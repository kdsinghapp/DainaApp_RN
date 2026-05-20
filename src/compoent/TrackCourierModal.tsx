import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Animated,
  Easing,
} from "react-native";

import imageIndex from "../assets/imageIndex";
import font from "../theme/font";

const TrackCourierModal = ({ visible, onpress, onClose, onLocationGranted }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current; // initial scale = 1

  useEffect(() => {
    // Create a looping bounce/pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);



  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconWrapper}>
            <Animated.Image
              source={imageIndex.pin}
              style={{
                height: 138,
                width: 138,
                transform: [{ scale: scaleAnim }], // apply animation
              }}
            />
          </View>

          <Text style={styles.title}>Your Courier has been booked Successfully</Text>
          <Text style={styles.subtitle}>
            Your can track your shipment with tracking id: #20287352341
          </Text>

          <TouchableOpacity style={styles.button} onPress={onpress}>
            <Text style={styles.buttonText}>Track Courier</Text>
          </TouchableOpacity>


        </View>
      </View>
    </Modal>
  );
};

export default TrackCourierModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    width: "80%",
  },
  iconWrapper: {
    padding: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    marginBottom: 10,
    textAlign: "center",
    color: "black",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: font.MonolithRegular,
    lineHeight: 22
  },
  button: {
    backgroundColor: "#FFCC00",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginBottom: 15,
    width: "100%",
    justifyContent: "center",
    height: 54,
  },
  buttonText: {
    color: "#000",
    textAlign: "center",
    fontSize: 16,
    fontFamily: font.MonolithRegular,


  },
  skipText: {
    color: "#B8B8B8",
    fontFamily: font.MonolithRegular,
    fontSize: 16,
  },
});
