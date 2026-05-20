import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  ZoomIn,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

import font from '../../../theme/font';
import strings from '../../../localization/Localization';
import ScreenNameEnum from '../../../routes/screenName.enum';
import { logout } from '../../../redux/feature/authSlice';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import { GetProfileApi, GetVerificationStatusApi } from '../../../Api/apiRequest';
import { loginSuccess } from '../../../redux/feature/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color } from '../../../constant';

const { width, height } = Dimensions.get('window');

const VerificationPending: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.2);
  const rotation = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2000 }),
        withTiming(0.2, { duration: 2000 })
      ),
      -1,
      false
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000 }),
      -1,
      false
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const animatedRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const statusRes = await GetVerificationStatusApi();
      const completion = statusRes?.completionStatus;

      if (!completion?.isProfileComplete) {
        navigation.replace(ScreenNameEnum.ProfileSetup);
      } else if (!completion?.isDocumentsUploaded) {
        navigation.replace(ScreenNameEnum.UploadDocumentsScreen);
      } else if (!completion?.isVehicleSetupComplete) {
        navigation.replace(ScreenNameEnum.VehicleSetupScreen);
      } else if (!completion?.isBankDetailsComplete) {
        navigation.replace(ScreenNameEnum.BankSetupScreen);
      } else if (statusRes?.verificationStatus !== 'in_review') {
        navigation.replace(ScreenNameEnum.DeliveryTabNavigator);
      }
    } catch (error) {
      console.log('Status check error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const statusRes = await GetVerificationStatusApi();
      const completion = statusRes?.completionStatus;

      if (!completion?.isProfileComplete) {
        navigation.replace(ScreenNameEnum.ProfileSetup);
      } else if (!completion?.isDocumentsUploaded) {
        navigation.replace(ScreenNameEnum.UploadDocumentsScreen);
      } else if (!completion?.isVehicleSetupComplete) {
        navigation.replace(ScreenNameEnum.VehicleSetupScreen);
      } else if (!completion?.isBankDetailsComplete) {
        navigation.replace(ScreenNameEnum.BankSetupScreen);
      } else if (statusRes?.verificationStatus !== 'in_review') {
        navigation.replace(ScreenNameEnum.DeliveryTabNavigator);
      } else {
        // Still in review, refresh profile data for any local updates
        const profileRes = await GetProfileApi(() => { });
        if (profileRes) {
          dispatch(loginSuccess({ userData: profileRes }));
        }
      }
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const handleLogout = async () => {
    dispatch(logout());
    await AsyncStorage.removeItem('authData');
    navigation.replace(ScreenNameEnum.SPLASH_SCREEN);
  };

  const TimelineStep = ({ title, desc, icon, isLast, status, delay }: any) => {
    const isActive = status === 'active';
    const isDone = status === 'done';

    return (
      <Animated.View entering={FadeInRight.delay(delay).springify()} style={styles.stepContainer}>
        <View style={styles.stepLeft}>
          <View style={[
            styles.stepIconBox,
            isDone && styles.stepIconBoxDone,
            isActive && styles.stepIconBoxActive
          ]}>
            <Icon
              name={isDone ? "checkmark" : icon}
              size={18}
              color={isDone ? "#FFF" : (isActive ? "#FFCC00" : "#94A3B8")}
            />
          </View>
          {!isLast && <View style={[styles.stepLine, isDone && styles.stepLineDone]} />}
        </View>
        <View style={styles.stepRight}>
          <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{title}</Text>
          <Text style={styles.stepDesc}>{desc}</Text>
          {isActive && (
            <Animated.View entering={FadeInDown.delay(delay + 200)} style={styles.activeLabel}>
              <View style={styles.blinkingDot} />
              <Text style={styles.activeLabelText}>{strings.InProgress}</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBarComponent backgroundColor="#FFFFFF" barStyle="dark-content" />



      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}

        style={{
          marginBottom: 15
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FFCC00"]} />
        }
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, {
          marginTop: 18
        }]}>
          <Animated.View style={[styles.bgRing, animatedRotationStyle]}>
            <View style={styles.ringDot} />
          </Animated.View>

          <View style={styles.illustrationWrap}>
            <Animated.View style={[styles.pulse1, animatedPulseStyle]} />
            <Animated.View style={[styles.pulse2, animatedPulseStyle]} />
            <Animated.View entering={ZoomIn.duration(800)} style={styles.iconCircle}>
              <Icon name="time" size={50} color="#FFCC00" />
            </Animated.View>
          </View>

          <Animated.View entering={FadeInUp.delay(300)} style={styles.statusChip}>
            <Text style={styles.statusChipText}>{strings.PendingApproval}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.titleWrap}>
            <Text style={styles.mainTitle}>{strings.VerificationPending}</Text>
            <Text style={styles.mainSubtitle}>
              {strings.VerificationPendingDesc}
            </Text>
          </Animated.View>
        </View>

        {/* Progress Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{strings.ReviewProgress}</Text>
          <View style={styles.timelineWrap}>
            <TimelineStep
              delay={600}
              icon="document-attach-outline"
              title={strings.DocumentsUploaded}
              desc={strings.DocumentsUploadedDesc}
              status="done"
            />
            <TimelineStep
              delay={800}
              icon="search-outline"
              title={strings.AdminVerification}
              desc={strings.AdminVerificationDesc}
              status="active"
            />
            <TimelineStep
              delay={1000}
              icon="shield-checkmark-outline"
              title={strings.BackgroundCheck}
              desc={strings.BackgroundCheckDesc}
              status="pending"
            />
            <TimelineStep
              delay={1200}
              isLast
              icon="rocket-outline"
              title={strings.ReadyForOrders}
              desc={strings.ReadyForOrdersDesc}
              status="pending"
            />
          </View>
        </View>

        {/* Tips Section */}
        <Animated.View entering={FadeInUp.delay(1400)} style={styles.tipsCard}>
          <View style={styles.tipsIcon}>
            <Icon name="bulb-outline" size={24} color="#FFCC00" />
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>{strings.DidYouKnow}</Text>
            <Text style={styles.tipsText}>
              {strings.VerificationTip}
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Footer */}
      <Animated.View entering={FadeInUp.delay(1600)} style={styles.footer}>
        <TouchableOpacity
          style={styles.mainBtn}
          onPress={onRefresh}
          activeOpacity={0.9}
        >
          <Text style={styles.mainBtnText}>{strings.RefreshStatus}</Text>
          {refreshing ? (
            <View style={{ marginLeft: 10 }}>
              <Icon name="sync" size={18} color="#000" />
            </View>
          ) : (
            <Icon name="refresh" size={18} color="#000" style={{ marginLeft: 10 }} />
          )}
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  illustrationWrap: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bgRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringDot: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCC00',
  },
  pulse1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFCC00',
  },
  pulse2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFCC00',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
    }),
  },
  statusChip: {
    backgroundColor: color.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: font.MonolithRegular,
    letterSpacing: 1.5,
    textTransform: "lowercase"

  },
  titleWrap: {
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 26,
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    marginBottom: 10,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: font.MonolithRegular,
    letterSpacing: 1,
    marginBottom: 20,
  },
  timelineWrap: {
    width: '100%',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  stepLeft: {
    alignItems: 'center',
    width: 30,
  },
  stepIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepIconBoxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepIconBoxActive: {
    borderColor: '#FFCC00',
    backgroundColor: '#FFFBEB',
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  stepLineDone: {
    backgroundColor: '#10B981',
  },
  stepRight: {
    flex: 1,
    marginLeft: 15,
    paddingBottom: 25,
  },
  stepTitle: {
    fontSize: 15,
    color: '#334155',
    fontFamily: font.MonolithRegular,
  },
  stepTitleActive: {
    color: '#0F172A',
  },
  stepDesc: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: font.MonolithRegular,
    marginTop: 2,
  },
  activeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeLabelText: {
    fontSize: 10,
    color: '#B45309',
    fontFamily: font.MonolithRegular,
    marginLeft: 6,
  },
  blinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFCC00',
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      }
    })
  },
  tipsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsContent: {
    flex: 1,
    marginLeft: 15,
  },
  tipsTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
  },
  tipsText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    lineHeight: 18,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  mainBtn: {
    backgroundColor: '#FFCC00',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FFCC00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }),
  },
  mainBtnText: {
    fontSize: 16,
    color: '#000',
    fontFamily: font.MonolithRegular,
  },
  secondaryBtn: {
    marginTop: 15,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    textDecorationLine: 'underline',
  },
});

export default VerificationPending;
