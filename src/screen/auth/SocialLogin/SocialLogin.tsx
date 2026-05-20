import React from 'react';
import { View, Text, Image, ImageBackground } from 'react-native';
import { styles } from './style';
import imageIndex from '../../../assets/imageIndex';
import CustomButton from '../../../compoent/CustomButton';
import ScreenNameEnum from '../../../routes/screenName.enum';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import useChooseRoleScreen from './useChooseRoleScreen';
import strings from '../../../localization/Localization';

const SocialLogin = () => {
  const {


    navigation } = useChooseRoleScreen()
  return (
    <ImageBackground style={styles.container}

      source={imageIndex.fram}
    >
      <StatusBarComponent />


      <View style={styles.buttonContainer}>
        <Image
          source={imageIndex.group}
          style={styles.logo}
          resizeMode="contain"
        />
        <CustomButton
          title={strings.ContinueWithNumber}
          bgColor="#FFCC00"
          txtcolor="#000"
          height={60}

          style={styles.button}
          leftIcon={
            <Image
              source={imageIndex.Mobile}
              style={styles.icon}
              resizeMode="contain"
            />
          }
          onPress={() => navigation.navigate(ScreenNameEnum.PhoneLogin)}
        />



        {/* <CustomButton
        title={strings.ContinueWithGoogle}
        bgColor="#fff"
        txtcolor="#000"
        height={60}
        style={styles.button}
        leftIcon={
          <Image
            source={imageIndex.google}
            style={styles.icon}
            resizeMode="contain"
          />
        }
      //  onPress={handleGoogleLogin}
      onPress={()=>navigation.navigate(ScreenNameEnum.PhoneLogin)}

          // onPress={() => navigation.navigate(ScreenNameEnum.GeneralInfo)}
        
      /> */}


      </View>
    </ImageBackground>
  );
};

export default SocialLogin;
