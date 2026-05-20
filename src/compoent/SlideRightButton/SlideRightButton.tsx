// SlideButton.tsx
import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import SvgIndex from "../../assets/svgIndex";
import font from "../../theme/font";

import strings from "../../localization/Localization";

const { width } = Dimensions.get("window");

interface SlideButtonProps {
  title?: string;
  onSlideSuccess: () => void;
}

const SlideButton: React.FC<SlideButtonProps> = ({
  title = "Continue",
  onSlideSuccess,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const maxSlide = width * 0.75; // slider area ka width

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => {
        if (gesture.dx >= 0 && gesture.dx <= maxSlide - 70) {
          translateX.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > maxSlide - 120) {
          Animated.timing(translateX, {
            toValue: maxSlide - 70,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            console.log("Slide complete!");

            onSlideSuccess();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.slider}>
        {/* Background text */}

        {/* Arrow indicator */}
        <View style={styles.arrowWrapper}>
          <Text style={styles.hintText}>{strings.Slide}</Text>
          <View style={{
            marginLeft: 15
          }}>
            <SvgIndex.SlideArrow />

          </View>
        </View>

        {/* Sliding button */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.button, { transform: [{ translateX }] }]}
        >
          <Text style={styles.buttonText}>{title}</Text>
        </Animated.View>
      </View>
    </View>
  );
};

export default SlideButton;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  slider: {
    width: "92%",
    height: 58,
    backgroundColor: "#FFF7D9",
    borderRadius: 40,
    justifyContent: "center",

  },
  hintText: {
    fontSize: 16,
    color: "black",
    fontFamily: font.MonolithRegular
  },
  arrowWrapper: {
    position: "absolute",
    right: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    position: "absolute",
    left: 0,
    width: 140,
    height: 50,
    backgroundColor: "#FFCC00",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",

  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: font.MonolithRegular

  },
});
