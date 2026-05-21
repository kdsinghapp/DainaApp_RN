import { Platform, StyleSheet } from "react-native";
import { hp } from "../../../utils/Constant";
import { color, } from "../../../constant";
import font from "../../../theme/font";


export const styles = StyleSheet.create({
  container: {
    padding: 15,
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 15,

  },
  backButton: {
    marginTop: 8,
    width: '15%',
  },
  backIcon: {
    height: 32,
    width: 32,
  },
  txtHeading: {
    fontSize: 24,
    lineHeight: 36,
    color: 'rgba(0, 0, 0, 1)',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: font.MonolithRegular
  },
  txtDes: {
    color: '#9DB2BF',
    fontSize: 16,
    marginTop: 10,
    fontFamily: font.MonolithRegular,
    lineHeight: 30,
    textAlign: "center"
  },
  headerSection: {
    height: hp(15),
    marginTop: 5,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    color: 'rgba(0, 0, 0, 1)',
    lineHeight: 36,
    marginTop: 40,
    fontFamily: font.MonolithRegular
  },
  description: {
    fontSize: 16,
    fontFamily: font.MonolithRegular
    ,
    color: 'rgba(157, 178, 191, 1)',
    lineHeight: 24,
    marginTop: 10,
  },
  otpFieldContainer: {
    height: hp(10),
    marginHorizontal: 18,
    justifyContent: 'center',
    marginTop: 25
  },
  cellWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',

  },
  cell: {
    width: 60,
    height: 60,
    fontSize: 24,
    lineHeight: Platform.OS === 'ios' ? 58 : 65,           // match the height for vertical centering
    borderWidth: 1.5,
    borderColor: '#E9E9E9',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#000',
    borderRadius: 30,
    fontFamily: font.MonolithRegular,
    includeFontPadding: false,  // remove extra padding for Android
  },
  focusCell: {
    borderColor: color.primary,
    backgroundColor: 'white',
    textAlignVertical: 'center',
    justifyContent: "center"

  },
  errorText: {
    color: 'red',
    marginTop: 18,
    fontFamily: font.MonolithRegular,
    marginBottom: 15

  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(30),
    marginTop: 30,
  },
  bannerImage: {
    height: '100%',
    width: '100%',
  },
  submitButton: {
    width: '100%',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center'
  },
});
