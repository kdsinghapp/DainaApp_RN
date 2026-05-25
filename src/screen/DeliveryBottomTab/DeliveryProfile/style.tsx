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
    paddingBottom: 40
  },
  title: {
    fontSize: 32,
    fontFamily: font.MonolithRegular,
    color: TEXT,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#d6e1f9ff",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  avatarWrap: {
    marginRight: 16,
    position: "relative"
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: color.primary,
  },
  statusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#34C759",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: BG,
  },
  name: {
    fontSize: 20,
    fontFamily: font.MonolithRegular,
    color: TEXT,
    lineHeight: 26,
  },
  email: {
    fontSize: 13,
    color: SUBTLE,
    marginTop: 2,
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
  card: {
    backgroundColor: BG,
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#d6e1f9ff",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center"
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  secureIconWrap: {
    backgroundColor: "rgba(255, 204, 0, 0.1)",
  },
  rowLabel: {
    marginLeft: 16,
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: TEXT,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
  },
  logoutBtn: {
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,

    backgroundColor: "white"
  },
  logoutText: {
    fontSize: 17,
    fontFamily: font.MonolithRegular,
    color: "#EF4444"
  },

});
