import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import imageIndex from "../assets/imageIndex";
import font from "../theme/font";
import strings from "../localization/Localization";

const HomeHeaderBar = ({
  location = "Wallace, Australia",
  style1,
  onLocationPress,
  onNotificationPress,
  hasNotification = true,
}: any) => {
  return (
    <View>
      <Text style={styles.tex}>{strings?.CurrentLocation}</Text>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={onLocationPress}
          activeOpacity={0.7}
        >
          <Image source={imageIndex.location1} style={styles.iconSmall} />
          <Text
            style={[styles.locationText, style1]}
            numberOfLines={1}           // restrict to single line
            ellipsizeMode="tail"        // add "..." if too long
          >
            {location}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationContainer}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Icon name="notifications-outline" size={24} color="#000" />
          {hasNotification && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,                     // allow text to shrink if needed
    marginRight: 10,             // some spacing from notification
  },
  locationText: {
    fontSize: 15,
    marginHorizontal: 5,
    color: "#000",
    fontFamily: font.MonolithRegular,
    flexShrink: 1,               // allow text to shrink
  },
  tex: {
    color: "#878787",
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  notificationContainer: {
    position: "relative",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  iconSmall: {
    width: 22,
    height: 22,
  },
  iconLarge: {
    width: 44,
    height: 44,
  },
});

export default HomeHeaderBar;
