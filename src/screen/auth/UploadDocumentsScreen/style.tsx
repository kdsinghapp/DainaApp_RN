import { StyleSheet, Dimensions } from "react-native";
import { color } from "../../../constant";
import font from "../../../theme/font";


export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    alignItems: "center",
    paddingTop: 38,
    paddingBottom: 20,
  },
  uploadBox: {
    width: "90%",
    height: 150,
    borderWidth: 1.4,
    borderStyle: "dashed",
    borderColor: "#FFCC00",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    // backgroundColor: "#FFFBEA",
  },
  icon: {
    height: 40,
    width: 40,
    tintColor: "#FFB800",
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#444",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    resizeMode: "cover",
  },
  previewContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: -10,
    right: -10,
    backgroundColor: "#FFB800",
    borderRadius: 15,
    padding: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonWrapper: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingBottom: 40,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: font.MonolithRegular
    ,
    color: "#333",
  },
  modalBody: {
    marginTop: 10,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  optionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular
    ,
    color: "#444",
  },

});
