import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from "react-native";
import imageIndex from "../assets/imageIndex";
import font from "../theme/font";
import { color } from "../constant";
import { STATUS_COLORS, STATUS_LABELS } from "../utils/Constant";
import strings from "../localization/Localization";

// Define the colors based on your design
const YELLOW = "#FFCC00";
const TEXT = "#0F0F0F";
const MUTED = "#BABFC5";
const BORDER = "#EFEFEF";

const arePropsEqual = (prevProps: any, nextProps: any) => {
  return (
    prevProps.order?.id === nextProps.order?.id &&
    prevProps.order?.deliveryStatus === nextProps.order?.deliveryStatus &&
    prevProps.order?.pickupLocation === nextProps.order?.pickupLocation &&
    prevProps.order?.dropLocation === nextProps.order?.dropLocation
  );
};

const OrderCard = React.memo(({ order, onPress }: { order: any; onPress?: () => void }) => {
  const isoTime = order?.createdAt;

  // Helper to format the date/time
  const formatDateTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: 'numeric'
    });
  };

  const statusKey = order?.deliveryStatus;
  const statusLabel = STATUS_LABELS[statusKey] || strings?.StatusPending;
  const statusColor = STATUS_COLORS[statusKey] || 'black';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => onPress && onPress()}
    >
      {/* Top Header Section */}
      <View style={styles.cardTop}>

        <View style={styles.headerText}>
          <View >
            <Text style={styles.trackingLabel}>{strings.TrackingID}</Text>

            <Text style={styles.cardId}>#{order?.trackingId || order?.id}</Text>
            <Text style={styles.cardDate}> {formatDateTime(order?.createdAt)}</Text>

          </View>
        </View>
        <Text style={[styles.statusValue, { color: statusColor }]}>
          {statusLabel}
        </Text>
      </View>

      {/* Location Section with Vertical Vector */}
      <View style={styles.locationSection}>
        {/* Vertical Line Image */}
        <View style={styles.routeLineColumn}>
          <View style={styles.routeDotPickup} />
          <View style={styles.routeLine} />
          <View style={styles.routeDotDrop} />
        </View>
        <View style={styles.locationContent}>
          {/* Pickup */}
          <View style={styles.locationBlock}>
            <Text style={styles.label}>{strings?.From || "From"}</Text>
            <Text style={[styles.value, {

            }]} numberOfLines={2}>
              {order?.pickupLocation}
            </Text>
          </View>

          {/* Drop */}
          <View style={[styles.locationBlock, { marginTop: 15 }]}>
            <Text style={styles.label}>{strings?.To || "To"}</Text>
            <Text style={styles.value} numberOfLines={2}>
              {order?.dropLocation}
            </Text>
          </View>

        </View>
      </View>

      {/* Footer Status Section */}

      <View style={{
        backgroundColor: color.primary,
        padding: 6,
        height: 45,
        borderRadius: 10,
        marginTop: 15,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={[styles.viewDetailsText, { color: "white" }]}>
          {strings?.ViewDetails}
        </Text>
      </View>
    </TouchableOpacity>
  );
}, arePropsEqual);

export default OrderCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#d6e1f9ff",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },

    }),


  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  routeLineColumn: {
    width: 24,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
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
  iconBox: {
    // backgroundColor: "#F9F9F9",
    // padding: 8,
    // borderRadius: 12,
  },
  headerIcon: {
    height: 45,
    width: 45
  },
  headerText: {
    flex: 1,
    flexDirection: 'row'
  },
  cardId: {
    fontFamily: font.MonolithRegular,
    fontSize: 15,
    color: TEXT,
    lineHeight: 22,
    marginTop: 3
  },
  cardDate: {
    fontFamily: font.MonolithRegular,
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  priceContainer: {
    backgroundColor: "#FFF9E5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceText: {
    fontFamily: font.MonolithRegular,
    color: YELLOW,

  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  vectorLine: {
    height: 90,
    width: 15,
  },
  locationContent: {
    flex: 1,
    marginLeft: 15,
  },
  locationBlock: {
    flexDirection: "column",
  },
  label: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trackingLabel: {
    color: MUTED,
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    color: "black",
    fontFamily: font.MonolithRegular,
    marginTop: 2,

  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 13,
    color: TEXT,
    fontFamily: font.MonolithRegular,
  },
  statusValue: {
    fontSize: 16,
    color: "#4CAF50", // Green for status
    fontFamily: font.MonolithRegular,
  },
  viewDetailsText: {
    fontSize: 14,
    color: color.primary,
    // textDecorationLine: "underline",
    fontFamily: font.MonolithRegular,
  },
});