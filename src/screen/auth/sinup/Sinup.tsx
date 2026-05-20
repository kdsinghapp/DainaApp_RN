import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { color } from '../../../constant';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import CustomButton from '../../../compoent/CustomButton';
import ScreenNameEnum from '../../../routes/screenName.enum';
import strings from '../../../localization/Localization';

// Define navigation type
type RootStackParamList = {
  Home: undefined;
};

const Sinup: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBarComponent backgroundColor={color.white} />
      <View style={styles.container}>
        <View style={styles.flexGrow} />
        <View style={styles.buttonContainer}>
          <CustomButton
            title={strings.CreateAccount}
            onPress={() => navigation.navigate(ScreenNameEnum.OnboardingScreen as any)}
          />
          <View style={styles.spacing} />
          <CustomButton
            style={{
              borderWidth: 1,
              backgroundColor: "white",
              borderColor: "#4CBCA6",
            }}
            textStyle={{
              color: color.primary,
            }}
            title={strings.AlreadyHaveAccount}
            onPress={() => navigation.navigate(ScreenNameEnum.OnboardingScreen as any)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 230
  },
  flexGrow: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center"
  },
  spacing: {
    height: 10,
  },
});

export default Sinup;
