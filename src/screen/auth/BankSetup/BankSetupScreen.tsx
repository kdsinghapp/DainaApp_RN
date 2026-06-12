import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { DeliveryBankSetup } from "../../../Api/apiRequest";
import { errorToast } from "../../../utils/customToast";
import strings from "../../../localization/Localization";
import font from "../../../theme/font";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const BankSetupScreen = () => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<any>();
  const route: any = useRoute();
  const hideHeaderBack = route?.params?.type === "header";

  const handleFinish = async () => {
    if (!bankName.trim()) {
      errorToast(strings.EnterBankNameError);
      return;
    }
    if (!accountNumber.trim()) {
      errorToast(strings.EnterAccountNumberError);
      return;
    }
    if (!ifscCode.trim()) {
      errorToast(strings.EnterIFSCCodeError);
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

  const renderInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    icon,
    keyboardType = "default",
    autoCapitalize = "sentences",
  }: {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    icon: string;
    keyboardType?: "default" | "numeric";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
  }) => {
    const hasValue = !!value.trim();

    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.inputWrap, hasValue && styles.inputActive]}>
          <View style={[styles.fieldIconBox, hasValue && styles.fieldIconBoxActive]}>
            <MaterialCommunityIcons
              name={icon}
              size={21}
              color={hasValue ? "#111827" : "#9CA3AF"}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType="done"
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader label={strings.BankSetup} hideLeftIcon={hideHeaderBack} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >




          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.sectionTitle}>{strings.Banking}</Text>
                <Text style={styles.sectionSubtitle}>{strings.PayoutReady}</Text>
              </View>
              <View style={styles.cardIconSmall}>
                <MaterialCommunityIcons name="credit-card-check-outline" size={22} color="#111827" />
              </View>
            </View>

            {renderInput({
              label: strings.BankName,
              placeholder: strings.EnterBankName,
              value: bankName,
              onChangeText: setBankName,
              icon: "bank",
              autoCapitalize: "words",
            })}

            {renderInput({
              label: strings.AccountNumber,
              placeholder: strings.EnterAccountNumber,
              value: accountNumber,
              onChangeText: setAccountNumber,
              icon: "card-account-details-outline",
              keyboardType: "numeric",
              autoCapitalize: "none",
            })}

            {renderInput({
              label: strings.IFSCCode,
              placeholder: strings.EnterIFSCCode,
              value: ifscCode,
              onChangeText: (text) => setIfscCode(text.toUpperCase()),
              icon: "identifier",
              autoCapitalize: "characters",
            })}
          </View>
        </ScrollView>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleFinish}
            disabled={isLoading}
            activeOpacity={0.86}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Text style={styles.buttonText}>{strings.SaveAndFinish}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 18,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FFCC00",
    justifyContent: "center",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "62%",
  },
  statusText: {
    color: "#111827",
    fontSize: 11,
    marginLeft: 5,
    fontFamily: font.MonolithRegular,
  },
  title: {
    fontSize: 22,
    fontFamily: font.MonolithRegular,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#D1D5DB",
    lineHeight: 20,
    marginTop: 8,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 22,
    width: "70%",
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDone: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  progressActive: {
    backgroundColor: "#FFCC00",
    borderColor: "#FFCC00",
  },
  progressStepText: {
    color: "#111827",
    fontSize: 13,
    fontFamily: font.MonolithRegular,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
  },
  progressLineDone: {
    backgroundColor: "#22C55E",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#111827",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },

    }),
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontFamily: font.MonolithRegular,
  },
  sectionSubtitle: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 5,
    fontFamily: font.MonolithRegular,
  },
  cardIconSmall: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FFF7CC",
    justifyContent: "center",
    alignItems: "center",
  },
  fieldBlock: {
    marginBottom: 17,
  },
  fieldLabel: {
    color: "#4B5563",
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    marginBottom: 9,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 62,
    backgroundColor: "#F9FAFB",
  },
  inputActive: {
    borderColor: "#FFCC00",
    backgroundColor: "#FFFFFF",
  },
  fieldIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
    borderWidth: 1,
    borderColor: "#EEF0F3",
  },
  fieldIconBoxActive: {
    backgroundColor: "#FFF7CC",
    borderColor: "#FFE680",
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
    color: "#111827",
    fontFamily: font.MonolithRegular,
  },
  buttonWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 10 : 16,
    backgroundColor: "rgba(255,255,255,0.96)",

  },
  button: {
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFCC00",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: font.MonolithRegular,
  },
});

export default BankSetupScreen;
