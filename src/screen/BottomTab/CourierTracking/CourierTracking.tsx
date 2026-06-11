
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Linking,
  Dimensions,
  PanResponder,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, AnimatedRegion, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import { SafeAreaView } from "react-native-safe-area-context";
import imageIndex from "../../../assets/imageIndex";
import font from "../../../theme/font";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { GOOGLE_MAPS_APIKEY, WebSocket_Url } from "../../../Api";
import { STATUS, STATUS_COLORS, STATUS_LABELS } from "../../../utils/Constant";
import { GetApi, RateDeliveryApi } from "../../../Api/apiRequest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { successToast } from "../../../utils/customToast";
import RatingModal from "../../../compoent/RatingModal";
import strings from "../../../localization/Localization";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
const { height } = Dimensions.get("window");
const PANEL_PEEK_HEIGHT = 280;
const PANEL_OPEN_Y = height * 0.3;
const PANEL_CLOSED_Y = height - PANEL_PEEK_HEIGHT;
const routesMatch = (a: Array<{ latitude: number; longitude: number }>, b: Array<{ latitude: number; longitude: number }>) =>
  a.length === b.length &&
  a.every((point, index) => (
    Math.abs(point.latitude - b[index].latitude) < 0.00001 &&
    Math.abs(point.longitude - b[index].longitude) < 0.00001
  ));
const CourierTrackingScreen = () => {
  const nav = useNavigation();
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const rou: any = useRoute();
  const { item, parcel: routeParcel, event } = rou.params || {};
  const [parcel, setParcel] = useState(item ?? null);
  const socketRef = useRef<WebSocket | null>(null);
  const getDetailRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const parcelIdRef = useRef<number | undefined>(parcel?.id ?? item?.parcel?.id ?? routeParcel?.id ?? item?.id);
  const trackingIdRef = useRef<string | number | undefined>(parcel?.trackingId ?? item?.parcel?.trackingId ?? routeParcel?.trackingId ?? item?.trackingId);
  const driverLocationRef = useRef<any>(null);
  const setCurrentCoordsRef = useRef<((c: { latitude: number; longitude: number }) => void) | null>(null);
  const fitMapToRouteRef = useRef<() => void>(() => { });
  const routeContextRef = useRef<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const ratingSubmittedRef = useRef(false);

  const getDetail = async () => {
    const parcelId = parcel?.id ?? item?.parcel?.id ?? routeParcel?.id ?? item?.parcelId ?? item?.id;
    if (!parcelId) return;
    const param = { url: `/parcel-details/${parcelId}` };
    const res = await GetApi(param, setLoading);
    if (isMounted.current && res?.status === 1 && res?.parcel) {
      setParcel({ ...res.parcel });
    }
  };
  getDetailRef.current = getDetail;
  parcelIdRef.current = parcel?.id ?? item?.parcel?.id ?? routeParcel?.id ?? item?.parcelId ?? item?.id;
  trackingIdRef.current = parcel?.trackingId ?? item?.parcel?.trackingId ?? routeParcel?.trackingId ?? item?.trackingId;
  useEffect(() => {
    isMounted.current = true;
    getDetail();
    return () => {
      isMounted.current = false;
    };
  }, [item?.id, item?.parcel?.id, item?.parcelId, routeParcel?.id]);
  useEffect(() => {
    let ws: WebSocket | null = null;
    const connectSocket = (token: string) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const wsUrl = `${WebSocket_Url}/user?token=${encodeURIComponent(token)}`;
          ws = new WebSocket(wsUrl);
          let resolved = false;
          ws.onopen = () => {
            resolved = true;
            socketRef.current = ws;
            try {
              ws?.send(JSON.stringify({ type: "ping" }));
            } catch (_) { }
            resolve();
          };
          ws.onmessage = async (event: { data: string | Blob | ArrayBuffer }) => {
            let raw: string;
            const d = event?.data;
            if (typeof d === "string") raw = d;
            else if (d && typeof (d as Blob).text === "function") raw = await (d as Blob).text();
            else if (d instanceof ArrayBuffer) raw = new TextDecoder().decode(d);
            else raw = String(d);
            try {
              const data = JSON.parse(raw);

              if (data?.type === "parcel_status_update") {
                successToast(data?.message ?? "updated");
                getDetailRef.current?.();
              }

              if (data?.type === "driver_location" || data?.type === "online" || data?.type === "location") {
                const pId = parcelIdRef.current;
                const incomingParcelId = data?.parcelId ?? data?.parcel_id ?? data?.id;
                const incomingTrackingId = data?.trackingId ?? data?.tracking_id;
                const currentTrackingId = trackingIdRef.current;
                const hasParcelId = pId != null && incomingParcelId != null;
                const hasTrackingId = currentTrackingId != null && incomingTrackingId != null;
                const match =
                  (hasParcelId && Number(incomingParcelId) === Number(pId)) ||
                  (hasTrackingId && String(incomingTrackingId) === String(currentTrackingId)) ||
                  (!hasParcelId && !hasTrackingId);
                const lat = parseFloat(data?.lat ?? data?.latitude);
                const lon = parseFloat(data?.lon ?? data?.lng ?? data?.longitude);
                if (match && Number.isFinite(lat) && Number.isFinite(lon)) {
                  const rawPoint = normalizeCoords(lat, lon);
                  if (!rawPoint) return;
                  const routeContext = routeContextRef.current;
                  const liveStatus = routeContext?.status;
                  const routeTarget = [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP].includes(liveStatus)
                    ? routeContext?.pickup
                    : routeContext?.dropoff;
                  const routeTargetAddress = [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP].includes(liveStatus)
                    ? routeContext?.pickupAddress
                    : routeContext?.dropoffAddress;
                  if (!routeTarget) return;
                  const newPoint = normalizePointForRoute(rawPoint, routeTarget, routeTargetAddress);
                  setHasLiveDriverLocation(true);
                  setCurrentCoordsRef.current?.(newPoint);
                  const region = driverLocationRef.current;
                  if (region) {
                    (region as any).timing({
                      ...newPoint,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                      duration: 2000,
                      useNativeDriver: false,
                    }).start();
                  }
                  setTimeout(() => fitMapToRouteRef.current?.(), 100);
                }
              }
              if (data?.type === "order_update" || data?.refreshOrders) {
                getDetailRef.current?.();
              }
            } catch (_) { }
          };
          ws.onerror = (e: unknown) => {
            const msg = e && typeof e === "object" && "message" in e ? String((e as { message?: string }).message) : "WebSocket error";
            if (!resolved) reject(new Error(msg));
          };
          ws.onclose = (event: { reason?: string }) => {
            socketRef.current = null;
            if (!resolved) reject(new Error(event?.reason ?? "Connection closed"));
          };
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    };
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        await connectSocket(token);
      } catch (_) { }
    };
    init();
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);
  const driver = parcel?.assignedDriver ?? item?.parcel?.assignedDriver ?? routeParcel?.assignedDriver ?? item?.assignedDriver;
  const status = parcel?.deliveryStatus ?? item?.parcel?.deliveryStatus ?? routeParcel?.deliveryStatus ?? item?.deliveryStatus;
  const DEFAULT_LAT = 22.7176;
  const DEFAULT_LNG = 75.8577;
  type LatLng = { latitude: number; longitude: number };
  const safeNum = (v: any, fallback: number | null): number | null => {
    if (v == null) return fallback;
    const n = parseFloat(v);
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
    [parcel?.parcel, item?.parcel, routeParcel, event?.parcel, parcel, item, event].find(hasRouteFields) ??
    parcel?.parcel ??
    item?.parcel ??
    routeParcel ??
    event?.parcel ??
    parcel ??
    item ??
    event;
  const normalizeCoords = (latField: any, lonField: any): LatLng | null => {
    const v1 = safeNum(latField, null);
    const v2 = safeNum(lonField, null);
    if (v1 === null || v2 === null) return null;
    if (Math.abs(v1) > 90 && Math.abs(v2) <= 90) return { latitude: v2, longitude: v1 };
    if (v1 > 60 && v2 < 40) return { latitude: v2, longitude: v1 };
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
    if (!point) return null;
    const addressText = getAddressText(address).toLowerCase();
    const looksLikeUsAddress =
      addressText.includes("usa") ||
      addressText.includes("united states") ||
      addressText.includes("san francisco") ||
      /\bca\b/.test(addressText);

    const looksLikeWestUsCoordinate =
      point.latitude >= 30 &&
      point.latitude <= 50 &&
      point.longitude > 100 &&
      point.longitude <= 130;

    if ((looksLikeUsAddress || looksLikeWestUsCoordinate) && point.longitude > 0 && point.longitude >= 60 && point.longitude <= 130) {
      return { ...point, longitude: -point.longitude };
    }

    return point;
  };
  const normalizePointForRoute = (point: LatLng, destination: LatLng, address: any): LatLng => {
    const normalized = normalizePointForAddress(point, address) ?? point;
    const sameLongitudeBand = Math.abs(Math.abs(normalized.longitude) - Math.abs(destination.longitude)) <= 35;
    const sameLatitudeBand = Math.abs(normalized.latitude - destination.latitude) <= 30;

    if (sameLongitudeBand && sameLatitudeBand && destination.longitude < 0 && normalized.longitude > 0) {
      return { ...normalized, longitude: -normalized.longitude };
    }

    if (sameLongitudeBand && sameLatitudeBand && destination.longitude > 0 && normalized.longitude < 0) {
      return { ...normalized, longitude: Math.abs(normalized.longitude) };
    }

    return normalized;
  };

  const pickupAddressForCoords = getAddressText(
    source?.pickupLocation,
    source?.pickup,
    source?.pickupAddress,
    source?.pickup_address,
    item?.pickupLocation,
  );
  const dropoffAddressForCoords = getAddressText(
    source?.dropLocation,
    source?.drop,
    source?.deliveryLocation,
    source?.dropAddress,
    source?.drop_address,
    item?.dropLocation,
  );

  const pickupCoords = normalizePointForAddress(getCoords(
    [source?.pickupLocation, source?.pickup, source?.pickupCoords, source?.pickupCoordinate, source?.pickup_coordinates],
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
  ), pickupAddressForCoords);

  const dropoffCoords = normalizePointForAddress(getCoords(
    [source?.dropLocation, source?.drop, source?.deliveryLocation, source?.dropCoords, source?.dropCoordinate, source?.drop_coordinates],
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
  ), dropoffAddressForCoords);

  const pickup = pickupCoords ?? { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
  const dropoff = dropoffCoords ?? {
    latitude: pickup.latitude + 0.01,
    longitude: pickup.longitude + 0.01,
  };
  routeContextRef.current = {
    pickup,
    dropoff,
    status,
    pickupAddress: pickupAddressForCoords,
    dropoffAddress: dropoffAddressForCoords,
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
    if (!Number.isFinite(value)) return "—";
    if (value < 0.1) return `${Math.round(value * 1000)} m`;
    return `${value.toFixed(value < 10 ? 1 : 0)} km`;
  };
  const formatDuration = (minutes: number | null) => {
    if (minutes == null || !Number.isFinite(minutes)) return "—";
    const rounded = Math.max(1, Math.ceil(minutes));
    if (rounded < 60) return `${rounded} min`;
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const isValidLatLng = (point: LatLng | null | undefined) =>
    Boolean(
      point &&
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude) &&
      Math.abs(point.latitude) <= 90 &&
      Math.abs(point.longitude) <= 180,
    );
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
    if (getDistanceKm(origin, first) > 0.05) withEndpoints.unshift(origin);
    if (getDistanceKm(destination, last) > 0.05) withEndpoints.push(destination);

    return withEndpoints;
  }, []);
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
          const duration = legs.reduce((sum: number, leg: any) => sum + (Number(leg?.duration?.value) || 0), 0) / 60;

          return { coordinates, distance, duration };
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
        duration: (Number(osrmRoute?.duration) || 0) / 60,
      };
    } catch (error) {
      console.warn("Manual route fetch failed:", error);
      return null;
    }
  }, [cleanRouteCoordinates]);
  const [totalRouteDistance, setTotalRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [activeRouteCoordinates, setActiveRouteCoordinates] = useState<LatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [hasLiveDriverLocation, setHasLiveDriverLocation] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(() => pickup);
  const [driverLocation] = useState(
    () =>
      new AnimatedRegion({
        ...pickup,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }),
  );
  driverLocationRef.current = driverLocation;
  setCurrentCoordsRef.current = setCurrentCoords;
  const [eta, setEta] = useState("Calculating...");
  const pickupAddress = pickupAddressForCoords || strings.PickupLocation;
  const dropoffAddress = dropoffAddressForCoords || strings.DropLocation;
  // Route bounds for initial region and auto-zoom
  const centerLat = (pickup.latitude + dropoff.latitude) / 2;
  const centerLng = (pickup.longitude + dropoff.longitude) / 2;
  const latSpan = Math.max(0.02, Math.abs(pickup.latitude - dropoff.latitude) * 1.5);
  const lngSpan = Math.max(0.02, Math.abs(pickup.longitude - dropoff.longitude) * 1.5);
  const initialRegion = {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(0.05, latSpan),
    longitudeDelta: Math.max(0.05, lngSpan),
  };
  const EDGE_PADDING = {
    top: hp(10),
    right: wp(10),
    bottom: PANEL_PEEK_HEIGHT + hp(7),
    left: wp(10),
  };
  const fitMapToRoute = useCallback(() => {
    const points = (activeRouteCoordinates.length > 1 ? activeRouteCoordinates : routeCoordinates.length > 1 ? routeCoordinates : [pickupCoords, dropoffCoords])
      .filter((p): p is LatLng => isValidLatLng(p));
    if (points.length < 2) return;
    try {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(points, {
          edgePadding: {
            top: hp(10),
            right: wp(10),
            bottom: PANEL_PEEK_HEIGHT + hp(7),
            left: wp(10),
          },
          animated: true,
        });
      }, Platform.OS === "ios" ? 350 : 80);
    } catch (e) {
      console.warn("fitToCoordinates failed:", e);
    }
  }, [
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
    pickupCoords,
    dropoffCoords,
    activeRouteCoordinates,
    routeCoordinates,
  ]);
  fitMapToRouteRef.current = fitMapToRoute;

  const mapRef = useRef<MapView>(null);
  const pan = useRef(new Animated.Value(PANEL_CLOSED_Y)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        const newY = PANEL_CLOSED_Y + gestureState.dy;
        if (newY > PANEL_OPEN_Y) pan.setValue(newY);
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy < -50) {
          Animated.spring(pan, {
            toValue: PANEL_OPEN_Y,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.spring(pan, {
            toValue: PANEL_CLOSED_Y,
            useNativeDriver: false,
          }).start();
        }
      },
    }),

  ).current;

  useEffect(() => {
    setCurrentCoords(pickup);
    (driverLocation as any).timing({
      ...pickup,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
      duration: 0,
      useNativeDriver: false,
    }).start();
  }, [pickup.latitude, pickup.longitude]);

  // Auto-zoom once on mount so route + all markers fit
  useEffect(() => {
    const t = setTimeout(() => fitMapToRoute(), 500);
    return () => clearTimeout(t);
  }, [fitMapToRoute]);

  useEffect(() => {
    const parcelId = parcel?.id ?? item?.parcel?.id ?? routeParcel?.id ?? item?.parcelId ?? item?.id;
    const currentStatus = parcel?.deliveryStatus ?? item?.parcel?.deliveryStatus ?? routeParcel?.deliveryStatus ?? item?.deliveryStatus;

    // Only connect if the parcel is in an active tracking state
    const isActive = [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP, STATUS.PICKED_UP, STATUS.ON_THE_WAY].includes(currentStatus);

    if (!parcelId || !isActive) return;

    let socket: WebSocket | null = null;
    let isCancelled = false;

    const connectTrackSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token || isCancelled) return;

        socket = new WebSocket(`${WebSocket_Url}/parcel/${parcelId}/track?token=${encodeURIComponent(token)}`);

        socket.onopen = () => {
          console.log("Tracking socket connected for parcel", parcelId);
        };

        socket.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            // console.log("Tracking socket data:", data);

            if (data?.type === "driver_location" && data?.lat != null && data?.lon != null) {
              const lat = parseFloat(data.lat);
              const lon = parseFloat(data.lon);
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
              const rawPoint = normalizeCoords(lat, lon);
              if (!rawPoint) return;
              const routeTarget = [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP].includes(currentStatus) ? pickup : dropoff;
              const routeTargetAddress = [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP].includes(currentStatus)
                ? pickupAddressForCoords
                : dropoffAddressForCoords;
              const newPoint = normalizePointForRoute(rawPoint, routeTarget, routeTargetAddress);
              setHasLiveDriverLocation(true);
              setCurrentCoords(newPoint);
              (driverLocation as any)
                .timing({
                  ...newPoint,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                  duration: 2000,
                  useNativeDriver: false,
                })
                .start();
            }
          } catch (err) {
            console.log("Tracking Socket Error:", err);
          }
        };

        socket.onerror = (e) => {
          console.warn("Tracking socket error:", e);
        };

        socket.onclose = () => {
          console.log("Tracking socket closed");
        };
      } catch (err) {
        console.warn("Tracking setup error:", err);
      }
    };

    connectTrackSocket();

    return () => {
      isCancelled = true;
      if (socket) {
        socket.close();
      }
    };
  }, [
    parcel?.id,
    item?.parcel?.id,
    routeParcel?.id,
    item?.parcelId,
    item?.id,
    parcel?.deliveryStatus,
    item?.parcel?.deliveryStatus,
    routeParcel?.deliveryStatus,
    item?.deliveryStatus,
  ]);

  const hasPickupCoords = isValidLatLng(pickupCoords);
  const hasDropoffCoords = isValidLatLng(dropoffCoords);
  const hasRealRouteCoords = hasPickupCoords && hasDropoffCoords;
  const pickupToDropoffValid = Boolean(
    hasRealRouteCoords &&
    isValidLatLng(pickup) &&
    isValidLatLng(dropoff) &&
    (pickup.latitude !== dropoff?.latitude || pickup?.longitude !== dropoff?.longitude)
  );
  const totalDistanceText = hasRealRouteCoords ? formatKm(totalRouteDistance ?? getDistanceKm(pickup, dropoff)) : "—";
  const routeDurationText = formatDuration(routeDuration);
  const routeStartLabel = strings?.Pickup || "Pickup";
  const routeEndLabel = strings?.Drop || "Drop";
  const routeDestination = [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP].includes(status) ? pickup : dropoff;
  const routeDestinationAddress = [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP].includes(status)
    ? pickupAddress
    : dropoffAddress;
  const activeRouteValid = Boolean(
    hasLiveDriverLocation &&
    isValidLatLng(currentCoords) &&
    isValidLatLng(routeDestination) &&
    getDistanceKm(currentCoords, routeDestination) >= 0.05 &&
    [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP, STATUS.PICKED_UP, STATUS.ON_THE_WAY].includes(status)
  );

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

      const { coordinates, distance, duration } = roadRoute;
      setTotalRouteDistance(distance);
      setRouteDuration(duration);
      setEta(formatDuration(duration));
      setRouteCoordinates(coordinates);
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: EDGE_PADDING,
          animated: true,
        });
      }, 450);
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
  ]);

  useEffect(() => {
    setRouteCoordinates([]);
    setActiveRouteCoordinates([]);
    setRouteDuration(null);
    setRouteError(null);
  }, [
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
  ]);

  useEffect(() => {
    if (!activeRouteValid) {
      setActiveRouteCoordinates([]);
      return;
    }
    let cancelled = false;

    const loadActiveRoute = async () => {
      const normalizedDriverPoint = normalizePointForRoute(currentCoords, routeDestination, routeDestinationAddress);
      const roadRoute = await fetchRoadRoute(normalizedDriverPoint, routeDestination);
      if (cancelled) return;
      if (!roadRoute || roadRoute.coordinates.length < 2) {
        setActiveRouteCoordinates([]);
        return;
      }

      setActiveRouteCoordinates(roadRoute.coordinates);
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(roadRoute.coordinates, {
          edgePadding: EDGE_PADDING,
          animated: true,
        });
      }, 450);
    };

    loadActiveRoute();
    return () => {
      cancelled = true;
    };
  }, [
    activeRouteValid,
    currentCoords.latitude,
    currentCoords.longitude,
    fetchRoadRoute,
    routeDestination.latitude,
    routeDestination.longitude,
    routeDestinationAddress,
  ]);

  const [statusKey, setStatusKey] = useState<string | null>(null);

  useEffect(() => {
    const key = parcel?.deliveryStatus ?? item?.deliveryStatus ?? null;
    setStatusKey(key);
  }, [parcel?.deliveryStatus, item?.deliveryStatus]);
  useFocusEffect(
    useCallback(() => {
      getDetail(); // 👈 screen focus hote hi call hoga

      return () => {
        // optional cleanup (agar chahiye)
      };
    }, [parcel])
  );

  const isDelivered =
    (parcel?.deliveryStatus ?? item?.parcel?.deliveryStatus ?? routeParcel?.deliveryStatus ?? item?.deliveryStatus) === "delivered" ||
    (parcel?.deliveryStatus ?? item?.parcel?.deliveryStatus ?? routeParcel?.deliveryStatus ?? item?.deliveryStatus) === STATUS.DELIVERED;
  useEffect(() => {
    if (isDelivered && !ratingSubmittedRef.current) {
      setShowRatingModal(true);
    }
  }, [isDelivered]);

  const handleRatingSubmit = useCallback(
    async (rating: number, comment: string) => {
      if (rating < 1) return;
      const parcelId = parcel?.id ?? item?.parcel?.id ?? routeParcel?.id ?? item?.parcelId ?? item?.id;
      if (!parcelId) return;

      setRatingSubmitting(true);
      try {
        const res = await RateDeliveryApi({
          parcelId: Number(parcelId),
          rating: rating,
          review: comment
        });

        if (res?.status == 1 || res?.status == "1") {
          ratingSubmittedRef.current = true;
          setShowRatingModal(false);
          nav.goBack();
        }
      } catch (error) {
        console.error("Rating submission error:", error);
      } finally {
        setRatingSubmitting(false);
      }
    },
    [nav, parcel?.id, item?.id]
  );

  const closeRatingModal = useCallback(() => {
    setShowRatingModal(false);
    nav.goBack();
  }, [nav]);

  const statusNormKey = (statusKey ?? status ?? "").toLowerCase().trim();
  const statusLabel = STATUS_LABELS[statusNormKey] || "Unknown";
  const statusColor = STATUS_COLORS[statusNormKey] || "black";

  return (
    <View style={styles.container}>
      <RatingModal
        visible={showRatingModal}
        onClose={closeRatingModal}
        onSubmit={handleRatingSubmit}
        isSubmitting={ratingSubmitting}
      />
      <StatusBarComponent />

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          mapType="standard"
          initialRegion={initialRegion}
          mapPadding={{ top: hp(9), right: wp(4), bottom: PANEL_PEEK_HEIGHT + hp(6), left: wp(4) }}
          loadingEnabled
          loadingIndicatorColor="#FFCC00"
          showsBuildings={false}
          showsTraffic={false}
          showsUserLocation={false}
          onMapReady={() => setTimeout(() => fitMapToRoute(), 100)}
          onLayout={() => setTimeout(() => fitMapToRoute(), 100)}
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
                setTotalRouteDistance(result.distance ?? null);
                setRouteDuration(result.duration ?? null);
                setEta(formatDuration(result.duration ?? null));
                setRouteError(null);
                setRouteLoading(false);
                if (coordinates.length > 1) {
                  mapRef.current?.fitToCoordinates(coordinates, {
                    edgePadding: EDGE_PADDING,
                    animated: true,
                  });
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
              key={`google-active-${currentCoords.latitude}-${currentCoords.longitude}-${routeDestination.latitude}-${routeDestination.longitude}`}
              origin={normalizePointForRoute(currentCoords, routeDestination, routeDestinationAddress)}
              destination={routeDestination}
              apikey={GOOGLE_MAPS_APIKEY}
              mode="DRIVING"
              precision="high"
              strokeWidth={0}
              strokeColor="transparent"
              optimizeWaypoints={false}
              onReady={(result) => {
                const start = normalizePointForRoute(currentCoords, routeDestination, routeDestinationAddress);
                const coordinates = cleanRouteCoordinates(result.coordinates || [], start, routeDestination);
                if (coordinates.length > 1 && !routesMatch(activeRouteCoordinates, coordinates)) {
                  setActiveRouteCoordinates(coordinates);
                }
                if (coordinates.length > 1) {
                  mapRef.current?.fitToCoordinates(coordinates, {
                    edgePadding: EDGE_PADDING,
                    animated: true,
                  });
                }
              }}
              onError={(errorMessage) => {
                console.warn("Google active route error:", errorMessage);
                setActiveRouteCoordinates([]);
              }}
            />
          )}

          {/* 1. BACKGROUND ROUTE: Total trip path (Pickup -> Dropoff) */}
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={activeRouteCoordinates.length > 1 ? 8 : 10}
              strokeColor="rgba(255, 255, 255, 0.96)"
              lineCap="round"
              lineJoin="round"
              zIndex={0}
            />
          )}

          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={activeRouteCoordinates.length > 1 ? 4 : 6}
              strokeColor={activeRouteCoordinates.length > 1 ? "#94A3B8" : "#FFCC00"}
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

          {/* Pickup Marker */}
          {hasPickupCoords && (
            <Marker
              coordinate={pickup}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              title={routeStartLabel}
              description={pickupAddress}
              zIndex={10}
            >
              <View style={styles.mapMarkerContainer}>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText}>{routeStartLabel}</Text>
                </View>
                <View style={[styles.pinHead, styles.pickupPin]}>
                  <View style={styles.pinIconCircle}>
                    <Ionicons name="cube-outline" size={16} color="#10B981" />
                  </View>
                </View>
                <View style={[styles.pinPointer, styles.pickupPointer]} />
              </View>
            </Marker>
          )}

          {/* Drop-off Marker */}
          {hasDropoffCoords && (
            <Marker
              coordinate={dropoff}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              title={routeEndLabel}
              description={dropoffAddress}
              zIndex={10}
            >
              <View style={styles.mapMarkerContainer}>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText}>{routeEndLabel}</Text>
                </View>
                <View style={[styles.pinHead, styles.dropPin]}>
                  <View style={styles.pinIconCircle}>
                    <Ionicons name="location-sharp" size={17} color="#EF4444" />
                  </View>
                </View>
                <View style={[styles.pinPointer, styles.dropPointer]} />
              </View>
            </Marker>
          )}

          {/* Driver Marker */}
          {hasLiveDriverLocation && (
            <Marker.Animated
              key="driver-marker"
              coordinate={driverLocation as any}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={12}
            >
              <View style={styles.courierMarker}>
                <View style={styles.courierPulse} />
                <View style={styles.courierMarkerInner}>
                  <Image source={imageIndex.caricon} style={styles.courierImage} />
                </View>
              </View>
            </Marker.Animated>
          )}
        </MapView>

        {(routeLoading || routeError) && (
          <View style={styles.routeStatusPill} pointerEvents="none">
            {routeLoading ? <ActivityIndicator size="small" color="#111827" /> : null}
            <Text style={styles.routeStatusText}>
              {routeLoading ? "Loading route" : routeError}
            </Text>
          </View>
        )}

      </View>

      <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.backButtonWrap}
            onPress={() => nav.goBack()}
            activeOpacity={0.8}
          >
            <Image source={imageIndex.back}


              style={{
                height: 38,
                width: 38
              }}
            />
          </TouchableOpacity>

          <View style={styles.locationContent}>
            <View style={styles.routeHeaderRow}>
              <Text style={styles.routeTitle}></Text>
              <View style={styles.distancePill}>
                <Ionicons name="navigate" size={13} color="#111827" />
                <Text style={styles.distanceText}>{totalDistanceText}</Text>
              </View>
            </View>
          </View>
        </View>

      </SafeAreaView>

      {/* Rapido-style bottom sheet */}
      <View style={[styles.draggablePanel,]}>
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.handleBar} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.driverSection}>
            <View style={styles.driverCore}>
              <View style={styles.avatarWrap}>
                <Image
                  source={driver?.image ? { uri: driver.image } : imageIndex.dpuser}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.driverMeta}>
                <Text style={styles.driverName} numberOfLines={1}>
                  {driver?.name || "Assigning driver..."}
                </Text>
                <Text style={styles.trackingIdText}>{item?.trackingId || ""}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.driverActionsSide}>
              {isDelivered ? (
                <TouchableOpacity
                  style={styles.rateDeliveryButton}
                  onPress={() => setShowRatingModal(true)}
                >
                  <Text style={styles.rateDeliveryButtonText}>{strings.RateDelivery}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.otpPill}>
                  <Text style={styles.otpPillLabel}>{strings?.OTP}</Text>
                  <Text style={styles.otpPillValue}>
                    {(() => {
                      const s = parcel?.deliveryStatus ?? item?.deliveryStatus;
                      if (s === STATUS.ASSIGNED || s === STATUS.GOING_TO_PICKUP) {
                        return parcel?.pickupOtp ?? item?.pickupOtp ?? "";
                      }
                      return parcel?.deliveryOtp ?? item?.deliveryOtp ?? "";
                    })()}
                  </Text>
                </View>
              )}

              <View style={styles.contactRow}>
                <TouchableOpacity
                  style={styles.circleActionBtn}
                  onPress={() => driver?.phone && Linking.openURL(`tel:${driver?.phone}`)}
                >
                  <Image source={imageIndex.Calls} style={styles.actionIcon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.circleActionBtn, { marginLeft: 12 }]}
                  onPress={() => parcel && (nav as any).navigate(ScreenNameEnum.ChatScreen, { item: parcel })}
                >
                  <Image source={imageIndex.messtrcker} style={styles.actionIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </View>



        </ScrollView>
      </View>
    </View>
  );
};



export default CourierTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  mapWrap: { flex: 1, width: "100%", minHeight: height * 0.5 },
  map: { ...StyleSheet.absoluteFillObject },
  routeStatusPill: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: PANEL_PEEK_HEIGHT + 18,
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
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 5 },
  infoCard: {
    alignSelf: "center",

    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20

  },
  backButtonWrap: {


    alignItems: "center",
    justifyContent: "center",

    marginRight: 8,
  },
  locationContent: { flex: 1 },
  routeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  routeTitle: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginRight: 8,
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7CC",
    borderRadius: 13,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#111827",
    fontFamily: font.MonolithRegular,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  locationIconWrap: {
    width: 18,
    alignItems: "center",
    marginTop: 2,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  connectorLine: {
    width: 2,
    height: 30,
    backgroundColor: "#E5E7EB",
    marginTop: 4,
  },
  locationCopy: {
    flex: 1,
    paddingLeft: 8,
  },
  locationLabel: {
    fontSize: 10,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontFamily: font.MonolithRegular,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: "#1F2937",
    fontFamily: font.MonolithRegular,
    lineHeight: 17,
  },
  routeSummaryCard: {
    marginHorizontal: 18,
    marginTop: 2,
    marginBottom: 14,
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  routeSummaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7CC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  routeSummaryCopy: { flex: 1, paddingRight: 6 },
  routeSummaryLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: font.MonolithRegular,
    marginBottom: 2,
  },
  routeSummaryText: {
    fontSize: 15,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    lineHeight: 18,
  },
  routeMetrics: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  routeMetricItem: {
    alignItems: "center",
    minWidth: 54,
  },
  routeMetricDivider: {
    width: 1,
    height: 26,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  routeSummaryDistance: {
    fontSize: 13,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
  },
  routeSummaryEta: {
    fontSize: 10,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    marginTop: 2,
  },
  mapMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerLabel: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 5,
    maxWidth: 90,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  markerLabelText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: font.MonolithRegular,
    textTransform: "uppercase",
  },
  pinHead: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  courierMarker: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  courierPulse: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFCC00",
    borderWidth: 1,
    borderColor: "#FFCC00",
  },
  courierMarkerInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  courierImage: { width: 22, height: 22, resizeMode: "contain" },
  draggablePanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 0 : 0,

  },
  dragArea: { width: "100%", paddingTop: 12, paddingBottom: 8, alignItems: "center" },
  handleBar: {
    width: 18,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 20,
  },
  scrollContent: { flex: 1 },
  scrollContentContainer: { paddingHorizontal: 18, paddingBottom: 10 },
  etaHeaderStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  etaMain: { alignItems: "center", paddingHorizontal: 20 },
  etaValue: { fontSize: 20, color: "#111827", fontFamily: font.MonolithRegular },
  etaUnit: { fontSize: 10, color: "#6B7280", fontFamily: font.MonolithRegular, marginTop: -2 },
  etaDivider: { width: 1, height: 24, backgroundColor: "#E5E7EB" },
  etaSecondary: { alignItems: "center", paddingHorizontal: 20 },
  etaDistanceValue: { fontSize: 18, color: "#4B5563", fontFamily: font.MonolithRegular },
  etaDistanceUnit: { fontSize: 10, color: "#9CA3AF", marginTop: -2 },

  routeDetailsSection: {
    marginTop: 14,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionTitle: {
    fontSize: 15,
    color: "#111827",
    fontFamily: font.MonolithRegular,
  },
  sectionMetricRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionDistance: {
    fontSize: 12,
    color: "#92400E",
    fontFamily: font.MonolithRegular,
    backgroundColor: "#FFF7CC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sectionDuration: {
    marginLeft: 6,
    fontSize: 12,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timelineItem: { flexDirection: "row", paddingTop: 14 },
  timelineGraphic: { alignItems: "center", width: 28, marginRight: 12 },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  pickupTimelineDot: { backgroundColor: "#10B981" },
  dropTimelineDot: { backgroundColor: "#EF4444" },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginTop: 4,
    marginBottom: -12,
  },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineContentLast: { paddingBottom: 0 },
  timelineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  timelineLabel: {
    fontSize: 11,
    color: "#64748B",
    textTransform: "uppercase",
    marginLeft: 5,
    fontFamily: font.MonolithRegular
  },
  timelineText: {
    fontSize: 14,
    color: "#1F2937",
    fontFamily: font.MonolithRegular,
    lineHeight: 20,
  },
  driverSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 10,
  },
  driverCore: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,

  },
  avatar: { width: "100%", height: "100%", borderRadius: 30 },
  driverMeta: { marginLeft: 14, flex: 1, paddingRight: 8 },
  driverName: { fontSize: 17, fontFamily: font.MonolithRegular, color: "#111827" },
  trackingIdText: { fontSize: 13, color: "#6B7280", marginTop: 2, fontFamily: font.MonolithRegular },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontFamily: font.MonolithRegular, },

  driverActionsSide: { alignItems: "flex-end", marginLeft: 10 },
  otpPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    minWidth: 86,
    borderWidth: 0.5,
    borderColor: "#FDE68A",
  },
  otpPillLabel: { fontSize: 10, color: "black", fontFamily: font.MonolithRegular, textTransform: "uppercase" },
  otpPillValue: { fontSize: 16, color: "black", fontFamily: font.MonolithRegular, marginTop: 1 },

  contactRow: { flexDirection: "row", alignItems: "center" },
  circleActionBtn: {


    justifyContent: "center",
    alignItems: "center",

  },
  actionIcon: { width: 38, height: 38, resizeMode: "contain" },

  vehicleStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  vehicleStripText: { marginLeft: 8, fontSize: 13, color: "#4B5563", fontFamily: font.MonolithRegular },

  parcelGrid: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    marginTop: 20,
    padding: 16,
  },
  parcelStat: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 11, color: "#9CA3AF", fontFamily: font.MonolithRegular, textTransform: "uppercase" },
  statValue: { fontSize: 14, color: "#111827", fontFamily: font.MonolithRegular, marginTop: 4 },
  statDivider: { width: 1, height: "100%", backgroundColor: "#F3F4F6" },

  rateDeliveryButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  rateDeliveryButtonText: { fontSize: 13, fontFamily: font.MonolithRegular, color: "#111827" },
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
});
