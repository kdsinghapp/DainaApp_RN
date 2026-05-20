import { StyleSheet, Dimensions } from "react-native";
import { color } from "../../../constant";
import font from "../../../theme/font";

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: width * 0.48,   // responsive size
    height: width * 0.35,
  },

  versionContainer: {
    position: 'absolute',
    bottom: height * 0.05, // 5% from bottom
    width: '100%',
    alignItems: 'center',
  },

  versionText: {
    fontSize: 15,
    color: 'black',
    opacity: 0.7,
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
  },
});
