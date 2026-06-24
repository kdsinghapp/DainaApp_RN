import { FunctionComponent, useEffect, useRef } from 'react';
import { LogBox, Text, } from 'react-native';
import 'react-native-gesture-handler';
import AppNavigator from './src/navigators/AppNavigator';
import { TextInput } from 'react-native';
import 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/services/queryClient';
import NotificationService from './src/services/NotificationService';
import { getLanguage } from './src/localization/localeStorage';
import strings from './src/localization/Localization';
import { getMessaging } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppUpdateModal from './src/compoent/AppUpdateModal';

LogBox.ignoreAllLogs();
(Text as any).defaultProps = (Text as any).defaultProps || {};

(Text as any).defaultProps.allowFontScaling = false;

(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};

(TextInput as any).defaultProps.allowFontScaling = false;

(TextInput as any).defaultProps.underlineColorAndroid = "transparent";
const App: FunctionComponent<any> = () => {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    initApp();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const initApp = async () => {
    const lang = await getLanguage();
    strings.setLanguage(lang);
    getFcmToken()
    // Initialize Notifications
    await initNotifications();
  };
  const getFcmToken = async () => {
    try {
      const fcmToken = await getMessaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        console.log('✅ FCM Token:', fcmToken);
        return fcmToken;
      } else {
        throw new Error('FCM Token not received');
      }

    } catch (error) {
      console.log(`❌ FCM Token Error: `, error);
      return null;
    }
  };
  const initNotifications = async () => {
    try {
      await NotificationService.registerAppWithFCM();
      const granted = await NotificationService.requestPermission();
      if (!granted) {
        console.log('Notification permission denied — stopping init');
        return;
      }
      await NotificationService.createChannel();
      await NotificationService.getFcmToken();
      await NotificationService.clearBadge();
      const unsubscribe = NotificationService.setupListeners();
      unsubscribeRef.current = unsubscribe;
      console.log('Notifications initialized successfully');
    } catch (error) {
      console.log('Notification init error:', error);
    }
  };
  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
      <AppUpdateModal />
    </QueryClientProvider>
  )
}

export default App;

