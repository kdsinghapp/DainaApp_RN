import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import font from '../theme/font';
import strings from '../localization/Localization';

const { width } = Dimensions.get('window');

type Props = {
  isConnected: boolean;
  offlineText?: string;
};

const NetworkStatusBanner: React.FC<Props> = ({
  isConnected,
  offlineText,
}) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showBanner, setShowBanner] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pulse animation for the icon when offline
  useEffect(() => {
    if (showBanner && !isConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [showBanner, isConnected, pulseAnim]);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!isConnected) {
      // OFFLINE — show banner
      setWasDisconnected(true);
      setShowBanner(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (wasDisconnected) {
      // BACK ONLINE — show green "Back Online" then auto-hide after 3s
      setShowBanner(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimerRef.current = setTimeout(() => {
        hideBanner();
        setWasDisconnected(false);
      }, 3500);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isConnected]);

  const hideBanner = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowBanner(false));
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:root=WIFI');
    } else {
      Linking.openSettings();
    }
  };

  if (!showBanner) return null;

  const isOffline = !isConnected;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.banner,
          isOffline ? styles.offlineBanner : styles.onlineBanner,
        ]}
      >
        <View style={styles.content}>
          {/* Animated Icon */}
          <Animated.View
            style={[
              styles.iconWrap,
              isOffline ? styles.iconWrapOffline : styles.iconWrapOnline,
              { transform: [{ scale: isOffline ? pulseAnim : 1 }] },
            ]}
          >
            <Ionicons
              name={isOffline ? 'wifi-outline' : 'checkmark-circle'}
              size={24}
              color={isOffline ? '#EF4444' : '#10B981'}
            />
            {isOffline && (
              <View style={styles.slash} />
            )}
          </Animated.View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, isOffline ? styles.titleOffline : styles.titleOnline]}>
              {isOffline ? (offlineText || strings.NoInternetConnection) : strings.BackOnline}
            </Text>
            {isOffline && (
              <Text style={styles.subtitle}>
                {strings.CheckWifiData}
              </Text>
            )}
          </View>

          {/* Action */}
          {isOffline && (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={openSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsBtnText}>Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Accent Bar */}
        <View
          style={[
            styles.bottomAccent,
            { backgroundColor: isOffline ? '#EF4444' : '#10B981' },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const TOP_INSET = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: TOP_INSET,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  banner: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },

    }),
  },
  offlineBanner: {
    backgroundColor: '#FFFFFF',
  },
  onlineBanner: {
    backgroundColor: '#FFFFFF',
  },
  bottomAccent: {
    height: 4,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 20, // space for bottom accent
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  iconWrapOffline: {
    backgroundColor: '#FEF2F2',
  },
  iconWrapOnline: {
    backgroundColor: '#ECFDF5',
  },
  slash: {
    position: 'absolute',
    width: 2,
    height: 28,
    backgroundColor: '#EF4444',
    transform: [{ rotate: '45deg' }],
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    letterSpacing: 0.3,
  },
  titleOffline: {
    color: '#0F172A',
  },
  titleOnline: {
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: '#64748B',
    marginTop: 3,

  },
  settingsBtn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  settingsBtnText: {
    color: '#EA580C',
    fontSize: 13,
    fontFamily: font.MonolithRegular,
  }
});

export default NetworkStatusBanner;
