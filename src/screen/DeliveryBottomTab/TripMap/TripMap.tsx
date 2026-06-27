import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Alert,
  TextInput,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
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
import { errorToast, successToast } from '../../../utils/customToast';
import ScreenNameEnum from '../../../routes/screenName.enum';
import strings from '../../../localization/Localization';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const routesMatch = (a: Array<{ latitude: number; longitude: number }>, b: Array<{ latitude: number; longitude: number }>) =>
  a.length === b.length &&
  a.every((point, index) => (
    Math.abs(point.latitude - b[index].latitude) < 0.00001 &&
    Math.abs(point.longitude - b[index].longitude) < 0.00001
  ));



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
  const [hasDriverLocation, setHasDriverLocation] = useState(false);
  const locationSocketRef = useRef<WebSocket | null>(null);
  const driverLocationSocketRef = useRef<WebSocket | null>(null);
  const latestDriverLocationPayloadRef = useRef<{ parcelId: number | string; lat: number; lon: number } | null>(null);
  const locationTokenRef = useRef<string | null>(null);
  const locationHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const parcelIdRef = useRef<string | number | undefined>(item?.parcelId ?? item?.id);
  parcelIdRef.current = parcel?.parcelId ?? parcel?.id ?? item?.parcelId ?? item?.id;
  const canCancel = item?.deliveryStatus &&
    [STATUS?.PENDING, STATUS?.ASSIGNED, STATUS?.GOING_TO_PICKUP, STATUS?.PICKED_UP, STATUS?.ON_THE_WAY].includes(item.deliveryStatus);

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
    setHasDriverLocation(true);
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
        if (latestPayload && ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(latestPayload));
        }
      };

      const existingSocket = driverLocationSocketRef.current;
      if (existingSocket?.readyState === WebSocket?.OPEN) {
        sendLatestPayload(existingSocket);
        return;
      }
      if (existingSocket?.readyState === WebSocket?.CONNECTING) {
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
        if (driverLocationSocketRef?.current === ws) {
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
        const { latitude, longitude } = position?.coords;
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
    getDetail()
  }, [])

  const getDetail = async () => {
    const param = {
      url: `/delivery/my-offers/${parcelId}`
    }
    const res = await GetApi(param, setLoading)
    if (res?.status == 1) {
      setParcel(res?.offer?.parcel)
    }
    setActionLoading(false)
  }


  const navigation = useNavigation()
  const getButtonConfig = () => {
    const currentStatus = item?.deliveryStatus;
    switch (currentStatus) {

      case STATUS.ASSIGNED:
        return {
          title: strings?.StartPickup,
          onPress: () => handleStatusUpdate(STATUS.GOING_TO_PICKUP),
          color: STATUS_COLORS[STATUS.GOING_TO_PICKUP], // Fixed
          icon: "car-outline",
          showInputs: false
        };

      case STATUS.GOING_TO_PICKUP:
        return {
          title: strings?.MarkPickedUp,
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

  const hasRouteFields = (candidate: any) => Boolean(
    candidate && (
      candidate.pickupLat != null ||
      candidate.pickup_lat != null ||
      candidate.pickupLocationLat != null ||
      candidate.pickup_location_lat != null ||
      candidate.pickup != null ||
      candidate.pickupCoords != null ||
      candidate.pickupCoordinate != null ||
      candidate.dropLat != null ||
      candidate.droplat != null ||
      candidate.drop_lat != null ||
      candidate.dropLocationLat != null ||
      candidate.drop_location_lat != null ||
      candidate.drop != null ||
      candidate.dropCoords != null ||
      candidate.dropCoordinate != null ||
      candidate.deliveryLocation != null
    )
  );
  const source =
    [parcel?.parcel, item?.parcel, event?.parcel, parcel, item, event].find(hasRouteFields) ??
    parcel?.parcel ??
    item?.parcel ??
    event?.parcel ??
    parcel ??
    item ??
    event;
  const mapRef = useRef<MapView>(null);
  const normalizeCoords = (latField: any, lonField: any): LatLng | null => {
    const v1 = safeNum(latField, null);
    const v2 = safeNum(lonField, null);

    if (v1 === null || v2 === null) return null;

    if (Math.abs(v1) > 90 && Math.abs(v2) <= 90) {
      return { latitude: v2, longitude: v1 };
    }
    if (v1 > 60 && v2 < 40) {
      return { latitude: v2, longitude: v1 };
    }
    if (Math.abs(v1) > 90 || Math.abs(v2) > 180) return null;
    return { latitude: v1, longitude: v2 };
  };
  const getPointFromCandidate = (candidate: any): LatLng | null => {
    if (!candidate) return null;
    if (Array.isArray(candidate) && candidate.length >= 2) {
      return normalizeCoords(candidate[0], candidate[1]);
    }
    if (typeof candidate === "string") {
      const match = candidate.match(/-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?/);
      if (!match) return null;
      const [lat, lon] = match[0].split(",").map((value) => value.trim());
      return normalizeCoords(lat, lon);
    }
    if (typeof candidate !== "object") return null;

    const directPoint = normalizeCoords(
      candidate.latitude ?? candidate.lat,
      candidate.longitude ?? candidate.lng ?? candidate.lon,
    );
    if (directPoint) return directPoint;

    const nestedLocation = candidate.location ?? candidate.geometry?.location;
    if (nestedLocation && nestedLocation !== candidate) {
      const nestedPoint = getPointFromCandidate(nestedLocation);
      if (nestedPoint) return nestedPoint;
    }

    const coordinates = candidate.coordinates ?? candidate.geometry?.coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      return normalizeCoords(coordinates[0], coordinates[1]);
    }

    return null;
  };
  const getCoords = (
    objectCandidates: any[],
    coordinatePairs: Array<[any, any]>,
  ): LatLng | null => {
    for (const candidate of objectCandidates) {
      const point = getPointFromCandidate(candidate);
      if (point) return point;
    }

    for (const [latField, lonField] of coordinatePairs) {
      const point = normalizeCoords(latField, lonField);
      if (point) return point;
    }

    return null;
  };
  const getAddressText = (...values: any[]) => {
    for (const value of values) {
      if (!value) continue;
      if (typeof value === "string") return value;
      if (typeof value === "object") {
        const text =
          value.address ??
          value.location ??
          value.formattedAddress ??
          value.formatted_address ??
          value.description ??
          value.name;
        if (text) return String(text);
      }
    }
    return "";
  };
  const normalizePointForAddress = (point: LatLng | null, address: any): LatLng | null => {
    return point;
  };
  const normalizePointForRoute = (point: LatLng, destination: LatLng, address: any): LatLng => {
    return point;
  };

  const pickupAddress = getAddressText(
    source?.pickupLocation,
    source?.pickup,
    source?.pickupAddress,
    source?.pickup_address,
    item?.pickup?.location,
    strings?.PickupLocation,
  );
  const dropoffAddress = getAddressText(
    source?.dropLocation,
    source?.drop,
    source?.deliveryLocation,
    source?.dropAddress,
    source?.drop_address,
    item?.drop?.location,
    strings?.DropLocation,
  );

  const pickupCoords = normalizePointForAddress(getCoords(
    [source?.pickup, source?.pickupLocation, source?.pickupCoords, source?.pickupCoordinate, source?.pickup_coordinates],
    [[
      source?.pickupLat ?? source?.pickup_lat,
      source?.pickupLon ?? source?.pickupLng ?? source?.pickup_lon ?? source?.pickup_lng,
    ], [
      source?.pickupLocationLat ?? source?.pickup_location_lat,
      source?.pickupLocationLon ?? source?.pickupLocationLng ?? source?.pickup_location_lon ?? source?.pickup_location_lng,
    ], [
      source?.sourceLat ?? source?.source_lat,
      source?.sourceLon ?? source?.sourceLng ?? source?.source_lon ?? source?.source_lng,
    ]],
  ), pickupAddress);

  const dropoffCoords = normalizePointForAddress(getCoords(
    [source?.drop, source?.dropLocation, source?.deliveryLocation, source?.dropCoords, source?.dropCoordinate, source?.drop_coordinates],
    [[
      source?.dropLat ?? source?.droplat ?? source?.drop_lat,
      source?.dropLon ?? source?.dropLng ?? source?.drop_lon ?? source?.drop_lng,
    ], [
      source?.dropLocationLat ?? source?.drop_location_lat,
      source?.dropLocationLon ?? source?.dropLocationLng ?? source?.drop_location_lon ?? source?.drop_location_lng,
    ], [
      source?.destinationLat ?? source?.destination_lat,
      source?.destinationLon ?? source?.destinationLng ?? source?.destination_lon ?? source?.destination_lng,
    ]],
  ), dropoffAddress);

  const pickup = pickupCoords || { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
  const dropoff = dropoffCoords || { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
  const [currentCoords, setCurrentCoords] = useState(driverCoords);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [activeRouteCoordinates, setActiveRouteCoordinates] = useState<LatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [activeRouteLoading, setActiveRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const normalizedPickupAddress = String(pickupAddress)?.trim()?.toLowerCase();
  const normalizedDropoffAddress = String(dropoffAddress)?.trim()?.toLowerCase();
  const sameLocation =
    normalizedPickupAddress?.length > 0 &&
    normalizedPickupAddress === normalizedDropoffAddress;

  const deliveryStatus = item?.deliveryStatus ?? parcel?.deliveryStatus ?? item?.parcel?.deliveryStatus ?? '';
  const isToPickup = deliveryStatus === STATUS.ASSIGNED || deliveryStatus === STATUS.GOING_TO_PICKUP;
  const isToDropoff = deliveryStatus === STATUS.PICKED_UP || deliveryStatus === STATUS.ON_THE_WAY || deliveryStatus === STATUS.ARRIVING;
  const routeDestination = isToPickup ? pickup : dropoff;
  const distanceBetween = (a: LatLng, b: LatLng) => {
    const dLat = a?.latitude - b?.latitude;
    const dLng = a?.longitude - b?.longitude;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  };

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const getDistanceKm = (a: LatLng, b: LatLng) => {
    const earthRadiusKm = 6371;
    const dLat = toRadians(b?.latitude - a?.latitude);
    const dLng = toRadians(b?.longitude - a?.longitude);
    const lat1 = toRadians(a?.latitude);
    const lat2 = toRadians(b?.latitude);
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

  const MIN_DIST = 0.0003;
  const tooClose = hasDriverLocation && distanceBetween(currentCoords, routeDestination) < MIN_DIST;
  // Full path green→red: show polyline between pickup and dropoff so driver sees where to go
  const pickupToDropoffValid = Boolean(
    pickupCoords &&
    dropoffCoords &&
    Math.abs(pickup?.latitude) <= 90 &&
    Math.abs(pickup?.longitude) <= 180 &&
    Math.abs(dropoff?.latitude) <= 90 &&
    Math.abs(dropoff?.longitude) <= 180 &&
    Number.isFinite(pickup?.latitude) &&
    Number.isFinite(pickup?.longitude) &&
    Number.isFinite(dropoff?.latitude) &&
    Number.isFinite(dropoff?.longitude) &&
    (pickup?.latitude !== dropoff?.latitude || pickup?.longitude !== dropoff?.longitude)
  );
  const orderDistanceText = pickupToDropoffValid ? formatKm(routeDistanceKm ?? getDistanceKm(pickup, dropoff)) : "—";

  const isValidLatLng = useCallback((point: LatLng | null | undefined) =>
    Boolean(
      point &&
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude) &&
      Math.abs(point.latitude) <= 90 &&
      Math.abs(point.longitude) <= 180,
    ), []);
  const cleanRouteCoordinates = useCallback((coordinates: LatLng[], origin: LatLng, destination: LatLng) => {
    const cleaned = coordinates.reduce<LatLng[]>((acc, point) => {
      if (!isValidLatLng(point)) return acc;
      const last = acc[acc.length - 1];
      if (
        last &&
        Math.abs(last.latitude - point.latitude) < 0.00001 &&
        Math.abs(last.longitude - point.longitude) < 0.00001
      ) {
        return acc;
      }
      acc.push(point);
      return acc;
    }, []);

    if (cleaned.length < 2) return [];

    const directKm = Math.max(getDistanceKm(origin, destination), 0.1);
    const routeKm = cleaned.reduce((sum, point, index) => {
      if (index === 0) return sum;
      return sum + getDistanceKm(cleaned[index - 1], point);
    }, 0);

    if (routeKm > directKm * 8 + 80) return [];

    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    const withEndpoints = [...cleaned];
    if (getDistanceKm(origin, first) > 0.001) withEndpoints.unshift(origin);
    if (getDistanceKm(destination, last) > 0.001) withEndpoints.push(destination);

    return withEndpoints;
  }, [isValidLatLng]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e?.endCoordinates?.height));
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

  const rawDriverCoordinate: LatLng = {
    latitude: safeNum(driverCoords?.latitude, DEFAULT_LAT) ?? DEFAULT_LAT,
    longitude: safeNum(driverCoords?.longitude, DEFAULT_LNG) ?? DEFAULT_LNG,
  };
  const driverCoordinate = normalizePointForRoute(
    rawDriverCoordinate,
    routeDestination,
    isToPickup ? pickupAddress : dropoffAddress,
  );
  useEffect(() => {
    setCurrentCoords(driverCoordinate);
  }, [driverCoordinate.latitude, driverCoordinate.longitude]);
  const activeRouteValid = Boolean(
    hasDriverLocation &&
    (isToPickup ? pickupCoords : dropoffCoords) &&
    Math.abs(driverCoordinate?.latitude) <= 90 &&
    Math.abs(driverCoordinate?.longitude) <= 180 &&
    Math.abs(routeDestination?.latitude) <= 90 &&
    Math.abs(routeDestination?.longitude) <= 180 &&
    Number.isFinite(driverCoordinate?.latitude) &&
    Number.isFinite(driverCoordinate?.longitude) &&
    Number.isFinite(routeDestination?.latitude) &&
    Number.isFinite(routeDestination.longitude) &&
    distanceBetween(driverCoordinate, routeDestination) >= MIN_DIST &&
    (isToPickup || isToDropoff)
  );
  const hasActiveRouteLine = activeRouteCoordinates.length > 1;

  const mapEdgePadding = useMemo(() => ({
    right: wp(8),
    bottom: hp(30),
    left: wp(8),
    top: hp(8),
  }), []);

  const initialRegion = useMemo(() => ({
    latitude: (pickup?.latitude + dropoff?.latitude) / 2,
    longitude: (pickup?.longitude + dropoff?.longitude) / 2,
    latitudeDelta: Math.max(0.018, Math.abs(pickup?.latitude - dropoff?.latitude) * 1.15),
    longitudeDelta: Math.max(0.018, Math.abs(pickup?.longitude - dropoff?.longitude) * 1.15),
  }), [
    dropoff?.latitude,
    dropoff?.longitude,
    pickup?.latitude,
    pickup?.longitude,
  ]);

  const zoomToPoint = useCallback((point: LatLng) => {
    if (!isValidLatLng(point)) return;
    setTimeout(() => {
      mapRef.current?.animateToRegion({
        ...point,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 450);
    }, Platform.OS === 'ios' ? 350 : 80);
  }, [isValidLatLng]);

  const fitMapToPoints = useCallback((points: LatLng[]) => {
    const validPoints = points.filter((point): point is LatLng => isValidLatLng(point));
    if (validPoints.length === 1) {
      zoomToPoint(validPoints[0]);
      return;
    }
    if (validPoints.length < 2) return;

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(validPoints, {
        edgePadding: mapEdgePadding,
        animated: true,
      });
    }, Platform.OS === 'ios' ? 350 : 80);
  }, [isValidLatLng, mapEdgePadding, zoomToPoint]);

  const fetchRoadRoute = useCallback(async (origin: LatLng, destination: LatLng) => {
    try {
      const googleUrl =
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_MAPS_APIKEY}`;
      const polyline = require("@mapbox/polyline") as {
        decode: (encoded: string, precision?: number) => Array<[number, number]>;
      };

      const googleResponse = await fetch(googleUrl);
      const googleJson = await googleResponse.json();
      const googleRoute = googleJson?.routes?.[0];
      const points = googleRoute?.overview_polyline?.points;

      if (points) {
        const coordinates = cleanRouteCoordinates(
          polyline.decode(points).map(([latitude, longitude]) => ({ latitude, longitude })),
          origin,
          destination,
        );
        if (coordinates.length > 1) {
          const legs = Array.isArray(googleRoute?.legs) ? googleRoute.legs : [];
          const distance = legs.reduce((sum: number, leg: any) => sum + (Number(leg?.distance?.value) || 0), 0) / 1000;

          return { coordinates, distance };
        }
      }

      const osrmUrl =
        `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};` +
        `${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=false`;
      const osrmResponse = await fetch(osrmUrl);
      const osrmJson = await osrmResponse.json();
      const osrmRoute = osrmJson?.routes?.[0];
      const osrmCoordinates = osrmRoute?.geometry?.coordinates;
      if (!Array.isArray(osrmCoordinates) || osrmCoordinates.length < 2) return null;

      const coordinates = osrmCoordinates
        .map(([longitude, latitude]: [number, number]) => ({ latitude, longitude }))
        .filter((point: LatLng) => isValidLatLng(point));
      const displayCoordinates = cleanRouteCoordinates(coordinates, origin, destination);
      if (displayCoordinates.length < 2) return null;

      return {
        coordinates: displayCoordinates,
        distance: (Number(osrmRoute?.distance) || 0) / 1000,
      };
    } catch (error) {
      console.warn("Manual route fetch failed:", error);
      return null;
    }
  }, [cleanRouteCoordinates, isValidLatLng]);

  const fitVisibleRoute = useCallback(() => {
    if (activeRouteCoordinates.length > 1) {
      fitMapToPoints(activeRouteCoordinates);
      return;
    }
    if (hasDriverLocation) {
      zoomToPoint(driverCoordinate);
      return;
    }
    if (routeCoordinates.length > 1) {
      fitMapToPoints(routeCoordinates);
      return;
    }
    if (activeRouteValid) {
      fitMapToPoints([driverCoordinate, routeDestination]);
      return;
    }
    if (pickupToDropoffValid) {
      fitMapToPoints([pickup, dropoff]);
    }
  }, [
    activeRouteCoordinates,
    activeRouteValid,
    driverCoordinate.latitude,
    driverCoordinate.longitude,
    dropoff.latitude,
    dropoff.longitude,
    fitMapToPoints,
    hasDriverLocation,
    pickup.latitude,
    pickup.longitude,
    pickupToDropoffValid,
    routeCoordinates,
    routeDestination.latitude,
    routeDestination.longitude,
    zoomToPoint,
  ]);

  useEffect(() => {
    setRouteCoordinates([]);
    setRouteError(null);
  }, [
    pickup?.latitude,
    pickup?.longitude,
    dropoff?.latitude,
    dropoff?.longitude,
  ]);

  useEffect(() => {
    if (!activeRouteValid) {
      setActiveRouteCoordinates([]);
    }
  }, [activeRouteValid]);

  useEffect(() => {
    fitVisibleRoute();
  }, [fitVisibleRoute]);

  useEffect(() => {
    if (!pickupToDropoffValid) return;
    let cancelled = false;

    const loadRoute = async () => {
      setRouteLoading(true);
      setRouteError(null);
      const roadRoute = await fetchRoadRoute(pickup, dropoff);
      if (cancelled) return;
      if (!roadRoute || roadRoute.coordinates.length < 2) {
        setRouteCoordinates([]);
        setRouteError("Route unavailable");
        setRouteLoading(false);
        return;
      }

      const { coordinates, distance } = roadRoute;
      setRouteDistanceKm(distance);
      setRouteCoordinates(coordinates);
      fitMapToPoints(coordinates);
      setRouteLoading(false);
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    pickupToDropoffValid,
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
    fetchRoadRoute,
    fitMapToPoints,
  ]);

  useEffect(() => {
    if (!activeRouteValid) return;
    let cancelled = false;

    const loadActiveRoute = async () => {
      setActiveRouteLoading(true);
      const roadRoute = await fetchRoadRoute(driverCoordinate, routeDestination);
      if (cancelled) return;
      if (!roadRoute || roadRoute.coordinates.length < 2) {
        setActiveRouteCoordinates([]);
        setActiveRouteLoading(false);
        return;
      }

      const { coordinates } = roadRoute;
      setActiveRouteCoordinates(coordinates);
      fitMapToPoints(coordinates);
      setActiveRouteLoading(false);
    };

    loadActiveRoute();
    return () => {
      cancelled = true;
    };
  }, [
    activeRouteValid,
    driverCoordinate.latitude,
    driverCoordinate.longitude,
    routeDestination.latitude,
    routeDestination.longitude,
    fetchRoadRoute,
    fitMapToPoints,
  ]);

  const buttonConfig = getButtonConfig();
  const updateParcelStatus = async (orderId: string | number, newStatus: string, otp?: string) => {
    const token = await AsyncStorage.getItem('token');
    const body = {
      otp: otp ?? '',
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
        errorToast(strings.EnterDeliveryOTPShared)
        return;
      }

      const result = await updateParcelStatus(item?.parcelId || item?.id, newStatus, newStatus == STATUS.DELIVERED ? deliveryOtp : pickupOtp);
      console.log(result)
      if (result.status == 1) {
        successToast(String(strings?.formatString(strings.StatusUpdatedTo, STATUS_LABELS[newStatus])))
        navigation.goBack();
        // You might want to refresh the data here
      } else {
        errorToast(result.message ?? strings.FailedUpdateStatus)
        // Alert.alert("Success", "Update Status Successfully");
      }
    } catch (error) {
      console.error("Status update error:", error);
      errorToast(strings.SomethingWentWrong)

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
            style={styles.mapView}
            initialRegion={initialRegion}
            loadingEnabled
            loadingIndicatorColor="#FFCC00"
            mapPadding={mapEdgePadding}
            showsBuildings={false}
            showsTraffic={false}
            onMapReady={fitVisibleRoute}
            onLayout={fitVisibleRoute}
          >
            {pickupToDropoffValid && (
              <MapViewDirections
                key={`google-full-${pickup.latitude}-${pickup.longitude}-${dropoff.latitude}-${dropoff.longitude}`}
                origin={pickup}
                destination={dropoff}
                apikey={GOOGLE_MAPS_APIKEY}
                mode="DRIVING"
                precision="high"
                strokeWidth={0}
                strokeColor="transparent"
                optimizeWaypoints={false}
                onReady={(result) => {
                  const coordinates = cleanRouteCoordinates(result.coordinates || [], pickup, dropoff);
                  if (coordinates.length > 1 && !routesMatch(routeCoordinates, coordinates)) {
                    setRouteCoordinates(coordinates);
                  }
                  setRouteDistanceKm(result.distance ?? null);
                  setRouteError(null);
                  setRouteLoading(false);
                  if (coordinates.length > 1) {
                    fitMapToPoints(coordinates);
                  }
                }}
                onError={(errorMessage) => {
                  console.warn("Google full route error:", errorMessage);
                  setRouteError("Route unavailable");
                  setRouteLoading(false);
                }}
              />
            )}

            {activeRouteValid && (
              <MapViewDirections
                key={`google-active-${driverCoordinate.latitude}-${driverCoordinate.longitude}-${routeDestination.latitude}-${routeDestination.longitude}`}
                origin={driverCoordinate}
                destination={routeDestination}
                apikey={GOOGLE_MAPS_APIKEY}
                mode="DRIVING"
                precision="high"
                strokeWidth={0}
                strokeColor="transparent"
                optimizeWaypoints={false}
                onReady={(result) => {
                  const coordinates = cleanRouteCoordinates(result.coordinates || [], driverCoordinate, routeDestination);
                  if (coordinates.length > 1 && !routesMatch(activeRouteCoordinates, coordinates)) {
                    setActiveRouteCoordinates(coordinates);
                  }
                  if (coordinates.length > 1) {
                    fitMapToPoints(coordinates);
                  }
                  setActiveRouteLoading(false);
                }}
                onError={(errorMessage) => {
                  console.warn("Google active route error:", errorMessage);
                  setActiveRouteCoordinates([]);
                  setActiveRouteLoading(false);
                }}
              />
            )}

            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={hasActiveRouteLine ? 8 : 10}
                strokeColor="rgba(255, 255, 255, 0.96)"
                lineCap="round"
                lineJoin="round"
                zIndex={0}
              />
            )}
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={hasActiveRouteLine ? 4 : 6}
                strokeColor={hasActiveRouteLine ? "#94A3B8" : "#FFCC00"}
                lineCap="round"
                lineJoin="round"
                zIndex={1}
              />
            )}

            {activeRouteCoordinates.length > 1 && (
              <Polyline
                coordinates={activeRouteCoordinates}
                strokeWidth={10}
                strokeColor="rgba(255, 255, 255, 0.96)"
                lineCap="round"
                lineJoin="round"
                zIndex={2}
              />
            )}
            {activeRouteCoordinates.length > 1 && (
              <Polyline
                coordinates={activeRouteCoordinates}
                strokeWidth={6}
                strokeColor="#FFCC00"
                lineCap="round"
                lineJoin="round"
                zIndex={3}
              />
            )}
            {pickupCoords && (
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
            )}
            {dropoffCoords && (
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
            )}
            {hasDriverLocation && (
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
            )}
          </MapView>
          {(routeLoading || activeRouteLoading || routeError) && (
            <View style={styles.routeStatusPill} pointerEvents="none">
              {(routeLoading || activeRouteLoading) ? <ActivityIndicator size="small" color="#111827" /> : null}
              <Text style={styles.routeStatusText}>
                {(routeLoading || activeRouteLoading) ? "Loading route" : routeError}
              </Text>
            </View>
          )}
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
                {isToPickup ? strings?.ArrivedAtPickup : strings?.ArrivedAtDropoff}
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
              <Text style={styles.distanceText}>{orderDistanceText}</Text>
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
  routeStatusPill: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 224,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    zIndex: 20,
    elevation: 8,
  },
  routeStatusText: {
    marginLeft: 8,
    color: "#111827",
    fontSize: 12,
    fontFamily: font.MonolithRegular,
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
    zIndex: 1000,
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
