import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import font from '../theme/font';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import strings from '../localization/Localization';
import { base_url, WebSocket_Url } from '../Api';
import { GetProfileApi } from '../Api/apiRequest';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/feature/authSlice';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.88;
const BUTTON_HEIGHT = 64;
const BUTTON_PADDING = 6;
const HANDLE_SIZE = BUTTON_HEIGHT - BUTTON_PADDING * 2;
const SWIPE_RANGE = BUTTON_WIDTH - HANDLE_SIZE - BUTTON_PADDING * 2;

interface Props {
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  coords?: { lat?: number; lon?: number };
  onSlideSuccess?: (newStatus: boolean) => void;
}

const OnlineOfflineButton: React.FC<Props> = ({
  isOnline,
  setIsOnline,
  coords,
  onSlideSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const dispatch = useDispatch();

  // Reanimated shared values
  const translateX = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };

  useEffect(() => {
    if (isOnline) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isOnline]);

  const toggleOnlineStatus = async () => {
    if (loading) return;
    const targetOnline = !isOnline;
    setLoading(true);

    // Provide haptic feedback on success
    ReactNativeHapticFeedback.trigger("notificationSuccess", hapticOptions);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const lat = coords?.lat ?? 0;
      const lon = coords?.lon ?? 0;
      const statusStr = targetOnline ? 'online' : 'offline';

      const response = await axios.post(
        `${base_url}/driver/location`,
        { status: statusStr, lat, lon },
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );

      try {
        const ws = new WebSocket(`${WebSocket_Url}/driver-live?token=${token}`);
        ws.onopen = () => {
          ws.send(JSON.stringify({ status: statusStr, lat, lon }));
          setTimeout(() => ws.close(), 1500);
        };
      } catch (_) { }

      if (response.data?.status === 1 || response.status === 200) {
        setIsOnline(targetOnline);
        onSlideSuccess?.(targetOnline);
        const profileResponse = await GetProfileApi(setIsProfileLoading);
        if (profileResponse) {
          dispatch(loginSuccess({ userData: profileResponse, token: token || '' }));
          await AsyncStorage.setItem('authData', JSON.stringify({ userData: profileResponse, token }));
        }
      }
    } catch (error) {
      console.error('❌ Status Toggle Error:', error);
      translateX.value = withSpring(0);
    } finally {
      setLoading(false);
      translateX.value = withSpring(0); // Reset handle position
    }
  };

  const onGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number }>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      const newVal = ctx.startX + event.translationX;
      translateX.value = Math.min(Math.max(newVal, 0), SWIPE_RANGE);
    },
    onEnd: () => {
      if (translateX.value > SWIPE_RANGE * 0.75) {
        translateX.value = withSpring(SWIPE_RANGE);
        runOnJS(toggleOnlineStatus)();
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_RANGE * 0.5], [1, 0], Extrapolate.CLAMP);
    return { opacity };
  });

  const getStatusText = () => {
    return isOnline ? strings.SlideToGoOffline : strings.SlideToGoOnline;
  };




  return (
    <View style={styles.container}>
      <View style={[
        styles.swipeContainer,
        isOnline ? styles.swipeContainerOnline : styles.swipeContainerOffline
      ]}>

        <Animated.View style={[styles.trackContent, textStyle]}>
          <MaterialCommunityIcons
            name={"arrow-right-circle-outline"}
            size={18}
            color={isOnline ? '#FFFFFF' : '#111827'}
          />
          <Text style={[styles.swipeText, { color: isOnline ? '#FFF' : '#111827' }]}>
            {getStatusText()}
          </Text>
        </Animated.View>

        <PanGestureHandler onGestureEvent={onGestureEvent} enabled={!loading}>
          <Animated.View style={[styles.handle, handleStyle]}>
            {loading ? (
              <ActivityIndicator color={isOnline ? '#DC2626' : '#047857'} size="small" />
            ) : (
              <MaterialCommunityIcons
                name={isOnline ? "power-off" : "power"}
                size={28}
                color={isOnline ? '#DC2626' : '#047857'}
              />
            )}
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
};

export default OnlineOfflineButton;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 18,
  },
  statusCard: {
    width: BUTTON_WIDTH,
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,

  },
  statusCardOnline: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  statusCardOffline: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  statusEyebrow: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    textTransform: 'uppercase',
  },
  statusTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: font.MonolithRegular,
    textTransform: 'uppercase',
  },
  liveBadge: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    textTransform: 'uppercase',
  },
  statusMessage: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    fontFamily: font.MonolithRegular,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  infoChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoChipReady: {
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
  },
  infoChipWarning: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  infoChipMuted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  infoChipText: {
    color: '#047857',
    fontSize: 11,
    marginLeft: 6,
    fontFamily: font.MonolithRegular,
    flexShrink: 1,
  },
  infoChipTextWarning: {
    color: '#B45309',
  },
  infoChipTextMuted: {
    color: '#64748B',
  },
  swipeContainer: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2,
    padding: BUTTON_PADDING,
    justifyContent: 'center',

  },
  swipeContainerOnline: {
    backgroundColor: '#8B4513',

  },
  swipeContainerOffline: {
    backgroundColor: '#FFCC00',
  },
  trackContent: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    left: BUTTON_PADDING,
  },
  swipeText: {
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    marginLeft: 6,
  },
  handle: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',

  },
});
