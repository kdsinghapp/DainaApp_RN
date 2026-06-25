import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomButton from '../../../compoent/CustomButton';
import font from '../../../theme/font';
import { GOOGLE_MAPS_APIKEY } from '../../../Api';
import { SafeAreaView } from 'react-native-safe-area-context';
import strings from '../../../localization/Localization';
import CustomHeader from '../../../compoent/CustomHeader';

Geocoder.init(GOOGLE_MAPS_APIKEY);

const PickupLocationRapido = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const searchRef = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [region, setRegion] = useState({
    latitude: 46.8625, // Mongolia Fallback
    longitude: 103.8467,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [address, setAddress] = useState(strings?.Locating);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const fetchAddressForCoords = async (lat: number, lng: number) => {
    try {
      const json = await Geocoder.from(lat, lng);
      const formatted = json.results?.[0]?.formatted_address || strings?.UnknownLocation;
      setAddress(formatted);
      searchRef.current?.setAddressText(formatted);
    } catch {
      setAddress(strings?.UnknownLocation);
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setAddress(strings?.PermissionDenied);
        return;
      }
    }

    setIsLocatingUser(true);
    setIsFetchingAddress(true);
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const userRegion = { ...region, latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
        setRegion(userRegion);
        mapRef.current?.animateToRegion(userRegion, 300);
        setIsLocatingUser(false);
        fetchAddressForCoords(latitude, longitude);
      },
      (err) => {
        Geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const userRegion = { ...region, latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
            setRegion(userRegion);
            mapRef.current?.animateToRegion(userRegion, 300);
            setIsLocatingUser(false);
            fetchAddressForCoords(latitude, longitude);
          },
          (err2) => {
            setIsLocatingUser(false);
            setIsFetchingAddress(false);
            setAddress(strings?.PermissionDenied);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      },
      { enableHighAccuracy: false, timeout: 2000, maximumAge: 60000 }
    );
  };
  const route = useRoute();

  const confirmLocation = async () => {
    const locationData = {
      latitude: region.latitude,
      longitude: region.longitude,
      address: address,
    };
    console.log(locationData)
    // Trigger the callback from params
    if (route?.params?.onLocationSelect) {
      route?.params?.onLocationSelect(locationData);
    }

    navigation.goBack();
  };

  const handleRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    setIsFetchingAddress(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const json = await Geocoder.from(newRegion.latitude, newRegion.longitude);
        const addressComponent = json?.results?.[0]?.formatted_address || 'Unknown Location';
        setAddress(addressComponent);
        searchRef.current?.setAddressText(addressComponent);
      } catch (error) {
        setAddress(strings?.UnknownLocation);
      } finally {
        setIsFetchingAddress(false);
      }
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container}  >

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
      />

      {/* SEARCH BAR OVERLAY */}
      <View style={styles.searchContainer}>
        <CustomHeader />

        {/* <GooglePlacesAutocomplete
          ref={searchRef}
          placeholder="Search Pickup Area"
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details) {
              const { lat, lng } = details.geometry.location;
              const newRegion = { ...region, latitude: lat, longitude: lng };
              mapRef.current?.animateToRegion(newRegion, 1000);
            }
          }}
          query={{ key: GOOGLE_MAPS_APIKEY, language: 'en' }}
          styles={searchStyles}
          enablePoweredByContainer={false}
        /> */}
      </View>

      {/* FIXED PIN */}
      <View pointerEvents="none" style={styles.pinWrapper}>
        <View style={styles.pinContainer}>

          <Icon name="location-on" size={48} color="#FF3B30" />
        </View>
      </View>

      {/* <TouchableOpacity style={styles.recenterBtn} onPress={getCurrentLocation}>
        <Icon name="my-location" size={24} color="#000" />
      </TouchableOpacity> */}

      <View style={styles.bottomCard}>
        <View style={styles.indicator} />
        <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
        <CustomButton title={strings?.ConfirmLocation}
          onPress={confirmLocation}
          disable={isFetchingAddress || address === 'Locating...'}
          textStyle={{
            color: "white"
          }}
        />
        <SafeAreaView edges={['bottom']} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, },
  map: { flex: 1 },
  searchContainer: { position: 'absolute', width: '100%', top: 60, zIndex: 100 },
  pinWrapper: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  pinContainer: { alignItems: 'center', marginBottom: 48 },
  pinCallout: { backgroundColor: '#fff', padding: 8, borderRadius: 12, marginBottom: 4 },
  calloutText: {
    fontSize: 11, fontFamily: font.MonolithRegular
  },
  recenterBtn: { position: 'absolute', right: 20, bottom: 220, backgroundColor: '#fff', padding: 12, borderRadius: 12, },
  bottomCard: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, },
  addressText: { fontSize: 14, color: '#333', marginBottom: 15, fontFamily: font.MonolithRegular },
  indicator: { width: 40, height: 4, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 10 },
});

export default PickupLocationRapido;