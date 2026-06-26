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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StatusBarComponent from '../../../../compoent/StatusBarCompoent';
import imageIndex from '../../../../assets/imageIndex';
import ScreenNameEnum from '../../../../routes/screenName.enum';
import font from '../../../../theme/font';
import { WebSocket_Url } from '../../../../Api';
import { CancelParcelApi } from '../../../../Api/apiRequest';
import strings from '../../../../localization/Localization';
import CustomHeader from '../../../../compoent/CustomHeader';

const { width } = Dimensions.get('window');

const ACCEPT_TIMEOUT_SEC = 60;
const RADAR_SIZE = Math.min(width - 90, 330);

const COLORS = {
  white: '#FFFFFF',
  black: '#111111',
  text: '#202020',
  backBg: '#EEF1F5',
  gold: '#F4DD78',
  goldLight: '#FFF2A8',
  goldDark: '#B8791A',
  brown: '#8A4A09',
  brownDark: '#6B3705',
  grey: '#E8E8E8',
};

interface RouteParams {
  parcelId: {
    parcel: {
      id: string;
    };
  };
}

interface WSMessage {
  type?: string;
  offers?: any[];
  status?: string;
}

const RequestLoading = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const { parcelId } = (route?.params as RouteParams) || {};

  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const socketRef = useRef<WebSocket | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(ACCEPT_TIMEOUT_SEC);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
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
      if (finished) {
        setTimeoutReached(true);
      }
    });
  };

  const startCountdown = () => {
    clearCountdown();

    let s = ACCEPT_TIMEOUT_SEC;
    setSecondsLeft(s);

    countdownRef.current = setInterval(() => {
      s -= 1;
      setSecondsLeft(s);

      if (s <= 0) {
        clearCountdown();
      }
    }, 1000);
  };

  const connectSocket = async (token: string) => {
    try {
      if (!parcelId?.parcel?.id) {
        setError('Parcel ID not found');
        return;
      }

      const wsUrl = `${WebSocket_Url}/parcel/${parcelId.parcel.id}?token=${token}&role=user`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setError(null);
        socketRef.current = ws;
      };

      ws.onmessage = event => {
        try {
          const data: WSMessage = JSON.parse(event.data);

          if (data?.type === 'offers_update') {
            clearCountdown();

            navigation.replace(ScreenNameEnum.OfferOR, {
              Parcelid: data.offers,
              id: parcelId,
            });
          }
        } catch (e) {
          console.log('Socket message error:', e);
        }
      };

      ws.onerror = () => {
        setError(strings.ConnectionErrorRetrying || 'Connection error');
      };

      ws.onclose = () => {
        socketRef.current = null;
      };

      socketRef.current = ws;
    } catch (err) {
      setError(strings.FailedConnectCheckInternet || 'Failed to connect');
    }
  };

  const initSocket = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      setError(strings.AuthTokenNotFound || 'Auth token not found');
      return;
    }

    connectSocket(token);
  };

  const handleCancel = async () => {
    clearCountdown();

    const id = parcelId?.parcel?.id;

    if (id) {
      await CancelParcelApi(id, () => { });
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace(ScreenNameEnum.DashBoardScreen);
    }
  };

  const handleRetry = () => {
    setTimeoutReached(false);
    setSecondsLeft(ACCEPT_TIMEOUT_SEC);
    setError(null);

    startProgressAnimation();
    startCountdown();
    initSocket();
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0.25,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    startProgressAnimation();
    startCountdown();
    initSocket();

    return () => {
      clearCountdown();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.8],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.28, 0.12, 0],
  });

  const percent = Math.round(
    ((ACCEPT_TIMEOUT_SEC - secondsLeft) / ACCEPT_TIMEOUT_SEC) * 100,
  );

  if (timeoutReached) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBarComponent barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.timeoutBox}>
          <View style={styles.timeoutIconBox}>
            <Image
              source={imageIndex.locationpin}
              style={styles.timeoutIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.timeoutTitle}>
            {strings.NoDataFound || 'No Drivers Found'}
          </Text>



          <TouchableOpacity style={styles.retryMainButton} onPress={handleRetry}>
            <Text style={styles.retryMainText}>
              {strings.RetryLabel || 'RETRY'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelSmallButton} onPress={handleCancel}>
            <Text style={styles.cancelSmallText}>
              {strings.Cancel || 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent barStyle="dark-content" backgroundColor="#FFFFFF" />
      <CustomHeader label={strings.EditProfile} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>


        <View style={styles.radarWrapper}>
          <View style={styles.radar}>
            <View style={styles.radarBackground} />
            <View style={styles.radarLightCircleOne} />
            <View style={styles.radarLightCircleTwo} />

            <Animated.View
              style={[
                styles.pulseCircle,
                {
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />

            <View style={styles.ringOuter} />
            <View style={styles.ringLarge} />
            <View style={styles.ringMiddle} />
            <View style={styles.ringSmall} />

            <View style={styles.lineHorizontal} />
            <View style={styles.lineVertical} />
            <View style={styles.diagonalOne} />
            <View style={styles.diagonalTwo} />



            <Animated.View
              style={[
                styles.sweepContainer,
                {
                  transform: [{ rotate: spin }],
                },
              ]}>
              <View style={styles.scanGlow} />
              <View style={styles.sweepLine} />
            </Animated.View>

            <View style={styles.centerGlowBig} />
            <View style={styles.centerGlowSmall} />
            <View style={styles.centerDot} />

            <Animated.View style={[styles.driverRing, { opacity: blinkAnim }]} />
            <Animated.View style={[styles.driverDot, { opacity: blinkAnim }]} />
          </View>
        </View>



        <View style={styles.bottomSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{strings?.AnnouncementRadiusInfo}</Text>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>{strings?.CancelSearch}</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default RequestLoading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
  },

  header: {
    marginTop: 8,
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.backBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#101828',
  },

  title: {
    fontSize: 28,
    color: COLORS.black,
    fontFamily: font.MonolithRegular,
    letterSpacing: 0.2,
  },

  headerRight: {
    width: 72,
  },

  emptySpace: {
    height: 255,
  },

  radarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 55
  },

  radar: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#F9F6EF',
    backgroundColor: COLORS.gold,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  radarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.gold,
  },

  radarLightCircleOne: {
    position: 'absolute',
    width: RADAR_SIZE * 1.05,
    height: RADAR_SIZE * 1.05,
    borderRadius: RADAR_SIZE * 0.525,
    backgroundColor: 'rgba(255,255,255,0.12)',
    left: -RADAR_SIZE * 0.36,
    top: -RADAR_SIZE * 0.28,
  },

  radarLightCircleTwo: {
    position: 'absolute',
    width: RADAR_SIZE * 0.85,
    height: RADAR_SIZE * 0.85,
    borderRadius: RADAR_SIZE * 0.425,
    backgroundColor: 'rgba(255,255,255,0.16)',
    right: -RADAR_SIZE * 0.25,
    bottom: -RADAR_SIZE * 0.18,
  },

  pulseCircle: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },

  ringOuter: {
    position: 'absolute',
    width: RADAR_SIZE * 0.96,
    height: RADAR_SIZE * 0.96,
    borderRadius: RADAR_SIZE * 0.48,
    borderWidth: 2,
    borderColor: 'rgba(138,74,9,0.22)',
  },

  ringLarge: {
    position: 'absolute',
    width: RADAR_SIZE * 0.78,
    height: RADAR_SIZE * 0.78,
    borderRadius: RADAR_SIZE * 0.39,
    borderWidth: 2,
    borderColor: 'rgba(138,74,9,0.45)',
  },

  ringMiddle: {
    position: 'absolute',
    width: RADAR_SIZE * 0.52,
    height: RADAR_SIZE * 0.52,
    borderRadius: RADAR_SIZE * 0.26,
    borderWidth: 2,
    borderColor: 'rgba(138,74,9,0.55)',
  },

  ringSmall: {
    position: 'absolute',
    width: RADAR_SIZE * 0.28,
    height: RADAR_SIZE * 0.28,
    borderRadius: RADAR_SIZE * 0.14,
    borderWidth: 2,
    borderColor: 'rgba(138,74,9,0.55)',
  },

  lineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(138,74,9,0.48)',
  },

  lineVertical: {
    position: 'absolute',
    height: '100%',
    width: 2,
    backgroundColor: 'rgba(138,74,9,0.48)',
  },

  diagonalOne: {
    position: 'absolute',
    width: '140%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ rotate: '45deg' }],
  },

  diagonalTwo: {
    position: 'absolute',
    width: '140%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ rotate: '-45deg' }],
  },

  compassText: {
    position: 'absolute',
    fontSize: 15,
    color: COLORS.brown,
    fontFamily: font.MonolithRegular,
    opacity: 0.85,
  },

  north: {
    top: 6,
  },

  east: {
    right: 6,
  },

  south: {
    bottom: 6,
  },

  west: {
    left: 6,
  },

  sweepContainer: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
  },

  scanGlow: {
    position: 'absolute',
    top: 0,
    left: RADAR_SIZE / 2,
    width: RADAR_SIZE / 2,
    height: RADAR_SIZE / 2,
    borderTopRightRadius: RADAR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  sweepLine: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: RADAR_SIZE / 2,
    backgroundColor: COLORS.brownDark,
    borderRadius: 4,
  },

  centerGlowBig: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(138,74,9,0.10)',
  },

  centerGlowSmall: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(138,74,9,0.12)',
  },

  centerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.brown,
  },

  driverRing: {
    position: 'absolute',
    right: RADAR_SIZE * 0.22,
    top: RADAR_SIZE * 0.30,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: 'rgba(138,74,9,0.55)',
  },

  driverDot: {
    position: 'absolute',
    left: RADAR_SIZE * 0.28,
    bottom: RADAR_SIZE * 0.24,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.brown,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    marginBottom: 62,
  },

  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.brown,
    marginRight: 18,
  },

  statusText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    fontFamily: font.MonolithRegular,
  },

  bottomSection: {
    marginTop: 40,
    marginBottom: 15
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressLabel: {
    fontSize: 15,
    color: '#333333',
    fontFamily: font.MonolithRegular,
  },

  progressPercent: {
    fontSize: 18,
    color: COLORS.goldDark,
    fontFamily: font.MonolithRegular,
  },

  progressTrack: {
    marginTop: 20,
    height: 7,
    borderRadius: 10,
    backgroundColor: COLORS.grey,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.brown,
    borderRadius: 10,
  },

  cancelButton: {
    marginTop: 48,
    height: 56,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.brown,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  cancelText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: font.MonolithRegular,
  },

  errorText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 13,
    color: '#EF4444',
    fontFamily: font.MonolithRegular,
  },

  timeoutBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  timeoutIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  timeoutIcon: {
    width: 42,
    height: 42,
  },

  timeoutTitle: {
    fontSize: 18,
    color: COLORS.black,
    fontFamily: font.MonolithRegular,
    textAlign: "center"
  },

  timeoutMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 23,
    fontFamily: font.MonolithRegular,
    marginBottom: 30,
  },

  retryMainButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.brownDark,
    borderWidth: 1,
    marginBottom: 15,
    marginTop: 19
  },

  retryMainText: {
    color: COLORS.black,
    fontSize: 16,
    letterSpacing: 2,
    fontFamily: font.MonolithRegular,
  },

  cancelSmallButton: {
    marginTop: 24,
    alignSelf: "center"

  },

  cancelSmallText: {
    color: COLORS.brown,
    fontSize: 15,
    fontFamily: font.MonolithRegular,
  },
});