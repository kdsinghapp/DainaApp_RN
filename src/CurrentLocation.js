import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Modal, View, Text, StyleSheet, TouchableOpacity, Linking, AppState, ActivityIndicator } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geocoder from 'react-native-geocoding';
import font from './theme/font';

const GOOGLE_API_KEY = "AIzaSyDgFGS91BvviXh_f-nmvtEggUHJcaGyUwA";
Geocoder.init(GOOGLE_API_KEY);

// Configure Geolocation for iOS
if (Platform.OS === 'ios') {
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
  });
}

const CurrentLocation = forwardRef(({ onLocationFetched }, ref) => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkPermissionSilent();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkPermissionSilent = async () => {
    const permission = Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const status = await check(permission);
    if (status === RESULTS.GRANTED) {
      setShowPermissionModal(false);
    }
  };

  const requestPermission = async () => {
    const permission = Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    try {
      const status = await check(permission);
      if (status === RESULTS.GRANTED) return true;

      const result = await request(permission);
      if (result === RESULTS.GRANTED) {
        setShowPermissionModal(false);
        return true;
      }

      setShowPermissionModal(true);
      return false;
    } catch (error) {
      console.log("Permission error:", error);
      return false;
    }
  };

  const fetchLocation = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return { error: 'Permission denied' };
    }

    setIsFetching(true);
    return new Promise((resolve) => {
      let resolved = false;

      const finish = async (lat, lng, error = null) => {
        if (resolved) return;
        resolved = true;
        setIsFetching(false);

        if (error) {
          resolve({ error });
          return;
        }

        try {
          const json = await Geocoder.from(lat, lng);
          const address = json.results[0].formatted_address;
          const result = { latitude: lat, longitude: lng, address };
          if (onLocationFetched) onLocationFetched(result);
          resolve(result);
        } catch (geoError) {
          console.log("Geocoding error:", geoError);
          const result = { latitude: lat, longitude: lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
          if (onLocationFetched) onLocationFetched(result);
          resolve(result);
        }
      };

      // Primary call: Low accuracy for instantaneous result
      Geolocation.getCurrentPosition(
        (pos) => finish(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.log("First fast attempt failed, trying fallback...", err.message);
          // Fallback
          Geolocation.getCurrentPosition(
            (pos2) => finish(pos2.coords.latitude, pos2.coords.longitude),
            (err2) => {
              console.log("Second attempt failed:", err2.message);
              finish(null, null, err2.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        },
        { enableHighAccuracy: false, timeout: 2000, maximumAge: 60000 }
      );

      // Final fail-safe
      setTimeout(() => {
        if (!resolved) {
          finish(null, null, "Location timeout");
        }
      }, 25000);
    });
  };

  useImperativeHandle(ref, () => ({
    fetchLocation,
  }));

  return (
    <>
      <Modal visible={showPermissionModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="map-marker-radius" size={50} color="#FFCC00" />
            </View>
            <Text style={styles.title}>Location Permission</Text>
            <Text style={styles.message}>
              We need your location to show nearby deliveries and provide accurate tracking.
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.settingsButton]} onPress={() => Linking.openSettings()}>
                <Text style={styles.buttonText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={async () => {
                  if (await requestPermission()) {
                    setShowPermissionModal(false);
                    fetchLocation();
                  }
                }}
              >
                <Text style={[styles.buttonText, { color: '#000' }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    fontFamily: font.MonolithRegular
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFBEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: '#333',
    marginBottom: 12,
    fontFamily: font.MonolithRegular
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#000',
  },
  retryButton: {
    backgroundColor: '#FFCC00',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: font.MonolithRegular
  },
});

export default CurrentLocation;
