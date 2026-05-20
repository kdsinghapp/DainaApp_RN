import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import CustomInput from "../../../compoent/CustomInput";
import CustomButton from "../../../compoent/CustomButton";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { DeliveryBankSetup, GetVerificationStatusApi } from "../../../Api/apiRequest";
import { errorToast } from "../../../utils/customToast";
import strings from "../../../localization/Localization";
import font from "../../../theme/font";

const BankSetupScreen = () => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<any>();

  const handleFinish = async () => {
    if (!bankName.trim()) {
      errorToast(strings.EnterBankName);
      return;
    }
    if (!accountNumber.trim()) {
      errorToast(strings.EnterAccountNumber);
      return;
    }
    if (!ifscCode.trim()) {
      errorToast(strings.EnterIFSCCode);
      return;
    }

    const params = {
      bankName,
      bankAccountNumber: accountNumber,
      bankIfscCode: ifscCode,
    };

    const response = await DeliveryBankSetup(params, setIsLoading);
    if (response?.status == "1" || response?.status == 1) {
      navigation.replace(ScreenNameEnum.DeliveryTabNavigator);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader label={strings.BankSetup} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>{strings.BankSetup}</Text>
          <Text style={styles.subtitle}>Please provide your bank details for payments.</Text>
        </View>

        <View style={styles.inputSection}>
          <CustomInput
            placeholder={strings.EnterBankName}
            value={bankName}
            onChangeText={setBankName}
          />
          <CustomInput
            placeholder={strings.EnterAccountNumber}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
          />
          <CustomInput
            placeholder={strings.EnterIFSCCode}
            value={ifscCode}
            onChangeText={setIfscCode}
            autoCapitalize="characters"
          />
        </View>
      </ScrollView>

      <View style={styles.buttonWrapper}>
        <CustomButton
          title={strings.SaveAndFinish}
          onPress={handleFinish}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: font.MonolithRegular,
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: "#666",
    lineHeight: 20,
  },
  inputSection: {
    gap: 15,
  },
  buttonWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
});

export default BankSetupScreen;
