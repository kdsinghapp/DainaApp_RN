import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {
  CodeField,
  Cursor,
} from 'react-native-confirmation-code-field';
import CustomButton from '../../../compoent/CustomButton';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './style';
import { useOtpVerification } from './useOTPVerification';
import { color } from '../../../constant';
import CustomHeader from '../../../compoent/CustomHeader';
import LoadingModal from '../../../utils/Loader';
import strings from '../../../localization/Localization';
import font from '../../../theme/font';

export default function OtpScreen() {
  const {
    value,
    isLoading,
    errorMessage,
    ref,
    props,
    timer,
    getCellOnLayoutHandler,
    handleChangeText,
    handleVerifyOTP,
    handleResendOTP,
    data,
    phone
  } = useOtpVerification()
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}

    >

      <StatusBarComponent />
      <CustomHeader label={strings.Back} />
      <LoadingModal visible={isLoading} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={styles.txtHeading}>{strings.EnterVerificationCode}</Text>
            <Text style={styles.txtDes}>{strings.formatString(strings.SentCodeTo, `${data?.code} ${data?.mob}`)}
            </Text>
          </View>

          <View style={styles.otpFieldContainer}>
            <CodeField
              ref={ref}
              {...props}
              value={value}
              onChangeText={handleChangeText}
              cellCount={4}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <View key={index} style={styles.cellWrapper}>
                  <Text
                    style={[styles.cell, isFocused && styles.focusCell]}
                    onLayout={getCellOnLayoutHandler(index)}
                  >
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>
          <View style={{ alignItems: 'center', marginTop: 15 }}>
            {timer > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.txtDes}>{strings.ResendIn}</Text>
                <Text style={{
                  color: color.primary,
                  fontFamily: font.MonolithRegular,

                  marginLeft: 6
                }}>
                  {Math.floor(timer / 60).toString().padStart(2, '0')}:
                  {(timer % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} activeOpacity={0.7}>
                <Text style={{
                  color: color.primary, fontFamily: font.MonolithRegular,
                  textTransform: "uppercase",
                  textDecorationLine: 'underline'
                }}>
                  {strings?.ResendOTPButton}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        {/* <Image source={imageIndex.otp} style={{ width: '80%', height: hp(45), alignSelf: 'center', marginBottom: 30 }} /> */}

        <CustomButton
          title={strings.Continue}
          // onPress={() => {
          //   if (type == "signup") {
          //     navigation.navigate(ScreenNameEnum.LoginScreen)

          //   } else {
          //     navigation.navigate(ScreenNameEnum.PasswordReset)


          //   }
          // }
          // }
          onPress={handleVerifyOTP}
          style={styles.submitButton}
        />

      </View>
    </SafeAreaView>
  );
}