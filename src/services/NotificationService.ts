import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";

export const DELIVERY_NOTIFICATION_CHANNEL_ID = "delivery_orders_v5";
const ANDROID_RINGTONE_SOUND = "ringtone_notification";
const IOS_RINGTONE_SOUND = "ringtone_notification.caf";

class NotificationService {
  async incrementBadge() {
    try {
      const currentBadge = await notifee.getBadgeCount();
      const nextBadge = currentBadge + 1;
      await notifee.setBadgeCount(nextBadge);
      return nextBadge;
    } catch (error) {
      console.log("Error incrementing badge count", error);
      return 1;
    }
  }

  async clearBadge() {
    try {
      await notifee.setBadgeCount(0);
    } catch (error) {
      console.log("Error clearing badge count", error);
    }
  }

  async registerAppWithFCM() {
    if (Platform.OS === "ios") {
      await messaging().registerDeviceForRemoteMessages();
      await messaging().setAutoInitEnabled(true);
    }
  }

  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (Platform.OS === "android") {
      await notifee.requestPermission();
    }

    return enabled;
  }

  async createChannel() {
    if (Platform.OS === "android") {
      await notifee.createChannel({
        id: DELIVERY_NOTIFICATION_CHANNEL_ID,
        name: "Delivery Orders",
        description: "New parcel and delivery request alerts",
        importance: AndroidImportance.HIGH,
        badge: true,
        sound: ANDROID_RINGTONE_SOUND,
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
      });
    }
  }

  async getFcmToken() {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.log("Error getting FCM token", error);
      return null;
    }
  }

  setupListeners() {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("A new FCM message arrived!", JSON.stringify(remoteMessage));
      await this.createChannel();
      const badgeCount = await this.incrementBadge();
      if (remoteMessage.notification) {
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          data: remoteMessage.data,
          ios: {
            badgeCount,
            sound: IOS_RINGTONE_SOUND,
          },
          android: {
            channelId: DELIVERY_NOTIFICATION_CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            badgeCount,
            sound: ANDROID_RINGTONE_SOUND,
            pressAction: {
              id: "default",
            },
          },
        });
      }
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(async () => {
      await this.clearBadge();
    });

    const unsubscribeForegroundEvent = notifee.onForegroundEvent(
      async ({ type }) => {
        if (type === EventType.PRESS) {
          await this.clearBadge();
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeOpened();
      unsubscribeForegroundEvent();
    };
  }

  async onBackgroundMessage(remoteMessage: any) {
    console.log(
      "Background FCM message arrived!",
      JSON.stringify(remoteMessage)
    );
    await this.createChannel();
    const badgeCount = await this.incrementBadge();

    if (remoteMessage?.notification) {
      await notifee.displayNotification({
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data,
        ios: {
          badgeCount,
          sound: IOS_RINGTONE_SOUND,
        },
        android: {
          channelId: DELIVERY_NOTIFICATION_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          badgeCount,
          sound: ANDROID_RINGTONE_SOUND,
          pressAction: {
            id: "default",
          },
        },
      });
    }
  }
}

export default new NotificationService();
