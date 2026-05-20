import { Dimensions } from "react-native";

const figmaScreenWidth = 430; // Figma design width
const figmaScreenHeight = 932; // Figma design height

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ResponsiveSize = {
  width: (figmaWidth) => (figmaWidth / figmaScreenWidth) * screenWidth,
  height: (figmaHeight) => (figmaHeight / figmaScreenHeight) * screenHeight,
  top: (figmaTop) => (figmaTop / figmaScreenHeight) * screenHeight,
  left: (figmaLeft) => (figmaLeft / figmaScreenWidth) * screenWidth,
  margin: (figmaMargin) => (figmaMargin / figmaScreenWidth) * screenWidth,
  padding: (figmaPadding) => (figmaPadding / figmaScreenWidth) * screenWidth,
  marginTop: (figmaMarginTop) => (figmaMarginTop / figmaScreenHeight) * screenHeight, // Added marginTop
};

export default ResponsiveSize;
