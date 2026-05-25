import { Dimensions } from "react-native";

const figmaScreenWidth = 430; // Figma design width
const figmaScreenHeight = 932; // Figma design height

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");


const ResponsiveSize = {
  width: (figmaWidth: any) => (figmaWidth / figmaScreenWidth) * screenWidth,
  height: (figmaHeight: any) => (figmaHeight / figmaScreenHeight) * screenHeight,
  top: (figmaTop: any) => (figmaTop / figmaScreenHeight) * screenHeight,
  left: (figmaLeft: any) => (figmaLeft / figmaScreenWidth) * screenWidth,
  margin: (figmaMargin: any) => (figmaMargin / figmaScreenWidth) * screenWidth,
  padding: (figmaPadding: any) => (figmaPadding / figmaScreenWidth) * screenWidth,
  marginTop: (figmaMarginTop: any) => (figmaMarginTop / figmaScreenHeight) * screenHeight, // Added marginTop
};

export default ResponsiveSize;
