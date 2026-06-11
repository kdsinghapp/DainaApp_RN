import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GetNotifications, MarkNotificationsAsReadApi } from "../Api/apiRequest";

const LAST_READ_KEY = "notifications_last_read_at";

const toBoolean = (value: any) => {
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (["1", "true", "read", "seen"].includes(normalized)) return true;
    if (["0", "false", "unread", "unseen"].includes(normalized)) return false;
  }
  return Boolean(value);
};

const getNotificationTime = (notification: any) => {
  const rawDate =
    notification?.createdAt ||
    notification?.created_at ||
    notification?.createdDate ||
    notification?.date;
  const time = rawDate ? new Date(rawDate).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const readKeys = ["isRead", "is_read", "read", "seen", "isSeen", "is_seen"];

const isUnreadNotification = (notification: any, lastReadAt = 0) => {
  for (const key of readKeys) {
    if (notification?.[key] !== undefined && notification?.[key] !== null) {
      return !toBoolean(notification[key]);
    }
  }

  if (notification?.status) {
    const status = String(notification.status).toLowerCase();
    if (["read", "seen"].includes(status)) return false;
    if (["unread", "unseen"].includes(status)) return true;
  }

  if (lastReadAt > 0) {
    return getNotificationTime(notification) > lastReadAt;
  }

  return true;
};

const useNotificationCount = () => {
  const [notificationCount, setNotificationCount] = useState(0);

  const refreshNotificationCount = useCallback(async () => {
    const lastReadAt = Number(await AsyncStorage.getItem(LAST_READ_KEY)) || 0;
    const res = await GetNotifications(() => {});
    const notifications = Array.isArray(res?.notifications) ? res.notifications : [];

    const directCount = Number(
      res?.unreadCount ??
        res?.unread_count ??
        res?.notificationCount ??
        res?.notification_count,
    );
    if (!notifications.length && Number.isFinite(directCount) && directCount >= 0) {
      setNotificationCount(directCount);
      return;
    }

    setNotificationCount(
      notifications.filter((notification: any) =>
        isUnreadNotification(notification, lastReadAt),
      ).length,
    );
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotificationCount(0);
    await AsyncStorage.setItem(LAST_READ_KEY, String(Date.now()));
    await MarkNotificationsAsReadApi({}, () => {});
  }, []);

  const markNotificationRead = useCallback(
    async (notificationId?: number | null) => {
      if (notificationId === undefined || notificationId === null) return;
      await MarkNotificationsAsReadApi({ notificationId }, () => {});
      await refreshNotificationCount();
    },
    [refreshNotificationCount],
  );

  useFocusEffect(
    useCallback(() => {
      refreshNotificationCount();
    }, [refreshNotificationCount]),
  );

  return {
    notificationCount,
    refreshNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
  };
};

export default useNotificationCount;
