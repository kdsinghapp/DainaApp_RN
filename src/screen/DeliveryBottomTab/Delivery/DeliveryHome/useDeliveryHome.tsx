import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import { base_url, WebSocket_Url } from '../../../../Api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { successToast, errorToast } from '../../../../utils/customToast';
import ScreenNameEnum from '../../../../routes/screenName.enum';
import { STATUS } from '../../../../utils/Constant';
import { View, Text, TouchableOpacity, FlatList, AppState, AppStateStatus } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../../../../redux/feature/authSlice';
import { GetProfileApi } from '../../../../Api/apiRequest';
import { playNotificationSound, stopNotificationSound } from '../../../../utils/soundPlayer';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};
export const useDeliveryHome = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<any>()
  const [requests, setRequests] = useState<any[]>([]);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [locationModal, setlocationModal] = useState(false);
  const [currentlocation, setCurrentLocation] = useState<any>(null);
  const [acceptModal, setAcceptModal] = useState(false);
  const [userInfromation, setuserInfromation] = useState([]);
  const [newOrderNotification, setNewOrderNotification] = useState<{
    visible: boolean;
    data: unknown;
  } | null>(null);
  const [acceptCounterOfferLoading] = useState(false);
  const locationRef = useRef<any>(null);
  const dispatch = useDispatch();
  const userData = useSelector((state: any) => state.auth.userData);
  const token = useSelector((state: any) => state.auth.token);
  const actualUserData = userData?.user || userData?.data || userData;
  const userType = String(actualUserData?.type || userData?.type || '').trim().toLowerCase();
  const isDeliveryUser = userType === 'delivery';

  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(userData?.onlineStatus?.toLowerCase() === 'online');
  const isOnlineRef = useRef(isOnline);

  // Sync isOnline with Redux userData
  useEffect(() => {
    const currentStatus = userData?.onlineStatus?.toLowerCase() === 'online';
    setIsOnline(currentStatus);
    isOnlineRef.current = currentStatus;
  }, [userData?.onlineStatus]);

  const socketRef = useRef<WebSocket | null>(null);
  const socketLiveRef = useRef<WebSocket | null>(null);
  const cancelledRef = useRef(false);
  const soundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveReconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveHeartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isNetworkConnectedRef = useRef(true);

  // Store lat/long for API; only updates when user moves ≥20m (see watchPosition)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  const fetchAvailableRequests = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      let lat = coordsRef.current?.lat;
      let lon = coordsRef.current?.lon;

      // If no stored coords yet, get current position once
      if (lat == null || lon == null) {
        try {
          const position = await new Promise<{ coords: { latitude: number; longitude: number } }>((resolve, reject) => {
            Geolocation.getCurrentPosition(resolve, (err) => {
              // Fallback to low accuracy immediately if high accuracy fails
              Geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 10000
              });
            }, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 10000,
            });
          });
          lat = position?.coords?.latitude;
          lon = position?.coords?.longitude;
          if (lat != null && lon != null) {
            setCoords({ lat, lon });
          }
        } catch (err) {
          console.warn("Failed to get initial position in fetchAvailableRequests", err);
        }
      }

      if (lat == null || lon == null) {
        setIsLoading(false);
        return;
      }


      const response = await axios.get(
        `${base_url}/delivery/available-requests?lat=${lat}&lon=${lon}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );
      console.log("ss", response)

      if (response?.data?.status == 1) {
        const list = response?.data?.parcels || response?.data?.requests || [];
        const validRequests = list
          ?.filter((item: any) => item?.trackingId !== null && item?.trackingId !== "")
          ?.map((item: any) => ({
            ...item,
            deliveryStatus: item?.deliveryStatus || item?.status,
            date: item?.createdAt ? moment(item.createdAt).format('DD MMM, YYYY') : item?.date
          }));
        setIsLoading(false);
        setRequests(validRequests || []);
      } else {
        setRequests([]);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error(
        'Error fetching available requests:',
        error?.response?.data || error?.message,
      );
      setIsLoading(false);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const sendLiveLocation = useCallback((lat: number, lon: number) => {
    const ws = socketLiveRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ type: 'online', lat, lon });
      console.log("📤 Sending Location to Socket:", payload);
      ws.send(payload);
    } else {
      console.log("⚠️ Socket not open. State:", ws?.readyState);
    }
  }, []);

  const nearbyparcels = useCallback((lat: number, lon: number) => {
    const ws = socketLiveRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log("⚠️ Nearby parcels socket not open. State:", ws?.readyState);
      return;
    }
    const payload = { type: 'location', lat, lon };
    const payloadStr = JSON.stringify(payload);
    console.log("📤 Nearby parcels → sending:", payloadStr);
    ws.send(payloadStr);
  }, []);

  // Watch position: update stored lat/long only when user moves ≥20 meters
  useEffect(() => {
    if (!token || !isDeliveryUser || !isOnline) {
      return;
    }

    let watchId: number | null = null;

    const onPosition = (position: { coords: { latitude: number; longitude: number } }) => {
      const lat = position?.coords?.latitude;
      const lon = position?.coords?.longitude;
      if (lat != null && lon != null) {
        setCoords({ lat, lon });
        sendLiveLocation(lat, lon);
        nearbyparcels(lat, lon);
      }
    };

    const onError = (error: unknown) => {
      console.warn('Location error:', error);
    };

    const startWatching = () => {
      watchId = Geolocation.watchPosition(onPosition, onError, {
        enableHighAccuracy: true,
        distanceFilter: 20,
      });
    };

    Geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lon = pos?.coords?.longitude;
        if (lat != null && lon != null) {
          setCoords({ lat, lon });
          sendLiveLocation(lat, lon);
          nearbyparcels(lat, lon);
        }
        startWatching();
      },
      (err) => {
        console.warn('Initial location fetch failed, starting watch anyway:', err);
        startWatching();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
    );


    return () => {
      if (watchId != null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [token, isDeliveryUser, isOnline, sendLiveLocation, nearbyparcels]);

  // Auto-fetch when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAvailableRequests();
    }, [fetchAvailableRequests])
  );

  const connectSocket = (token: string) => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

    // Properly close any existing socket before reconnecting
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Only connect if the user is a Delivery person
    // Redundant check removed since useEffect handles the fallback to AsyncStorage

    return new Promise<void>((resolve, reject) => {
      try {
        const wsUrl = `${WebSocket_Url}/driver?token=${token}`;
        console.log('🌐 [WebSocket] Connecting to primary socket:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (cancelledRef.current) {
            ws.close();
            return;
          }
          console.log('✅ [WebSocket] Primary driver socket connected');
          setIsConnected(true);
          socketRef.current = ws;

          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);

          resolve();
        };

        ws.onmessage = async (event: { data: string | Blob | ArrayBuffer }) => {
          if (cancelledRef.current) return;
          let raw: string;
          const d = event.data;
          if (typeof d === 'string') raw = d;
          else if (d && typeof (d as Blob).text === 'function') raw = await (d as Blob).text();
          else if (d instanceof ArrayBuffer) raw = new TextDecoder().decode(d);
          else raw = String(d);
          try {
            const data = JSON.parse(raw);
            if (data?.type === 'pong') return;

            console.log('📩 [WebSocket] Received primary message type:', data?.type);

            if (data?.type === 'new_offer') {
              if (cancelledRef.current) return;
              const parcel = data?.parcel ?? data;
              const parcelObj = parcel && typeof parcel === 'object' ? { ...parcel } : {};
              const { type: _t, ...rest } = parcelObj as { type?: string;[k: string]: unknown };
              const item: Record<string, unknown> & { deliveryStatus: string } = {
                ...rest,
                id: rest.id ?? rest.parcelId ?? parcelObj?.id ?? parcelObj?.parcelId,
                parcelId: rest.parcelId ?? rest.id ?? parcelObj?.parcelId ?? parcelObj?.id,
                deliveryStatus: STATUS.PENDING,
              };
              setRequests((prev: unknown[]) => {
                const arr = Array.isArray(prev) ? [...prev] : [];
                const exists = arr.some((r: unknown) => {
                  const x = r as { id?: string; parcelId?: string };
                  return String(x?.id ?? x?.parcelId) === String(item?.id ?? item?.parcelId);
                });
                const trackingId = item?.trackingId;
                if (!exists && trackingId != null && String(trackingId) !== '') {
                  arr.unshift({ ...item, status: STATUS.PENDING });
                }
                return arr as never[];
              });
              if (!cancelledRef.current) {
                setNewOrderNotification({ visible: true, data });
                if (isOnlineRef.current) {
                  if (soundTimerRef.current) clearTimeout(soundTimerRef.current);
                  playNotificationSound();
                  ReactNativeHapticFeedback.trigger("notificationSuccess", hapticOptions);
                  soundTimerRef.current = setTimeout(() => {
                    stopNotificationSound();
                    soundTimerRef.current = null;
                  }, 10000);
                }
              }
              return;
            }

            if (data?.type === 'counter_offer') {
              if (!cancelledRef.current) {
                setNewOrderNotification({ visible: true, data });
                if (isOnlineRef.current) {
                  if (soundTimerRef.current) clearTimeout(soundTimerRef.current);
                  playNotificationSound();
                  ReactNativeHapticFeedback.trigger("notificationWarning", hapticOptions);
                  soundTimerRef.current = setTimeout(() => {
                    stopNotificationSound();
                    soundTimerRef.current = null;
                  }, 10000);
                }
              }
              return;
            }

            if (data?.type === "offer_accepted") {
              if (cancelledRef.current) return;
              setAcceptModal(true);
              setuserInfromation(data);
              navigation.navigate(ScreenNameEnum.TripMap, {
                item: { ...data?.parcel, deliveryStatus: STATUS.ASSIGNED },
                event: data,
              });
            }
            if (data?.type == "parcelStatusUpdate") {
              console.log("📦 Parcel Status Update:", data?.status);
            }
          } catch (e) {
            console.warn('❌ [WebSocket] Failed to parse primary message:', e);
          }
        };

        ws.onerror = (event) => {
          const msg = (event && typeof event === 'object' && 'message' in event) ? String((event as { message?: string }).message) : 'WebSocket error';
          console.error('❌ [WebSocket] Primary Error:', msg);
          if (!cancelledRef.current) setIsConnected(false);
          reject(new Error(msg));
        };

        ws.onclose = (event) => {
          console.log(`⚠️ [WebSocket] Primary Closed: ${event.code} - ${event.reason}`);
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
          if (!cancelledRef.current) {
            setIsConnected(false);
            socketRef.current = null;

            if (isNetworkConnectedRef.current) {
              reconnectTimerRef.current = setTimeout(() => {
                console.log('🔄 [WebSocket] Reconnecting primary driver socket...');
                connectSocket(token);
              }, 5000);
            } else {
              console.log('🚫 [WebSocket] Network down, waiting for NetInfo to restore primary socket.');
            }
          }
        };
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        console.log('⚠️ Error creating socket:', error);
      }
    });
  };


  // Helper: send location on nearby-parcels socket (called after connect + when coords change)
  const sendNearbyLocationOnce = useCallback((ws: WebSocket, lat: number, lon: number) => {


    console.log("lat ----   ws  parsel ", lat)
    console.log("lon ----   ws  parsel ", lon)
    if (ws.readyState !== WebSocket.OPEN) return;
    const payload = JSON.stringify({ type: 'location', lat, lon });
    console.log('📤 [onopen] Sending initial location to nearby-parcels:', payload);
    ws.send(payload);
  }, []);

  // Single socket: nearby-parcels – live location
  const connectLiveLocationSocket = (token: string) => {
    if (liveReconnectTimerRef.current) clearTimeout(liveReconnectTimerRef.current);
    if (liveHeartbeatIntervalRef.current) clearInterval(liveHeartbeatIntervalRef.current);

    // Properly close any existing socket before reconnecting
    if (socketLiveRef.current) {
      socketLiveRef.current.close();
      socketLiveRef.current = null;
    }

    // Only connect if the user is a Delivery person
    // Redundant check removed since useEffect handles the fallback to AsyncStorage

    return new Promise<void>((resolve, reject) => {
      try {
        const wsUrl = `${WebSocket_Url}/nearby-parcels?token=${encodeURIComponent(token)}`;

        console.log("🌐 [WebSocket] Connecting to live/nearby socket:", wsUrl)
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (cancelledRef.current) {
            ws.close();
            return;
          }
          console.log('✅ [WebSocket] Live/nearby socket connected');
          socketLiveRef.current = ws;

          liveHeartbeatIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);

          const { lat, lon } = coordsRef.current ?? {};
          if (lat != null && lon != null) {
            sendNearbyLocationOnce(ws, lat, lon);
          } else {
            Geolocation.getCurrentPosition(
              (pos) => {
                if (cancelledRef.current) return;
                const la = pos?.coords?.latitude;
                const lo = pos?.coords?.longitude;
                if (la != null && lo != null && socketLiveRef.current === ws) {
                  setCoords({ lat: la, lon: lo });
                  sendNearbyLocationOnce(ws, la, lo);
                }
              },
              (err) => console.warn('❌ [WebSocket] Failed to get initial position for nearby send:', err),
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
            );
          }
          resolve();
        };

        ws.onmessage = async (event: { data: string | Blob | ArrayBuffer }) => {
          if (cancelledRef.current) return;
          let raw: string;
          const d = event?.data;
          if (typeof d === 'string') raw = d;
          else if (d && typeof (d as Blob).text === 'function') raw = await (d as Blob).text();
          else if (d instanceof ArrayBuffer) raw = new TextDecoder().decode(d);
          else raw = String(d ?? '');
          try {
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') return;
            if (data?.type === 'pong') return;

            console.log('📩 [WebSocket] Received live/nearby message type:', data?.type);
            if (data?.type === 'nearby_parcel') {
              if (cancelledRef.current) return;

              if (isOnlineRef.current) {
                console.log("🔊 [WebSocket] Playing sound for nearby_parcel (Status: Online)");
                playNotificationSound();
                ReactNativeHapticFeedback.trigger("notificationSuccess", hapticOptions);

                if (soundTimerRef.current) clearTimeout(soundTimerRef.current);
                soundTimerRef.current = setTimeout(() => {
                  stopNotificationSound();
                  soundTimerRef.current = null;
                }, 10000);
              } else {
                console.log("🔇 [WebSocket] Skipping sound because driver is offline (Ref check)");
              }

              const parcel = data?.parcel ?? data;
              const parcelObj = parcel && typeof parcel === 'object' ? { ...parcel } : {};
              const { type: _t, ...rest } = parcelObj as { type?: string;[k: string]: unknown };
              const item: Record<string, unknown> & { deliveryStatus: string } = {
                ...rest,
                id: rest.id ?? rest.parcelId ?? parcelObj?.id ?? parcelObj?.parcelId,
                parcelId: rest.parcelId ?? rest.id ?? parcelObj?.parcelId ?? parcelObj?.id,
                deliveryStatus: STATUS.PENDING,
              };
              setRequests((prev: unknown[]) => {
                const arr = Array.isArray(prev) ? [...prev] : [];
                const exists = arr.some((r: unknown) => {
                  const x = r as { id?: string; parcelId?: string };
                  return String(x?.id ?? x?.parcelId) === String(item?.id ?? item?.parcelId);
                });
                const trackingId = item?.trackingId;
                if (!exists && trackingId != null && String(trackingId) !== '') {
                  arr.unshift({ ...item, status: STATUS.PENDING });
                }
                return arr as never[];
              });
              setNewOrderNotification({ visible: true, data });
              return;
            }

            if (data?.type === 'remove_nearby_parcel') {
              if (cancelledRef.current) return;
              console.log("🗑️ [WebSocket] Removing nearby parcel notification");
              const removeId = data?.parcelId ?? data?.id;
              if (removeId) {
                setRequests((prev: any[]) => prev.filter((r: any) => String(r.id ?? r.parcelId) !== String(removeId)));
              }
              setNewOrderNotification(null);
              stopNotificationSound();
              if (soundTimerRef.current) {
                clearTimeout(soundTimerRef.current);
                soundTimerRef.current = null;
              }
              return;
            }




            const list = data?.requests ?? data?.parcels ?? data?.data ?? data?.result;
            if (Array.isArray(list) && !cancelledRef.current) {
              const validRequests = list
                .filter((item: { trackingId?: string | null }) => item?.trackingId != null && item?.trackingId !== '')
                .map((item: Record<string, unknown> & { status?: string }) => ({
                  ...item,
                  deliveryStatus: item?.status,
                }));
              setRequests(validRequests as never[]);
              console.log('📋 [WebSocket] Requests updated from socket, count:', validRequests.length);
            }
          } catch (e) {
            console.warn('❌ [WebSocket] Failed to parse nearby message:', e);
          }
        };

        ws.onerror = (event) => {
          const msg =
            event && typeof event === 'object' && 'message' in event
              ? String((event as { message?: string }).message)
              : 'WebSocket error';
          console.error('❌ [WebSocket] Live/nearby Error:', msg);
          reject(new Error(msg));
        };

        ws.onclose = (event) => {
          console.log(`⚠️ [WebSocket] Live/nearby Closed: ${event.code} - ${event.reason}`);
          if (liveHeartbeatIntervalRef.current) clearInterval(liveHeartbeatIntervalRef.current);
          if (!cancelledRef.current) {
            socketLiveRef.current = null;

            if (isNetworkConnectedRef.current) {
              liveReconnectTimerRef.current = setTimeout(() => {
                console.log('🔄 [WebSocket] Reconnecting live/nearby WebSocket...');
                connectLiveLocationSocket(token);
              }, 5000);
            } else {
              console.log('🚫 [WebSocket] Network down, waiting for NetInfo to restore live socket.');
            }
          }
        };
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        console.log('⚠️ Error creating live location socket:', error);
      }
    });
  };





  const reconnectAll = useCallback(async () => {
    if (cancelledRef.current || !isNetworkConnectedRef.current) {
      console.log('🚫 [WebSocket] Reconnect skipped (Cancelled or No Network)');
      return;
    }

    if (userType !== 'delivery') {
      console.log('🚫 [WebSocket] Reconnect skipped: not a Delivery user');
      return;
    }

    if (!token) return;

    console.log('🔄 [WebSocket] Reconnecting all sockets due to state change...');
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      connectSocket(token).catch(e => console.log('❌ Primary socket reconnect failed:', e));
    }
    if (!socketLiveRef.current || socketLiveRef.current.readyState !== WebSocket.OPEN) {
      connectLiveLocationSocket(token).catch(e => console.log('❌ Live socket reconnect failed:', e));
    }
  }, [token, userType]);

  useEffect(() => {
    const appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 [WebSocket] App came to foreground, checking connection...');
        reconnectAll();
      }
      appStateRef.current = nextAppState;
    });

    const netInfoListener = NetInfo.addEventListener((state: NetInfoState) => {
      if (!isNetworkConnectedRef.current && state.isConnected) {
        console.log('🌐 [WebSocket] Network restored, reconnecting...');
        reconnectAll();
      }
      isNetworkConnectedRef.current = state.isConnected ?? true;
    });

    return () => {
      appStateListener.remove();
      netInfoListener();
    };
  }, [reconnectAll]);

  useEffect(() => {
    cancelledRef.current = false;

    const init = async () => {
      try {
        // Fallback to AsyncStorage in case Redux is out of sync or empty
        const storedToken = await AsyncStorage.getItem('token');
        const activeToken = token || storedToken;

        let activeUserData = userData;
        if (!activeUserData) {
          const authDataRaw = await AsyncStorage.getItem('authData');
          if (authDataRaw) {
            try {
              const parsed = JSON.parse(authDataRaw);
              activeUserData = parsed?.userData;
            } catch (e) { }
          }
        }

        const activeActualUserData = activeUserData?.user || activeUserData?.data || activeUserData;
        const activeUserType = String(activeActualUserData?.type || activeUserData?.type || '').trim().toLowerCase();

        console.log(`[WebSocket Debug] Token present: ${!!activeToken}, UserType: '${activeUserType}', RawUserData:`, activeUserData);

        if (!activeToken || activeUserType !== 'delivery') {
          console.log('🚫 [WebSocket] Init skipped: No token or not a Delivery user');
          cancelledRef.current = true;
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
          }
          if (socketLiveRef.current) {
            socketLiveRef.current.close();
            socketLiveRef.current = null;
          }
          return;
        }

        handleGetLocation();
        await connectSocket(activeToken);
        if (cancelledRef.current) return;
        try {
          await connectLiveLocationSocket(activeToken);
        } catch (liveErr) {
          console.warn('🔌 Live/nearby socket failed (app continues):', liveErr);
        }
      } catch (error) {
        console.error('🔌 Socket init failed:', error);
      }
    };

    init();

    return () => {
      cancelledRef.current = true;
      console.log('🛑 Disconnect WebSockets');
      if (soundTimerRef.current) {
        clearTimeout(soundTimerRef.current);
        soundTimerRef.current = null;
      }
      stopNotificationSound(); // Stop any playing sounds on unmount
      try {
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        if (socketLiveRef.current) {
          socketLiveRef.current.close();
          socketLiveRef.current = null;
        }
        stopNotificationSound();
      } catch (_) { }
    };
  }, [token, userType]);

  const handleGetLocation = async () => {
    try {
      const data = await locationRef?.current?.fetchLocation();
      if (data.error) {
        // Alert.alert('Error', data.error);
      } else {
        // Store in AsyncStorage
        await AsyncStorage.setItem('pickupLocation', JSON.stringify(data));
        setCurrentLocation(data?.address)
        // Update state
        setCurrentLocation(data.address);
        // setPickupLocation(data);
        // setPickupLat({
        //   latitude: data.region.latitude,
        //   longitude: data.region.longitude,
        // });

        console.log('Stored and set location:', data);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const acceptCounterOffer = async (offerId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        errorToast('Token not found');
        return;
      }
      const response = await fetch(`${base_url}/delivery/offers/${offerId}/accept-counter`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok && (result?.status === 1 || result?.success === true)) {
        successToast(result?.message ?? 'Counter offer accepted');
        setNewOrderNotification(null);
        fetchAvailableRequests();
      } else {
        errorToast(result?.message ?? 'Failed to accept counter offer');
      }
    } catch (error) {
      console.error('Accept counter offer error:', error);
      errorToast('Something went wrong');
    } finally {

    }
  };
  const RejectcounterOffer = async (offerId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        errorToast('Token not found');
        return;
      }
      const response = await fetch(`${base_url}/delivery/offers/${offerId}/reject-counter`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok && (result?.status === 1 || result?.success === true)) {
        successToast(result?.message ?? 'Reject  offer ');
        setNewOrderNotification(null);
        // fetchAvailableRequests();
      }
    } catch (error) {
      console.error('Reject counter offer error:', error);
      errorToast('Something went wrong');
    } finally {

    }
  };

  const getProfileApi = async () => {
    try {
      const response = await GetProfileApi(setIsLoading);
      if (response) {
        const token = await AsyncStorage.getItem('token') || '';
        dispatch(loginSuccess({ userData: response, token }));
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  return {
    // States
    isLoading,
    setIsLoading,
    requests,
    setRequests,
    address,
    setAddress,
    location,
    setLocation,
    locationModal,
    setlocationModal,
    currentlocation,
    setCurrentLocation,
    locationRef,
    coords,
    userInfromation,
    // API function
    fetchAvailableRequests,
    acceptModal,
    setAcceptModal,
    newOrderNotification,
    setNewOrderNotification,
    acceptCounterOffer,
    acceptCounterOfferLoading,
    RejectcounterOffer,
    isOnline,
    setIsOnline,
    isConnected,
    getProfileApi,
    userData
  };
};
