import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  LayoutAnimation,
  UIManager,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import imageIndex from "../../../assets/imageIndex";
import { useNavigation, useRoute } from "@react-navigation/native";
import font from "../../../theme/font";
import { base_url, WebSocket_Url } from "../../../Api";
import { useSelector } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import CounterOfferModal from "../../../compoent/MakeCounterModal";
import AcceptOfferModal from "../../../compoent/AcceptOfferModal";
import { errorToast, successToast } from "../../../utils/customToast";
import ScreenNameEnum from "../../../routes/screenName.enum";
import strings from "../../../localization/Localization";

// ─── Config ──────────────────────────────────────────────────────────────────
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  isRead?: boolean;
}

interface ApiMessage {
  id: number;
  senderId: number;
  senderRole: string;
  message: string;
  isRead: boolean;
  isMine: boolean;
  createdAt: string;
}

interface WsIncoming {
  message?: string;
  sender_type?: string;
  is_mine?: boolean;
  created_at?: string;
  timestamp?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toTimeString = (iso?: string): string => {
  if (!iso) return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const normalized = iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`;
  return new Date(normalized).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDayLabel = (iso: string): string => {
  const normalized = iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`;
  const d = new Date(normalized);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return strings.Today;
  if (sameDay(d, yesterday)) return strings.Yesterday;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const cleanToken = (t: string | null): string | null => {
  if (!t) return null;
  return t.startsWith("Bearer ") ? t.replace("Bearer ", "").trim() : t.trim();
};

// ─── Build flat list items (messages + day separators) ───────────────────────
type ListItem =
  | { type: "separator"; id: string; label: string }
  | { type: "message"; id: string; msg: Message };

const buildListItems = (messages: Message[], rawDates: Record<string, string>): ListItem[] => {
  const items: ListItem[] = [];
  let lastLabel = "";

  messages.forEach((msg) => {
    const iso = rawDates[msg.id] ?? "";
    const label = iso ? toDayLabel(iso) : "";

    if (label && label !== lastLabel) {
      items.push({ type: "separator", id: `sep_${msg.id}`, label });
      lastLabel = label;
    }
    items.push({ type: "message", id: msg.id, msg });
  });

  return items;
};

// ─── Component ───────────────────────────────────────────────────────────────
const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = (route?.params as any) || {};
  const parcelId = item?.parcelId || item?.id;
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [isOfferAvailable, setIsOfferAvailable] = useState(true);
  console.log("item", item)
  const userData: any = useSelector((state: any) => state?.auth?.userData);
  const [messages, setMessages] = useState<Message[]>([]);
  const rawDatesRef = useRef<Record<string, string>>({});
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // ── Accept Offer ──────────────────────────────────────────────────────────
  const onAcceptOffer = async (id: any) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) return;
      // const response = await fetch(`${base_url}/delivery/offers/${offerId}/accept-counter`, {

      const response = await fetch(`${base_url}/delivery/offers/${id}/accept-counter`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      console.log("result 666 ", result)
      if (response.ok) {
        setOfferModalVisible(false);

        successToast(strings.OfferAcceptedSuccess);
        (navigation as any).navigate(ScreenNameEnum.TabNavigator);
      } else {
        errorToast(result?.message || strings.OfferAcceptFailed);
        setIsOfferAvailable(false);
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      errorToast(strings.SomethingWentWrong);
    }
  };

  // ── Counter Offer ─────────────────────────────────────────────────────────
  const onCounterOffer = async (id: number, amount: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) return;

      const body = new URLSearchParams({
        counterAmount: String(amount),
        counterMessage: "hi",
      }).toString();

      const response = await fetch(`${base_url}/offers/${id}/counter-offer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const result = await response.json();
      if (response.ok && (result.status == 1 || result.success === true)) {
        successToast("Counter offer sent successfully");
        setCounterModalVisible(false);
        navigation.goBack();
      } else {
        errorToast(result?.message || strings.CounterOfferFailed);
      }
    } catch (error) {
      console.log("Counter offer error:", error);
      errorToast(strings.SomethingWentWrong);
    }
  };

  // ── Mark Messages Read ────────────────────────────────────────────────────
  const markMessagesAsRead = useCallback(async () => {
    if (!token || !parcelId) return;
    try {
      await fetch(`${base_url}/chat/${parcelId}/mark-read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    } catch (error) {
      console.error("Mark read error:", error);
    }
  }, [parcelId, token]);

  // ── 0. Load & clean token ─────────────────────────────────────────────────
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(cleanToken(storedToken));
      } catch (e) {
        console.error("Token load error:", e);
      } finally {
        setTokenLoaded(true);
      }
    };
    loadToken();
  }, []);

  // ── 1. Fetch existing chat history ────────────────────────────────────────
  const fetchMessages = useCallback(async (showLoading = true) => {
    if (!tokenLoaded || !parcelId || !token) return;

    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`${base_url}/chat/${parcelId}/messages`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`HTTP Error: ${response.status}`);
        return;
      }

      const json = await response.json();
      const raw: ApiMessage[] = Array.isArray(json) ? json : json?.messages ?? [];
      const dates: Record<string, string> = {};

      const mapped: Message[] = raw.map((m) => {
        const id = String(m.id);
        dates[id] = m.createdAt;
        return {
          id,
          text: m.message,
          sender: m.isMine ? "me" : "other",
          time: toTimeString(m.createdAt),
          isRead: m.isRead,
        };
      });

      rawDatesRef.current = dates;
      setMessages(mapped);

      if (showLoading) markMessagesAsRead();
    } catch (error) {
      console.error("Fetch Messages Error:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [parcelId, token, tokenLoaded, markMessagesAsRead]);

  // Initial fetch and polling for read receipts
  useEffect(() => {
    if (!tokenLoaded || !parcelId || !token) {
      setLoading(false);
      return;
    }

    fetchMessages(true);

    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 4000); // Poll every 4 seconds for read receipts

    return () => clearInterval(intervalId);
  }, [fetchMessages, tokenLoaded, parcelId, token]);

  // ── 2. Connect WebSocket ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tokenLoaded || !parcelId || !token) return;
    const wsUrl = `${WebSocket_Url}/chat/${parcelId}?token=${token}`;
    // const wsUrl = `${WebSocket_Url}/chat${parcelId}?token=${token}`;
    // const WS_BASE = "wss://aitechnotech.in/DAINA/ws/chat";

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (e) {
      console.error("WebSocket creation error:", e);
      return;
    }

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: WsIncoming = JSON.parse(event.data);

        // ✅ FIX 1: Guard against empty/ping frames — skip if no message text
        if (!data.message || data.message.trim() === "") return;

        // ✅ FIX 2: Correct isMine detection using your actual role
        const myRole = userData?.type?.toLowerCase(); // e.g. "delivery" or "user"
        const isMine =
          data.is_mine !== undefined
            ? data.is_mine
            : data.sender_type?.toLowerCase() === myRole;

        // ✅ FIX 3: Skip echoed own messages to avoid duplicates
        if (isMine) return;

        const iso = data.created_at ?? data.timestamp ?? new Date().toISOString();
        const msgId = `ws_${Date.now()}_${Math.random()}`;
        rawDatesRef.current[msgId] = iso;

        const incoming: Message = {
          id: msgId,
          text: data.message,
          sender: "other",
          time: toTimeString(iso),
        };

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages((prev) => [...prev, incoming]);
        markMessagesAsRead();
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };

    ws.onerror = (e) => console.error("WS error:", e);

    ws.onclose = (e) => {
      console.log("WS closed:", e.code, e.reason);
      setConnected(false);
    };

    return () => {
      ws.onclose = null;
      ws.close();
      wsRef.current = null;
    };
  }, [parcelId, token, tokenLoaded, markMessagesAsRead]);

  // ── 3. Auto-scroll on new message ────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: true }),
      100
    );
    return () => clearTimeout(timer);
  }, [messages]);

  // ── 4. Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    const msgId = `me_${Date.now()}`;
    rawDatesRef.current[msgId] = now;

    const newMsg: Message = {
      id: msgId,
      text: trimmed,
      sender: "me",
      time: toTimeString(now),
      isRead: false,
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: trimmed }));
    } else {
      console.warn("WebSocket not open — message may not be delivered.");
    }
  }, [inputText]);

  // ── Handle Phone Call ─────────────────────────────────────────────────────
  const handleCall = (phone: string | number | undefined) => {
    if (!phone) {
      Alert.alert(strings.Error, strings.PhoneNumber);
      return;
    }
    const phoneNumber =
      Platform.OS === "android" ? `tel:${phone}` : `telprompt:${phone}`;
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (!supported) {
          Alert.alert(strings.Error, strings.PhoneNumber);
        } else {
          return Linking.openURL(phoneNumber);
        }
      })
      .catch((err) => console.log("Call Error:", err));
  };

  // ── Derive agent info ─────────────────────────────────────────────────────
  // ✅ FIX 4: Use chattingWith from API response (passed via route params)
  const chattingWith = item?.chattingWith;

  const agentName =
    chattingWith?.name ??
    item?.carrierName ??
    item?.parcelOwner?.name ??
    item?.driver?.name ??
    item?.user?.firstName ?? item?.assignedDriver?.name ?? "Delivery Agent";

  const agentImage =
    chattingWith?.image ??
    item?.deliveryUser?.profile_image ??
    item?.parcelOwner?.image ??
    item?.driver?.image ?? item?.user?.image ?? item?.assignedDriver?.image
  null;

  const agentPhone = chattingWith?.phone ??
    item?.parcelOwner?.phone ?? item?.user?.phone ?? item?.assignedDriver?.phone
  null;
  const listItems = buildListItems(messages, rawDatesRef?.current);

  const renderItem = ({ item: listItem }: { item: ListItem }) => {
    if (listItem.type === "separator") {
      return (
        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorLabel}>{listItem.label}</Text>
          <View style={styles.separatorLine} />
        </View>
      );
    }

    const { msg } = listItem;
    const isMe = msg.sender === "me";

    return (
      <View
        style={[
          styles.bubbleWrapper,
          isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperOther,
        ]}
      >
        {!isMe && (
          <View style={styles.chatAvatarContainer}>
            {agentImage ? (
              <Image source={{ uri: agentImage }} style={styles.chatAvatar} />
            ) : (
              <View style={styles.chatAvatarFallback}>
                <Text style={styles.chatAvatarInitial}>
                  {agentName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text style={isMe ? styles.myMessageText : styles.otherMessageText}>
            {msg?.text}
          </Text>
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.timeText,
                { color: isMe ? "rgba(0, 0, 0, 0.54)" : "#aaa" },
              ]}
            >
              {msg?.time}
            </Text>
            {isMe && (
              <Ionicons
                name="checkmark-done"
                size={16}
                color={msg?.isRead ? "#2196F3" : "rgba(0,0,0,0.4)"}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };
  console.log("item")
  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Image source={imageIndex.back} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          {agentImage ? (
            <Image source={{ uri: agentImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {agentName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {/* <View style={styles.onlineBadge} /> */}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {agentName}
          </Text>
          <Text style={styles.trackingId}>{item?.trackingId}</Text>
        </View>

        {/* Offer button — only show for Delivery users */}
        {/* {item?.offerAmount && userData?.type == "Delivery" && isOfferAvailable && (

          <>
            {item?.offerStatus === "counter_offered" ? (
              <TouchableOpacity
                onPress={() => setOfferModalVisible(true)}
                style={[styles.headerOfferBtn, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}
              >
                <Text style={[styles.headerOfferText, { color: '#EA580C' }]}>View Offer</Text>
              </TouchableOpacity>
            ) : null}
          </>

        )} */}

        {/* Call button */}
        <TouchableOpacity onPress={() => handleCall(agentPhone)}>
          <Image
            source={imageIndex.Calblack}
            style={{ height: 33, width: 33, resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        {/* ── Messages ── */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FFCC00" />
            <Text style={styles.loadingText}>{strings.LoadingMessages}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={listItems}
            renderItem={renderItem}
            keyExtractor={(i, index) => i?.id ? String(i.id) : String(index)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyText}>{strings.NoMessagesYetSayHi}</Text>
              </View>
            }
          />
        )}

        {/* ── Input Box ── */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>

            <TextInput
              style={styles.input}
              placeholder={strings.TypeAMessagePlaceholder}
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor="#8E8E93"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline={false}
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.4 }]}
            activeOpacity={0.7}
            disabled={!inputText.trim()}
          >
            <Image source={imageIndex.Messagesend} style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Counter Offered Detail Modal ── */}
      <Modal
        visible={offerModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#FFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: font.MonolithRegular, color: '#0F172A' }}>
                Counter Offer Details
              </Text>
              <TouchableOpacity onPress={() => setOfferModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 16,
              padding: 8,
              alignItems: 'center',
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}>
              <Text style={{ fontSize: 13, fontFamily: font.MonolithRegular, color: '#92400E' }}>
                Offer Amount
              </Text>
              <Text style={{ fontSize: 32, fontFamily: font.MonolithRegular, color: '#D97706', marginTop: 4 }}>
                ${item?.offerAmount}
              </Text>
            </View>

            {/* Delivery Price */}


            {/* Pickup Location */}
            {item?.parcel?.pickupLocation && (
              <View style={{ flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' }}>
                <Ionicons name="location" size={20} color="#22C55E" style={{ marginTop: 2, marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: font.MonolithRegular, color: '#94A3B8', marginBottom: 2 }}>
                    PICKUP
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: font.MonolithRegular, color: '#334155', lineHeight: 18 }} numberOfLines={2}>
                    {item?.parcel?.pickupLocation}
                  </Text>
                </View>
              </View>
            )}

            {/* Drop Location */}
            {item?.parcel?.dropLocation && (
              <View style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' }}>
                <Ionicons name="location" size={20} color="#EF4444" style={{ marginTop: 2, marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: font.MonolithRegular, color: '#94A3B8', marginBottom: 2 }}>
                    DROP-OFF
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: font.MonolithRegular, color: '#334155', lineHeight: 18 }} numberOfLines={2}>
                    {item?.parcel?.dropLocation}
                  </Text>
                </View>
              </View>
            )}



            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setOfferModalVisible(false);
                  setCounterModalVisible(true);
                }}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#F1F5F9',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15, fontFamily: font.MonolithRegular, color: '#334155' }}>
                  Counter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onAcceptOffer(item?.offerId);
                }}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#FFCC00',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15, fontFamily: font.MonolithRegular, color: '#000' }}>
                  Accept Offer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Counter Offer Input Modal ── */}
      <CounterOfferModal
        visible={counterModalVisible}
        defaultValue={item?.offerAmount || "1"}
        currency="$"
        min={1}
        max={50000}
        onCancel={() => setCounterModalVisible(false)}
        onSubmit={(amount: any) => {
          const id = item?.offerId;
          if (id) {
            onCounterOffer(id, amount);
          } else {
            errorToast(strings.InvalidOfferID);
          }
        }}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const YELLOW = "#FFCC00";
const DARK = "#1A1A1A";
const GRAY_BG = "#F7F7F9";
const LIGHT_TEXT = "#8E8E93";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",



  },
  backBtn: {
    marginRight: 12,
  },
  backIcon: {
    height: 42,
    width: 42,
    resizeMode: "contain",

  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F0F0",
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: YELLOW,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    color: "#000",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CD964",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: DARK,
    lineHeight: 20,
  },
  trackingId: {
    fontSize: 12,
    color: LIGHT_TEXT,
    fontFamily: font.MonolithRegular,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerOfferBtn: {
    backgroundColor: "#F0F9F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1E7DD",
  },
  headerOfferText: {
    fontSize: 11,
    color: "#0F5132",
    fontFamily: font.MonolithRegular,
  },
  callBtn: {
    padding: 4,
  },
  callIcon: {
    height: 24,
    width: 24,
    resizeMode: "contain",
    tintColor: DARK,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: LIGHT_TEXT,
    fontFamily: font.MonolithRegular,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    textAlign: "center",
    color: LIGHT_TEXT,
    fontFamily: font.MonolithRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  separatorLabel: {
    fontSize: 12,
    color: LIGHT_TEXT,
    fontFamily: font.MonolithRegular,
    paddingHorizontal: 12,
  },
  chatContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  bubbleWrapper: {
    marginVertical: 4,
    flexDirection: "row",
    width: "100%",
  },
  bubbleWrapperMe: {
    justifyContent: "flex-end",
  },
  bubbleWrapperOther: {
    justifyContent: "flex-start",
    marginBottom: 10
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessage: {
    backgroundColor: YELLOW,
    borderBottomRightRadius: 4,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  otherMessage: {
    backgroundColor: GRAY_BG,
    borderBottomLeftRadius: 4,
  },
  myMessageText: {
    color: "white",
    fontFamily: font.MonolithRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  otherMessageText: {
    color: DARK,
    fontFamily: font.MonolithRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    fontFamily: font.MonolithRegular,
    color: "rgba(0,0,0,0.4)",
  },
  tickText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: font.MonolithRegular,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 15 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GRAY_BG,
    borderRadius: 25,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  attachBtn: {
    padding: 8,
  },
  attachIcon: {
    width: 20,
    height: 20,
    tintColor: LIGHT_TEXT,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontFamily: font.MonolithRegular,
    fontSize: 15,
    color: DARK,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: YELLOW,
    justifyContent: "center",
    alignItems: "center",

  },
  sendIcon: {
    height: 22,
    width: 22,
    resizeMode: "contain",
    tintColor: "#000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontFamily: font.MonolithRegular,
    fontSize: 16,
    color: "#333",
  },
  offerSection: {
    marginTop: 15,
  },
  offerLabel: {
    fontFamily: font.MonolithRegular,
    fontSize: 12,
    color: "#888",
  },
  offerValue: {
    fontFamily: font.MonolithRegular,
    fontSize: 26,
    color: "#FF9800",
    marginTop: 4,
  },
  offerMessage: {
    fontFamily: font.MonolithRegular,
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
    marginTop: 4,
  },
  modalActions: {
    marginTop: 25,
    gap: 12,
  },
  modalAcceptBtn: {
    backgroundColor: "#FFCC00",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
  },
  modalAcceptText: {
    color: "#000",
    fontSize: 14,
    fontFamily: font.MonolithRegular,
  },
  modalCounterBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#FFCC00",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCounterText: {
    color: "#FFCC00",
    fontSize: 14,
    fontFamily: font.MonolithRegular,
  },
  headerAcceptBtn: {
    backgroundColor: "#FFCC00",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAcceptText: {
    color: "#000",
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  headerCounterBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#FFCC00",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCounterText: {
    color: "#FFCC00",
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  parcelBadge: {
    backgroundColor: "#FFF3B0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  parcelBadgeText: {
    fontSize: 11,
    color: "#7a5f00",
    fontFamily: font.MonolithRegular,
  },
  offerBanner: {
    backgroundColor: "#FFFBE6",
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0E6D2",
  },
  chatAvatarContainer: {
    marginRight: 8,
    justifyContent: "flex-end",
    marginBottom: 0,
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
  },
  chatAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFCC00",
    justifyContent: "center",
    alignItems: "center",
  },
  chatAvatarInitial: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#000",
  },
});

export default ChatScreen;