import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { launchImageLibrary } from "react-native-image-picker";
import { openCamera } from "../../../utils/cameraHelper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import CustomInput from "../../../compoent/CustomInput";
import CustomButton from "../../../compoent/CustomButton";
import ImagePickerModal from "../../../compoent/ImagePickerModal";
import imageIndex from "../../../assets/imageIndex";
import { GetProfileApi, UpdateProfile } from "../../../Api/apiRequest";
import { loginSuccess } from "../../../redux/feature/authSlice";
import LoadingModal from "../../../utils/Loader";
import { errorToast } from "../../../utils/customToast";
import ScreenNameEnum from "../../../routes/screenName.enum";
import strings from "../../../localization/Localization";
import CurrentLocation from "../../../CurrentLocation";

const ProfileSetup = () => {
  const navigation = useNavigation<any>();
  const userData: any = useSelector((state: any) => state.auth.userData);
  const route: any = useRoute();
  const type = route?.params?.type;

  const [fullName, setFullName] = useState(userData?.firstName || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [address, setAddress] = useState(userData?.address || "");
  const [image, setImage] = useState<any>(userData?.image || null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const locationRef = useRef<any>(null);

  useEffect(() => {
    getProfileApi();
    setFullName(userData?.firstName || "");
    setEmail(userData?.email || "");
    setAddress(userData?.address || "");
    setImage(userData?.image || "");
  }, [userData?.firstName]);

  const getProfileApi = async () => {
    try {
      const response = await GetProfileApi(setIsLoading);
      if (response) {
        dispatch(loginSuccess({ userData: response }));
      }
    } catch (error) {
    }
  };

  const pickImageFromGallery = () => {
    launchImageLibrary({ mediaType: "photo", quality: 0.4 }, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.log("ImagePicker Error: ", response.errorMessage);
        errorToast(response.errorMessage || "Something went wrong");
      } else if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0]);
      }
    });
  };

  const takePhotoFromCamera = () => {
    openCamera((result) => {
      if ("cancelled" in result) return;
      if ("error" in result) {
        errorToast(result.error);
        return;
      }
      setImage(result.asset);
    });
  };

  const handleSave = async () => {
    try {
      if (!fullName?.trim()) {
        errorToast(strings.EnterFullNameError);
        return;
      }
      // if (!email || !email.trim()) {
      //   errorToast(strings.EnterEmailError);
      //   return;
      // }
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (!emailRegex.test(email.trim())) {
      //   errorToast(strings.ValidEmailError);
      //   return;
      // }

      if (!address?.trim()) {
        errorToast(strings.EnterAddressError);
        return;
      }

      // if (!image) {
      //   errorToast(strings.UploadProfileImageError);
      //   return;
      // }

      const params = {
        username: fullName,
        email: email,
        address: address,
        imagePrfoile: image,
      };

      const response = await UpdateProfile(params, setIsLoading);
      if (response) {
        await getProfileApi();
        if (userData?.type === "Delivery") {
          navigation.navigate(ScreenNameEnum.UploadDocumentsScreen, {
            type: "header"
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: ScreenNameEnum.TabNavigator }],
          });
        }
      }
    } catch (error) {
      console.error("Error while saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSkip = () => {
    if (userData?.type === "Delivery") {
      navigation.navigate(ScreenNameEnum.UploadDocumentsScreen);
    } else {
      navigation.navigate(ScreenNameEnum.TabNavigator);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const data = await locationRef.current?.fetchLocation();
      if (data && data.address) {
        setAddress(data.address);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBarComponent />
      <CustomHeader label={strings.Profile} />

      <CurrentLocation ref={locationRef} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileContainer}>
            <Image
              source={image ? { uri: image.uri || image } : imageIndex.prfile}
              style={styles.profileImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.editIconContainer}
              onPress={() => setIsModalVisible(true)}
            >
              <Image
                source={imageIndex.eoditphots}
                style={styles.editIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <CustomInput
                placeholder={strings.FullName}
                value={fullName}
                onChangeText={setFullName}
                leftIcon={<Image source={imageIndex.profiel} style={styles.icon} />}
              />
              <CustomInput
                placeholder={strings.Email}
                value={email}
                onChangeText={setEmail}
                leftIcon={<Image source={imageIndex.mess} style={styles.icon} />}
              />
              <CustomInput
                placeholder={strings.Address}
                value={address}
                onChangeText={setAddress}
                leftIcon={<Image source={imageIndex.location1} style={styles.icon} />}
                rightIcon={
                  <TouchableOpacity onPress={handleGetCurrentLocation}>
                    <Image source={imageIndex.locationpin} style={styles.icon} />
                  </TouchableOpacity>
                }
              />
            </View>
          </View>

          <ImagePickerModal
            modalVisible={isModalVisible}
            setModalVisible={setIsModalVisible}
            pickImageFromGallery={pickImageFromGallery}
            handleTakePhoto={takePhotoFromCamera}
          />
        </ScrollView>

        <View style={styles.buttonContainer}>
          <CustomButton title={strings.Update} onPress={handleSave} loading={isLoading} />
        </View>
        {/* {type === "otp" && (
          <View style={styles.buttonContainer}>
            <CustomButton title={strings.Skip} onPress={onSkip} />
          </View>
        )} */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    alignItems: "center",
    paddingVertical: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 20,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: "relative",
    bottom: 20,
    right: 0,
    padding: 5,
    left: 16
  },
  editIcon: {
    width: 33,
    height: 33,
  },
  inputContainer: {
    marginTop: 20,
    width: "90%",
  },
  icon: {
    width: 18,
    height: 18,
  },
  buttonContainer: {
    marginBottom: Platform.OS === 'ios' ? 10 : 30,
    marginHorizontal: 15,
  },
});

export default ProfileSetup;
