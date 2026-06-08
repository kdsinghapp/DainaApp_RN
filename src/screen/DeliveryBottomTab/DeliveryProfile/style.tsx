import { StyleSheet, Platform } from "react-native";
import { color } from "../../../constant";
import font from "../../../theme/font";
const TEXT = "#0F172A";
const SUBTLE = "#64748B";
const BG = "#FFFFFF";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 120
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 25,
    fontFamily: font.MonolithRegular,
    color: TEXT,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: SUBTLE,
    marginTop: 4,
  },
  headerEditBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG,
    borderRadius: 22,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },

    }),
  },
  profileAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: color.primary,
  },
  avatarWrap: {
    marginRight: 16,
    position: "relative",
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#FFF7CC",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: BG,
  },
  statusBadge: {
    position: "absolute",
    bottom: 5,
    right: 4,
    backgroundColor: color.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,

  },
  name: {
    flex: 1,
    fontSize: 20,
    fontFamily: font.MonolithRegular,
    color: TEXT,
    lineHeight: 26,
  },
  rolePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginLeft: 8,
  },
  rolePillText: {
    fontSize: 10,
    color: "#475569",
    fontFamily: font.MonolithRegular,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  email: {
    flex: 1,
    fontSize: 13,
    color: SUBTLE,
    marginLeft: 7,
    fontFamily: font.MonolithRegular,
  },
  phoneNumber: {
    fontSize: 12,
    color: color.primary,
    fontFamily: font.MonolithRegular,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: SUBTLE,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: SUBTLE,
    marginLeft: 4,
    marginBottom: 10,
  },
  card: {
    backgroundColor: BG,
    borderRadius: 16,
    paddingVertical: 0,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },

    }),
  },
  row: {
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  secureIconWrap: {
    backgroundColor: "rgba(255, 204, 0, 0.1)",
  },
  rowLabel: {
    flex: 1,
    marginLeft: 14,
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    color: TEXT,
  },
  rowLabelDanger: {
    color: "#EF4444",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
  },
  logoutBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexDirection: "row",
  },
  logoutText: {
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    color: "#EF4444",
    marginLeft: 8,
  },

});
