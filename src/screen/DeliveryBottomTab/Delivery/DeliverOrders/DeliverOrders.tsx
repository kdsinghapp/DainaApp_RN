import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import StatusBarComponent from "../../../../compoent/StatusBarCompoent";
import imageIndex from "../../../../assets/imageIndex";
import ScreenNameEnum from "../../../../routes/screenName.enum";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { base_url } from "../../../../Api";
import LoadingModal from "../../../../utils/Loader";
import { styles } from "./style";
import { STATUS, STATUS_COLORS, STATUS_LABELS } from "../../../../utils/Constant";
import strings from "../../../../localization/Localization";
import { errorToast, successToast } from "../../../../utils/customToast";
import CounterOfferModal from "../../../../compoent/MakeCounterModal";

type OrderStatus = "Pending" | "Completed" | "Cancelled";
type Order = {
  id: string;
  name: string;
  phone: string;
  code: string; // e.g. HSW 4736 XK
  status: OrderStatus;
  pickup: string;
  drop: string;
  avatar?: string; // remote/avatar uri if you have
};

const TABS = ["Pending", "Completed", "Cancelled"] as const;

const STATUS_STYLES: Record<
  OrderStatus,
  { bg: string; text: string; label: string }
> = {
  Pending: { bg: "#FFF4E5", text: "#C26B00", label: "Pending" },
  Completed: { bg: "#EAF8EE", text: "#00CE9A", label: "Completed" },
  Cancelled: { bg: "#FDECEC", text: "#D32F2F", label: "Cancelled" },
};

const DeliveryHome = () => {
  const navigation = useNavigation<any>();
  const [ordersSeed, setordersSeed] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | number | null>(null);
  const [rejectingOfferId, setRejectingOfferId] = useState<string | number | null>(null);
  const [replyingOfferId, setReplyingOfferId] = useState<string | number | null>(null);
  const [counterReplyOffer, setCounterReplyOffer] = useState<any>(null);
  const pillX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pillX, {
      toValue: isOnline ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Pending");
  const filteredOrders = ordersSeed?.filter((item) => {
    const status = item?.parcel?.deliveryStatus?.toLowerCase();

    const COMPLETED_STATUSES = ["delivered", "completed"];
    const Cancelled_STATUSES = ["cancelled", "Cancelled"];

    if (activeTab === "Pending") {
      return (
        !COMPLETED_STATUSES.includes(status) &&
        !Cancelled_STATUSES.includes(status)
      );
    }

    if (activeTab === "Completed") {
      return COMPLETED_STATUSES.includes(status);
    }

    if (activeTab === "Cancelled") {
      return Cancelled_STATUSES.includes(status);
    }

    return false;
  });

  // list enter animation on tab change
  const listSlide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    listSlide.setValue(0);
    Animated.timing(listSlide, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [activeTab]);
  const translateX = listSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  const fade = listSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });
  useFocusEffect(
    useCallback(() => {
      fetchAvailableRequests();
    }, []),
  );
  const fetchAvailableRequests = async () => {
    setisLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        return;
      }
      const response = await axios.get(`${base_url}/delivery/my-offers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (response?.data?.status == 1) {
        console.log(response?.data?.offers, "data in order page");
        setisLoading(false);
        // console.log(response?.data, "data in order page");
        setordersSeed(response?.data?.offers);
      } else {
        setisLoading(false);
      }
    } catch (error: any) {
      setisLoading(false);

      console.error(
        "Error fetching available requests:",
        error?.response?.data || error?.message,
      );
    } finally {
      setisLoading(false);
    }
  };

  const acceptOffer = async (item: any) => {
    const offerId = item?.offerId ?? item?.id;
    if (!offerId || acceptingOfferId || rejectingOfferId || replyingOfferId) return;

    setAcceptingOfferId(offerId);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        errorToast("Token not found");
        return;
      }

      const response = await fetch(`${base_url}/delivery/offers/${offerId}/accept-counter`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (response.ok && (result?.status == 1 || result?.success === true)) {
        successToast(result?.message || strings.OfferAcceptedSuccess || "Offer accepted successfully");
        await fetchAvailableRequests();
      } else {
        errorToast(result?.message || strings.OfferAcceptFailed || "Failed to accept offer");
      }
    } catch (error) {
      console.error("Accept offer error:", error);
      errorToast(strings.SomethingWentWrong || "Something went wrong");
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const rejectOffer = async (item: any) => {
    const offerId = item?.offerId ?? item?.id;
    if (!offerId || acceptingOfferId || rejectingOfferId || replyingOfferId) return;

    setRejectingOfferId(offerId);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        errorToast("Token not found");
        return;
      }

      const response = await fetch(`${base_url}/delivery/offers/${offerId}/reject-counter`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (response.ok && (result?.status == 1 || result?.success === true)) {
        successToast(result?.message || "Counter offer cancelled");
        await fetchAvailableRequests();
      } else {
        errorToast(result?.message || "Failed to cancel offer");
      }
    } catch (error) {
      console.error("Reject offer error:", error);
      errorToast(strings.SomethingWentWrong || "Something went wrong");
    } finally {
      setRejectingOfferId(null);
    }
  };

  const sendCounterReply = async (item: any, amount: number, message?: string) => {
    const offerId = item?.offerId ?? item?.id;
    if (!offerId || acceptingOfferId || rejectingOfferId || replyingOfferId) return;

    setReplyingOfferId(offerId);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        errorToast("Token not found");
        return;
      }

      const body = new URLSearchParams();
      body.append("amount", String(amount));
      if (message?.trim()) {
        body.append("message", message.trim());
      }

      const response = await fetch(`${base_url}/delivery/offers/${offerId}/counter-reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: body.toString(),
      });

      const result = await response.json();
      if (response.ok && (result?.status == 1 || result?.success === true)) {
        successToast(result?.message || strings.CounterOfferSent || "Counter reply sent successfully");
        setCounterReplyOffer(null);
        await fetchAvailableRequests();
      } else {
        errorToast(result?.message || strings.CounterOfferFailed || "Failed to send counter reply");
      }
    } catch (error) {
      console.error("Counter reply error:", error);
      errorToast(strings.SomethingWentWrong || "Something went wrong");
    } finally {
      setReplyingOfferId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => {

    const st = item?.parcel?.deliveryStatus;
    const statusKey = item?.parcel?.deliveryStatus;
    const statusLabel = STATUS_LABELS[statusKey] || strings?.Unknown;
    const statusColor = STATUS_COLORS[statusKey] || "black";
    const offerStatus = String(item?.offerStatus ?? item?.status ?? "").trim();
    const offerAmount = item?.counterAmount ?? item?.offerAmount;
    const offerId = item?.offerId ?? item?.id;
    const showAcceptOfferButton = Boolean(
      offerAmount &&
      offerId &&
      (!offerStatus || offerStatus === "counter_offered")
    );
    const isAcceptingThisOffer = acceptingOfferId === offerId;
    const isRejectingThisOffer = rejectingOfferId === offerId;
    const isReplyingThisOffer = replyingOfferId === offerId;
    const isProcessingThisOffer = isAcceptingThisOffer || isRejectingThisOffer || isReplyingThisOffer;
    const offerAmountText = offerAmount != null ? `₮ ${offerAmount}` : "";
    const getTranslucentColor = (hex: string) => {
      if (!hex || hex === "black") return "rgba(255, 149, 0, 0.08)";
      if (hex.startsWith("#")) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.08)`;
      }
      return hex;
    };
    const statusBg = getTranslucentColor(statusColor);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          if (offerStatus === "counter_offered") {
            return;
          }

          if (st === STATUS.PENDING) {
            navigation.navigate(ScreenNameEnum.ParcelDetails, {
              item: { ...item, ...item?.parcel }
            });
          }
          else if ([
            STATUS.ASSIGNED,
            STATUS.GOING_TO_PICKUP,
            STATUS.PICKED_UP,
            STATUS.ON_THE_WAY,
            STATUS.ARRIVING
          ].includes(st as any)) {
            navigation.navigate(ScreenNameEnum.TripMap, {
              item: { ...item, ...item?.parcel }
            });
          }
        }}
      >

        {showAcceptOfferButton && (
          <View style={styles.offerBox}>
            <View style={styles.offerAccent} />
            <View style={styles.offerInfo}>
              <View style={styles.offerHeaderRow}>
                <Text style={styles.offerEyebrow}>{strings.CounterOfferReceived || "Counter Offer Received"}</Text>
                <Text style={styles.offerAmount}>{offerAmountText}</Text>
              </View>
              <Text style={styles.offerTitle}>{strings.UserOfferedNewPrice}</Text>
              <View style={styles.offerActionsRow}>

                <TouchableOpacity
                  style={[styles.acceptOfferBtn, isProcessingThisOffer && styles.acceptOfferBtnDisabled]}
                  activeOpacity={0.85}
                  disabled={isProcessingThisOffer}
                  onPress={(event) => {
                    event.stopPropagation();
                    acceptOffer(item);
                  }}
                >
                  <Text style={styles.acceptOfferText}>
                    {isAcceptingThisOffer ? strings.Processing : strings.Accept}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelOfferBtn, isProcessingThisOffer && styles.acceptOfferBtnDisabled]}
                  activeOpacity={0.85}
                  disabled={isProcessingThisOffer}
                  onPress={(event) => {
                    event.stopPropagation();
                    rejectOffer(item);
                  }}
                >
                  <Text style={styles.cancelOfferText}>
                    {isRejectingThisOffer ? strings.Processing : strings.Cancel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.replyOfferBtn, isProcessingThisOffer && styles.acceptOfferBtnDisabled]}
                  activeOpacity={0.85}
                  disabled={isProcessingThisOffer}
                  onPress={(event) => {
                    event.stopPropagation();
                    setCounterReplyOffer(item);
                  }}
                >
                  <Text style={styles.replyOfferText}>
                    {isReplyingThisOffer ? strings.Reply : strings.Reply}
                  </Text>
                </TouchableOpacity>

              </View>

            </View>


          </View>
        )}

        <View style={styles.cardTop}>
          <Image
            source={
              item?.user?.image
                ? { uri: item?.user?.image }
                : imageIndex?.dpuser || { uri: "https://i.pravatar.cc/100" }
            }
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item?.user?.firstName}
            </Text>
            <Text style={styles.phone} numberOfLines={1}>
              {item?.user?.phone}
            </Text>
          </View>

          <View style={[styles.statusChip, { backgroundColor: statusBg, borderColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1).toLowerCase()}

            </Text>
          </View>
        </View>


        {/* Pickup / Drop block */}
        <View style={styles.splitter} />

        <View style={styles.stopsRow}>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineDotStart} />
            <View style={styles.timelineLine} />
            <View style={styles.timelineDotEnd} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.stopLabel}>{strings.PickupLocation}</Text>
            <Text style={styles.stopValue}  >
              {item?.parcel?.pickupLocation}
            </Text>

            <Text style={[styles.stopLabel, { marginTop: 12 }]}>
              {strings.DropLocation}
            </Text>
            <Text style={styles.stopValue} >
              {item?.parcel?.dropLocation}
            </Text>
          </View>
        </View>


      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CounterOfferModal
        visible={!!counterReplyOffer}
        defaultValue={counterReplyOffer?.counterAmount ?? counterReplyOffer?.offerAmount ?? ""}
        currency="₮"
        min={1}
        max={50000}
        showMessage
        title="Counter Reply"
        onCancel={() => setCounterReplyOffer(null)}
        loading={!!replyingOfferId}
        onSubmit={(amount: number, message?: string) => {
          if (counterReplyOffer) {
            sendCounterReply(counterReplyOffer, amount, message);
          }
        }}
      />

      {/* <View style={styles.ordersHeader}>
        <Text style={styles.sectionTitle}>Orders</Text>
        <Image
          source={imageIndex?.Filter || { uri: "" }}
          style={{ height: 22, width: 22 }}
          resizeMode="contain"
        />
      </View> */}

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          const label = tab === "Completed" ? strings.Complete : tab === "Cancelled" ? strings.Canceled : strings.Pending || tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <Animated.View
        style={{ flex: 1, transform: [{ translateX }], opacity: fade }}
      >
        <FlatList
          data={filteredOrders}
          extraData={filteredOrders}
          // data={ordersSeed}
          style={{
            marginTop: 10,
            marginBottom: 8
          }}
          keyExtractor={(i) => String(i?.id ?? i?.offerId ?? i?.parcel?.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.illustrationWrap}>
                <View style={styles.illustrationBg} />
                <Image source={imageIndex?.ordePracle} style={styles.emptyIcon} />
              </View>
              <Text style={styles.emptyTitle}>{strings.NoOrder}</Text>
              <Text style={styles.emptySubtitle}>{strings.NoOrdersFound1}</Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default DeliveryHome;
