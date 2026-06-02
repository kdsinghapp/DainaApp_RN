import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Alert,
  TextInput,
  Platform,
  Keyboard,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation, useRoute } from '@react-navigation/native';
import LoadingModal from '../../../utils/Loader';
import imageIndex from '../../../assets/imageIndex';
import CustomButton from '../../../compoent/CustomButton';
import { GetApi, PostApi } from '../../../Api/apiRequest';
import { GOOGLE_MAPS_APIKEY, WebSocket_Url } from '../../../Api';
import { STATUS, STATUS_COLORS, STATUS_LABELS } from '../../../utils/Constant';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../../constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import font from '../../../theme/font';
import MapViewDirections from 'react-native-maps-directions';
import { errorToast, successToast } from '../../../utils/customToast';
import ScreenNameEnum from '../../../routes/screenName.enum';
import strings from '../../../localization/Localization';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  }
];


const TripMap = () => {
  const [loading, setLoading] = useState(false)
  const route: any = useRoute()
  const { item, event } = route?.params || ""
  // console.log("pickupLon", event?.parcel?.pickupLat)
  // console.log("pickupLon", event?.parcel?.pickupLon)
  const parcelId = item?.parcelId
  const [actionLoading, setActionLoading] = useState(true);
  useEffect(() => {

  }, [route])
  const [parcel, setParcel] = useState(item)
  const [pickupOtp, setPickupOtp] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [driverCoords, setDriverCoords] = useState({
    latitude: 33.95,
    longitude: 117.4028,
  });
  const locationSocketRef = useRef<WebSocket | null>(null);
  const driverLocationSocketRef = useRef<WebSocket | null>(null);
  const latestDriverLocationPayloadRef = useRef<{ parcelId: number | string; lat: number; lon: number } | null>(null);
  const locationTokenRef = useRef<string | null>(null);
  const locationHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const parcelIdRef = useRef<string | number | undefined>(item?.parcelId ?? item?.id);
  parcelIdRef.current = parcel?.parcelId ?? parcel?.id ?? item?.parcelId ?? item?.id;
  const canCancel = item?.deliveryStatus &&
    [STATUS.PENDING, STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP, STATUS.PICKED_UP, STATUS.ON_THE_WAY].includes(item.deliveryStatus);

  useEffect(() => {
    let cancelled = false;

    const connectLocationSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token || cancelled) return;
      locationTokenRef.current = token;

      const ws = new WebSocket(`${WebSocket_Url}/nearby-parcels?token=${encodeURIComponent(token)}`);
      locationSocketRef.current = ws;

      ws.onopen = () => {
        if (cancelled) {
          ws.close();
          return;
        }
        locationHeartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onerror = (error) => {
        console.warn('Driver location socket error:', error);
      };

      ws.onclose = () => {
        if (locationSocketRef.current === ws) {
          locationSocketRef.current = null;
        }
      };
    };

    connectLocationSocket();

    return () => {
      cancelled = true;
      if (locationHeartbeatRef.current) {
        clearInterval(locationHeartbeatRef.current);
        locationHeartbeatRef.current = null;
      }
      locationSocketRef.current?.close();
      locationSocketRef.current = null;
      driverLocationSocketRef.current?.close();
      driverLocationSocketRef.current = null;
    };
  }, []);

  const syncDriverLocation = async (latitude: number, longitude: number) => {
    setDriverCoords({ latitude, longitude });

    const payload = {
      type: 'online',
      lat: latitude,
      lon: longitude,
      parcelId: item?.parcelId || item?.id,
      trackingId: item?.trackingId,
    };

    const ws = locationSocketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }

    const token = locationTokenRef.current || await AsyncStorage.getItem('token');
    if (!token) return;
    locationTokenRef.current = token;

    PostApi({
      url: '/driver/location',
      data: {
        lat: latitude,
        lon: longitude,
        status: 'Online',
      },
      token,
    }, () => { }).catch((error: unknown) => {
      console.warn('Save driver location failed:', error);
    });
  };

  // New function: Send driver location via /driver-location WebSocket
  const sendDriverLocationViaSocket = async (lat: number, lon: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn('No token found for driver-location socket');
        return;
      }

      const parcelIdForSocket = parcelIdRef.current;
      if (!parcelIdForSocket) return;

      const payload = {
        parcelId: parcelIdForSocket,
        lat,
        lon,
      };
      latestDriverLocationPayloadRef.current = payload;

      const sendLatestPayload = (ws: WebSocket) => {
        const latestPayload = latestDriverLocationPayloadRef.current;
        if (latestPayload && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(latestPayload));
        }
      };

      const existingSocket = driverLocationSocketRef.current;
      if (existingSocket?.readyState === WebSocket.OPEN) {
        sendLatestPayload(existingSocket);
        return;
      }
      if (existingSocket?.readyState === WebSocket.CONNECTING) {
        return;
      }

      const ws = new WebSocket(`${WebSocket_Url}/driver-location?token=${encodeURIComponent(token)}`);
      driverLocationSocketRef.current = ws;

      ws.onopen = () => sendLatestPayload(ws);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Driver location socket response:', data);
        } catch (e) {
          console.warn('Failed to parse driver location response:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.warn('Driver location socket error:', error);
      };

      ws.onclose = () => {
        if (driverLocationSocketRef.current === ws) {
          driverLocationSocketRef.current = null;
        }
      };
    } catch (error) {
      console.warn('sendDriverLocationViaSocket error:', error);
    }
  };

  // Fetch current location, sync it to server, and watch for updates.
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        syncDriverLocation(latitude, longitude);
        sendDriverLocationViaSocket(latitude, longitude);
      },
      (error) => {
        console.log('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000,
        fastestInterval: 2000
      }
    );

    return () => {
      if (watchId !== undefined) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);
  useEffect(() => {
    // setActionLoading(true)
    getDetail()
  }, [])

  const getDetail = async () => {
    const param = {
      url: `/delivery/my-offers/${parcelId}`
    }
    const res = await GetApi(param, setLoading)
    if (res.status == 1) {
      console.log("---")
      setParcel(res?.offer?.parcel)
    }
    setActionLoading(false)
    console.log(res, 'this is res')
  }


  const navigation = useNavigation()
  const getButtonConfig = () => {
    const currentStatus = item?.deliveryStatus;
    switch (currentStatus) {

      case STATUS.ASSIGNED:
        return {
          title: strings.StartPickup,
          onPress: () => handleStatusUpdate(STATUS.GOING_TO_PICKUP),
          color: STATUS_COLORS[STATUS.GOING_TO_PICKUP], // Fixed
          icon: "car-outline",
          showInputs: false
        };

      case STATUS.GOING_TO_PICKUP:
        return {
          title: strings.MarkPickedUp,
          onPress: () => handleStatusUpdate(STATUS.PICKED_UP),
          color: STATUS_COLORS[STATUS.PICKED_UP], // Fixed
          icon: "cube-outline",
          showInputs: false
        };

      case STATUS.PICKED_UP:
        return {
          title: strings.StartDelivery,
          onPress: () => handleStatusUpdate(STATUS.ON_THE_WAY),
          color: STATUS_COLORS[STATUS.ON_THE_WAY], // Fixed
          icon: "navigate-outline",
          showInputs: false
        };

      // case STATUS.ON_THE_WAY:
      //   return {
      //     title: "Mark as Arriving",
      //     onPress: () => handleStatusUpdate(STATUS.ARRIVING),
      //     color: STATUS_COLORS[STATUS.ARRIVING], // Fixed
      //     icon: "location-outline",
      //     showInputs: false
      //   };

      case STATUS.ON_THE_WAY:
        return {
          title: strings.MarkDelivered,
          onPress: () => handleStatusUpdate(STATUS.DELIVERED),
          color: STATUS_COLORS[STATUS.DELIVERED], // Fixed
          icon: "checkmark-circle-outline",
          showInputs: false
        };

      // case STATUS.DELIVERED:
      //   return {
      //     title: "Complete Order",
      //     onPress: () => handleStatusUpdate(STATUS.COMPLETED),
      //     color: STATUS_COLORS[STATUS.COMPLETED], // Fixed
      //     icon: "flag-outline",
      //     showInputs: false
      //   };

      case STATUS.DELIVERED:
        return {
          title: strings.OrderCompleted,
          onPress: null,
          color: STATUS_COLORS[STATUS.COMPLETED], // Fixed
          icon: "checkmark-done-outline",
          showInputs: false,
          disabled: true
        };

      case STATUS.CANCELLED:
        return {
          title: strings.OrderCancelled,
          onPress: null,
          color: STATUS_COLORS[STATUS.CANCELLED], // Fixed
          icon: "close-circle-outline",
          showInputs: false,
          disabled: true
        };

      default:
        return {
          title: strings.SendOffer,
          onPress: null,
          color: "#FFD700", // Golden color for offer
          icon: "send-outline",
          showInputs: true
        };
      // {
      //   title: "Send",
      //   onPress: handleSendOffer,
      //   color: "#FFD700",
      //   icon: "send-outline",
      //   showInputs: true
      // };
    }
  };
  const DEFAULT_LAT = 22.7176;
  const DEFAULT_LNG = 75.8577;

  type LatLng = { latitude: number; longitude: number };

  /** Ensures native map gets a number; API often returns string or null. */
  const safeNum = (v: unknown, fallback: number | null): number | null => {
    if (v == null) return fallback;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : fallback;
  };

  const source = parcel || item?.parcel || item;
  const mapRef = useRef<MapView>(null);
  // Intelligent coordinate extraction to handle potential API swaps
  const getCoords = (latField: any, lonField: any): LatLng | null => {
    const v1 = safeNum(latField, null);
    const v2 = safeNum(lonField, null);

    if (v1 === null || v2 === null) return null;

    // Common heuristic for Indore/India: Lat ~22, Lon ~75
    // If v1 is > 60 and v2 is < 40, they are swapped (v1 is Lon, v2 is Lat)
    if (v1 > 60 && v2 < 40) {
      return { latitude: v2, longitude: v1 };
    }
    return { latitude: v1, longitude: v2 };
  };

  const pickup = getCoords(
    source?.pickupLat ?? source?.pickupLocationLat ?? source?.pickup_location_lat ?? source?.pickupLat,
    source?.pickupLon ?? source?.pickupLocationLon ?? source?.pickup_location_lon ?? source?.pickupLon
  ) || { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };

  const dropoff = getCoords(
    source?.dropLat ?? source?.dropLocationLat ?? source?.drop_location_lat ?? source?.dropLat,
    source?.dropLon ?? source?.dropLocationLon ?? source?.drop_location_lon ?? source?.dropLon
  ) || { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
  const [currentCoords, setCurrentCoords] = useState(driverCoords);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [directionsFailed, setDirectionsFailed] = useState(false);
  const [activeDirectionsFailed, setActiveDirectionsFailed] = useState(false);

  const pickupAddress = source?.pickupLocation || item?.pickup?.location || strings.PickupLocation;
  const dropoffAddress = source?.dropLocation || item?.drop?.location || strings.DropLocation;
  const normalizedPickupAddress = String(pickupAddress).trim().toLowerCase();
  const normalizedDropoffAddress = String(dropoffAddress).trim().toLowerCase();
  const sameLocation =
    normalizedPickupAddress.length > 0 &&
    normalizedPickupAddress === normalizedDropoffAddress;

  const deliveryStatus = item?.deliveryStatus ?? parcel?.deliveryStatus ?? item?.parcel?.deliveryStatus ?? '';
  const isToPickup = deliveryStatus === STATUS.ASSIGNED || deliveryStatus === STATUS.GOING_TO_PICKUP;
  const isToDropoff = deliveryStatus === STATUS.PICKED_UP || deliveryStatus === STATUS.ON_THE_WAY || deliveryStatus === STATUS.ARRIVING;
  const routeDestination = isToPickup ? pickup : dropoff;
  const distanceBetween = (a: LatLng, b: LatLng) => {
    const dLat = a.latitude - b.latitude;
    const dLng = a.longitude - b.longitude;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  };

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const getDistanceKm = (a: LatLng, b: LatLng) => {
    const earthRadiusKm = 6371;
    const dLat = toRadians(b.latitude - a.latitude);
    const dLng = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  const formatKm = (value: number) => {
    if (value < 0.1) return `${Math.round(value * 1000)} m`;
    return `${value.toFixed(value < 10 ? 1 : 0)} km`;
  };

  const orderDistanceKm = routeDistanceKm ?? getDistanceKm(pickup, dropoff);
  const MIN_DIST = 0.0003;
  const tooClose = distanceBetween(currentCoords, routeDestination) < MIN_DIST;
  // Full path green→red: show polyline between pickup and dropoff so driver sees where to go
  const pickupToDropoffValid = Boolean(
    pickup?.latitude &&
    pickup?.longitude &&
    dropoff?.latitude &&
    dropoff?.longitude &&
    Math.abs(pickup.latitude) <= 90 &&
    Math.abs(pickup.longitude) <= 180 &&
    Math.abs(dropoff.latitude) <= 90 &&
    Math.abs(dropoff.longitude) <= 180 &&
    Number.isFinite(pickup?.latitude) &&
    Number.isFinite(pickup?.longitude) &&
    Number.isFinite(dropoff?.latitude) &&
    Number.isFinite(dropoff?.longitude) &&
    (pickup?.latitude !== dropoff?.latitude || pickup?.longitude !== dropoff?.longitude)
  );

  useEffect(() => {
    setCurrentCoords(driverCoords);
  }, [driverCoords.latitude, driverCoords.longitude]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
      Keyboard.dismiss();
      setKeyboardHeight(0);
    };
  }, []);

  useEffect(() => {
    const showOtp = item?.deliveryStatus === STATUS?.GOING_TO_PICKUP || item?.deliveryStatus === STATUS.ON_THE_WAY;
    if (!showOtp) {
      Keyboard.dismiss();
      setKeyboardHeight(0);
    }
  }, [item?.deliveryStatus]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setKeyboardHeight(0);
  };

  const driverCoordinate: LatLng = {
    latitude: safeNum(driverCoords?.latitude, DEFAULT_LAT) ?? DEFAULT_LAT,
    longitude: safeNum(driverCoords?.longitude, DEFAULT_LNG) ?? DEFAULT_LNG,
  };
  const activeRouteValid = Boolean(
    routeDestination?.latitude &&
    routeDestination?.longitude &&
    Math.abs(driverCoordinate.latitude) <= 90 &&
    Math.abs(driverCoordinate.longitude) <= 180 &&
    Math.abs(routeDestination.latitude) <= 90 &&
    Math.abs(routeDestination.longitude) <= 180 &&
    Number.isFinite(driverCoordinate.latitude) &&
    Number.isFinite(driverCoordinate.longitude) &&
    Number.isFinite(routeDestination.latitude) &&
    Number.isFinite(routeDestination.longitude) &&
    distanceBetween(driverCoordinate, routeDestination) >= MIN_DIST &&
    (isToPickup || isToDropoff)
  );

  useEffect(() => {
    setDirectionsFailed(false);
    setActiveDirectionsFailed(false);
  }, [
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
    driverCoordinate.latitude,
    driverCoordinate.longitude,
    routeDestination.latitude,
    routeDestination.longitude,
    deliveryStatus,
  ]);

  const buttonConfig = getButtonConfig();
  const updateParcelStatus = async (orderId: string | number, newStatus: string, otp?: string) => {
    // Implement your API call here
    const token = await AsyncStorage.getItem('token');
    const body = {
      otp: otp ?? '',
      // order_id: orderId,
      newStatus: newStatus
    };
    console.log(body, orderId)
    const param = {
      url: `/delivery/parcels/${orderId}/status`,
      data: body,
      token,
      isFormData: true
    }
    return await PostApi(param, setActionLoading);
  };
  const navgation = useNavigation()
  useEffect(() => {

  }, [item])
  const handleStatusUpdate = async (newStatus: any) => {
    try {
      setActionLoading(true);
      if (newStatus == STATUS.PICKED_UP && pickupOtp == '') {
        errorToast(strings.EnterPickupOTPShared)
        return;
      }
      if (newStatus == STATUS.DELIVERED && deliveryOtp == '') {
        Alert.alert(strings.EnterDeliveryOTPShared)
        return;
      }

      const result = await updateParcelStatus(item?.parcelId || item?.id, newStatus, newStatus == STATUS.DELIVERED ? deliveryOtp : pickupOtp);
      console.log(result)
      if (result.status == 1) {
        successToast(String(strings.formatString(strings.StatusUpdatedTo, STATUS_LABELS[newStatus])))
        navigation.goBack();
        // You might want to refresh the data here
      } else {
        Alert.alert(strings.Error, result.message ?? strings.FailedUpdateStatus);
        // Alert.alert("Success", "Update Status Successfully");
      }
    } catch (error) {
      console.error("Status update error:", error);
      Alert.alert(strings.Error, strings.SomethingWentWrong);
    } finally {
      setActionLoading(false);
    }
  };

  const statusKey = item?.deliveryStatus;
  const statusLabel = STATUS_LABELS[statusKey] || strings.Unknown;
  const statusColor = STATUS_COLORS[statusKey] || 'black';
  return (
    <View style={styles.container}>
      {loading && <LoadingModal />}

      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <View style={styles.mapWrap}>
          <MapView
            mapType='standard'
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={[styles.mapView, Platform.OS === 'ios' && { height: Dimensions.get('window').height }]}
            initialRegion={{
              latitude: (pickup?.latitude + dropoff?.latitude) / 2,
              longitude: (pickup?.longitude + dropoff?.longitude) / 2,
              latitudeDelta: Math.max(0.05, Math.abs(pickup?.latitude - dropoff?.latitude) * 1.5),
              longitudeDelta: Math.max(0.05, Math.abs(pickup?.longitude - dropoff?.longitude) * 1.5),
            }}
          >
            {pickupToDropoffValid && (
              <MapViewDirections
                key={`polyline-pickup-dropoff-${pickup?.latitude.toFixed(5)}-${pickup?.longitude.toFixed(5)}-${dropoff?.latitude.toFixed(5)}-${dropoff?.longitude.toFixed(5)}`}
                origin={pickup}
                destination={dropoff}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="rgba(15, 23, 42, 0.22)"
                lineCap="round"
                lineJoin="round"
                precision="high"
                mode="DRIVING"
                optimizeWaypoints={true}
                onReady={result => {
                  setDirectionsFailed(false);

                  setRouteDistanceKm(result.distance);
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      right: wp(15),
                      bottom: hp(40),
                      left: wp(15),
                      top: hp(15),
                    },
                    animated: true,
                  });
                }}
                onError={(err) => {
                  console.warn('MapViewDirections error:', err);
                  setDirectionsFailed(true);
                }}
              />
            )}
            {pickupToDropoffValid && directionsFailed && (
              <Polyline
                coordinates={[pickup, dropoff]}
                strokeWidth={4}
                strokeColor="rgba(15, 23, 42, 0.22)"
                lineCap="round"
                lineJoin="round"
              />
            )}
            {activeRouteValid && (
              <MapViewDirections
                key={`active-driver-route-${deliveryStatus}-${driverCoordinate.latitude.toFixed(5)}-${driverCoordinate.longitude.toFixed(5)}-${routeDestination.latitude.toFixed(5)}-${routeDestination.longitude.toFixed(5)}`}
                origin={driverCoordinate}
                destination={routeDestination}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={7}
                strokeColor={color.primary}
                lineCap="round"
                lineJoin="round"
                precision="high"
                mode="DRIVING"
                optimizeWaypoints={true}
                onReady={result => {
                  setActiveDirectionsFailed(false);
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      right: wp(15),
                      bottom: hp(40),
                      left: wp(15),
                      top: hp(15),
                    },
                    animated: true,
                  });
                }}
                onError={(err) => {
                  console.warn('Active MapViewDirections error:', err);
                  setActiveDirectionsFailed(true);
                }}
              />
            )}
            {activeRouteValid && activeDirectionsFailed && (
              <Polyline
                coordinates={[driverCoordinate, routeDestination]}
                strokeWidth={6}
                strokeColor={color.primary}
                lineCap="round"
                lineJoin="round"
              />
            )}
            <Marker coordinate={pickup} title={strings.Pickup} tracksViewChanges={false} anchor={{ x: 0.5, y: 1 }}>
              <View style={styles.mapMarkerWrap}>
                <View style={[styles.pinHead, styles.pickupPin]}>
                  <View style={styles.pinIconCircle}>
                    <Ionicons name="cube-outline" size={16} color="#10B981" />
                  </View>
                </View>
                <View style={[styles.pinPointer, styles.pickupPointer]} />
              </View>
            </Marker>
            <Marker coordinate={dropoff} title={strings.Drop} tracksViewChanges={false} anchor={{ x: 0.5, y: 1 }}>
              <View style={styles.mapMarkerWrap}>
                <View style={[styles.pinHead, styles.dropPin]}>
                  <View style={styles.pinIconCircle}>
                    <Ionicons name="location-sharp" size={17} color="#EF4444" />
                  </View>
                </View>
                <View style={[styles.pinPointer, styles.dropPointer]} />
              </View>
            </Marker>
            <Marker
              key="driver-marker"
              coordinate={driverCoordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.courierMarker}>
                <View style={styles.courierPulse} />
                <View style={styles.courierMarkerInner}>
                  <Image source={imageIndex.deliver} style={styles.courierImage} />
                </View>
              </View>
            </Marker>
          </MapView>
          {sameLocation && (
            <View style={styles.sameLocationBanner}>
              <Ionicons name="alert-circle" size={20} color="#FFF" />
              <Text style={styles.sameLocationText}>Same Location Delivery</Text>
            </View>
          )}
          {tooClose && (
            <View style={styles.arrivalBadge}>
              <View style={styles.arrivalBadgeIconWrap}>
                <Ionicons name="location-sharp" size={20} color="#FFF" />
              </View>
              <Text style={styles.arrivalBadgeText}>
                {isToPickup ? strings.ArrivedAtPickup : strings.ArrivedAtDropoff}
              </Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.infoCard}>
        <TouchableOpacity
          style={styles.backButtonWrap}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={imageIndex.back}
            style={{ height: 40, width: 40 }}
            resizeMode='contain'
          />
        </TouchableOpacity>

        <View style={styles.locationContent}>
          <View style={styles.routeHeaderRow}>
            <Text style={styles.routeTitle}>Order Route</Text>
            <View style={styles.distancePill}>
              <Ionicons name="navigate" size={13} color="#0F172A" />
              <Text style={styles.distanceText}>{formatKm(orderDistanceKm)}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.locationIconWrap}>
              <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.connectorLine} />
            </View>
            <View style={styles.locationCopy}>
              <Text style={styles.locationLabel}>{strings.Pickup}</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {pickupAddress}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.locationIconWrap}>
              <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
            </View>
            <View style={styles.locationCopy}>
              <Text style={styles.locationLabel}>{strings.Drop}</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {dropoffAddress}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <View style={[styles.driverCard, { bottom: keyboardHeight }]}>


          <View style={styles.driverRow}>
            {item?.user?.image ? (
              <Image
                source={{
                  uri: item?.user?.image || item?.user?.imagem ? item?.user?.image : item?.user?.image,
                }}
                style={styles.avatar}
              />

            ) : (
              <Image
                source={imageIndex.dpuser}
                style={styles.avatar}
              />

            )}

            <View>

              {/* <Text style={styles.driverName}>Marcus Aminoff</Text> */}
              <Text style={styles.driverName}>{item?.user?.firstName || event?.sender.name || ""}. </Text>
              <Text style={styles.carDetails}>{item?.user?.phone}</Text>
              <Text style={styles.carDetails}>{item?.trackingId}</Text>
              <Text style={styles.carDetails}>{item?.patient_details?.mobile_number}</Text>

            </View>
            <Text style={[styles.timeText, { right: 0, color: statusColor }]}>{statusLabel}</Text>

          </View>


          <View style={styles.buttonRow}>

            <TouchableOpacity onPress={() =>
              Alert.alert(
                strings.Confirmation,
                strings.AreYouSureCancel,
                [
                  {
                    text: strings.No,
                    style: "cancel",
                    onPress: () => console.log("User chose No"),
                  },
                  {
                    text: strings.Yes,
                    onPress: () => {
                      console.log("User chose Yes");
                      handleStatusUpdate(STATUS.CANCELLED);
                    },
                  },
                ],
                { cancelable: false }
              )
            }>
              <Image source={imageIndex.Closed} style={styles.iconBtn} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              let url = `tel:${item?.user?.phobe}`;
              Linking.openURL(url);
            }}>
              <Image source={imageIndex.Calblack} style={styles.iconBtn} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              (navgation as any).navigate(ScreenNameEnum.ChatScreen, {
                item: item,
              })
            }}>
              <Image source={imageIndex.MessageBlack} style={styles.iconBtn} />
            </TouchableOpacity>
          </View>

          {item?.deliveryStatus === STATUS?.GOING_TO_PICKUP && (
            <OtpSection
              label={strings.EnterPickupOTPShared}
              value={pickupOtp}
              onChange={setPickupOtp}
            />
          )}

          {item?.deliveryStatus === STATUS?.ON_THE_WAY && (
            <OtpSection
              label={strings.EnterDeliveryOTPShared}
              value={deliveryOtp}
              onChange={setDeliveryOtp}
            />
          )}

          <CustomButton
            title={actionLoading ? strings.Processing : buttonConfig.title}
            onPress={buttonConfig.onPress ?? undefined}
            disable={actionLoading || buttonConfig?.disabled}
            style={{
              // backgroundColor: buttonConfig.color,
              backgroundColor: color.primary,
              opacity: (actionLoading || buttonConfig.disabled) ? 0.6 : 1,

            }}
          // txtcolor={'white'}

          />
        </View>
      </TouchableWithoutFeedback>

    </View>
  );
};
const OtpSection = ({ label, value, onChange }: any) => {
  return (
    <View>
      <View style={styles.inputContainer1}>
        <Text style={styles.inputLabel}>{label}</Text>

        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          placeholder={strings.EnterOTP}
          maxLength={6}
          value={value}
          onChangeText={onChange}
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );
};
export default TripMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',


    zIndex: 100,
  },
  backButtonWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
  },
  locationContent: {
    flex: 1,
    paddingLeft: 12,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: font.MonolithRegular,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7CC',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: font.MonolithRegular,

  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationIconWrap: {
    width: 16,
    alignItems: 'center',
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  connectorLine: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  locationCopy: {
    flex: 1,
    paddingLeft: 8,
  },
  locationLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
    fontFamily: font.MonolithRegular,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
    lineHeight: 18,
  },
  driverCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: '#fff',
  },
  arrivingText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: '#000',
  },
  timeText: {
    position: 'absolute',
    right: 20,
    top: 20,
    color: '#888',

  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginVertical: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  driverName: {
    fontSize: 16,
    fontFamily: font.MonolithRegular

  },
  carDetails: {
    color: '#aaa',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 15,
    marginBottom: 25
  },
  iconBtn: {
    width: 50,
    height: 50,
    // backgroundColor: '#00BFA5',
    // borderRadius: 25,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  seprator: {
    height: 0.7,
    marginVertical: 5,
    marginTop: 15,
    width: '100%',
    backgroundColor: "grey"
  },
  inputContainer1: {
    marginBottom: 15,
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    padding: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: "#3B4051",
    marginBottom: 8,
    fontFamily: font.MonolithRegular

  },
  textInput: {
    color: "#000",
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    padding: 0,
  },
  dotMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },
  dotMarkerLarge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: "#FFF",

  },
  courierMarker: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  courierPulse: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255, 204, 0, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 204, 0, 0.45)",
  },
  courierMarkerInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFCC00",
  },
  courierImage: { width: 29, height: 29, resizeMode: "contain" },
  mapWrap: {
    flex: 1,
    width: '100%',
  },
  mapView: {
    flex: 1,
    width: '100%',
  },
  mapMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinHead: {
    width: 40,
    height: 40,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",

  },
  pinIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupPin: {
    backgroundColor: "#10B981",
  },
  dropPin: {
    backgroundColor: "#EF4444",
  },
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -5,
  },
  pickupPointer: {
    borderTopColor: "#10B981",
  },
  dropPointer: {
    borderTopColor: "#EF4444",
  },
  arrivalBadge: {
    position: 'absolute',
    top: hp(10),
    left: wp(5),
    right: wp(5),
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,

  },
  arrivalBadgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrivalBadgeText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    flex: 1,
    lineHeight: 20,
  },
  sameLocationBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 168 : 148,
    alignSelf: 'center',
    maxWidth: '90%',
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    zIndex: 1000,
  },
  sameLocationText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: font.MonolithRegular,
  },
});
