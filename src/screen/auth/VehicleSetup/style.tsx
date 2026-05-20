import { StyleSheet, Dimensions } from "react-native";
import font from "../../../theme/font";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    marginHorizontal: 15,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    height: 66,
  },
  dropdownText: {
    color: "#333",
    fontSize: 15,
    fontFamily: font.MonolithRegular

  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    fontSize: 15,
    color: "#333",
    fontFamily: font.MonolithRegular

  },
  uploadBox: {
    borderWidth: 1.4,
    borderStyle: "dashed",
    borderColor: "#FFCC00",
    borderRadius: 10,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },
  uploadText: {
    marginTop: 10,
    color: "#333",
    fontSize: 15,
    fontFamily: font.MonolithRegular

  },
  button: {
    backgroundColor: "#FFCC00",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: font.MonolithRegular
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "80%",
    paddingVertical: 10,
  },
  dropdownItem: {
    padding: 15,
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#333",
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
    overflow: 'hidden',
    borderRadius: 10,
  },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#FFB800",
    borderRadius: 15,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: {
    height: 40,
    width: 40,
    tintColor: "#FFB800",
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
