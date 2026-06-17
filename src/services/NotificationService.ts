import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";

export const NEW_PARCEL_NOTIFICATION_CHANNEL_ID = "new_parcel_alerts_v1";
export const GENERAL_NOTIFICATION_CHANNEL_ID = "general_notifications_v1";
export const DELIVERY_NOTIFICATION_CHANNEL_ID = NEW_PARCEL_NOTIFICATION_CHANNEL_ID;
const ANDROID_RINGTONE_SOUND = "ringtone_notification";
const IOS_RINGTONE_SOUND = "ringtone_notification.caf";
const DISPLAYED_MESSAGE_IDS_KEY = "displayed_notification_message_ids";
const DISPLAYED_MESSAGE_TTL_MS = 10 * 60 * 1000;

const NEW_PARCEL_TYPES = new Set([
  "new_offer",
  "nearby_parcel",
  "new_parcel",
  "new_parcel_request",
  "new_delivery_request",
  "delivery_request",
  "parcel_request",
]);

const NON_RINGING_TYPES = new Set([
  "counter_offer",
  "counter_offer_accepted",
  "offer_accepted",
  "offers_update",
  "parcel_status_update",
  "parcelstatusupdate",
  "driver_location",
  "location",
  "online",
  "chat",
  "message",
]);

const DELIVERY_ROLE_VALUES = new Set(["delivery", "driver", "delivery_user", "deliveryuser"]);

type NotificationContent = {
  title?: string;
  body?: string;
};

class NotificationService {
  private unsubscribeListeners: (() => void) | null = null;

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
        id: GENERAL_NOTIFICATION_CHANNEL_ID,
        name: "General Notifications",
        description: "Chat, status, offer updates, and other app notifications",
        importance: AndroidImportance.HIGH,
        badge: true,
        vibration: true,
      });

      await notifee.createChannel({
        id: NEW_PARCEL_NOTIFICATION_CHANNEL_ID,
        name: "New Parcel Alerts",
        description: "Ringtone alerts for new parcel and delivery requests",
        importance: AndroidImportance.HIGH,
        badge: true,
        sound: ANDROID_RINGTONE_SOUND,
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
      });
    }
  }

  normalizeValue(value: any) {
    return String(value ?? "").toLowerCase().trim();
  }

  isDeliveryValue(value: any) {
    return DELIVERY_ROLE_VALUES.has(this.normalizeValue(value));
  }

  async getStoredUserType() {
    try {
      const selectedRole = await AsyncStorage.getItem("selectedRole");
      if (selectedRole) return selectedRole;

      const authData = await AsyncStorage.getItem("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        const userData = parsed?.userData?.user ?? parsed?.userData?.data ?? parsed?.userData;
        return userData?.type ?? parsed?.userData?.type;
      }

      const persistedRoot = await AsyncStorage.getItem("persist:root");
      if (persistedRoot) {
        const root = JSON.parse(persistedRoot);
        const auth = root?.auth ? JSON.parse(root.auth) : null;
        const userData = auth?.userData?.user ?? auth?.userData?.data ?? auth?.userData;
        return userData?.type ?? auth?.userData?.type;
      }
    } catch (error) {
      console.log("[NotificationService] Unable to read stored user type", error);
    }

    return null;
  }

  isDeliveryTarget(data: any) {
    return (
      this.isDeliveryValue(data?.receiverType) ||
      this.isDeliveryValue(data?.receiver_type) ||
      this.isDeliveryValue(data?.targetRole) ||
      this.isDeliveryValue(data?.target_role) ||
      this.isDeliveryValue(data?.userType) ||
      this.isDeliveryValue(data?.user_type) ||
      this.isDeliveryValue(data?.role)
    );
  }

  async shouldUseRingtone(remoteMessage: any) {
    const data = remoteMessage?.data ?? {};
    const rawType =
      data?.type ??
      data?.notificationType ??
      data?.notification_type ??
      data?.event ??
      data?.eventType;
    const type = this.normalizeValue(rawType);

    if (NON_RINGING_TYPES.has(type)) return false;

    const storedUserType = await this.getStoredUserType();
    const isDeliveryUser = this.isDeliveryValue(storedUserType) || this.isDeliveryTarget(data);
    if (!isDeliveryUser) return false;

    if (NEW_PARCEL_TYPES.has(type)) return true;

    const title = this.normalizeValue(remoteMessage?.notification?.title ?? data?.title);
    const body = this.normalizeValue(remoteMessage?.notification?.body ?? data?.body ?? data?.message);
    const text = `${title} ${body}`;

    return (
      text.includes("new parcel") ||
      text.includes("new delivery") ||
      text.includes("delivery request") ||
      text.includes("parcel request") ||
      text.includes("nearby parcel")
    );
  }

  async getDisplayOptions(remoteMessage: any, badgeCount: number) {
    const shouldRing = await this.shouldUseRingtone(remoteMessage);

    return {
      ios: {
        badgeCount,
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
        ...(shouldRing ? { sound: IOS_RINGTONE_SOUND } : {}),
      },
      android: {
        channelId: shouldRing
          ? NEW_PARCEL_NOTIFICATION_CHANNEL_ID
          : GENERAL_NOTIFICATION_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        badgeCount,
        ...(shouldRing ? { sound: ANDROID_RINGTONE_SOUND } : {}),
        pressAction: {
          id: "default",
        },
      },
    };
  }

  getNotificationContent(remoteMessage: any): NotificationContent | null {
    const notification = remoteMessage?.notification;
    const data = remoteMessage?.data ?? {};
    const title = notification?.title ?? data?.title ?? data?.notificationTitle;
    const body = notification?.body ?? data?.body ?? data?.message ?? data?.notificationBody;

    if (!title && !body) return null;

    return { title, body };
  }

  getMessageId(remoteMessage: any, content?: NotificationContent | null) {
    const data = remoteMessage?.data ?? {};
    const id =
      remoteMessage?.messageId ??
      remoteMessage?.message_id ??
      data?.messageId ??
      data?.message_id ??
      data?.notificationId ??
      data?.notification_id ??
      data?.id ??
      data?.orderId ??
      data?.order_id ??
      data?.parcelId ??
      data?.parcel_id;

    if (id) return String(id);

    const title = content?.title ?? remoteMessage?.notification?.title ?? "";
    const body = content?.body ?? remoteMessage?.notification?.body ?? "";
    const type = data?.type ?? data?.notificationType ?? data?.notification_type ?? "";
    return `${type}:${title}:${body}`;
  }

  async hasRecentlyDisplayed(messageId: string) {
    try {
      const now = Date.now();
      const rawIds = await AsyncStorage.getItem(DISPLAYED_MESSAGE_IDS_KEY);
      const ids = rawIds ? JSON.parse(rawIds) : {};
      const lastDisplayedAt = ids?.[messageId];
      return typeof lastDisplayedAt === "number" && now - lastDisplayedAt < DISPLAYED_MESSAGE_TTL_MS;
    } catch (error) {
      console.log("[NotificationService] Unable to check duplicate notification", error);
      return false;
    }
  }

  async markDisplayed(messageId: string) {
    try {
      const now = Date.now();
      const rawIds = await AsyncStorage.getItem(DISPLAYED_MESSAGE_IDS_KEY);
      const ids = rawIds ? JSON.parse(rawIds) : {};
      const nextIds = Object.keys(ids).reduce((acc: Record<string, number>, key) => {
        if (now - ids[key] < DISPLAYED_MESSAGE_TTL_MS) {
          acc[key] = ids[key];
        }
        return acc;
      }, {});

      nextIds[messageId] = now;
      await AsyncStorage.setItem(DISPLAYED_MESSAGE_IDS_KEY, JSON.stringify(nextIds));
    } catch (error) {
      console.log("[NotificationService] Unable to save displayed notification", error);
    }
  }

  async displayLocalNotification(remoteMessage: any, badgeCount: number) {
    if (Platform.OS === "ios" && remoteMessage?.notification) {
      return;
    }

    const content = this.getNotificationContent(remoteMessage);
    if (!content) return;

    const messageId = this.getMessageId(remoteMessage, content);
    if (await this.hasRecentlyDisplayed(messageId)) return;
    await this.markDisplayed(messageId);

    const displayOptions = await this.getDisplayOptions(remoteMessage, badgeCount);
    await notifee.displayNotification({
      id: messageId,
      title: content.title,
      body: content.body,
      data: remoteMessage?.data,
      ios: displayOptions.ios,
      android: displayOptions.android,
    });
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
    if (this.unsubscribeListeners) {
      return this.unsubscribeListeners;
    }

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("A new FCM message arrived!", JSON.stringify(remoteMessage));
      await this.createChannel();
      const badgeCount = await this.incrementBadge();
      await this.displayLocalNotification(remoteMessage, badgeCount);
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

    this.unsubscribeListeners = () => {
      unsubscribe();
      unsubscribeOpened();
      unsubscribeForegroundEvent();
      this.unsubscribeListeners = null;
    };

    return this.unsubscribeListeners;
  }

  async onBackgroundMessage(remoteMessage: any) {
    console.log(
      "Background FCM message arrived!",
      JSON.stringify(remoteMessage)
    );
    await this.createChannel();
    const badgeCount = await this.incrementBadge();

    if (remoteMessage?.notification) {
      return;
    }

    await this.displayLocalNotification(remoteMessage, badgeCount);
  }
}

export default new NotificationService();
