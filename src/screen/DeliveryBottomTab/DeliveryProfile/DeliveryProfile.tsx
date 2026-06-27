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
import { DeleteAccountApi, LogoutApi } from "../../../Api/apiRequest";
import DeleteAccountModal from "../../../compoent/DeleteAccountModal";
import { styles } from "./style";
import strings from "../../../localization/Localization";
import NewOrderNotificationModal from "../../../compoent/NewOrderNotificationModal";
import OfferAcceptedModal from "../../../compoent/OfferAcceptedModal";
import { color } from "../../../constant";
import Icon from 'react-native-vector-icons/Ionicons';
import StarIcon from 'react-native-vector-icons/MaterialIcons';
import font from "../../../theme/font";
import LoadingModal from "../../../utils/Loader";

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
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  secure?: boolean;
  destructive?: boolean;
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
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDanger]}>{label}</Text>
    </View>
    <Icon name="chevron-forward" size={18} color={destructive ? "#EF4444" : "#94A3B8"} />
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
  const token: any = useSelector<any>((state) => state?.auth?.token);
  const displayName = [isLogin?.firstName, isLogin?.lastName].filter(Boolean).join(" ") || isLogin?.name || user.name || "Driver";
  const ratingValue = Number(isLogin?.rating || 0);
  const roleLabel = isLogin?.type === 'Delivery' ? strings.Delivery : (isLogin?.type === 'User' ? strings.User : isLogin?.type || strings.Delivery);
  useEffect(() => {
    getProfileApi();
  }, []);

  const getProfileApi = async () => {
    try {
      const response = await GetProfileApi(setLoading);
      if (response) {
        dispatch(loginSuccess({ userData: response, token: token || response?.token || "" }));
      }
    } catch (error) {
      setLoading(false)

    }
  };
  const handleLogout = async () => {
    setModal(false);
    try {
      await LogoutApi(setLoading);
    } catch (error) {
      console.log('Logout API error:', error);
    }
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
        <View style={styles.headerRow}>


        </View>

        {/* Profile card */}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate(ScreenNameEnum.EditProfileDeliver)
          }}
          style={styles.profileCard}>
          <View style={styles.profileAccent} />
          <View style={styles.avatarWrap}>
            {isLogin?.image ? (
              <Image source={{ uri: isLogin?.image }} style={styles.avatar} />
            ) : (
              <Image source={imageIndex.prfile} style={styles.avatar} />
            )}
            <View style={styles.statusBadge}>
              <Icon name="checkmark" size={13} color="#111827" />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameLine}>
              <Text style={styles.name} numberOfLines={1}>{displayName}</Text>

            </View>
            {!!(isLogin?.email || user.email) && (
              <View style={styles.infoRow}>
                <Icon name="mail-outline" size={14} color="#64748B" />
                <Text style={styles.email} numberOfLines={1}>{isLogin?.email || user.email}</Text>
              </View>
            )}
            {!!isLogin?.phoneNumber && (
              <View style={styles.infoRow}>
                <Icon name="call-outline" size={14} color="#64748B" />
                <Text style={styles.email} numberOfLines={1}>{isLogin.phoneNumber}</Text>
              </View>
            )}
            <View style={styles.ratingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    name={ratingValue >= star ? "star" : (ratingValue >= star - 0.5 ? "star-half" : "star-border")}
                    size={16}
                    color={ratingValue >= star - 0.5 ? color.primary : "#CBD5E1"}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>
                {isLogin?.rating || 0} ({isLogin?.totalReviews || 0} {strings.ReviewsLabel})
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Menu */}
        <Text style={styles.sectionTitle}>{strings.Account || "Account"}</Text>
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
            icon={<Icon name="trash-outline" size={24} color={color.primary} />}
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
          <Icon name="log-out-outline" size={19} color="#EF4444" />
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
      {/* <LoadingModal visible={isLoading} /> */}
    </SafeAreaView>
  );
};

const ItemDivider = () => <View style={styles.divider} />;



export default DeliveryProfile;
