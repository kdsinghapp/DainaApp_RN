import React, { useState, useEffect, useRef } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
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

  const userData: any = useSelector((state: any) => state.auth.userData);
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

      // WebSocket notification (fire-and-forget)
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
      // Reset slider on error
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

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const getStatusText = () => {
    return isOnline ? strings.SlideToGoOffline : strings.SlideToGoOnline;
  };

  const getStatusLabel = () => {
    return userData?.onlineStatus || (isOnline ? 'Online' : 'Offline');
  };

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={[styles.statusCard, isOnline ? styles.statusCardOnline : styles.statusCardOffline]}>
        <Text style={[styles.statusText, { color: isOnline ? '#10b981' : '#6b7280' }]}>
          {getStatusLabel()}
        </Text>
      </View>

      {/* Swipe Component */}
      <View style={[
        styles.swipeContainer,
        isOnline ? styles.swipeContainerOnline : styles.swipeContainerOffline
      ]}>

        {/* Track Text */}
        <Animated.View style={[styles.trackContent, textStyle]}>
          <Text style={[styles.swipeText, { color: isOnline ? '#FFF' : '#3d2000' }]}>
            {getStatusText()}
          </Text>
        </Animated.View>

        {/* Handle */}
        <PanGestureHandler onGestureEvent={onGestureEvent} enabled={!loading}>
          <Animated.View style={[styles.handle, handleStyle]}>
            {loading ? (
              <ActivityIndicator color={isOnline ? '#000' : '#FFCC00'} size="small" />
            ) : (
              <MaterialCommunityIcons
                name={isOnline ? "power-off" : "power"}
                size={28}
                color={isOnline ? '#000' : '#FFCC00'}
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
    marginVertical: 24,

  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: '#FFF',

  },
  statusCardOnline: { borderLeftWidth: 3, borderLeftColor: '#10b981' },
  statusCardOffline: { borderLeftWidth: 3, borderLeftColor: '#6b7280' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotOnline: { backgroundColor: '#10b981' },
  dotOffline: { backgroundColor: '#9ca3af' },
  statusText: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    left: BUTTON_PADDING,
  },
  swipeText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
  },
  handle: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
    }),
  },
});