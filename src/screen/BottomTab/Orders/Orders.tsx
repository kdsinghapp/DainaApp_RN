import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import imageIndex from "../../../assets/imageIndex";
import font from "../../../theme/font";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import { useNavigation } from "@react-navigation/native";
import ScreenNameEnum from "../../../routes/screenName.enum";
import LoadingModal from "../../../utils/Loader";
import { STATUS, STATUS_COLORS, STATUS_LABELS } from "../../../utils/Constant";
import useOrders from "./useOrders";
import strings from "../../../localization/Localization";

type OrderStatus = "packaged" | "shipped" | "inTransit" | "delivered";

type Order = {
  id: string;
  trackingId: string;
  fromCity?: string;
  toCity?: string;
  startDate?: string;
  endDate?: string;
  status?: OrderStatus;
  deliveryStatus: OrderStatus;
  pickupDate?: string;
  pickupTime?: string;
  pickupLocation?: string;
  dropLocation?: string;
  [key: string]: any;
};

// const STATUS_STEPS: OrderStatus[] = [
//   "packaged",
//   "shipped",
//   "inTransit",
//   "delivered",
// ];
// Full progress order: all statuses so Pending tab shows correct step for every order
const STATUS_STEPS = [
  STATUS.PENDING,
  STATUS.ASSIGNED,
  STATUS.GOING_TO_PICKUP,
  STATUS.PICKED_UP,
  STATUS.ON_THE_WAY,
  STATUS.ARRIVING,
  STATUS.DELIVERED,
];

const norm = (s: string | undefined) => (s || "").toLowerCase().trim();

const areOrderCardPropsEqual = (prev: any, next: any) => prev.order.id === next.order.id && prev.order.deliveryStatus === next.order.deliveryStatus;

const OrderCard = React.memo(({ order }: { order: Order }) => {
  const nava = useNavigation();
  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        const s = norm(order.deliveryStatus);
        if (s === STATUS.CANCELLED) return;
        (nava as any).navigate(ScreenNameEnum.ViewDetails, { item: order });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.trackingGroup}>
          <Text style={styles.trackingLabel}>{strings.TrackingID}</Text>
          <Text style={styles.trackingId}>#{order.trackingId}</Text>
        </View>
        <StatusPill status={order.deliveryStatus} />
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeLineColumn}>
          <View style={styles.routeDotPickup} />
          <View style={styles.routeLine} />
          <View style={styles.routeDotDrop} />
        </View>

        <View style={styles.routeDetailsColumn}>
          <View style={styles.routeLocationRow}>
            <View style={styles.addressHeaderRow}>
              <Text style={styles.locationLabel}>{strings.From || "From"}</Text>
              {order.pickupDate ? (
                <Text style={styles.routeDateText}>{formatDate(order.pickupDate)}</Text>
              ) : null}
            </View>
            <Text style={styles.addressText}>{order?.pickupLocation || "—"}</Text>
          </View>

          <View style={{ height: 16 }} />

          <View style={styles.routeLocationRow}>
            <View style={styles.addressHeaderRow}>
              <Text style={styles.locationLabel}>{strings.To || "To"}</Text>
              {order.pickupTime ? (
                <Text style={styles.routeDateText}>{order.pickupTime}</Text>
              ) : null}
            </View>
            <Text style={styles.addressText}>{order?.dropLocation || "—"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <ProgressTrack status={order.deliveryStatus} />

      <View style={styles.footerRow}>
        <Text style={styles.dateLabel}>
          {order.startDate ? `${strings.Today || "Date"}: ${formatDate(order.startDate)}` : ""}
        </Text>
        <Pressable onPress={() => (nava as any).navigate(ScreenNameEnum.ViewDetails, { item: order })}>
          <Text style={styles.viewDetails}>
            {norm(order.deliveryStatus) === STATUS.DELIVERED || norm(order.deliveryStatus) === STATUS.COMPLETED
              ? strings.WriteAReview
              : strings.ViewDetails}
          </Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );
}, areOrderCardPropsEqual);

export default function OrdersScreen() {
  const {
    isLoading,
    orderData,
    getParceldetailsApi
  } = useOrders()
  const [tab, setTab] = useState<"pending" | "complete" | "cancelled">("pending");
  const nava = useNavigation()
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getParceldetailsApi();
    }, [])
  );

  // Pending = all except Complete & Cancelled. Complete = delivered/completed. Cancelled = cancelled only.
  const data = useMemo(() => {
    return orderData.filter((o: Order) => {
      const status = norm(o.deliveryStatus);
      const isDelivered =
        status === STATUS.DELIVERED || status === STATUS.COMPLETED;
      const isCancelled = status === STATUS.CANCELLED;

      if (tab === "complete") return isDelivered;
      if (tab === "cancelled") return isCancelled;
      return !isDelivered && !isCancelled;
    });
  }, [tab, orderData]);


  // 2. Pull to Refresh Logic
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (getParceldetailsApi) {
        await getParceldetailsApi();
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [getParceldetailsApi]);

  const renderItem = useCallback(({ item }: any) => <OrderCard order={item} />, []);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyWrap}>
      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationBg} />
        <Image source={imageIndex.ordePracle} style={styles.emptyIcon} />
      </View>
      <Text style={styles.emptyTitle}>{strings.NoOrder}</Text>
      <Text style={styles.emptySubtitle}>{strings.NoOrdersFound1}</Text>
    </View>
  ), []);

  const ItemSeparatorComponent = useCallback(() => <View style={{ height: 10 }} />, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBarComponent />
      <View style={styles.container}>
        <Text style={styles.title}>{strings.Orders}</Text>

        {/* Modern Segmented Tab Bar */}
        <View style={styles.tabsWrap}>
          <SegmentedTab
            label={strings.Pending}
            active={tab === "pending"}
            onPress={() => setTab("pending")}
          />
          <SegmentedTab
            label={strings.Complete}
            active={tab === "complete"}
            onPress={() => setTab("complete")}
          />
          <SegmentedTab
            label={strings.Canceled}
            active={tab === "cancelled"}
            onPress={() => setTab("cancelled")}
          />
        </View>

        <FlatList
          contentContainerStyle={{ paddingBottom: 120, marginTop: 4 }}
          data={data}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparatorComponent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={11}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FFCC00"]}
              tintColor="#FFCC00"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const SegmentedTab = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.tab, active && styles.tabActive]}
  >
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {label}
    </Text>
  </Pressable>
);

const StatusPill = ({ status }: { status: OrderStatus }) => {
  const s = norm(status);
  const statusLabel = STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? status ?? strings.StatusPending;
  const statusColor = STATUS_COLORS[s as keyof typeof STATUS_COLORS] || '#64748B';

  let badgeBg = '#F1F5F9';
  if (s === STATUS.DELIVERED || s === STATUS.COMPLETED) {
    badgeBg = '#ECFDF5'; // Soft green tint
  } else if (s === STATUS.CANCELLED) {
    badgeBg = '#FEF2F2'; // Soft red tint
  } else if (s === STATUS.PENDING) {
    badgeBg = '#FFFBEB'; // Soft yellow tint
  } else {
    badgeBg = '#EFF6FF'; // Soft blue tint
  }

  return (
    <View style={[styles.pill, { backgroundColor: badgeBg }]}>
      <Text style={[styles.pillText, { color: statusColor }]}>{statusLabel}</Text>
    </View>
  );
};

const ProgressTrack = ({ status }: { status: string }) => {
  const s = norm(status);
  const currentIdx = STATUS_STEPS.indexOf(s);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  const progressPercent = (activeIdx / (STATUS_STEPS.length - 1)) * 100;

  const completedCount = activeIdx + 1;
  const totalSteps = STATUS_STEPS.length;
  const statusLabel = STATUS_LABELS[s as keyof typeof STATUS_LABELS] || 'Unknown';

  return (
    <View style={styles.trackContainer}>

      <View style={styles.trackBase}>
        {/* Background Grey Line */}
        <View style={styles.trackLine} />

        {/* Active Yellow Line */}
        <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />

        {/* Milestone dots */}
        {STATUS_STEPS.map((step, i) => {
          const isActive = i <= activeIdx;
          return (
            <View
              key={step}
              style={[
                styles.dot,
                isActive ? styles.dotActive : styles.dotInactive,
                { left: `${(i / (STATUS_STEPS.length - 1)) * 100}%` },
              ]}
            >
              {isActive && <View style={styles.dotCore} />}
            </View>
          );
        })}
      </View>
    </View>
  );
};

/* -------------------- Styles -------------------- */

const YELLOW = "#FFCC00";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BG = "#F8FAFC"; // Sleek modern light gray

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: {
    fontSize: 28,
    fontFamily: font.MonolithRegular,
    color: TEXT,
    marginBottom: 10,
    letterSpacing: -0.5,
  },

  tabsWrap: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "center",
    marginTop: 12
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#FFCC00",
    height: 40,
  },
  tabText: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: "black",
  },
  tabTextActive: {
    color: "white",
    fontSize: 14,
    fontFamily: font.MonolithRegular,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,

    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },

      android: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  trackingGroup: {
    flexDirection: "column",
  },
  trackingLabel: {
    color: MUTED,
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    letterSpacing: 0.5,
  },
  trackingId: {
    color: TEXT,
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    marginTop: 2,
  },

  // Route timeline styles
  routeContainer: {
    flexDirection: "row",
    marginVertical: 4,
  },
  routeLineColumn: {
    width: 24,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  routeDotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981", // Green dot for pickup
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  routeDotDrop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444", // Red dot for drop
  },
  routeDetailsColumn: {
    flex: 1,
    marginLeft: 8,
  },
  routeLocationRow: {
    flexDirection: "column",
  },
  addressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routeDateText: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    color: MUTED,
  },
  addressText: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: TEXT,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },

  // Stepper tracker styles
  trackContainer: {
    marginBottom: 8,
  },
  trackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepStatusText: {
    color: "#FFCC00",
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  stepCompleteText: {
    color: MUTED,
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  trackBase: {
    height: 16,
    justifyContent: "center",
    marginVertical: 4,
  },
  trackLine: {
    position: "absolute",
    height: 3,
    backgroundColor: "#E2E8F0",
    left: 4,
    right: 4,
    borderRadius: 2,
  },
  trackFill: {
    position: "absolute",
    height: 3,
    backgroundColor: YELLOW,
    left: 4,
    borderRadius: 2,
  },
  dot: {
    position: "absolute",
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    top: 1,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  dotInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  dotCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  dateLabel: {
    fontSize: 12,
    color: MUTED,
    fontFamily: font.MonolithRegular,
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontFamily: font.MonolithRegular,
    fontSize: 11,
  },
  viewDetails: {
    color: YELLOW,
    fontFamily: font.MonolithRegular,
    fontSize: 14,
  },

  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  illustrationWrap: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: 'relative',
  },
  illustrationBg: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: YELLOW,
    opacity: 0.1,
  },
  emptyIcon: {
    height: 120,
    width: 120,
    resizeMode: 'contain',
  },
  emptyTitle: {
    fontSize: 22,
    color: TEXT,
    fontFamily: font.MonolithRegular,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: MUTED,
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    lineHeight: 22,
  },
});
