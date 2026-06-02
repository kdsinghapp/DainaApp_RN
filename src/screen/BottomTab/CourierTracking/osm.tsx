import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import MapLibreGL, { MapView, Camera, ShapeSource, LineLayer, PointAnnotation } from "@maplibre/maplibre-react-native";
import Geolocation from "@react-native-community/geolocation";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const CourierTrackingScreen = () => {
  const rou: any = useRoute();
  const { item } = rou.params || "";

  // Slide panel animation
  const slideAnim = useRef(new Animated.Value(height * 0.4)).current;
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  const togglePanel = () => {
    const toValue = isPanelExpanded ? height * 0.4 : height * 0.75;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
    setIsPanelExpanded(!isPanelExpanded);
  };

  // Route coordinates - Delhi locations
  const pickup = { latitude: 28.6139, longitude: 77.209 }; // Delhi pickup
  const delivery = { latitude: 28.62, longitude: 77.22 };   // Delhi delivery

  const [courierPosition, setCourierPosition] = useState(pickup);
  const [dynamicRoute, setDynamicRoute] = useState([pickup]);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);

  // Simulate courier movement for testing
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // For testing - simulate movement if real GPS not available
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      intervalId = setInterval(() => {
        setCourierPosition(prev => {
          // Move slightly towards destination
          const latDiff = delivery.latitude - prev.latitude;
          const lngDiff = delivery.longitude - prev.longitude;

          const step = 0.0001; // Small step for movement

          return {
            latitude: prev.latitude + (latDiff > 0 ? step : -step) * 0.1,
            longitude: prev.longitude + (lngDiff > 0 ? step : -step) * 0.1,
          };
        });
      }, 2000);
    }

    // Watch real courier location
    const watchId = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoord = { latitude, longitude };
        setCourierPosition(newCoord);
        setDynamicRoute((prev) => {
          // Limit to 100 points for performance
          if (prev.length > 100) {
            return [...prev.slice(1), newCoord];
          }
          return [...prev, newCoord];
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Use simulated movement if GPS fails
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        timeout: 15000,
        maximumAge: 10000
      }
    );

    return () => {
      if (intervalId) clearInterval(intervalId);
      Geolocation.clearWatch(watchId);
    };
  }, []);

  // Update dynamic route when courier moves
  useEffect(() => {
    if (dynamicRoute.length === 0) return;

    setDynamicRoute(prev => {
      const lastPoint = prev[prev.length - 1];
      // Only add new point if distance is significant
      const dist = calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        courierPosition.latitude,
        courierPosition.longitude
      );

      if (dist > 0.001) { // 1 meter threshold
        return [...prev, courierPosition];
      }
      return prev;
    });
  }, [courierPosition]);

  // Camera update
  const updateCamera = () => {
    if (cameraRef.current && courierPosition) {
      cameraRef.current.flyTo([courierPosition.longitude, courierPosition.latitude], 1000);
    }
  };

  useEffect(() => {
    if (isMapReady && courierPosition) {
      updateCamera();
    }
  }, [courierPosition, isMapReady]);

  const handleMapReady = () => {
    console.log("Map is ready");
    setIsMapReady(true);

    // Fit bounds to show both pickup and delivery
    if (mapRef.current && cameraRef.current) {
      const coordinates = [
        [pickup.longitude, pickup.latitude],
        [delivery.longitude, delivery.latitude]
      ];

      cameraRef.current.fitBounds(
        coordinates[0],
        coordinates[1],
        [50, 50, 50, 50], // padding
        1000 // animation duration
      );
    }
  };

  // Distance calculation (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Zoom controls
  const zoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.zoomTo(16, 500);
    }
  };

  const zoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.zoomTo(12, 500);
    }
  };

  const centerOnCourier = () => updateCamera();

  // Create GeoJSON features for lines
  const traveledRouteGeoJSON = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: dynamicRoute.map(p => [p.longitude, p.latitude])
    },
    properties: {}
  };

  const straightLineGeoJSON = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [courierPosition.longitude, courierPosition.latitude],
        [delivery.longitude, delivery.latitude]
      ]
    },
    properties: {}
  };

  const remainingDistance = calculateDistance(
    courierPosition.latitude,
    courierPosition.longitude,
    delivery.latitude,
    delivery.longitude
  );

  const totalDistance = calculateDistance(
    pickup.latitude,
    pickup.longitude,
    delivery.latitude,
    delivery.longitude
  );

  const progress = totalDistance > 0 ? ((totalDistance - remainingDistance) / totalDistance) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader label="Track Your Package" />

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          styleURL="https://demotiles.maplibre.org/style.json"
          onDidFinishLoadingMap={handleMapReady}
          logoEnabled={false}
          attributionEnabled={true}
          mapType="standard"
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: [pickup.longitude, pickup.latitude],
              zoomLevel: 14,
            }}
          />

          {/* Straight line from courier to destination (RED DASHED) */}
          <ShapeSource id="straightLineSource" shape={straightLineGeoJSON}>
            <LineLayer
              id="straightLineLayer"
              style={styles.straightLine}
            />
          </ShapeSource>

          {/* Traveled route (BLUE SOLID) */}
          {dynamicRoute.length > 1 && (
            <ShapeSource id="traveledRouteSource" shape={traveledRouteGeoJSON}>
              <LineLayer
                id="traveledRouteLayer"
                style={styles.traveledRoute}
              />
            </ShapeSource>
          )}

          {/* Pickup marker */}
          <PointAnnotation
            id="pickup"
            coordinate={[pickup.longitude, pickup.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}

          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerPin, { backgroundColor: '#FF6B35' }]}>
              </View>
              <View style={[styles.markerLabel, { backgroundColor: '#FF6B35' }]}>
                <Text style={styles.markerText}>Pickup</Text>
              </View>
            </View>
          </PointAnnotation>

          {/* Delivery marker */}
          <PointAnnotation
            id="delivery"
            coordinate={[delivery.longitude, delivery.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerPin, { backgroundColor: '#4CAF50' }]}>

              </View>
              <View style={[styles.markerLabel, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.markerText}>Delivery</Text>
              </View>
            </View>
          </PointAnnotation>

          {/* Courier marker */}
          <PointAnnotation
            id="courier"
            coordinate={[courierPosition.longitude, courierPosition.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.courierMarker}>
              <View style={styles.livePulse} />
              <View style={styles.courierInner}>

              </View>
            </View>
          </PointAnnotation>
        </MapView>

        {/* Distance overlay */}
        <View style={styles.distanceOverlay}>
          <Text style={styles.distanceText}>
            📍 Straight Distance: {remainingDistance.toFixed(2)} km
          </Text>
          <Text style={styles.distanceSubText}>
            🚚 Traveled: {(totalDistance - remainingDistance).toFixed(2)} km • {progress.toFixed(1)}% complete
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Map controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
            <Text style={styles.controlText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={centerOnCourier}>
            <Text style={styles.controlText}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Slide-up Panel */}
      <Animated.View style={[styles.slideUpPanel, { height: slideAnim }]}>
        <View style={styles.panelHandleContainer}>
          <TouchableOpacity onPress={togglePanel} style={styles.panelHandle}>
            <View style={styles.handleBar} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
          <View style={styles.panelInner}>
            <Text style={styles.sectionTitle}>Tracking Details</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Courier Status:</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>In Transit</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estimated Time:</Text>
                <Text style={styles.infoValue}>15-20 minutes</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Speed:</Text>
                <Text style={styles.infoValue}>25-30 km/h</Text>
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: '#FF6B35' }]} />
                  <View>
                    <Text style={styles.routeTitle}>Pickup Point</Text>
                    <Text style={styles.routeAddress}>Connaught Place, Delhi</Text>
                  </View>
                </View>

                <View style={styles.routeLine} />

                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
                  <View>
                    <Text style={styles.routeTitle}>Delivery Point</Text>
                    <Text style={styles.routeAddress}>Karol Bagh, Delhi</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default CourierTrackingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa"
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },

  // Line Styles
  straightLine: {
    lineColor: '#FF0000',
    lineWidth: 3,
    lineOpacity: 0.8,
    lineDasharray: [5, 5],
    lineJoin: 'round',
    lineCap: 'round',
  },

  traveledRoute: {
    lineColor: '#1E90FF',
    lineWidth: 4,
    lineOpacity: 1,
    lineJoin: 'round',
    lineCap: 'round',
  },

  // Marker Styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,

  },
  markerIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  markerLabel: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  markerText: {
    color: 'white',
    fontSize: 12,
  },

  // Courier Marker
  courierMarker: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  courierImage: {
    width: 32,
    height: 32,
    tintColor: '#FF6B35',
  },
  livePulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.5)',
  },

  // Distance Overlay
  distanceOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  distanceText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  distanceSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  controlText: {
    fontSize: 24,
    color: '#333',
  },

  // Slide-up Panel
  slideUpPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  panelHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  panelHandle: {
    width: 60,
    padding: 8,
  },
  handleBar: {
    height: 5,
    width: '100%',
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  panelContent: {
    flex: 1,
  },
  panelInner: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#333',
    marginBottom: 20,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#2196F3',
  },

  // Route Info
  routeInfo: {
    marginTop: 20,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  routeTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: '#666',
  },
  routeLine: {
    height: 30,
    width: 2,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginVertical: 5,
  },
});
