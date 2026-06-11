import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import { SafeAreaView } from "react-native-safe-area-context";
import font from "../../../theme/font";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { base_url } from "../../../Api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import strings from "../../../localization/Localization";
import imageIndex from "../../../assets/imageIndex";
import SearchBar from "../../../compoent/SearchBar";
import NewOrderNotificationModal from "../../../compoent/NewOrderNotificationModal";
import OfferAcceptedModal from "../../../compoent/OfferAcceptedModal";
type LastMessage = {
  text: string;
  senderRole: "user" | "delivery";
  time: string;
} | null;

type ParcelOwner = {
  id: number;
  name: string;
  phone: string;
  image: string;
  email: string;
};

type Parcel = {
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string | null;
  pickupTime: string | null;
  deliveryPrice: string | null;
};

type ChatItem = {
  parcelId: number;
  trackingId: string;
  deliveryStatus: string;
  offerId: number;
  offerStatus: string;
  offerAmount: string;
  totalMessages: number;
  unreadCount: number;
  lastMessage: LastMessage;
  parcelOwner: ParcelOwner;
  parcel: Parcel;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function capitalize(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF7ED", text: "#EA580C" },
  assigned: { bg: "#F0FDF4", text: "#16A34A" },
  accepted: { bg: "#EFF6FF", text: "#2563EB" },
  default: { bg: "#F8FAFC", text: "#64748B" },
};



const UnreadBadge = ({ count }: { count: number }) => {
  if (!count || count === 0) return null;
  return (
    <View style={styles.unreadBadge}>
      <Text style={styles.unreadBadgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
};


export default function InboxDeliver() {
  const navigation = useNavigation<any>();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fetchChats = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem("token");
      const url = `${base_url}/chat/history`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        setError(strings.SessionExpired);
        return;
      }
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const json = await response.json();
      setChats(Array.isArray(json?.chats) ? json.chats : []);
    } catch (err: any) {
      setError(strings.FailedLoadChats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // ── Filter Chats ────────────────────────────────────────────────────────────

  const filteredChats = query.trim()
    ? chats.filter(
      (c) =>
        c.parcelOwner?.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.trackingId?.toLowerCase().includes(query.toLowerCase()) ||
        c.lastMessage?.text?.toLowerCase().includes(query.toLowerCase())
    )
    : chats;

  const openChat = (item: ChatItem, chatName: string) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.parcelId === item.parcelId ? { ...chat, unreadCount: 0 } : chat,
      ),
    );
    navigation.navigate(ScreenNameEnum.ChatScreen, {
      item: { ...item, unreadCount: 0 },
      chatName,
    });
  };

  // ── Render Item ─────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: ChatItem }) => {
    const avatarUri = item.parcelOwner?.image;
    const displayName = item.parcelOwner?.name ?? strings.Unknown;
    const lastMsgText = item.lastMessage?.text ?? strings.NoMessagesYet;
    const msgTime = formatTime(item.lastMessage?.time);
    const hasUnread = (item.unreadCount ?? 0) > 0;
    console.log("item.deliveryStatus", item)
    return (
      <TouchableOpacity
        style={[styles.chatRow]}
        activeOpacity={0.75}
        onPress={() => openChat(item, displayName)}
      >
        {/* Left Side: Avatar */}
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <Image source={imageIndex.prfile} style={styles.avatar} />
          )}

        </View>

        {/* Right Side: Info Column */}
        <View style={styles.infoCol}>
          {/* Header Row: Name & Time */}
          <View style={styles.cardHeaderRow}>
            <Text
              style={[styles.driverName, hasUnread && styles.driverNameUnread]}
              numberOfLines={1}
            >
              {displayName}
            </Text>

          </View>

          {/* Footer Row: Last Message & Unread Badge */}
          <View style={styles.messageFooterRow}>
            <Text
              style={[styles.lastMessageText, hasUnread && styles.lastMessageTextUnread]}
              numberOfLines={1}
            >
              {lastMsgText}
            </Text>
            <UnreadBadge count={item.unreadCount} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render Empty State ──────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationBg} />
        <Image source={imageIndex.bubleYeelow} style={styles.emptyIcon} />
      </View>
      <Text style={styles.emptyTitle}>{strings.NoChatsYet || "No Chats Yet"}</Text>
      <Text style={styles.emptySubtitle}>
        {strings.NoConversationsSubtitle || "Your active conversations and delivery updates will show up here."}
      </Text>
    </View>
  );

  // ── Render Main Layout ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <NewOrderNotificationModal />
      <OfferAcceptedModal />
      {/* Screen Title & Subheader */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{strings.Inbox || "Messages"}</Text>

      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#FFCC00" />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => String(item.parcelId)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredChats.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={
            <SearchBar
              placeholder={strings.SearchInboxPlaceholder || "Search"}
              value={query}
              onChangeText={setQuery}
              containerStyle={styles.searchBox}
            />
          }
          ListEmptyComponent={renderEmptyState()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchChats(true)}
              colors={["#FFCC00"]}
              tintColor="#FFCC00"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Premium light-slate background to let white cards pop
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // Clear white search box
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
    marginLeft: 10,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Safe padding for bottom navigation
  },
  emptyListContent: {
    flexGrow: 1,
  },
  chatRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF", // Premium solid white card
    borderRadius: 11,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",

  },
  chatRowUnread: {
    borderColor: "#FEF08A", // soft gold/yellow border
    backgroundColor: "#FFFDF5", // soft warm tint
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 72,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarFallback: {
    backgroundColor: "#FFCC00",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  infoCol: {
    flex: 1,
    marginLeft: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  driverName: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
    flex: 1,
  },
  driverNameUnread: {
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  timeText: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#94A3B8",
    marginLeft: 10,
  },
  timeTextUnread: {
    fontFamily: font.MonolithRegular,
    color: "#FFCC00",
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  trackingIdPill: {
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  trackingIdText: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
  },
  messageFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  lastMessageText: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#FFCC00",
    flex: 1,
  },
  lastMessageTextUnread: {
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  unreadBadge: {
    backgroundColor: "#FFCC00",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#0F172A",
    fontSize: 10,
    fontFamily: font.MonolithRegular,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  illustrationWrap: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  illustrationBg: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFCC00",
    opacity: 0.08,
  },
  emptyIcon: {
    height: 80,
    width: 80,
    resizeMode: "contain",
  },
  emptyTitle: {
    fontSize: 20,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginBottom: 8,
    textAlign: "center",

  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    textAlign: "center",
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    textAlign: "center",
  },
});
