import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  Pressable,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import strings from '../../../localization/Localization';
import { saveLanguage, getLanguage } from '../../../localization/localeStorage';
import font from '../../../theme/font';
import { color } from '../../../constant';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import ScreenNameEnum from '../../../routes/screenName.enum';
import { useDispatch } from 'react-redux';
import { setAppLanguage } from '../../../redux/feature/authSlice';
import CustomHeader from '../../../compoent/CustomHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import imageIndex from '../../../assets/imageIndex';
import SlideButton from '../../../compoent/SlideRightButton/SlideRightButton';
import { SetLanguageApi } from '../../../Api/apiRequest';
import LoadingModal from '../../../utils/Loader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LanguageItem = ({ item, isSelected, onSelect }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onSelect(item?.code)}
        style={[
          styles.languageItem,
          isSelected && styles.selectedItem,
        ]}
      >
        <View style={styles.flagContainer}>
          <Text style={styles.flagText}>{item?.flag}</Text>
        </View>

        <View style={styles.languageInfo}>
          <View style={styles.nameContainer}>
            <Text style={[
              styles.languageName,
              isSelected && styles.selectedText
            ]}>
              {item.name}
            </Text>
            {/* {item.code === 'en' && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )} */}
          </View>
          <Text style={styles.languageSubName}>{item.subName}</Text>
        </View>

        <View style={[
          styles.radioOutline,
          isSelected && styles.radioOutlineSelected
        ]}>
          {isSelected && (
            <View style={styles.checkIcon}>
              <View style={styles.checkStem} />
              <View style={styles.checkKick} />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const LanguageSelection = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const isFirstTime = route.params?.isFirstTime || false;
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const lang = await getLanguage();
    setSelectedLanguage(lang || 'en');
  };

  const handleLanguageSelect = async (lang: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedLanguage(lang);
    await saveLanguage(lang);
    strings.setLanguage(lang);
    dispatch(setAppLanguage(lang));
  };

  const onConfirm = async () => {
    const languageId = selectedLanguage === 'en' ? 1 : 2;
    const res = await SetLanguageApi({ languageId }, setLoading);
    console.log("Language Set API Response:", res);

    if (isFirstTime) {
      navigation.replace(ScreenNameEnum.OnboardingScreen);
    } else {
      navigation.goBack();
    }
  };

  const languages = [
    { code: 'en', name: 'English', subName: 'United States', flag: '🇺🇸' },
    { code: 'mn', name: 'Монгол', subName: 'Монгол Улс', flag: '🇲🇳' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LoadingModal visible={loading} />
      <StatusBarComponent />
      {isFirstTime ? null : <CustomHeader
        label={isFirstTime ? strings.SelectLanguage : strings.ChangeLanguage}
      />}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerImageContainer}>
          <Image
            source={imageIndex.phonLogoapp}
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          {/* <Text style={styles.title}>
            {isFirstTime ? strings.SelectLanguage : strings.ChangeLanguage}
          </Text> */}
          <Text style={styles.subtitle}>
            {isFirstTime
              ? strings.LanguageSelectionTitle
              : strings.LanguageSelectionUpdate}
          </Text>
        </View>

        <View style={styles.languageList}>
          {languages.map((item) => (
            <LanguageItem
              key={item.code}
              item={item}
              isSelected={selectedLanguage === item.code}
              onSelect={handleLanguageSelect}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isFirstTime ? (
          <SlideButton
            title={strings.Continue}
            onSlideSuccess={onConfirm}
          />
        ) : (
          <View style={{
            marginHorizontal: 15
          }}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {strings.Done || 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  headerImage: {
    width: 200,
    height: 150,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: font.MonolithRegular,
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7C7C7C',
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.6,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',

    marginBottom: 12,
  },
  selectedItem: {
    borderColor: color.primary,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.1,
  },
  flagContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  flagText: {
    fontSize: 26,
  },
  languageInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageName: {
    fontSize: 17,
    fontFamily: font.MonolithRegular,
    color: '#1A1A1A',
  },
  selectedText: {
    color: '#000',
    fontFamily: font.MonolithRegular,


  },
  recommendedBadge: {
    backgroundColor: '#E7F7F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,

  },
  recommendedText: {
    fontSize: 10,
    color: '#2CC59D',
    fontFamily: font.MonolithRegular,
  },
  languageSubName: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: font.MonolithRegular,
  },
  radioOutline: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOutlineSelected: {
    backgroundColor: color.primary,
  },
  checkIcon: {
    width: 14,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkStem: {
    position: 'absolute',
    width: 2,
    height: 7,
    backgroundColor: 'white',
    transform: [{ rotate: '45deg' }, { translateX: 2 }, { translateY: -1 }],
  },
  checkKick: {
    position: 'absolute',
    width: 2,
    height: 3,
    backgroundColor: 'white',
    transform: [{ rotate: '-45deg' }, { translateX: -2 }, { translateY: 1 }],
  },
  footer: {
    borderTopColor: '#F0F0F0',
    marginBottom: 14,
  },
  confirmButton: {
    backgroundColor: color.primary,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',


  },
  confirmButtonText: {
    color: '#000',
    fontSize: 17,
    fontFamily: font.MonolithRegular,
    letterSpacing: 0.5,
  },
});

export default LanguageSelection;


