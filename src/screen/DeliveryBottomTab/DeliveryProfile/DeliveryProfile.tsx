// ProfileScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import imageIndex from "../../../assets/imageIndex";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { useNavigation } from "@react-navigation/native";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import LogoutModal from "../../../compoent/LogoutModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { GetProfileApi } from "../../../Api/apiRequest";
import { loginSuccess, logout } from "../../../redux/feature/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeleteAccountApi } from "../../../Api/apiRequest";
import DeleteAccountModal from "../../../compoent/DeleteAccountModal";
import { styles } from "./style";
import strings from "../../../localization/Localization";
import NewOrderNotificationModal from "../../../compoent/NewOrderNotificationModal";
import OfferAcceptedModal from "../../../compoent/OfferAcceptedModal";
import { color } from "../../../constant";
import Icon from 'react-native-vector-icons/Ionicons';
import StarIcon from 'react-native-vector-icons/MaterialIcons';
import font from "../../../theme/font";

type Props = {
  onEditProfile?: () => void;
  onAddress?: () => void;
  onOrders?: () => void;
  onChangePassword?: () => void;
  onPrivacyPolicy?: () => void;
  onTerms?: () => void;
  onLogout?: () => void;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
};


const ListItem = ({
  icon,
  label,
  onPress,
  secure = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  secure?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={styles.row}
  >
    <View style={styles.left}>
      <View style={[styles.iconWrap, secure && styles.secureIconWrap]}>
        {icon}
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Image
      source={imageIndex.right}
      style={{
        height: 18,
        width: 18,
        tintColor: "#CBD5E1"
      }}
    />
  </TouchableOpacity>
);

const DeliveryProfile: React.FC<Props> = ({

  user = {
    name: "",
    email: "",
    avatarUrl:
      "",
  },
}) => {
  const navigation: any = useNavigation()
  const [Modal, setModal] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const isLogin: any = useSelector<any>((state) => state?.auth?.userData);
  useEffect(() => {
    getProfileApi();
  }, []);

  const getProfileApi = async () => {
    try {
      const response = await GetProfileApi(setLoading);
      if (response) {
        dispatch(loginSuccess({ userData: response }));
      }
    } catch (error) {
      setLoading(false)

    }
  };
  const handleLogout = () => {
    setModal(false);
    dispatch(logout());
    AsyncStorage.removeItem('authData');
    navigation.replace(ScreenNameEnum.SPLASH_SCREEN);
  };

  const handleDeleteAccount = async () => {
    setDeleteModalVisible(false);
    const response = await DeleteAccountApi();
    if (response && (response.status === 1 || response.status === "1")) {
      dispatch(logout());
      setTimeout(async () => {
        await AsyncStorage.removeItem('authData');
        await AsyncStorage.removeItem('token');
        navigation.replace(ScreenNameEnum.SPLASH_SCREEN);
      }, 500);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBarComponent />
      <NewOrderNotificationModal />

      <OfferAcceptedModal />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          marginBottom: 80
        }}

        contentContainerStyle={styles.container}>
        {/* Header */}
        <Text style={styles.title}>{strings.Profile}</Text>

        {/* Profile card */}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate(ScreenNameEnum.EditProfileDeliver)
          }}
          style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {isLogin?.image ? (
              <Image source={{ uri: isLogin?.image }} style={styles.avatar} />
            ) : (
              <Image source={imageIndex.prfile} style={styles.avatar} />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{isLogin?.firstName || user.name}</Text>
            <Text style={styles.email}>{isLogin?.email || user.email}</Text>
            <Text style={styles.phoneNumber}>{isLogin?.phoneNumber || ""}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    name={Number(isLogin?.rating || 0) >= star ? "star" : (Number(isLogin?.rating || 0) >= star - 0.5 ? "star-half" : "star-border")}
                    size={16}
                    color={Number(isLogin?.rating || 0) >= star - 0.5 ? color.primary : "#CBD5E1"}
                  />
                ))}
              </View>
              <Text style={{
                fontSize: 12,
                fontFamily: font.MonolithRegular,
                color: "#64748B",
                marginLeft: 6
              }}>
                {isLogin?.rating || 0} ({isLogin?.totalReviews || 0} {strings.ReviewsLabel})
              </Text>
            </View>
            <Text style={styles.phoneNumber}>
              {isLogin?.type === 'Delivery' ? strings.Delivery : (isLogin?.type === 'User' ? strings.User : isLogin?.type)}
            </Text>
          </View>
          <Image source={imageIndex.right}
            style={{
              height: 20,
              width: 20,
              tintColor: "#CBD5E1"
            }}
          />
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.card}>
          <ListItem
            icon={<Icon name="document-text-outline" size={24} color={color.primary} />}
            label={strings.DocumentShow}
            onPress={() => {
              navigation.navigate(ScreenNameEnum.DocumentShow)
            }}
          />
          <ItemDivider />
          <ListItem
            icon={<Icon name="language-outline" size={24} color={color.primary} />}
            label={strings.ChangeLanguage}
            onPress={() => {
              navigation.navigate(ScreenNameEnum.language);
            }}
            secure
          />
          <ItemDivider />
          <ListItem
            icon={<Icon name="headset-outline" size={24} color={color.primary} />}
            label={strings.Support}
            onPress={() => {
              navigation.navigate(ScreenNameEnum.WebViewScreen, {
                url: 'https://api.daina.tech/support',
                title: strings.Support
              })
            }}
          />
          <ItemDivider />
          <ListItem
            icon={<Icon name="shield-checkmark-outline" size={24} color={color.primary} />}
            label={strings.PrivacyPolicy}
            onPress={() => {
              navigation.navigate(ScreenNameEnum.WebViewScreen, {
                url: 'https://api.daina.tech/privacy-policy',
                title: strings.PrivacyPolicy
              })
            }}
          />
          <ItemDivider />
          <ListItem
            icon={<Icon name="trash-outline" size={24} color="red" />}
            label={strings.DeleteAccount}
            onPress={() => {
              setDeleteModalVisible(true);
            }}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setModal(true)}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>{strings.Logout}</Text>
        </TouchableOpacity>

        {/* Logout */}

        <LogoutModal
          visible={Modal}
          onCancel={() => setModal(false)}
          onLogout={() => {
            handleLogout()
          }}
        />

        <DeleteAccountModal
          visible={deleteModalVisible}
          onDelete={async () => {
            handleDeleteAccount();

          }}
          onCancel={() => setDeleteModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const ItemDivider = () => <View style={styles.divider} />;



export default DeliveryProfile;
