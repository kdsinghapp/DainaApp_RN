

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import StatusBarComponent from '../../../../compoent/StatusBarCompoent';
import { GetApi, CancelParcelApi } from '../../../../Api/apiRequest';
import imageIndex from '../../../../assets/imageIndex';
import ScreenNameEnum from '../../../../routes/screenName.enum';
import CustomHeader from '../../../../compoent/CustomHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import font from '../../../../theme/font';
import colors from '../../../../theme/colors';
import shadows from '../../../../theme/shadows';
import { WebSocket_Url } from '../../../../Api';
import strings from '../../../../localization/Localization';

const { width, height } = Dimensions.get('window');
const ACCEPT_TIMEOUT_SEC = 30;
const DRIVER_SEARCH_RADIUS_METERS = 2000;

interface RouteParams {
  parcelId: {
    parcel: {
      id: string;
    };
  };
  pickupLocation?: string;
  pickupCoords?: {
    latitude?: number;
    longitude?: number;
  } | null;
}

interface WSMessage {
  type?: string;
  offers?: any[];
  status?: string;
}

const RequestLoading = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const [driverStatus, setDriverStatus] = useState(strings.SearchingDrivers);
  const [statusDetails, setStatusDetails] = useState(strings.ConnectingNetwork);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ACCEPT_TIMEOUT_SEC);
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const mapRef = useRef<MapView>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;

  const route = useRoute();
  const navigation = useNavigation<any>();
  const { parcelId, pickupLocation, pickupCoords } = (route?.params as RouteParams) || {};
  const pickupLatitude = Number(pickupCoords?.latitude);
  const pickupLongitude = Number(pickupCoords?.longitude);
  const hasPickupCoords = Number.isFinite(pickupLatitude) && Number.isFinite(pickupLongitude);

  const updateStatusDetails = (status: string) => {
    const statusMap: Record<string, string> = {
      DRIVER_FOUND: strings.DriverConfirmed,
      ON_THE_WAY: strings.DriverEnRoute,
      PICKED_UP: strings.ParcelCollected,
      DELIVERED: strings.ParcelDelivered,
    };
    setStatusDetails(statusMap[status] || strings.ConnectingNetwork);
  };

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const connectSocket = async (token: string): Promise<void> => {
    try {
      if (!parcelId?.parcel?.id) {
        throw new Error('Parcel ID not found');
      }
      const wsUrl = `${WebSocket_Url}/parcel/${parcelId?.parcel?.id}?token=${token}&role=user`;
      // const wsUrl = ` {WebSocket_Url}/parcel/${parcelId.parcel.id}?token=${token}&role=user`;
      // const wsUrl = `wss://aitechnotech.in/DAINA/ws/parcel/${parcelId.parcel.id}?token=${token}&role=user`;
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setRetryCount(0);
        socketRef.current = ws;
      };

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);

          if (data?.type === 'offers_update') {
            clearCountdown();
            navigation.replace(ScreenNameEnum.OfferOR, {
              Parcelid: data.offers,
              id: parcelId,
            });
            return;
          }

          if (data?.status) {
            setDriverStatus(data.status);
            updateStatusDetails(data.status);
          }
        } catch (e) {
          console.warn('Failed to parse message:', e);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        setError(strings.ConnectionErrorRetrying);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (retryCount < maxRetries) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            handleReconnect();
          }, Math.min(1000 * Math.pow(2, retryCount), 10000));
        } else {
          setError(strings.ConnectionFailedTryAgain);
        }
      };

      socketRef.current = ws;
    } catch (err) {
      setError(strings.FailedConnectCheckInternet);
    }
  };

  const handleReconnect = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) await connectSocket(token);
    } catch (_) { }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setTimeoutReached(false);
    setSecondsLeft(ACCEPT_TIMEOUT_SEC);
    progressAnim.setValue(0);
    startProgressAnimation();
    startCountdown();
    handleReconnect();
  };

  const handleGoBack = async () => {
    clearCountdown();
    const id = parcelId?.parcel?.id;
    if (id) {
      // setLoading(true);
      await CancelParcelApi(id, () => { });
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace(ScreenNameEnum.DashBoardScreen);
    }
  };

  const startProgressAnimation = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: ACCEPT_TIMEOUT_SEC * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setTimeoutReached(true);
    });
  };

  const startCountdown = () => {
    clearCountdown();
    let s = ACCEPT_TIMEOUT_SEC;
    setSecondsLeft(s);
    countdownRef.current = setInterval(() => {
      s -= 1;
      setSecondsLeft(s);
      if (s <= 0) clearCountdown();
    }, 1000);
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(pulseAnim1, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.timing(pulseAnim2, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ).start();
    }, 1250);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (hasPickupCoords) {
      const region = {
        latitude: pickupLatitude,
        longitude: pickupLongitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
      setCurrentRegion(region);
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 300);
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        };
        setCurrentRegion(region);
        setTimeout(() => {
          mapRef.current?.animateToRegion(region, 1000);
        }, 300);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );
  }, [hasPickupCoords, pickupLatitude, pickupLongitude]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError(strings.AuthTokenNotFound);
          return;
        }
        if (mounted) {
          await connectSocket(token);
          startProgressAnimation();
          startCountdown();
        }
      } catch (_) { }
    };
    init();
    return () => {
      mounted = false;
      clearCountdown();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3.5],
  });

  const pulseOpacity1 = pulseAnim1.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.6, 0.15, 0],
  });

  const pulseScale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3.5],
  });

  const pulseOpacity2 = pulseAnim2.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.6, 0.15, 0],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (timeoutReached) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBarComponent barStyle="dark-content" backgroundColor="#F5F5F5" />
        <CustomHeader />
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.timeoutCard}>
            <View style={styles.timeoutIconWrap}>
              <Image source={imageIndex.Location} style={styles.timeoutIcon} resizeMode="contain" />
            </View>
            <Text style={styles.timeoutTitle}>{strings.NoPartnerAccepted}</Text>
            <Text style={styles.timeoutMessage}>
              {strings.NoPartnerAcceptedDesc}
            </Text>
            <View style={styles.timeoutButtons}>
              <TouchableOpacity style={styles.btnGoBack} onPress={handleGoBack} activeOpacity={0.8}>
                <Text style={styles.btnGoBackText}>{strings.Back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnRetryMain} onPress={handleRetry} activeOpacity={0.8}>
                <Text style={styles.btnRetryMainText}>{strings.RetryLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent barStyle="dark-content" backgroundColor="#F5F5F5" />
      <CustomHeader />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{strings.FindingDriver}</Text>
          <Text style={styles.headerSubtitle}>{strings.PleaseWaitFindingPartner}</Text>
          <Text style={styles.radiusInfo}>{strings.AnnouncementRadiusInfo}</Text>
        </View>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={currentRegion}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            mapType="standard"
            mapPadding={{ top: 24, right: 16, bottom: 24, left: 16 }}
          >
            <Circle
              center={{
                latitude: currentRegion.latitude,
                longitude: currentRegion.longitude,
              }}
              radius={DRIVER_SEARCH_RADIUS_METERS}
              strokeColor="rgba(255, 204, 0, 0.95)"
              fillColor="rgba(255, 204, 0, 0.18)"
              strokeWidth={2}
            />
            <Marker
              coordinate={{
                latitude: currentRegion.latitude,
                longitude: currentRegion.longitude,
              }}
              title={strings.PickupLocation}
              description={pickupLocation}
            />
          </MapView>
          <View style={styles.mapOverlay} pointerEvents="none">
            <View style={styles.circleContainer}>
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseScale1 }], opacity: pulseOpacity1 }]} />
              <Animated.View style={[styles.pulseCircle2, { position: 'absolute', transform: [{ scale: pulseScale2 }], opacity: pulseOpacity2 }]} />
              <View style={[styles.mainCircle, { position: 'absolute' }]}>
                <Animated.View
                  style={[
                    styles.innerCircle,
                    { transform: [{ rotate: spin }] },
                  ]}
                >
                  <Image source={imageIndex.location1} style={styles.locationIcon} resizeMode="contain" />
                </Animated.View>
              </View>
            </View>
          </View>
          <View style={styles.currentLocationBadge} pointerEvents="none">
            <Text style={styles.currentLocationText}>{strings.CurrentLocation}</Text>
            {!!pickupLocation ? (
              <Text style={styles.pickupLocationText} numberOfLines={2}>
                {pickupLocation}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.bottomCard}>
          <View style={styles.indicator} />
          <Text style={styles.primaryStatus}>{driverStatus}</Text>
          <Text style={styles.secondaryStatus}>{statusDetails}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressText}>{strings.formatString(strings.XSecLeft, secondsLeft)}</Text>
          </View>
          {error ? (
            <View style={styles.connectionStatus}>
              <View style={[styles.connectionDot, styles.error]} />
              <Text style={styles.connectionText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryText}>{strings.RetryLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 8,
    fontFamily: font.MonolithRegular,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: font.MonolithRegular,
  },
  radiusInfo: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 18,
    fontFamily: font.MonolithRegular,
  },
  mapContainer: {
    flex: 1,
    minHeight: 280,
    overflow: 'hidden',
    backgroundColor: colors.border,
    ...shadows.card,
    borderRadius: 20,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingImage: {
    height: 35,
    width: 35,
    opacity: 0.9,
  },
  currentLocationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  currentLocationText: {
    fontSize: 13,
    color: '#374151',
    fontFamily: font.MonolithRegular,
  },
  pickupLocationText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: font.MonolithRegular,
  },
  loaderSection: {
    alignItems: 'center',
    marginBottom: 0,
  },
  circleContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFCC00',
  },
  pulseCircle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFCC00',
  },
  mainCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FFCC00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
        shadowColor: '#FFCC00',
      },
    }),
    borderWidth: 2,
    borderColor: '#FFCC00',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIcon: {
    width: 32,
    height: 32,
    tintColor: '#FFCC00',
  },
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    ...shadows.modal,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: font.MonolithRegular,
  },
  primaryStatus: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 24,
    fontFamily: font.MonolithRegular,
  },
  secondaryStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: font.MonolithRegular,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  connected: { backgroundColor: colors.success },
  connecting: { backgroundColor: colors.warning },
  error: { backgroundColor: colors.error },
  connectionText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: font.MonolithRegular,
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  timeoutCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  timeoutIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeoutIcon: {
    width: 44,
    height: 44,
    tintColor: colors.error,
  },
  timeoutTitle: {
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: font.MonolithRegular,
  },
  timeoutMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
    fontFamily: font.MonolithRegular,
  },
  timeoutButtons: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    maxWidth: 320,
  },
  btnGoBack: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGoBackText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: font.MonolithRegular,
  },
  btnRetryMain: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnRetryMainText: {
    fontSize: 16,
    color: colors.textInverse,
    fontFamily: font.MonolithRegular,
  },
});

export default RequestLoading;
