import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Image, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Modal, FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import CustomButton from "../../../compoent/CustomButton";
import imageIndex from "../../../assets/imageIndex";
import font from "../../../theme/font";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Constcounty from "./Constcounty";
import { LogiApi } from "../../../Api/apiRequest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingModal from "../../../utils/Loader";
import { getMessaging } from "@react-native-firebase/messaging";
import strings from "../../../localization/Localization";
type CountryOption = {
  country: string;
  code: string;
  dial_code: string;
  flag: string;
};


const PhoneLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [callingCode, setCallingCode] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(Constcounty);
  const navigation = useNavigation();
  const [error, setError] = useState(""); // For error message

  useEffect(() => {
    getFcmToken()
  }, [])

  const getFcmToken = async () => {
    try {
      const fcmToken = await getMessaging().getToken();

      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        console.log('✅ FCM Token:', fcmToken);
        return fcmToken;
      } else {
        throw new Error('FCM Token not received');
      }

    } catch (error) {
      console.log(`❌ FCM Token Error: `, error);
      return null;
    }
  };

  useEffect(() => {
    if (searchText === "") {
      setFilteredCountries(Constcounty);
    } else {
      const filtered = Constcounty?.filter((c) =>
        c?.country?.toLowerCase().includes(searchText?.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchText]);
  const handleSelectCountry = (country: CountryOption) => {
    setCountryCode(country?.code);
    setCallingCode(country?.dial_code);
    setModalVisible(false);
    setSearchText(""); // reset search
  };
  const handleContinue = async () => {
    const trimmedNumber = phoneNumber.replace(/\D/g, ""); // Remove non-digit characters
    const userType = await AsyncStorage.getItem('selectedRole');
    // Validation
    if (!trimmedNumber) {
      setError(strings.PleaseEnterPhone);
      return;
    } else if (trimmedNumber.length < 6 || trimmedNumber.length > 15) {
      setError(strings.PleaseEnterValidPhone);
      return;
    }
    // Clear error if valid
    setError("");
    let data = {
      code: `${callingCode}`,
      phone: phoneNumber,
      navigation: navigation,
      type: userType
    }

    try {
      await LogiApi(data, setLoading);
    } catch (err) {
      console.log("API call error:", err);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBarComponent />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <LoadingModal visible={loading} />
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={imageIndex.phonLogoapp}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{strings?.PhoneQuestion}</Text>
          <Text style={styles.subtitle}>{strings?.PhoneSubtitle}</Text>
          {/* Phone Input */}
          <Text style={{
            fontSize: 15,
            marginBottom: 15,
            fontFamily: font.MonolithRegular,
          }}>{strings.PhoneNumber}</Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.countryPicker}>
              <Text style={styles.callingCode}>{callingCode}</Text>
              <Image
                source={imageIndex.dounArroww}
                style={{ height: 22, width: 22, marginLeft: 5 }}
              />
              <View style={styles.separator} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder={strings.PhoneNumber}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholderTextColor={"black"}
              returnKeyType="done"
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Continue Button */}
          <View style={{ marginTop: 20 }}>
            <CustomButton title={strings.Continue} onPress={handleContinue} />
          </View>

          {/* Custom Country Modal */}
          <Modal visible={modalVisible} animationType="slide" transparent={true}>
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => { }}>
                  <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{strings.SelectCountry}</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Text style={styles.modalCancel}>{strings.Cancel}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <TextInput
                      placeholder={strings.SearchCountry}
                      value={searchText}
                      onChangeText={setSearchText}
                      style={styles.searchInput}
                      placeholderTextColor={"#999"}
                    />

                    {/* Country List */}
                    <FlatList
                      data={filteredCountries}
                      keyExtractor={(item) => item.code}
                      showsVerticalScrollIndicator={false}
                      style={{ marginTop: 10 }}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.modalItem}
                          onPress={() => handleSelectCountry(item)}
                        >
                          <Text style={styles.countryText}>
                            {item.flag} {item.country} ({item.dial_code})
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default PhoneLogin;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 12, paddingTop: 45 },
  logoContainer: { justifyContent: "center", alignItems: "center", marginBottom: 50 },
  logo: { height: 96, width: 167 },
  title: { marginBottom: 5, fontSize: 22, color: "black", fontFamily: font.MonolithRegular, textAlign: "center" },
  subtitle: { fontFamily: font.MonolithRegular, fontSize: 14, textAlign: "center", color: "#9DB2BF", marginBottom: 30, marginTop: 10 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1.2, borderColor: "#FFCC00", borderRadius: 40, paddingHorizontal: 10, marginBottom: 20 },
  countryPicker: { marginRight: 5, alignItems: "center", flexDirection: "row" },
  callingCode: { fontSize: 16, color: "black", fontFamily: font.MonolithRegular },
  separator: { borderWidth: 0.5, height: 22, borderColor: "#FFCC00", marginLeft: 5 },
  input: { fontFamily: font.MonolithRegular, flex: 1, height: 55, fontSize: 16, marginLeft: 5, color: "black" },
  emailText: { color: "black", textAlign: "center", fontSize: 16, marginTop: 20, fontFamily: font.MonolithRegular },

  /* Modal Styles */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: {
    backgroundColor: "#fff",
    width: "88%",
    borderRadius: 18,
    maxHeight: "52%",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontFamily: font.MonolithRegular, fontSize: 18, color: "#000" },
  modalCancel: { fontFamily: font.MonolithRegular, fontSize: 15, color: "#FFCC00" },
  searchInput: { fontFamily: font.MonolithRegular, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: "#000" },
  modalItem: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  countryText: { fontSize: 16, color: "#000", fontFamily: font.MonolithRegular },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontSize: 14,
    fontFamily: font.MonolithRegular
  },
});
