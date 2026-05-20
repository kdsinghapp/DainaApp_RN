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

const MenuItem = ({ icon, label, onPress, index, isLast }: any) => {
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
    <Animated.View
      entering={FadeInRight.delay(600 + index * 50).duration(500)}
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
          <Text style={styles.menuLabel}>{label}</Text>
        </View>
        <Image
          source={imageIndex.rightaArrow}
          style={styles.menuArrow}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProfileScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const userData: any = useSelector<any>((state) => state?.auth?.userData);
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

  return (
    <View style={styles.container}>
      <StatusBarComponent />
      <LoadingModal visible={isLoading} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Animated.View entering={FadeInDown.delay(300)} style={styles.avatarWrap}>
              <View style={styles.avatarGlow} />
              <Image
                source={userData?.image ? { uri: userData?.image } : imageIndex.prfile}
                style={styles.avatar}
              />

            </Animated.View>

            <View style={styles.nameSection}>
              <Text style={styles.nameText}>{userData?.firstName || "User"}</Text>
              <Text style={styles.emailText}>{userData?.email || ""}</Text>
              <Text style={[styles.emailText, {
                color: color.primary
              }]}>{userData?.phoneNumber || ""}   </Text>

            </View>
          </View>


        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          <Animated.View entering={FadeInDown.delay(700)} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{strings?.Account}. {userData?.type}</Text>
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
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(850)} style={styles.sectionWrap}>
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
                icon={<Icon name="trash-outline" size={22} color="red" />}
                label={strings.DeleteAccount}
                onPress={() => {
                  ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);
                  setDeleteModalVisible(true);
                }}
              />
            </View>
          </Animated.View>

          {/* Logout Button */}
          <Animated.View entering={FadeInDown.delay(1000)}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);
                setModalVisible(true);
              }}
              style={styles.logoutBtn}
            >
              <Text style={styles.logoutText}>{strings.Logout}</Text>
            </TouchableOpacity>
          </Animated.View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: hp(20),
    paddingTop: hp(8),
  },
  profileCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 24,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#d6e1f9ff",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    position: "relative",
  },
  avatarGlow: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: color.primary,
    opacity: 0.5,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.primary,
    borderWidth: 3,
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
    marginLeft: 18,
    flex: 1,
  },
  nameText: {
    fontSize: 22,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  emailText: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
    marginTop: 2,
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
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#94A3B8",
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d6e1f9ff",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 0,
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
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  menuArrow: {
    width: 14,
    height: 14,
    tintColor: "#CBD5E1",
  },
  logoutBtn: {
    height: 60,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "red",
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

