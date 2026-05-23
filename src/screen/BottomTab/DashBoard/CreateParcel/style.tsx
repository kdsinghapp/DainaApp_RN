import { StyleSheet } from "react-native";
import font from "../../../../theme/font";
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 15
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    color: "black",
    fontFamily: font.MonolithRegular
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 55,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    color: "black",
    fontFamily: font.MonolithRegular,
    fontSize: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    marginBottom: 15


  },
  placeholderText: {
    color: "#ADA4A5",
    fontSize: 15,
    fontFamily: font.MonolithRegular
  },
  packageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  packageBox: {
    width: "30%",
    paddingVertical: 40,
    borderWidth: 1.5,
    borderRadius: 10,
    borderColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 11,
  },
  packageText: {
    fontSize: 14,
    color: "#333",
    fontFamily: font.MonolithRegular,

  },
  selectedBox: {
    borderColor: "#FFD600",
    backgroundColor: "#FFFBE6",
  },
  selectedText: {
    color: "#FFD600",
    fontFamily: font.MonolithRegular

  },
  submitBtn: {
    marginTop: 30,
    backgroundColor: "#FFD600",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular
    ,
    color: "#000",
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontFamily: font.MonolithRegular,
  },
  imageUploadButton: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    backgroundColor: "#F8FAFC",
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginTop: 5,
    marginBottom: 11,

  },
  imageUploadPlaceholderText: {
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    color: "#475569",
    fontWeight: "600",
  },
  imageUploadSubText: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#94A3B8",
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginTop: 5,
    marginBottom: 11,
  },
  parcelImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageEditBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageEditBadgeText: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
    fontWeight: "600",
  },
});
