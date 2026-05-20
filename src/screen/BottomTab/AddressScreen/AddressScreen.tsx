import React from "react";
import { View, Image, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import imageIndex from "../../../assets/imageIndex";
import CustomButton from "../../../compoent/CustomButton";
import font from "../../../theme/font";
import strings from "../../../localization/Localization";

const addresses = [
  { id: "1", type: strings.HomeType, address: "6480 Sun Park, PC 66", icon: "home-outline" },
  { id: "2", type: strings.OfficeType, address: "6480 Sun Park, PC 66", icon: "business-outline" },
];

export default function AddressScreen() {
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Image
          style={{
            height: 55,
            width: 55
          }}
          source={imageIndex.Addressicone} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.type}</Text>
        <Text style={styles.subtitle}>{item.address}</Text>
      </View>
      <TouchableOpacity style={styles.editBtn}>
        <Image
          style={{
            height: 22,
            width: 22
          }}
          source={imageIndex.Editpen} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader
        label={strings.AddAddress}
      />

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      />
      <View style={{ flex: 1, marginHorizontal: 15, justifyContent: 'flex-end', paddingBottom: 11 }}>
        <CustomButton
          title={strings.Add}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee", shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBox: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: "#FFF7E0",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { flex: 1, marginLeft: 15 },
  title: { fontSize: 16, fontFamily: font.MonolithRegular, color: "#000" },
  subtitle: { marginTop: 2, fontSize: 13, fontFamily: font.MonolithRegular, color: "#777" },
  editBtn: {
    padding: 6,
    borderRadius: 8,
  },
});
