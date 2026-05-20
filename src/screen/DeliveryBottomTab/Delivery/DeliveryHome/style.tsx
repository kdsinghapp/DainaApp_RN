import { StyleSheet, Platform } from "react-native";
import font from "../../../../theme/font";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#fff",
  },

  topRow: {
    marginTop: 8,
    marginBottom: 4,
  },

  pill: {
    width: 180,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFD600",
    justifyContent: "center",
    overflow: "hidden",
  },
  pillHalf: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  pillLeftText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,

  },
  pillRightText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,

  },
  knob: {
    position: "absolute",
    top: 4,
    bottom: 4,
    width: 80,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  onlineText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    textAlign: "center",
  },

  ordersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: "black",
    fontFamily: font.MonolithRegular

  },
  sectionTitle1: {
    fontSize: 15,
    color: "black",
    fontFamily: font.MonolithRegular
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    padding: 6,
    borderRadius: 12,
    marginBottom: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10

  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFCC00",
    height: 45,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    justifyContent: "center",
    alignItems: "center"
  },
  tabText: {
    fontSize: 14,
    color: "#1C1B1B", fontFamily: font.MonolithRegular


  },
  tabTextActive: {
    color: "black",
    fontFamily: font.MonolithRegular
    ,
    fontSize: 15,


  },
  container1: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  card1: {
    flex: 1,
    // backgroundColor: "#FFCC00",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFCC00",
    marginHorizontal: 6,

  },
  icon: {
    height: 28,
    width: 28,
    marginBottom: 11,
  },
  title: {
    color: "black",
    fontSize: 14,
    marginTop: 8
  },
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
    marginBottom: 14,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#FFF9E6",
  },
  cardId: {
    fontSize: 15,
    color: "#0F172A",
  },
  bold: {
    fontFamily: font.MonolithRegular,

  },
  bulletSeparator: {
    marginHorizontal: 8,
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: font.MonolithRegular,
  },
  cardDate: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
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
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  timelineDotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 11,
  },
  label: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginTop: 2,
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  statusText: {
    fontSize: 12,
    color: "#555",
    marginRight: 6,
    fontFamily: font.MonolithRegular,
  },
  statusValue: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#9AA4AF",
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
    position: "relative",
  },
  illustrationBg: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFCC00",
    opacity: 0.1,
  },
  emptyIcon: {
    height: 120,
    width: 120,
    resizeMode: "contain",
  },
  emptyTitle: {
    fontSize: 22,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    textAlign: "center",
    lineHeight: 22,
  },
});
