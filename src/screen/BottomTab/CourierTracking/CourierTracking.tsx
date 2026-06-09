
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

const { width, height } = Dimensions.get("window");
const MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

const PANEL_PEEK_HEIGHT = 280;
const PANEL_OPEN_Y = height * 0.3;
const PANEL_CLOSED_Y = height - PANEL_PEEK_HEIGHT;

const CourierTrackingScreen = () => {
  const nav = useNavigation();
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const rou: any = useRoute();
  const { item } = rou.params || {};
  const [parcel, setParcel] = useState(item ?? null);
  const socketRef = useRef<WebSocket | null>(null);
  const getDetailRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const parcelIdRef = useRef<number | undefined>(parcel?.id ?? item?.id);
  const trackingIdRef = useRef<string | number | undefined>(parcel?.trackingId ?? item?.trackingId);
  const driverLocationRef = useRef<any>(null);
  const setCurrentCoordsRef = useRef<((c: { latitude: number; longitude: number }) => void) | null>(null);
  const fitMapToRouteRef = useRef<() => void>(() => { });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const ratingSubmittedRef = useRef(false);

  // console.log("parcel",parcel)
  const getDetail = async () => {
    const parcelId = parcel?.id ?? item?.id;
    if (!parcelId) return;
    const param = { url: `/parcel-details/${parcelId}` };
    const res = await GetApi(param, setLoading);
    if (isMounted.current && res?.status === 1 && res?.parcel) {
      setParcel({ ...res.parcel });
    }
  };
  getDetailRef.current = getDetail;
  parcelIdRef.current = parcel?.id ?? item?.id;
  trackingIdRef.current = parcel?.trackingId ?? item?.trackingId;
  useEffect(() => {
    isMounted.current = true;
    getDetail();
    return () => {
      isMounted.current = false;
    };
  }, [item?.id]);
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
            const d = event.data;
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
                  let finalLat = lat;
                  let finalLon = lon;
                  if (lat > 60 && lon < 40) {
                    finalLat = lon;
                    finalLon = lat;
                  }
                  const newPoint = { latitude: finalLat, longitude: finalLon };
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
            if (!resolved) reject(new Error(event.reason ?? "Connection closed"));
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
  const driver = parcel?.assignedDriver ?? item?.assignedDriver;
  const status = parcel?.deliveryStatus ?? item?.deliveryStatus;
  const DEFAULT_LAT = 22.7176;
  const DEFAULT_LNG = 75.8577;
  type LatLng = { latitude: number; longitude: number };
  const safeNum = (v: any, fallback: number | null): number | null => {
    if (v == null) return fallback;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const source = parcel ?? item;
  const normalizeCoords = (latField: any, lonField: any): LatLng | null => {
    const v1 = safeNum(latField, null);
    const v2 = safeNum(lonField, null);
    if (v1 === null || v2 === null) return null;
    if (v1 > 60 && v2 < 40) return { latitude: v2, longitude: v1 };
    return { latitude: v1, longitude: v2 };
  };
  const getCoords = (
    objectCandidates: any[],
    coordinatePairs: Array<[any, any]>,
  ): LatLng | null => {
    for (const candidate of objectCandidates) {
      if (!candidate) continue;
      if (typeof candidate === "object") {
        const point = normalizeCoords(
          candidate.latitude ?? candidate.lat,
          candidate.longitude ?? candidate.lng ?? candidate.lon,
        );
        if (point) return point;
      }
    }

    for (const [latField, lonField] of coordinatePairs) {
      const point = normalizeCoords(latField, lonField);
      if (point) return point;
    }

    return null;
  };

  const pickupCoords = getCoords(
    [source?.pickupLat, source?.pickupLocation, source?.pickup],
    [[
      source?.pickupLocationLat ?? source?.pickup_location_lat,
      source?.pickupLon ?? source?.pickupLocationLon ?? source?.pickup_location_lon,
    ]],
  );

  const dropoffCoords = getCoords(
    [source?.droplat, source?.dropLat, source?.dropLocation, source?.drop, source?.deliveryLocation],
    [[
      source?.dropLocationLat ?? source?.drop_location_lat,
      source?.dropLon ?? source?.dropLocationLon ?? source?.drop_location_lon,
    ]],
  );

  const pickup = pickupCoords ?? { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
  const dropoff = dropoffCoords ?? {
    latitude: pickup.latitude + 0.01,
    longitude: pickup.longitude + 0.01,
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
  const [totalRouteDistance, setTotalRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [fullRouteFailed, setFullRouteFailed] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
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
  const pickupAddress = source?.pickupLocation || item?.pickupLocation || strings.PickupLocation;
  const dropoffAddress = source?.dropLocation || item?.dropLocation || strings.DropLocation;
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
    const points = [pickup, dropoff].filter((p): p is LatLng => isValidLatLng(p));
    if (points.length < 2) return;
    try {
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: {
          top: hp(10),
          right: wp(10),
          bottom: PANEL_PEEK_HEIGHT + hp(7),
          left: wp(10),
        },
        animated: true,
      });
    } catch (e) {
      console.warn("fitToCoordinates failed:", e);
    }
  }, [
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
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
    const parcelId = parcel?.id ?? item?.parcelId ?? item?.id;
    const currentStatus = parcel?.deliveryStatus ?? item?.deliveryStatus;

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
              const newPoint = lat > 60 && lon < 40
                ? { latitude: lon, longitude: lat }
                : { latitude: lat, longitude: lon };
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
  }, [parcel?.id, item?.parcelId, item?.id, parcel?.deliveryStatus, item?.deliveryStatus]);

  const pickupToDropoffValid = Boolean(
    isValidLatLng(pickup) &&
    isValidLatLng(dropoff) &&
    (pickup.latitude !== dropoff.latitude || pickup.longitude !== dropoff.longitude)
  );
  const totalDistanceText = formatKm(totalRouteDistance ?? getDistanceKm(pickup, dropoff));
  const routeDurationText = formatDuration(routeDuration);
  const routeStartLabel = strings?.Pickup || "Pickup";
  const routeEndLabel = strings?.Drop || "Drop";

  useEffect(() => {
    setFullRouteFailed(false);
    setRouteCoordinates([]);
    setRouteDuration(null);
  }, [
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
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

  const isDelivered = (parcel?.deliveryStatus ?? item?.deliveryStatus) === "delivered" || (parcel?.deliveryStatus ?? item?.deliveryStatus) === STATUS.DELIVERED;
  useEffect(() => {
    if (isDelivered && !ratingSubmittedRef.current) {
      setShowRatingModal(true);
    }
  }, [isDelivered]);

  const handleRatingSubmit = useCallback(
    async (rating: number, comment: string) => {
      if (rating < 1) return;
      const parcelId = parcel?.id ?? item?.id;
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
          customMapStyle={MAP_STYLE}
          mapPadding={{ top: hp(9), right: wp(4), bottom: PANEL_PEEK_HEIGHT + hp(6), left: wp(4) }}
          loadingEnabled
          showsUserLocation={false}
          onMapReady={() => setTimeout(() => fitMapToRoute(), 100)}
          onLayout={() => setTimeout(() => fitMapToRoute(), 100)}
        >
          {/* 1. BACKGROUND ROUTE: Total trip path (Pickup -> Dropoff) */}
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={11}
              strokeColor="rgba(15, 23, 42, 0.18)"
              lineCap="round"
              lineJoin="round"
              zIndex={0}
            />
          )}

          {/* {pickupToDropoffValid && fullRouteFailed && (
            <Polyline
              coordinates={[pickup, dropoff]}
              strokeWidth={1}
              // strokeColor="rgba(15, 23, 42, 0.14)"
              lineCap="round"
              lineJoin="round"
              zIndex={0}
            />
          )} */}

          {pickupToDropoffValid && fullRouteFailed && (
            <Polyline
              coordinates={[pickup, dropoff]}
              strokeWidth={7}
              strokeColor="#FFCC00"
              lineCap="round"
              lineJoin="round"
              zIndex={1}
            />
          )}

          {pickupToDropoffValid && (
            <MapViewDirections
              key={`full-route-${pickup.latitude.toFixed(5)}-${pickup.longitude.toFixed(5)}-${dropoff.latitude.toFixed(5)}-${dropoff.longitude.toFixed(5)}`}
              origin={pickup}
              destination={dropoff}
              apikey={GOOGLE_MAPS_APIKEY}
              mode="DRIVING"
              strokeWidth={6}
              strokeColor="#FFCC00"
              lineCap="round"
              lineJoin="round"
              precision="high"
              onReady={(res) => {
                setFullRouteFailed(false);
                setTotalRouteDistance(res?.distance ?? null);
                setRouteDuration(res?.duration ?? null);
                setEta(formatDuration(res?.duration ?? null));
                if (res?.coordinates?.length > 1) {
                  setRouteCoordinates(res.coordinates);
                  mapRef.current?.fitToCoordinates(res.coordinates, {
                    edgePadding: EDGE_PADDING,
                    animated: true,
                  });
                }
              }}
              onError={(err) => {
                console.warn("Full route error:", err);
                setFullRouteFailed(true);
              }}
            />
          )}

          {/* Pickup Marker */}
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

          {/* Drop-off Marker */}
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
              <Text style={styles.routeTitle}>Delivery Route</Text>
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
        {eta !== "Calculating..." && (
          <View style={styles.routeSummaryCard}>
            <View style={styles.routeSummaryIcon}>
              <Ionicons name="navigate" size={18} color="#111827" />
            </View>
            <View style={styles.routeSummaryCopy}>
              <Text style={styles.routeSummaryLabel}>Directions Route</Text>
              <Text style={styles.routeSummaryText}>Pickup to Drop</Text>
            </View>

          </View>
        )}

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
                  onPress={() => driver?.phone && Linking.openURL(`tel:${driver.phone}`)}
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
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 5 },
  infoCard: {
    alignSelf: "center",

    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
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
    borderColor: "#F59E0B",
  },
  courierImage: { width: 26, height: 26, resizeMode: "contain" },
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
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 18,
  },
  driverCore: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF7CC",
    padding: 3,
    borderWidth: 1,
    borderColor: "#FDE68A",
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionIcon: { width: 22, height: 22, resizeMode: "contain" },

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
