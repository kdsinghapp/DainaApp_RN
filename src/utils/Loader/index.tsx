import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image
} from 'react-native';
import imageIndex from '../../assets/imageIndex';
import font from '../../theme/font';

const { width, height } = Dimensions.get('window');

// Your theme color
const THEME_COLOR = '#FFCC00';

const LoadingModal = ({ visible, message = "Loading..." }: any) => {
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const floatValue = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start all animations when modal becomes visible
      Animated.parallel([
        // Spinner rotation
        Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        // Fade in
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Scale up
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Floating animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatValue, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(floatValue, {
              toValue: 0,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ),
        // Dots pulsing animation
        Animated.loop(
          Animated.stagger(300, [
            createPulseAnimation(pulse1, 0),
            createPulseAnimation(pulse2, 200),
            createPulseAnimation(pulse3, 400),
          ])
        )
      ]).start();
    } else {
      // Reset animations when modal hides
      spinValue.setValue(0);
      fadeValue.setValue(0);
      scaleValue.setValue(0.8);
      floatValue.setValue(0);
      pulse1.setValue(0);
      pulse2.setValue(0);
      pulse3.setValue(0);
    }
  }, [visible]);

  const createPulseAnimation = (animatedValue, delay) => {
    return Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
  };

  // Interpolations for animations
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const float = floatValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const scale = scaleValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const dot1Scale = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const dot2Scale = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const dot3Scale = pulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeValue,
              transform: [
                { translateY: float },
                { scale: scale }
              ]
            }
          ]}
        >
          {/* Spinner container */}
          <View style={styles.spinnerContainer}>
            <Animated.View
              style={[
                styles.spinner,
                { transform: [{ rotate: spin }] }
              ]}
            >
              <View style={styles.spinnerInner} />
              <View style={styles.spinnerArc} />
            </Animated.View>

            {/* Central logo */}
            <View style={styles.centerIcon}>
              <View style={styles.logoPlaceholder}>
                <Image source={imageIndex.phonLogoapp}
                  resizeMode="stretch"
                  style={{

                    height: 33,
                    width: 33,

                  }} />
              </View>
            </View>
          </View>

          {/* <Text style={styles.message}>{message}</Text> */}

          {/* Progress dots */}
          {/* <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { transform: [{ scale: dot1Scale }] }]} />
            <Animated.View style={[styles.dot, { transform: [{ scale: dot2Scale }] }]} />
            <Animated.View style={[styles.dot, { transform: [{ scale: dot3Scale }] }]} />
          </View> */}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    // backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.7,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 10,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 15,
    // elevation: 10,
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.4,
    borderColor: '#E3E3E3',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  spinnerInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F8F8',
  },
  spinnerArc: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderLeftColor: THEME_COLOR,
    borderTopColor: THEME_COLOR,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  centerIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 12,
    fontFamily: font.MonolithRegular,

  },
  message: {
    fontSize: 15,
    color: '#708090',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: font.MonolithRegular
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLOR,
    marginHorizontal: 4,
  },
});

export default LoadingModal;