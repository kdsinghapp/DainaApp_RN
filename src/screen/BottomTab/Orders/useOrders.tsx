import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { GetProfileApi, Parceldetails } from '../../../Api/apiRequest';
import { loginSuccess } from '../../../redux/feature/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebSocket_Url } from '../../../Api';
import { successToast } from '../../../utils/customToast';

export type CounterOfferAcceptedPayload = {
  type: string;
  parcelId: number;
  offerId: number;
  status: string;
  acceptedBy: string;
  deliveryUserId: number;
  pickupOtp?: string;
  deliveryOtp?: string;
  timestamp?: string;
  notifyType?: string;
  title?: string;
  message?: string;
};

const useOrders = () => {
  const navigation = useNavigation();
  const [address, setAddress] = useState("");
  const [locationModal, setlocationModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [currentlocation, setcurrentlocation] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [orderData, setorderData] = useState([]);

  useEffect(() => {
    getParceldetailsApi()
  }, [])
  const dispatch = useDispatch();
  const locationRef: any = useRef(null);

  useEffect(() => {
    handleGetLocation()
  }, [])
  useEffect(() => {
    getProfileApi();
  }, []);

  const getProfileApi = async () => {
    try {
      const response = await GetProfileApi(setLoading);
      if (response) {
        dispatch(loginSuccess({ userData: response }));
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)

    }
  };
  // Inside your component
  const [pickupLocation, setPickupLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const handleGetLocation = async () => {
    try {
      const data = await locationRef?.current?.fetchLocation();
      if (data.error) {
        // Fallback to cached location before giving up
        const cached = await AsyncStorage.getItem('pickupLocation');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.address) {
              setcurrentlocation(parsed.address);
              setCurrentLocation(parsed.address);
              setPickupLocation(parsed);
              return;
            }
          } catch (e) {}
        }
      } else {
        // Store in AsyncStorage
        await AsyncStorage.setItem('pickupLocation', JSON.stringify(data));
        setcurrentlocation(data?.address)
        // Update state
        setCurrentLocation(data.address);
        setPickupLocation(data);
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
  const getParceldetailsApi = async () => {
    try {
      const response = await Parceldetails(setLoading);
      console.log("response", response.parcels)
      // const goingToPickupData = response.parcels.filter(
      //     item => item.deliveryStatus === "going_to_pickup"
      //   );
      setorderData(response.parcels);
    } catch (error) {

    }
  };
  const [isConnected, setIsConnected] = useState(false);
  const [socketData, setSocketData] = useState<any>(null);
  const [counterOfferAcceptedModal, setCounterOfferAcceptedModal] = useState<{
    visible: boolean;
    data: CounterOfferAcceptedPayload | null;
  }>({ visible: false, data: null });
  const socketRef = useRef<WebSocket | null>(null);

  const connectSocket = (token: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const wsUrl = `${WebSocket_Url}/user?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        let resolved = false;

        ws.onopen = () => {
          console.log('✅ WebSocket connected:', wsUrl);
          resolved = true;
          setIsConnected(true);
          socketRef.current = ws;
          // Optional: some servers need a first message (e.g. subscribe/ping) to start sending
          try {
            ws.send(JSON.stringify({ type: 'ping' }));
          } catch (_) { }
          resolve();
        };

        ws.onmessage = async (event: { data: string | Blob | ArrayBuffer }) => {
          console.log('📩 WebSocket message received');
          let raw: string;
          const d = event.data;

          if (typeof d === 'string') {
            raw = d;
          } else if (d && typeof (d as Blob).text === 'function') {
            raw = await (d as Blob).text();
          } else if (d instanceof ArrayBuffer) {
            raw = new TextDecoder().decode(d);
          } else {
            raw = String(d);
          }

          try {
            const data = JSON.parse(raw);
            console.log('📦 socket data:', data);
            setSocketData(data);

            if (data?.type === 'parcel_status_update') {
              successToast(data?.type?.message || "Parcels successfully")
              getParceldetailsApi()
              // optional: show new_offer modal later
            }
            if (data?.type === 'counter_offer_accepted') {
              setCounterOfferAcceptedModal({
                visible: true,
                data: data as CounterOfferAcceptedPayload,
              });
            }
            if (data?.type === 'order_update' || data?.refreshOrders) {
              getParceldetailsApi();
            }
          } catch (e) {
            console.warn('❌ Not JSON or parse failed:', e);
            console.log('📩 Raw message:', raw);
          }
        };

        ws.onerror = (event) => {
          const msg =
            event && typeof event === 'object' && 'message' in event
              ? String((event as { message?: string }).message)
              : 'WebSocket error';
          console.error('❌ WebSocket Error:', msg);
          setIsConnected(false);
          if (!resolved) reject(new Error(msg));
        };

        ws.onclose = (event) => {
          console.log('⚠️ WebSocket Closed', event.code, event.reason);
          setIsConnected(false);
          socketRef.current = null;
          if (!resolved) reject(new Error(event.reason || 'Connection closed'));
        };
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        console.log('⚠️ Error creating socket:', error);
      }
    });
  };


  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('❌ No token in storage');
          return;
        }
        await connectSocket(token);
      } catch (error) {
        console.error('🔌 Socket init failed:', error);
      }
    };

    init();

    return () => {
      console.log('🛑 Disconnect WebSocket');
      socketRef.current?.close(); // 👈 Proper cleanup
    };
  }, []);

  return {
    navigation,
    address,
    setAddress,
    location,
    setLocation,
    locationModal,
    setlocationModal,
    locationRef,
    currentlocation,
    isLoading,
    orderData,
    isConnected,
    socketData,
    counterOfferAcceptedModal,
    setCounterOfferAcceptedModal,
    getParceldetailsApi,
  };
};

export default useOrders;
