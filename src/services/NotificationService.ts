import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playNotificationSound, stopNotificationSound } from '../utils/soundPlayer';

class NotificationService {

  registerAppWithFCM = async (): Promise<void> => {
    try {
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
        console.log('iOS: Registered for remote messages');
      }
    } catch (error) {
      console.log('registerAppWithFCM error:', error);
    }
  };

  requestPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const permission = 'android.permission.POST_NOTIFICATIONS' as any;
          const currentStatus = await check(permission);

          if (currentStatus === RESULTS.GRANTED) {
            console.log('Android: Permission already granted');
            return true;
          }

          if (currentStatus === RESULTS.BLOCKED) {
            Alert.alert(
              'Notification Permission Required',
              'Please enable notifications from App Settings.',
              [{ text: 'OK' }]
            );
            return false;
          }

          const result = await request(permission);
          console.log('Android 13+ permission result:', result);
          return result === RESULTS.GRANTED;
        } else {
          console.log('Android < 13: No permission needed');
          return true;
        }
      } else {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      }
    } catch (error) {
      console.log('requestPermission error:', error);
      return false;
    }
  };

  checkPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const permission = 'android.permission.POST_NOTIFICATIONS' as any;
        const status = await check(permission);
        return status === RESULTS.GRANTED;
      }
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.log('checkPermission error:', error);
      return false;
    }
  };

  getFcmToken = async (): Promise<string | null> => {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) return null;

      const cachedToken = await AsyncStorage.getItem('fcmToken');
      if (cachedToken) return cachedToken;

      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        return fcmToken;
      }
      return null;
    } catch (error) {
      console.log('getFcmToken error:', error);
      return null;
    }
  };

  createChannel = async (): Promise<void> => {
    try {
      if (Platform.OS === 'android') {
        // Channel for Orders (with ringtone) - v3 to ensure fresh settings
        await notifee.createChannel({
          id: 'delivery_orders_v3',
          name: 'Delivery Orders',
          importance: AndroidImportance.HIGH,
          sound: 'ringtone_notification',
          vibration: true,
          vibrationPattern: [300, 500, 300, 500],
        });
        // Channel for General Notifications (default sound)
        await notifee.createChannel({
          id: 'default_channel',
          name: 'General Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'default',
        });
      }
    } catch (error) {
      console.log('createChannel error:', error);
    }
  };

  displayLocalNotification = async (remoteMessage: any): Promise<void> => {
    try {
      const { data, notification } = remoteMessage;

      // Robust check for nearby_parcel
      const type = String(data?.type || '').toLowerCase();
      const title = String(notification?.title || '').toLowerCase();
      const body = String(notification?.body || '').toLowerCase();

      const isNearbyParcel = type === 'nearby_parcel';

      // Check if logged-in user has the 'Delivery' role.
      // If it is a regular user (Customer), suppress nearby parcel requests.
      const authData = await AsyncStorage.getItem('authData');
      const parsedAuth = authData ? JSON.parse(authData) : null;
      const userType = parsedAuth?.userData?.type;

      if (isNearbyParcel && userType !== 'Delivery') {
        console.log('Suppressing foreground nearby_parcel notification for non-delivery user type:', userType);
        return;
      }

      console.log('--- NOTIFICATION RECEIVED ---', JSON.stringify(remoteMessage, null, 2));
      console.log('Is Nearby Parcel Detected:', isNearbyParcel, { type, title, body });

      const channelId = await notifee.createChannel({
        id: isNearbyParcel ? 'delivery_orders_v4' : 'default_channel',
        name: isNearbyParcel ? 'Delivery Orders' : 'General Notifications',
        importance: AndroidImportance.HIGH,
        sound: isNearbyParcel ? 'ringtone_notification' : 'default',
        vibration: true,
      });

      // Show notification
      await notifee.displayNotification({
        title: notification?.title || 'Daina App',
        body: notification?.body || '',
        data: data,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound: isNearbyParcel ? 'ringtone_notification' : 'default',
          pressAction: { id: 'default' },
        },
        ios: {
          sound: isNearbyParcel ? 'ringtone_notification.mp3' : 'default',
        },
      });

      // Start the long ringtone for foreground attention if online
      // Default to online if we can't determine status, to be safe
      const status = parsedAuth?.userData?.onlineStatus?.toLowerCase() || 'online';
      const isUserOnline = status === 'online';

      if (isNearbyParcel && isUserOnline) {
        playNotificationSound();
        // Stop after 10 seconds to match the socket behavior in DeliveryHome
        setTimeout(() => {
          stopNotificationSound();
        }, 10000);
      }
    } catch (error) {
      console.log('displayLocalNotification error:', error);
    }
  };

  setupListeners = (): (() => void) => {
    // Foreground FCM listener
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('FCM foreground message received');
      await this.displayLocalNotification(remoteMessage);
    });

    // Notifee Foreground Event listener (handles taps and dismissals)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
        case EventType.PRESS:
          console.log('User interacted with notification, stopping sound');
          stopNotificationSound();
          break;
      }
    });

    // App opened from background via FCM notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('App opened via notification');
      stopNotificationSound();
    });

    // App opened from quit state
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) stopNotificationSound();
    });

    return () => {
      unsubscribeForeground();
      unsubscribeNotifee();
    };
  };

  onBackgroundMessage = async (remoteMessage: any): Promise<void> => {
    try {
      const { data, notification } = remoteMessage;
      console.log('Background message received:', JSON.stringify(remoteMessage, null, 2));

      // Robust check for nearby_parcel
      const type = String(data?.type || '').toLowerCase();
      const title = String(notification?.title || '').toLowerCase();
      const body = String(notification?.body || '').toLowerCase();

      const isNearbyParcel = type === 'nearby_parcel';

      // Check if logged-in user has the 'Delivery' role in background.
      const authData = await AsyncStorage.getItem('authData');
      const parsedAuth = authData ? JSON.parse(authData) : null;
      const userType = parsedAuth?.userData?.type;

      if (isNearbyParcel && userType !== 'Delivery') {
        console.log('Suppressing background nearby_parcel notification for non-delivery user type:', userType);
        return;
      }

      // Prevent duplicate notifications: Firebase automatically displays notifications in background
      // if the 'notification' object is present. Only use notifee if it's a data-only message.
      if (!notification) {
        const channelId = await notifee.createChannel({
          id: isNearbyParcel ? 'delivery_orders_v4' : 'default_channel',
          name: isNearbyParcel ? 'Delivery Orders' : 'General Notifications',
          importance: AndroidImportance.HIGH,
          sound: isNearbyParcel ? 'ringtone_notification' : 'default',
        });

        await notifee.displayNotification({
          title: data?.title || 'New Parcel Request',
          body: data?.body || 'You have a new parcel request nearby.',
          data: data,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            sound: isNearbyParcel ? 'ringtone_notification' : 'default',
            pressAction: { id: 'default' },
          },
          ios: {
            sound: isNearbyParcel ? 'ringtone_notification.mp3' : 'default',
          },
        });
      }

      // Background sound play if online
      const isUserOnline = (parsedAuth?.userData?.onlineStatus?.toLowerCase() || 'online') === 'online';

      if (isNearbyParcel && isUserOnline) {
        playNotificationSound();
        setTimeout(() => stopNotificationSound(), 10000);
      }
    } catch (error) {
      console.log('onBackgroundMessage error:', error);
    }
  };
}

export default new NotificationService();