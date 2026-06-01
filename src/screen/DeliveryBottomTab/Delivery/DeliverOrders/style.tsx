import { StyleSheet, Dimensions, Platform } from "react-native";
import font from "../../../../theme/font";



export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#FFFFFF",
  },

  /* header */
  ordersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#000",
    fontFamily: font.MonolithRegular,
  },

  /* summary cards */
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  summaryTitle: {
    color: "#EDEDED",
    fontSize: 14,
    marginTop: 8,
    fontFamily: font.MonolithRegular,
  },
  summaryValue: {
    marginTop: 5,
    color: "#FFF",
    fontSize: 18,
    fontFamily: font.MonolithRegular,
  },

  /* tabs */
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
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
    fontSize: 13,
    color: "#1C1B1B",
    fontFamily: font.MonolithRegular

  },
  tabTextActive: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: font.MonolithRegular
  },

  /* cards */
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
      },

    }),
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#F1F5F9",
  },
  name: {
    fontSize: 15,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
  },
  phone: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
  },
  statusPill: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
  },
  code: {
    marginLeft: 52, // align under name (40 avatar + 12 gap)
    fontSize: 12,
    color: "#9AA4AF",
    fontFamily: font.MonolithRegular,
  },
  trackingText: {
    marginLeft: 52,
    fontSize: 12,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontFamily: font.MonolithRegular,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  splitter: {

    marginTop: 8,
    marginBottom: 12,
  },
  stopsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 34,
  },
  timelineContainer: {
    width: 12,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    height: 86,
  },
  timelineDotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFCC00",
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: "#CBD5E1",
    marginVertical: 4,
  },
  timelineDotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  stopLabel: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    letterSpacing: 0.5,
  },
  stopValue: {
    fontSize: 14,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginTop: 2,
    lineHeight: 18,
  },
  offerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFDF5",
    borderWidth: 1,
    borderColor: "#FDE68A",
    position: "relative",
    marginBottom: 11,
    overflow: "hidden",
  },
  offerAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: "#F59E0B",
  },
  offerInfo: {
    flex: 1,
    paddingLeft: 4,
  },
  offerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  offerEyebrow: {
    fontSize: 10,
    color: "#92400E",
    fontFamily: font.MonolithRegular,
    flexShrink: 1,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  offerBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#F59E0B",
  },
  offerBadgeText: {
    fontSize: 9,
    color: "#FFF",
    fontFamily: font.MonolithRegular,
  },
  offerTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginBottom: 8,
  },
  offerAmountPill: {
    alignSelf: "flex-start",
    paddingVertical: 7,
    borderRadius: 12,
  },
  offerAmount: {
    fontSize: 20,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
  },
  offerHint: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    lineHeight: 16,
    flexShrink: 1,
  },
  acceptOfferBtn: {
    minWidth: 88,
    height: 36,
    borderRadius: 21,
    backgroundColor: "#FFCC00",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  acceptOfferBtnDisabled: {
    opacity: 0.65,
  },
  acceptOfferText: {
    fontSize: 15,
    color: "white",
    fontFamily: font.MonolithRegular,
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
    backgroundColor: "#FFCC00",
    opacity: 0.1,
  },
  emptyIcon: {
    height: 120,
    width: 120,
    resizeMode: 'contain',
  },
  emptyTitle: {
    fontSize: 22,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    lineHeight: 22,
  },

});
