import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';

class NotificationService {
  async registerAppWithFCM() {
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
      await messaging().setAutoInitEnabled(true);
    }
  }

  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    if (Platform.OS === 'android') {
      await notifee.requestPermission();
    }
    
    return enabled;
  }

  async createChannel() {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
    }
  }

  async getFcmToken() {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.log('Error getting FCM token', error);
      return null;
    }
  }

  setupListeners() {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
      if (remoteMessage.notification) {
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId: 'default',
            importance: AndroidImportance.HIGH,
          },
        });
      }
    });
    return unsubscribe;
  }
}

export default new NotificationService();
