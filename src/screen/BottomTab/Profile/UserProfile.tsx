// UserProfile.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Share,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import font from "../../../theme/font";
import Icon from 'react-native-vector-icons/Ionicons';
import imageIndex from "../../../assets/imageIndex";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { useNavigation } from "@react-navigation/native";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import LogoutModal from "../../../compoent/LogoutModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { GetProfileApi } from "../../../Api/apiRequest";
import { loginSuccess, logout } from "../../../redux/feature/authSlice";
import LoadingModal from "../../../utils/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import strings from "../../../localization/Localization";
import { color } from "../../../constant";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { DeleteAccountApi } from "../../../Api/apiRequest";
import DeleteAccountModal from "../../../compoent/DeleteAccountModal";

const { width } = Dimensions.get("window");

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const StatItem = ({ label, value, icon, index }: any) => (
  <Animated.View
    entering={FadeInUp.delay(500 + index * 100).duration(600)}
    style={styles.statItem}
  >
    <View style={styles.statIconWrap}>
      {icon}
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Animated.View>
);

const MenuItem = ({ icon, label, onPress, index, isLast, destructive = false }: any) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
    opacity.value = withTiming(0.8);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1);
  };

  const handlePress = () => {
    ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
    onPress?.();
  };

  return (
    <View
      style={[animatedStyle, styles.menuItemContainer]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]}
      >
        <View style={styles.menuLeft}>
          <View style={styles.menuIconWrap}>
            {icon}
          </View>
          <Text style={[styles.menuLabel, destructive && styles.menuLabelDanger]}>{label}</Text>
        </View>
        <Icon name="chevron-forward" size={18} color={destructive ? "#EF4444" : "#94A3B8"} />
      </TouchableOpacity>
    </View>
  );
};

const ProfileScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const userData: any = useSelector<any>((state) => state?.auth?.userData);
  const token: any = useSelector<any>((state) => state?.auth?.token);
  const displayName = [userData?.firstName, userData?.lastName].filter(Boolean).join(" ") || userData?.name || "User";
  const accountType = userData?.type || strings?.Account || "Account";
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
      setLoading(false);
    }
  };

  const handleLogoutPress = () => {
    ReactNativeHapticFeedback.trigger("notificationSuccess", hapticOptions);
    dispatch(logout());
    navigation.replace(ScreenNameEnum.SPLASH_SCREEN);
  };

  const handleDeleteAccount = async () => {
    ReactNativeHapticFeedback.trigger("notificationSuccess", hapticOptions);
    const response = await DeleteAccountApi();
    if (response && (response.status === 1 || response.status === "1")) {
      setTimeout(() => {
        handleLogoutPress();
      }, 500);
    }
  };

  const handleShareApp = async () => {
    ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
    try {
      await Share.share({
        message: "Check out Daina App! A great app for delivery. Download it from the App Store or Play Store: https://play.google.com/store/apps/details?id=com.DainaApp",
      });
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.screenHeader}>

        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileTopAccent} />
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarGlow} />
              <Image
                source={userData?.image ? { uri: userData?.image } : imageIndex.prfile}
                style={styles.avatar}
              />
              <View style={styles.editBadge}>
                <Icon name="checkmark" size={14} color="#111827" />
              </View>
            </View>

            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{accountType}</Text>
                </View>
              </View>
              {!!userData?.email && (
                <View style={styles.profileInfoRow}>
                  <Icon name="mail-outline" size={14} color="#64748B" />
                  <Text style={styles.emailText} numberOfLines={1}>{userData.email}</Text>
                </View>
              )}
              {!!userData?.phoneNumber && (
                <View style={styles.profileInfoRow}>
                  <Icon name="call-outline" size={14} color="#64748B" />
                  <Text style={styles.emailText} numberOfLines={1}>{userData.phoneNumber}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{strings?.Account || "Account"}</Text>
            <View style={styles.card}>
              <MenuItem
                index={0}
                icon={<Icon name="person-outline" size={22} color={color.primary} />}
                label={strings.EditProfile}
                onPress={() => navigation.navigate(ScreenNameEnum.EditProfile)}
              />
              <MenuItem
                index={1}
                icon={<Icon name="language-outline" size={22} color={color.primary} />}
                label={strings.ChangeLanguage}
                onPress={() => navigation.navigate(ScreenNameEnum.language)}
              />
              {/* <MenuItem
                index={2}
                isLast
                icon={<Icon name="cart-outline" size={22} color={color.primary} />}
                label={strings.MyOrders}
                onPress={() => navigation.navigate(ScreenNameEnum.OrdersPrfile)}
              /> */}
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{strings?.Support}</Text>
            <View style={styles.card}>
              <MenuItem
                index={3}
                icon={<Icon name="shield-checkmark-outline" size={22} color={color.primary} />}
                label={strings.PrivacyPolicy}
                onPress={() => navigation.navigate(ScreenNameEnum.WebViewScreen, {
                  url: 'https://api.daina.tech/privacy-policy',
                  title: strings.PrivacyPolicy
                })}
              />

              <MenuItem
                index={4}
                icon={<Icon name="share-social-outline" size={22} color={color.primary} />}
                label={strings.ShareApp || "Suggest to others"}
                onPress={handleShareApp}
              />

              <MenuItem
                index={5}
                isLast
                icon={<Icon name="headset-outline" size={22} color={color.primary} />}
                label={strings.Support}
                onPress={() => navigation.navigate(ScreenNameEnum.WebViewScreen, {
                  url: 'https://api.daina.tech/support',
                  title: strings.Support
                })}
              />


              <MenuItem
                index={6}
                isLast

                icon={<Icon name="trash-outline" size={22} color={color.primary} />}
                label={strings.DeleteAccount}
                onPress={() => {
                  ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);
                  setDeleteModalVisible(true);
                }}
              />
            </View>
          </View>

          {/* Logout Button */}
          <View  >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);
                setModalVisible(true);
              }}
              style={styles.logoutBtn}
            >
              <Icon name="log-out-outline" size={19} color="#EF4444" />
              <Text style={styles.logoutText}>{strings.Logout}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <LogoutModal
        visible={modalVisible}
        onLogout={async () => {
          setModalVisible(false);
          handleLogoutPress();
        }}
        onCancel={() => setModalVisible(false)}
      />

      <DeleteAccountModal
        visible={deleteModalVisible}
        onDelete={async () => {
          setDeleteModalVisible(false);
          handleDeleteAccount();
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: hp(18),
    paddingTop: hp(1.5),
  },
  screenHeader: {
    marginHorizontal: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    fontSize: 25,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
  },
  headerEditBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 22,
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },

    }),
  },
  profileTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: color.primary,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  avatarWrap: {
    position: "relative",
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlow: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#FFF7CC",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.primary,
    borderWidth: 2,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",

  },
  editBadgeIcon: {
    width: 12,
    height: 12,
    tintColor: "#000",
  },
  nameSection: {
    marginLeft: 14,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  nameText: {
    flex: 1,
    fontSize: 20,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  typePill: {
    marginLeft: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typePillText: {
    fontSize: 10,
    color: "#475569",
    fontFamily: font.MonolithRegular,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  emailText: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
    marginLeft: 7,
    flex: 1,
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(255, 204, 0, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.primary,
    marginRight: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontFamily: font.MonolithRegular,
    color: color.primary,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#F1F5F9",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF9E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 9,
    fontFamily: font.MonolithRegular,
    color: "#94A3B8",
    marginTop: 1,

    letterSpacing: 0.5,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
      },

    }),
  },
  menuItemContainer: {
    width: "100%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  menuLabelDanger: {
    color: "#EF4444",
  },
  menuArrow: {
    width: 14,
    height: 14,
    tintColor: "#CBD5E1",
  },
  logoutBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexDirection: "row",
  },
  logoutText: {
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    color: "#EF4444",
    marginLeft: 8,
  },
  versionText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#94A3B8",
    letterSpacing: 1,
  },
});

export default ProfileScreen;
