import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import ScreenNameEnum from '../../../routes/screenName.enum';
import imageIndex from '../../../assets/imageIndex';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorToast } from '../../../utils/customToast';
import { styles } from './style';
import NotificationService from '../../../services/NotificationService';
import strings from '../../../localization/Localization';


const ChooseRole = () => {
  const [selected, setSelected] = useState<any>(null);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const options = [
    { id: 1, type: "user", label: strings.User, image: imageIndex.userLogo },
    { id: 2, type: "Delivery", label: strings.Delivery, image: imageIndex.deliver },
  ];

  useEffect(() => {
    // Smooth fade-in and scale animation on screen load
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelect = (item: any) => {
    setSelected(item);

    // Pulse animation on selection
    pulseAnim.setValue(1);
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.08,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 3,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = async () => {
    if (!selected) {
      errorToast(strings.PleaseSelectRole);
      return;
    }
    await NotificationService.requestPermission();
    await AsyncStorage.setItem('selectedRole', selected.type);
    navigation.navigate(ScreenNameEnum.PhoneLogin);
    // navigation.navigate(ScreenNameEnum.SocialLogin);
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBarComponent />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        < View
          style={[
            styles.container,

          ]}
        >
          {/* Header Image */}
          <Animated.Image
            source={imageIndex.phonLogoapp}
            style={[styles.image, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />

          {/* Title & Subtitle */}
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{strings.ChooseRole}</Text>
            <Text style={styles.subtitle}>{strings.PleaseSelectRole}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsWrap}>
            {options?.map((item) => {
              const isSelected = selected?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.touchContainer}
                  activeOpacity={0.9}
                  onPress={() => handleSelect(item)}
                >
                  <View
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,

                    ]}
                  >
                    <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                      <Image
                        source={item.image}
                        style={[
                          styles.optionIcon,
                          { tintColor: isSelected ? '#000' : '#FFCC00' },
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.optionDesc}>
                        {item.type === 'user' ? 'Send and track your parcels' : 'Deliver and earn with us'}
                      </Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleNext}
          style={[
            styles.nextButton,
            !selected && styles.nextButtonDisabled
          ]}
          disabled={!selected}
        >
          <Text style={[
            styles.nextButtonText,
            !selected && styles.nextButtonTextDisabled
          ]}>
            {strings.Continue}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChooseRole;
