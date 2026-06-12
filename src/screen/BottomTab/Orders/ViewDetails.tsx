import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  Dimensions,
  Platform
} from "react-native";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import font from "../../../theme/font";
import imageIndex from "../../../assets/imageIndex";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { GetApi, RateDeliveryApi } from "../../../Api/apiRequest";
import { STATUS, STATUS_LABELS, STATUS_ICONS, STATUS_COLORS } from "../../../utils/Constant";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { successToast } from "../../../utils/customToast";
import RatingModal from "../../../compoent/RatingModal";
import { WebSocket_Url } from "../../../Api";
import strings from "../../../localization/Localization";
import DriverVerificationModal from "../../../compoent/DriverVerificationModal";

type Order = {
  id: string;
  trackingId: string;
  fromCity: string;
  toCity: string;
  startDate: string;
  endDate: string;
  status: string;
};

type ParcelOffer = {
  id?: number | string;
  offerId?: number | string;
  carrierName?: string;
  offerAmount?: string | number;
  message?: string;
  status?: string;
  counterAmount?: string | number;
  counterMessage?: string;
  deliveryUser?: {
    name?: string;
    phone?: string;
  };
};

const STATUS_STEPS = [
  STATUS.PENDING,
  STATUS.ASSIGNED,
  STATUS.GOING_TO_PICKUP,
  STATUS.PICKED_UP,
  STATUS.ON_THE_WAY,
  STATUS.DELIVERED,
];

const norm = (s: string | undefined) => (s || "").toLowerCase().trim();
const titleize = (value?: string) =>
  (value || "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());


export default function ViewDetails() {
  const nav = useNavigation()
  const route: any = useRoute();
  const { item } = route?.params || {};
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const ratingSubmittedRef = useRef(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [, setLoading] = useState(false);
  const [parcel, setParcel] = useState(item ?? null);
  const [statusKey, setStatusKey] = useState<string | null>(() => item?.deliveryStatus ?? null);
  const isMounted = useRef(true);
  const socketRef = useRef<WebSocket | null>(null);
  const getDetailRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const closeRatingModal = useCallback(() => {
    setShowRatingModal(false);
  }, [nav]);
  const handleRatingSubmit = useCallback(
    async (rating: number, comment: string) => {
      if (rating < 1) return;
      const parcelId = parcel?.id ?? item?.id;
      if (!parcelId) return;

      setRatingSubmitting(true);
      try {
        const res = await RateDeliveryApi({
          parcelId: Number(parcelId),
          rating: rating,
          review: comment
        });

        if (res?.status == 1 || res?.status == "1") {
          ratingSubmittedRef.current = true;
          setShowRatingModal(false);
          nav.goBack();
        }
      } catch (error) {
        console.error("Rating submission error:", error);
      } finally {
        setRatingSubmitting(false);
      }
    },
    [nav, parcel?.id, item?.id]
  );

  const getDetail = async () => {
    const parcelId = parcel?.id ?? item?.id;
    if (!parcelId) return;
    const param = { url: `/parcel-details/${parcelId}` };
    const res = await GetApi(param, setLoading);
    if (isMounted.current && res?.status === 1 && res?.parcel) {
      setParcel({ ...res.parcel });
    }
  };
  getDetailRef.current = getDetail;

  useFocusEffect(
    useCallback(() => {
      getDetailRef.current?.();
      return () => { };
    }, []),
  );


  useEffect(() => {
    const key = parcel?.deliveryStatus ?? item?.deliveryStatus ?? null;
    setStatusKey(key);
  }, [parcel?.deliveryStatus, item?.deliveryStatus]);

  useEffect(() => {
    isMounted.current = true;
    getDetail();
    return () => {
      isMounted.current = false;
    };
  }, [item?.id]);
  useEffect(() => {
    let ws: WebSocket | null = null;
    const connectSocket = (token: string) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const wsUrl = `${WebSocket_Url}/user?token=${encodeURIComponent(token)}`;
          ws = new WebSocket(wsUrl);
          let resolved = false;
          ws.onopen = () => {
            resolved = true;
            socketRef.current = ws;
            try {
              ws?.send(JSON.stringify({ type: "ping" }));
            } catch (_) { }
            resolve();
          };
          ws.onmessage = async (event: { data: string | Blob | ArrayBuffer }) => {
            let raw: string;
            const d = event.data;
            if (typeof d === "string") raw = d;
            else if (d && typeof (d as Blob).text === "function") raw = await (d as Blob).text();
            else if (d instanceof ArrayBuffer) raw = new TextDecoder().decode(d);
            else raw = String(d);
            try {
              const data = JSON.parse(raw);
              if (data?.type === "parcel_status_update") {
                successToast(data?.message ?? "Parcel updated");
                getDetailRef.current?.();
              }
              if (data?.type === "order_update" || data?.refreshOrders) {
                getDetailRef.current?.();
              }
            } catch (_) { }
          };
          ws.onerror = (e: unknown) => {
            const msg = e && typeof e === "object" && "message" in e ? String((e as { message?: string }).message) : "WebSocket error";
            if (!resolved) reject(new Error(msg));
          };
          ws.onclose = (event: { reason?: string }) => {
            socketRef.current = null;
            if (!resolved) reject(new Error(event.reason ?? "Connection closed"));
          };
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    };
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        await connectSocket(token);
      } catch (_) { }
    };
    init();
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const source = parcel ?? item ?? {};
  const order: Order = {
    id: source?.id ?? "1",
    trackingId: source?.trackingId ?? "—",
    fromCity: source?.pickupLocation ?? "Unknown",
    toCity: source?.dropLocation ?? "Unknown",
    startDate: formatDate(source?.pickupDate),
    endDate: formatDate(source?.dropDate ?? new Date().toISOString()),
    status: statusKey ?? source?.deliveryStatus ?? STATUS.PENDING,
  };

  const statusNorm = norm(order.status);
  const currentIdx = STATUS_STEPS.indexOf(statusNorm);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;
  const progress =
    currentIdx >= 0 ? currentIdx / (STATUS_STEPS.length - 1) : 0;
  const statusLabel = STATUS_LABELS[statusNorm] || "Unknown";
  const statusColor = STATUS_COLORS[statusNorm] || "black";
  const offers: ParcelOffer[] = Array.isArray(source?.offers) ? source.offers : [];
  const hasCounterOffered = offers.some(offer => norm(offer?.status) === "counter_offered");
  const displayStatusLabel = hasCounterOffered ? titleize("counter_offered") : statusLabel;
  const displayStatusColor = hasCounterOffered ? YELLOW : statusColor;

  const navigation = useNavigation()
  const driver = parcel?.assignedDriver ?? item?.assignedDriver ?? parcel?.driver ?? item?.driver;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBarComponent />
      <CustomHeader label={strings.Back} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, marginTop: 11 }}
        showsVerticalScrollIndicator={false}
      >
        {offers.length > 0 && (
          <>
            <View style={styles.offersSectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{strings.OffersForYourAd || "Offers For Your Ad"}</Text>
                <Text style={styles.offersSectionSubtitle}>
                  {offers.length === 1
                    ? strings.CarrierResponseSingular || "1 driver response"
                    : strings.formatString
                      ? String(strings.formatString(strings.CarrierResponsePlural || "{0} driver responses", offers.length))
                      : `${offers.length} driver responses`}
                </Text>
              </View>
              <Text style={styles.offersCountText}>{offers.length}</Text>
            </View>
            <View style={styles.offersWrap}>
              {offers.map((offer, index) => {
                const carrierName = offer?.carrierName || offer?.deliveryUser?.name || strings.Unknown || "Unknown";
                const offerAmount = offer?.offerAmount ?? "N/A";
                const hasCounter = offer?.counterAmount || offer?.counterMessage;
                const offerId = offer?.id ?? offer?.offerId;
                const isCounterOffered = norm(offer?.status) === "counter_offered";
                const carrierInitial = carrierName.charAt(0).toUpperCase();

                return (
                  <TouchableOpacity
                    key={String(offerId ?? index)}
                    activeOpacity={0.8}
                    style={[styles.offerCard, isCounterOffered && styles.offerCardLocked]}
                    onPress={() => {
                      if (isCounterOffered) return;

                      (navigation as any).navigate(ScreenNameEnum.OfferOR, {
                        id: { parcel: parcel ?? source }
                      })
                    }}
                    disabled={isCounterOffered}
                  >
                    <View style={styles.offerTopRow}>
                      <View style={styles.offerCarrierRow}>
                        <View style={[styles.offerAvatar, isCounterOffered && styles.counterOfferAvatar]}>
                          <Text style={styles.offerAvatarText}>{carrierInitial}</Text>
                        </View>
                        <View style={styles.offerCarrierTextWrap}>
                          <Text style={styles.offerCarrier} numberOfLines={1}>{carrierName}</Text>
                          <Text style={styles.offerSubText}>
                            {isCounterOffered ? strings.DriverReplyPending || "Driver reply pending" : strings.OfferInformation || "Offer Information"}
                          </Text>
                        </View>
                      </View>
                      {!!offer?.status && (
                        <View style={[styles.offerStatusPill, isCounterOffered && styles.counterStatusPill]}>
                          <Text style={[styles.offerStatusText, isCounterOffered && styles.counterStatusText]}>
                            {isCounterOffered ? strings.PendingReply || "Pending Reply" : titleize(offer.status)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.offerAmountStack}>
                      <View style={styles.amountLine}>
                        <View style={[styles.priceIconWrap, styles.offerIconWrap]}>
                          <Icon name="cash-outline" size={16} color="#64748B" />
                        </View>
                        <View style={styles.amountTextColumn}>
                          <Text style={styles.offerLabel}>{strings.OfferPrice || "Offer Price"}</Text>
                        </View>
                        <Text style={styles.offerAmount}>{offerAmount}</Text>
                      </View>
                      {hasCounter && (
                        <View style={[styles.amountLine, styles.counterAmountLine]}>
                          <View style={[styles.priceIconWrap, styles.counterIconWrap]}>
                            <Icon name="swap-horizontal" size={16} color="#8A6A00" />
                          </View>
                          <View style={styles.amountTextColumn}>
                            <Text style={styles.counterLabel}>{strings.CounterOfferLabel || "Counter Offer"}</Text>
                          </View>
                          <Text style={styles.counterAmount}>{offer?.counterAmount ?? "N/A"}</Text>
                        </View>
                      )}
                    </View>

                    {(!!offer?.message || !!offer?.counterMessage) && (
                      <View style={styles.messageBox}>
                        {!!offer?.message && (
                          <View style={styles.messageRow}>
                            <Text style={styles.messageLabel}>{strings.MessageLabel || "Message"}</Text>
                            <Text style={styles.offerMessage} numberOfLines={2}>{offer.message}</Text>
                          </View>
                        )}
                        {!!offer?.counterMessage && (
                          <View style={[styles.messageRow, !!offer?.message && styles.messageDivider]}>
                            <Text style={styles.messageLabel}>{strings.CounterOfferLabel || "Counter Offer"}</Text>
                            <Text style={styles.counterMessage} numberOfLines={2}>{offer.counterMessage}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {isCounterOffered ? (
                      <View style={styles.offerLockedFooter}>
                        <Icon name="time-outline" size={16} color="#8A6A00" />
                        <Text style={styles.offerLockedText}>
                          {strings.DriverNotRepliedToCounter || "The driver has not replied to your counter offer yet."}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.offerActionRow}>
                        <Text style={styles.offerActionText}>{strings.ViewOffer || "View Offer"}</Text>
                        <Icon name="chevron-forward" size={18} color="#111827" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {statusNorm === STATUS.PENDING && !hasCounterOffered && (
          <View style={styles.pendingActionCard}>
            <View style={styles.pendingCardBgDecoration} />
            <View style={styles.pendingHeader}>
              <View style={styles.pendingIconWrap}>
                <Icon name="time" size={24} color="#A38200" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>{strings.StatusPending || "Pending"}</Text>
                <Text style={styles.pendingSubtitle}>Waiting for driver offers</Text>
              </View>
            </View>
            <Text style={styles.pendingMessage}>
              {strings.PendingOfferMessage || "Your parcel is posted successfully. Drivers will send you offers soon."}
            </Text>
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity
                style={styles.pendingActionButton}
                activeOpacity={0.8}
                onPress={() => {
                  (navigation as any).navigate(ScreenNameEnum.OfferOR, {
                    id: { parcel: parcel }
                  })
                }}
              >
                <Text style={styles.pendingActionButtonText}>{strings.CheckOffer || "Check Offers"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Card */}
        <TouchableOpacity style={styles.card} activeOpacity={1}
          onPress={() => {
            // navigation.navigate(ScreenNameEnum.CourierTrackingScreen, {
            //   item: item
            // })
          }}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.muted}>{strings.TrackingID}</Text>
              <Text style={styles.bold}>{order.trackingId}</Text>
            </View>
            <View
              style={[
                styles.headerStatusPill,
                { backgroundColor: displayStatusColor },
              ]}
            >
              <Text style={styles.headerStatusText}>{displayStatusLabel}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>

            <View style={styles.trackBase}>
              <View style={styles.trackLine} />
              <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
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
                  />
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.row,
              (statusNorm === STATUS.DELIVERED || hasCounterOffered) && { opacity: 0.55 }
            ]}
            disabled={statusNorm === STATUS.DELIVERED || hasCounterOffered}
            onPress={() => {
              if (statusNorm === STATUS.DELIVERED || hasCounterOffered) return;

              if (statusNorm === STATUS.PENDING) {
                (navigation as any).navigate(ScreenNameEnum.OfferOR, {
                  id: { parcel: parcel },
                });
              } else {
                (navigation as any).navigate(ScreenNameEnum.CourierTrackingScreen, {
                  item: parcel,
                });
              }
            }}
          >
            <View style={styles.addressTimeline}>
              <View style={styles.addressItem}>
                <View style={styles.addressMarkerWrap}>
                  <View style={styles.fromDot} />
                  <View style={styles.addressConnectorLine} />
                </View>
                <View style={styles.addressContent}>
                  <View style={styles.addressMetaRow}>
                    <Text style={styles.routeLabel}>{strings.Pickup}</Text>
                    <Text style={styles.date}>{order.startDate}</Text>
                  </View>
                  <Text style={styles.city}>{order.fromCity || ""}</Text>
                </View>
              </View>

              <View style={styles.addressItem}>
                <View style={styles.addressMarkerWrap}>
                  <View style={styles.toDot} />
                </View>
                <View style={styles.addressContent}>
                  <View style={styles.addressMetaRow}>
                    <Text style={styles.routeLabel}>{strings.Drop}</Text>
                    <Text style={styles.date}>{order.endDate}</Text>
                  </View>
                  <Text style={styles.city}>{order.toCity || ""}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <RatingModal
            visible={showRatingModal}
            onClose={closeRatingModal}
            onSubmit={handleRatingSubmit}
            isSubmitting={ratingSubmitting}
          />
          {/* Footer */}
          <View style={styles.footerRow}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerInfoText}>{displayStatusLabel}</Text>
            </View>
            {statusNorm === STATUS.DELIVERED ? null : hasCounterOffered ? null : (

              <TouchableOpacity
                onPress={() => {
                  if (statusNorm === STATUS.PENDING) {
                    (navigation as any).navigate(ScreenNameEnum.OfferOR, {
                      id: { parcel: parcel }
                    })
                  } else {
                    (navigation as any).navigate(ScreenNameEnum.CourierTrackingScreen, {
                      item: parcel
                    })
                  }
                }}
                activeOpacity={0.5}
                style={styles.cardActionButton}
              >
                <Icon
                  name={statusNorm === STATUS.PENDING ? "pricetag-outline" : "navigate-outline"}
                  size={14}
                  color="#111827"
                  style={styles.actionButtonIcon}
                />
                <Text style={styles.viewDetails}>
                  {statusNorm === STATUS.PENDING ? strings.ViewOffer : strings.TrackDetail}</Text>
              </TouchableOpacity>
            )}


          </View>
        </TouchableOpacity>


        {driver && (
          <View style={{
            marginHorizontal: 20,
            marginTop: 15,
            marginBottom: 10,

            backgroundColor: CARD,
            padding: 8,
            borderRadius: 15,

            ...(Platform.OS === 'android' && {
              borderWidth: 0.8,
              borderColor: '#E5E7EB',
            }),




          }}>
            <View style={{
              justifyContent: "space-between",
              flexDirection: "row",
              alignItems: "center"
            }}>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
              }}>
                {driver?.image ? <Image source={{ uri: driver?.image }}
                  style={{
                    height: 60,
                    width: 60,
                    borderRadius: 50
                  }}
                /> :
                  <Image source={imageIndex.dpuser}
                    style={{
                      height: 55,
                      width: 55,
                    }}
                  />}

                <View style={{ marginLeft: 11 }}>
                  {driver?.name && <Text style={{
                    fontSize: 14,
                    color: "black",
                    fontFamily: font.MonolithRegular,
                  }}>{driver?.name}</Text>}
                  {driver?.email &&
                    <Text style={{
                      fontSize: 13,
                      color: "gray",
                      fontFamily: font.MonolithRegular
                    }}>{driver?.email}</Text>
                  }

                </View>
              </View>
              <View style={{
                flexDirection: "row",
                justifyContent: "center"
              }}>



                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(ScreenNameEnum.ChatScreen, {
                      item: item?.id,
                      chatName: driver?.name,
                    })
                  }
                >
                  <Image
                    source={imageIndex.messtrcker}
                    style={{
                      height: 33,
                      width: 33,
                      right: 12,
                    }}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const phone = driver?.phone;
                    if (phone) {
                      Linking.openURL(`tel:${phone}`);
                    }
                  }}
                >
                  <Image
                    source={imageIndex.Calls}
                    style={{
                      height: 33,
                      width: 33,
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <DriverVerificationModal
              visible={isDetailsExpanded}
              driver={driver}
              onClose={() => setIsDetailsExpanded(false)}
              onSelectImage={setSelectedImage}
            />
          </View>
        )}



        {/* Tracking Package – steps with icon + label */}
        <View style={styles.sectionTitleRow}>

          <Text style={styles.sectionTitle}>{strings.TrackingPackage}</Text>
        </View>
        <View style={styles.timelineWrap}>
          {STATUS_STEPS.map((step, i) => {
            const isDone = i <= activeIdx;
            const isLast = i === STATUS_STEPS.length - 1;
            const iconName = (STATUS_ICONS as Record<string, string>)[step] || "ellipse-outline";
            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepIconWrap, isDone ? styles.stepIconDone : styles.stepIconPending]}>
                    <Icon
                      name={isDone ? "checkmark-circle" : (iconName as any)}
                      size={24}
                      color={isDone ? "#FFF" : "#9CA3AF"}
                    />
                  </View>
                  {!isLast && (
                    <View style={[styles.stepConnector, isDone ? styles.stepConnectorDone : styles.stepConnectorPending]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
                    {STATUS_LABELS[step] ?? step}
                  </Text>
                  {isDone && <Text style={styles.stepBadge}>{strings.Done}</Text>}
                </View>
              </View>
            );
          })}
        </View>


        {/* Security & Verification Details Modal Trigger */}
        <TouchableOpacity
          style={styles.verificationTriggerButton}
          onPress={() => setIsDetailsExpanded(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Icon name="shield-checkmark" size={20} color="#FFCC00" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.verificationButtonTitle}>
                {strings.DriverVerificationDetails || "Security & Verification Details"}
              </Text>
              <Text style={styles.verificationButtonSubtitle} numberOfLines={1}>
                {strings.VerifiedProfileVehicleDocs || "View verified profile, vehicle & documents"}
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: selectedImage || '' }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */

const YELLOW = "#FFCC00";
const TEXT = "#0F0F0F";
const MUTED = "#7C7C7C";
const CARD = "#FFFFFF";
const BG = "#F7F7F7";
const BORDER = "#EFEFEF";

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  backArrow: { fontSize: 26, fontFamily: font.MonolithRegular, color: "#6b6b6b", width: 24 },
  headerTitle: {
    flex: 1, textAlign: "center", fontFamily: font.MonolithRegular
    , fontSize: 16, color: "#4d4d4d"
  },

  card: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderColor: '#EFEFEF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && {
      borderWidth: 0.8,
      borderColor: '#E5E7EB',
    }),

  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  muted: { color: "#94A3B8", fontFamily: font.MonolithRegular, fontSize: 11, },
  bold: { color: TEXT, fontFamily: font.MonolithRegular, fontSize: 16, marginTop: 3 },
  headerStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: 130,
  },
  headerStatusText: {
    color: "#FFFFFF",
    fontFamily: font.MonolithRegular,
    fontSize: 11,
    textAlign: "center",
  },
  progressSection: {
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 8,
    marginBottom: 14,
  },
  progressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  stepCompleteText: {
    color: "#92400E",
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  progressPercent: {
    color: "#111827",
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  trackBase: { height: 28, justifyContent: "center" },
  trackLine: { position: "absolute", height: 5, backgroundColor: "#E5E7EB", left: 8, right: 8, borderRadius: 4 },
  trackFill: { position: "absolute", height: 5, backgroundColor: YELLOW, left: 8, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  dot: { position: "absolute", width: 16, height: 16, marginLeft: -8, borderRadius: 8, top: 6, borderWidth: 3 },
  dotActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  dotInactive: { backgroundColor: "#FFF", borderColor: "#E8E8E8" },

  row: {
    flexDirection: "column",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  addressTimeline: {
    width: "100%",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressMarkerWrap: {
    width: 20,
    alignItems: "center",
    paddingTop: 4,
    marginRight: 10,
  },
  addressConnectorLine: {
    width: 2,
    minHeight: 38,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginTop: 6,
    marginBottom: 6,
  },
  addressContent: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 14,
  },
  addressMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 5,
  },
  routeLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontFamily: font.MonolithRegular,
    flexShrink: 0,
  },
  fromDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  toDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  date: { color: "#64748B", fontSize: 10, fontFamily: font.MonolithRegular, flexShrink: 1, textAlign: "right" },
  city: { color: TEXT, fontSize: 13, fontFamily: font.MonolithRegular, lineHeight: 19 },
  playButton: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    alignItems: "center", justifyContent: "center", marginHorizontal: 10, backgroundColor: "#FFF",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#EDEFEE",
    marginBottom: 12,
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  footerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  footerInfoText: {
    marginLeft: 7,
    color: "#475569",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
  },
  pill: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, flexShrink: 1 },
  pillProgress: { backgroundColor: "#FFCC00" },
  pillDone: { backgroundColor: "#FFCC00" },
  pillText: { fontFamily: font.MonolithRegular, fontSize: 12, color: "white" },
  cardActionButton: {
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonIcon: { marginRight: 6 },
  viewDetails: { color: "#111827", fontFamily: font.MonolithRegular, fontSize: 12 },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 18, marginHorizontal: 16, marginBottom: 12 },
  trackingSectionIcon: { width: 28, height: 28, marginRight: 10 },
  sectionTitle: { color: TEXT, fontFamily: font.MonolithRegular, fontSize: 16 },
  timelineWrap: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,

  },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  stepLeft: { width: 44, alignItems: "center" },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",

  },
  stepIconDone: { backgroundColor: YELLOW },
  stepIconPending: { backgroundColor: "#E5E7EB" },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 4,
    borderRadius: 1,
    alignSelf: "center",
  },
  stepConnectorDone: { backgroundColor: YELLOW },
  stepConnectorPending: { backgroundColor: "#E5E7EB" },
  stepContent: { flex: 1, paddingLeft: 12, paddingTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepTitle: { fontFamily: font.MonolithRegular, fontSize: 15, color: "#6B7280" },
  stepTitleDone: { color: TEXT, fontFamily: font.MonolithRegular, },
  stepBadge: { fontFamily: font.MonolithRegular, fontSize: 11, color: YELLOW, backgroundColor: "#FEF9E7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  /* Pending Action Card Styles */
  pendingActionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.8,
    borderColor: "#FFCC00",
    shadowColor: "#FFCC00",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },
  pendingCardBgDecoration: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF5CC",
    opacity: 0.6,
  },
  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pendingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF5CC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#FFCC00",
  },
  pendingTitle: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    color: "#111827",

  },
  pendingSubtitle: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
    marginTop: 2,
  },
  pendingMessage: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 20,
  },
  actionButtonGroup: {
    gap: 12,
  },
  actionButton: {
    height: 55,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",

  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
  },
  pendingActionButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFCC00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

  },
  pendingActionButtonText: {
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    color: "#111827",
  },
  verificationTriggerButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  verificationButtonTitle: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  verificationButtonSubtitle: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
    marginTop: 2,

  },
  offersSectionHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offersSectionSubtitle: {
    marginTop: 4,
    color: "#7C7C7C",
    fontFamily: font.MonolithRegular,
    fontSize: 11,
  },
  offersCountText: {
    color: "#7C7C7C",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
  },
  offersWrap: {
    marginHorizontal: 16,
    gap: 10,
  },
  offerCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    overflow: "hidden",
  },
  offerCardLocked: {
    borderColor: "#F1D660",
    backgroundColor: "#FFFDF4",
  },
  offerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  offerCarrierRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  offerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  counterOfferAvatar: {
    backgroundColor: "#FFF3B0",
    borderColor: "#F1D660",
  },
  offerAvatarText: {
    color: "#111827",
    fontFamily: font.MonolithRegular,
    fontSize: 15,
  },
  offerCarrierTextWrap: {
    flex: 1,
  },
  offerCarrier: {
    color: TEXT,
    fontFamily: font.MonolithRegular,
    fontSize: 14,
  },
  offerSubText: {
    color: "#7C7C7C",
    fontFamily: font.MonolithRegular,
    fontSize: 11,
    marginTop: 3,
  },
  offerStatusPill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 118,
  },
  counterStatusPill: {
    backgroundColor: "#FFF3B0",
    borderColor: "#F5D447",
  },
  offerStatusText: {
    color: "#4B5563",
    fontFamily: font.MonolithRegular,
    fontSize: 10,
    textAlign: "center",
  },
  counterStatusText: {
    color: "#8A6A00",
  },
  offerAmountStack: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  amountLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 11,
    gap: 10,
  },
  counterAmountLine: {
    backgroundColor: "#FFF8D9",
    borderTopWidth: 1,
    borderTopColor: "#F1D660",
  },
  priceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  offerIconWrap: {
    backgroundColor: "#FFFFFF",
  },
  counterIconWrap: {
    backgroundColor: "#FFF2B8",
  },
  amountTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  offerLabel: {
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    fontSize: 11,
  },
  offerAmount: {
    color: TEXT,
    fontFamily: font.MonolithRegular,
    fontSize: 16,
    textAlign: "right",
    maxWidth: 120,
  },
  messageBox: {
    marginTop: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  messageRow: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  messageDivider: {
    borderTopWidth: 1,
    borderTopColor: "#E5EAF0",
  },
  messageLabel: {
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    fontSize: 10,
    marginBottom: 6,
  },
  offerMessage: {
    color: "#374151",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
    lineHeight: 19,
  },
  counterLabel: {
    color: "#8A6A00",
    fontFamily: font.MonolithRegular,
    fontSize: 11,
  },
  counterAmount: {
    color: "#111827",
    fontFamily: font.MonolithRegular,
    fontSize: 16,
    textAlign: "right",
    maxWidth: 120,
  },
  counterMessage: {
    color: "#111827",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  offerActionRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  offerActionText: {
    color: "#111827",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
  },
  offerLockedFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 7,
    backgroundColor: "#FFF8D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#F1D660",
  },
  offerLockedText: {
    color: "#8A6A00",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
  },
  noOffersCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    padding: 14,
  },
  noOffersText: {
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
});
