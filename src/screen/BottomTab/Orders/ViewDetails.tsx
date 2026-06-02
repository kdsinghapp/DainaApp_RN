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
  Dimensions
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

              </View>

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
                    <View style={[styles.offerAccentLine, isCounterOffered && styles.counterAccentLine]} />
                    <View style={styles.offerTopRow}>
                      <View style={styles.offerCarrierRow}>
                        <View style={styles.offerAvatar}>
                          <Text style={styles.offerAvatarText}>{carrierInitial}</Text>
                        </View>
                        <View style={styles.offerCarrierTextWrap}>
                          <Text style={styles.offerCarrier} numberOfLines={1}>{carrierName}</Text>
                          <Text style={styles.offerSubText}>
                            {isCounterOffered ? "Counter offer sent" : strings.OfferInformation || "Offer Information"}
                          </Text>
                        </View>
                      </View>
                      {!!offer?.status && (
                        <View style={[styles.offerStatusPill, isCounterOffered && styles.counterStatusPill]}>
                          <Text style={[styles.offerStatusText, isCounterOffered && styles.counterStatusText]}>
                            {titleize(offer.status)}
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
                        <Text style={styles.offerLockedText}>Waiting for carrier response</Text>
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
            <View style={styles.pendingHeader}>
              <Icon name="time" size={22} color={YELLOW} />
              <Text style={styles.pendingTitle}>{strings.StatusPending}</Text>
            </View>
            <Text style={styles.pendingMessage}>
              {strings.PendingOfferMessage}
            </Text>
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: YELLOW }]}
                onPress={() => {
                  (navigation as any).navigate(ScreenNameEnum.OfferOR, {
                    id: { parcel: parcel }
                  })
                }}
              >
                <Text style={[styles.actionButtonText, { color: "white" }]}>{strings.CheckOffer}</Text>
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
            <Text style={styles.muted}>{strings.TrackingID}:</Text>
            <Text style={styles.bold}>{order.trackingId}</Text>
          </View>

          <Text style={styles.stepCompleteText}>
            {strings.formatString(strings.StepXofY, activeIdx + 1, STATUS_STEPS.length)}
          </Text>
          {/* Progress Bar */}
          <View style={styles.trackBase}
          >
            <View style={styles.trackLine} />
            <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
            {/* {STATUS_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i <= currentIdx ? styles.dotActive : styles.dotInactive,
                  { left: `${(i / (STATUS_STEPS.length - 1)) * 100}%` },
                ]}
              />
            ))} */}

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

          {/* City Info */}
          {/* <TouchableOpacity style={styles.row}
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
          > */}
          <TouchableOpacity
            style={[
              styles.row,
              (statusNorm === STATUS.DELIVERED || hasCounterOffered) && { opacity: 0.5 } // thoda fade dikhe
            ]}
            disabled={statusNorm === STATUS.DELIVERED || hasCounterOffered}
            onPress={() => {
              if (statusNorm === STATUS.DELIVERED || hasCounterOffered) return; // extra safety

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
            <View style={styles.cityBlock}>
              <Text style={styles.date}>{order.startDate}</Text>
              <Text style={styles.city}>{order.fromCity}</Text>
            </View>

            <View style={[styles.cityBlock, { alignItems: "flex-end" }]}>
              <Text style={styles.date}>{order.endDate}</Text>
              <Text style={styles.city}>{order.toCity}</Text>
            </View>
          </TouchableOpacity>
          <View
            style={{
              borderWidth: 0.8,
              marginTop: 11,
              borderColor: "#EDEFEE",
              marginBottom: 10,
            }}
          />
          <RatingModal
            visible={showRatingModal}
            onClose={closeRatingModal}
            onSubmit={handleRatingSubmit}
            isSubmitting={ratingSubmitting}
          />
          {/* Footer */}
          <View style={styles.footerRow}>
            <View
              style={[
                styles.pill,
                activeIdx >= STATUS_STEPS.length - 1 ? styles.pillDone : styles.pillProgress,
                { backgroundColor: displayStatusColor },
              ]}
            >
              <Text style={styles.pillText}>
                {displayStatusLabel}
                {/* {order.status === "pending" ? "Waiting for Driver" : order.status === "packaged"
                  ? "Still Packaged"
                  : order.status === "shipped"
                    ? "In Shipping"
                    : order.status === "inTransit"
                      ? "In Transit"
                      : "Delivered"} */}
              </Text>
            </View>
            {statusNorm === STATUS.DELIVERED ? (
              <TouchableOpacity

                onPress={() => {
                  setShowRatingModal(true)
                }}
                style={{
                  padding: 5,
                  borderRadius: 20,
                  paddingVertical: 7
                }}>
                <Text style={[styles.viewDetails, {
                  color: "white",
                  fontFamily: font.MonolithRegular
                }]}

                >
                  {strings.RateYourDelivery}</Text>
              </TouchableOpacity>

            ) : hasCounterOffered ? null : (

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
                style={{
                  padding: 5,
                  borderRadius: 20,
                  paddingVertical: 7
                }}
              >
                <Text style={[styles.viewDetails, {
                  color: "white",
                  fontFamily: font.MonolithRegular
                }]}

                >
                  {statusNorm === STATUS.PENDING ? strings.ViewOffer : strings.TrackDetail}</Text>
              </TouchableOpacity>
            )}


          </View>
        </TouchableOpacity>


        {driver && (
          <View style={{ marginHorizontal: 20, marginTop: 10, marginBottom: 10 }}>
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
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#eee", shadowColor: "#000",


  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  muted: { color: MUTED, fontFamily: font.MonolithRegular },
  bold: { color: TEXT, fontFamily: font.MonolithRegular },
  stepCompleteText: {
    color: MUTED,
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    marginBottom: 6,
  },
  trackBase: { height: 24, justifyContent: "center", marginBottom: 10 },
  trackLine: { position: "absolute", height: 4, backgroundColor: "#E8E8E8", left: 8, right: 8, borderRadius: 4 },
  trackFill: { position: "absolute", height: 4, backgroundColor: YELLOW, left: 8, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  dot: { position: "absolute", width: 16, height: 16, marginLeft: -8, borderRadius: 8, top: 4, borderWidth: 3 },
  dotActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  dotInactive: { backgroundColor: "#FFF", borderColor: "#E8E8E8" },

  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cityBlock: { flex: 1 },
  date: { color: MUTED, fontSize: 12, fontFamily: font.MonolithRegular, marginBottom: 4 },
  city: { color: TEXT, fontSize: 16, fontFamily: font.MonolithRegular },
  playButton: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    alignItems: "center", justifyContent: "center", marginHorizontal: 10, backgroundColor: "#FFF",
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  pillProgress: { backgroundColor: "#FFCC00" },
  pillDone: { backgroundColor: "#FFCC00" },
  pillText: { fontFamily: font.MonolithRegular, fontSize: 12, color: "white" },
  viewDetails: { color: "black", fontFamily: font.MonolithRegular, fontSize: 12, },

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
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",

  },
  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pendingTitle: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    color: TEXT,
    marginLeft: 10,
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
    marginTop: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offersSectionSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    fontSize: 11,
  },
  offersCountBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  offersCountText: {
    color: "#FFFFFF",
    fontFamily: font.MonolithRegular,
    fontSize: 13,
  },
  offersWrap: {
    marginHorizontal: 16,
    gap: 14,
  },
  offerCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },
  offerCardLocked: {
    borderColor: "#F4D45E",
    backgroundColor: "#FFFDF2",
  },
  offerAccentLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#111827",
  },
  counterAccentLine: {
    backgroundColor: YELLOW,
  },
  offerTopRow: {
    flexDirection: "row",
    alignItems: "center",
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F2C200",
  },
  offerAvatarText: {
    color: "#111827",
    fontFamily: font.MonolithRegular,
    fontSize: 16,
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
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    fontSize: 11,
    marginTop: 3,
  },
  offerStatusPill: {
    backgroundColor: "#FEF9E7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#F5E7A6",
  },
  counterStatusPill: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  offerStatusText: {
    color: "#8A6A00",
    fontFamily: font.MonolithRegular,
    fontSize: 10,
  },
  counterStatusText: {
    color: "#FFFFFF",
  },
  offerAmountStack: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  amountLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 10,
  },
  counterAmountLine: {
    backgroundColor: "#FFF8D9",
    borderTopWidth: 1,
    borderTopColor: "#F4D45E",
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
    color: MUTED,
    fontFamily: font.MonolithRegular,
    fontSize: 10,
  },
  offerAmount: {
    color: TEXT,
    fontFamily: font.MonolithRegular,
    fontSize: 17,
    textAlign: "right",
    maxWidth: 120,
  },
  messageBox: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  messageRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageDivider: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  messageLabel: {
    color: "#94A3B8",
    fontFamily: font.MonolithRegular,
    fontSize: 10,
    marginBottom: 5,
  },
  offerMessage: {
    color: "#4B5563",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  counterLabel: {
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    fontSize: 10,
  },
  counterAmount: {
    color: "#111827",
    fontFamily: font.MonolithRegular,
    fontSize: 17,
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
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  offerActionText: {
    color: "#111827",
    fontFamily: font.MonolithRegular,
    fontSize: 12,
  },
  offerLockedFooter: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#FFF8D9",
    borderRadius: 12,
    paddingVertical: 10,
  },
  offerLockedText: {
    color: "#8A6A00",
    fontFamily: font.MonolithRegular,
    fontSize: 11,
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
