import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { color } from '../constant';
import font from '../theme/font';

type AlignType = 'left' | 'center' | 'right';

interface CustomButtonProps {
  title: string;
  txtcolor?: string;
  bgColor?: string;
  leftIcon?: React.ReactNode;
  alignItm?: AlignType;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  height?: number;
  onPress?: (event: GestureResponderEvent) => void;
  disable?: boolean;
  loading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  txtcolor = '#000000',
  bgColor = color.primary,
  leftIcon,
  alignItm = 'center',
  style,
  textStyle,
  height = 55,
  onPress,
  disable = false,
  loading = false
}) => {
  const alignment: Record<AlignType, 'flex-start' | 'center' | 'flex-end'> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  const buttonStyle: StyleProp<ViewStyle> = {
    backgroundColor: bgColor,
    height: height,
    borderRadius: height / 1,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, buttonStyle, (disable || loading) && styles.disabledButton, style]}
      disabled={disable || loading}
    >
      <View style={[styles.content, { justifyContent: alignment[alignItm] }]}>
        {loading ? (
          <ActivityIndicator color={txtcolor} size="small" />
        ) : (
          <>
            {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
            <Text

              allowFontScaling={false}

              style={[styles.text, { color: txtcolor }, textStyle]}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: "#000",
    fontSize: 16,
    fontFamily: font.MonolithRegular
  },
});

export default CustomButton;
