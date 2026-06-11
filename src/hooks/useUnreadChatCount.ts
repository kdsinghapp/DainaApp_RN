import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { base_url } from "../Api";

const getUnreadCount = (chat: any) => {
  const count = Number(chat?.unreadCount ?? chat?.unread_count ?? chat?.unread ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
};

const useUnreadChatCount = () => {
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const refreshUnreadChatCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${base_url}/chat/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        setUnreadChatCount(0);
        return;
      }

      const json = await response.json();
      const chats = Array.isArray(json?.chats) ? json.chats : [];
      const totalUnread = chats.reduce(
        (total: number, chat: any) => total + getUnreadCount(chat),
        0,
      );
      setUnreadChatCount(totalUnread);
    } catch (error) {
      console.log("refreshUnreadChatCount error:", error);
      setUnreadChatCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUnreadChatCount();
    }, [refreshUnreadChatCount]),
  );

  return {
    unreadChatCount,
    refreshUnreadChatCount,
  };
};

export default useUnreadChatCount;
