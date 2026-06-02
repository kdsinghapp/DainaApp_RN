import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import imageIndex from "../assets/imageIndex";
import font from "../theme/font";
import { color } from "../constant";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/Constant";
import strings from "../localization/Localization";

const YELLOW = "#FFCC00";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E5E7EB";

const OrderCard = ({ order, onPress }: { order: any; onPress: () => void }) => {
  const formatDateTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const statusKey = order?.deliveryStatus;
  const statusLabel = STATUS_LABELS[statusKey] || strings?.StatusPending;
  const statusColor = STATUS_COLORS[statusKey] || "black";
  const statusBg = statusColor === "black" ? "#F1F5F9" : `${statusColor}18`;
  const orderId = order?.trackingId || order?.id;

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <View style={styles.accentLine} />
      <View style={styles.cardTop}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Image source={imageIndex.icons} style={styles.headerIcon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.orderLabel}>{strings.Order || "Order"}</Text>
            <Text style={styles.cardId} numberOfLines={1}>
              #{orderId}
            </Text>
            <View style={styles.dateRow}>
              <Icon name="calendar-outline" size={12} color={MUTED} />
              <Text style={styles.cardDate}>{formatDateTime(order?.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statusChip, { backgroundColor: statusBg, borderColor: statusColor === "black" ? "#E2E8F0" : statusColor }]}>
          <Text style={[styles.statusChipText, { color: statusColor }]} numberOfLines={1}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.locationSection}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeTitle}>{strings.PickupAndDrop || "Pickup & Drop"}</Text>
          <View style={styles.routeBadge}>
            <Icon name="navigate-outline" size={13} color={MUTED} />
          </View>
        </View>
        <View style={styles.timeline}>
          <View style={styles.pickupDot} />
          <View style={styles.timelineLine} />
          <View style={styles.dropDot} />
        </View>

        <View style={styles.locationContent}>
          <View style={styles.locationBlock}>
            <View style={styles.labelRow}>
              <Icon name="radio-button-on" size={10} color={YELLOW} />
              <Text style={styles.label}>{strings?.From || "From"}</Text>
            </View>
            <Text style={styles.value} numberOfLines={2}>
              {order?.pickupLocation || strings.Unknown}
            </Text>
          </View>

          <View style={[styles.locationBlock, styles.dropBlock]}>
            <View style={styles.labelRow}>
              <Icon name="location" size={11} color="#10B981" />
              <Text style={styles.label}>{strings?.To || "To"}</Text>
            </View>
            <Text style={styles.value} numberOfLines={2}>
              {order?.dropLocation || strings.Unknown}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor === "black" ? MUTED : statusColor }]} />
          <View style={styles.footerStatusText}>
            <Text style={styles.statusLabel}>{strings.DeliveryStatus || "Delivery Status"}</Text>
            <Text style={[styles.statusValue, { color: statusColor }]} numberOfLines={1}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>{strings?.ViewDetails}</Text>
          <Icon name="arrow-forward" size={16} color="black" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default OrderCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },

    }),
    overflow: "hidden",
  },
  accentLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: color.primary,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFF8D9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F4D45E",
  },
  headerIcon: {
    height: 28,
    width: 28,
    resizeMode: "contain",
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  orderLabel: {
    fontFamily: font.MonolithRegular,
    fontSize: 10,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  cardId: {
    fontFamily: font.MonolithRegular,
    fontSize: 16,
    color: TEXT,
  },
  cardDate: {
    fontFamily: font.MonolithRegular,
    fontSize: 12,
    color: MUTED,
    marginLeft: 5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  statusChip: {
    maxWidth: 118,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusChipText: {
    fontSize: 10,
    fontFamily: font.MonolithRegular,
    textAlign: "center",
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 14,
    paddingTop: 38,
    paddingBottom: 14,
    position: "relative",
  },
  routeHeader: {
    position: "absolute",
    top: 11,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeTitle: {
    color: TEXT,
    fontFamily: font.MonolithRegular,
    fontSize: 12,
  },
  routeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  timeline: {
    width: 14,
    height: 92,
    alignItems: "center",
    paddingVertical: 3,
    marginTop: 2,
  },
  pickupDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: YELLOW,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 5,
  },
  dropDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  locationContent: {
    flex: 1,
    marginLeft: 14,
  },
  locationBlock: {
    flexDirection: "column",
  },
  dropBlock: {
    marginTop: 15,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: MUTED,
    fontFamily: font.MonolithRegular,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    color: TEXT,
    fontFamily: font.MonolithRegular,
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  statusRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  footerStatusText: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    fontSize: 10,
    color: MUTED,
    fontFamily: font.MonolithRegular,
    marginBottom: 2,
  },
  statusValue: {
    flex: 1,
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  viewDetailsButton: {
    backgroundColor: color.primary,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 14,
    marginLeft: 10,
  },
  viewDetailsText: {
    fontSize: 12,
    color: "black",
    fontFamily: font.MonolithRegular,
  },
});
