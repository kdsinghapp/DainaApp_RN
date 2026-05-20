import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Text,
} from 'react-native';
import Icon from './Icon';
import imageIndex from '../assets/imageIndex';
import font from '../theme/font';

interface CustomInputProps extends TextInputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntryToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  type?: string;
  onpress?: any,
  date?: string,
  placeholder: any
}

const CustomInput: React.FC<CustomInputProps> = ({
  leftIcon,
  secureTextEntryToggle = false,
  containerStyle,
  type = "input",
  onpress,
  date,
  rightIcon,
  placeholder,
  editable,
  ...rest
}) => {
  const [hidePassword, setHidePassword] = useState(secureTextEntryToggle);

  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

      {type == "date" ?
        <TouchableOpacity onPress={onpress} style={{ width: '93%', }}>
          <Text allowFontScaling={false} style={[styles.input, { width: '100%' }]}>{date}</Text>
        </TouchableOpacity>
        :

        <TextInput
          allowFontScaling={false}
          placeholder={placeholder}
          editable={editable}
          style={styles.input}
          placeholderTextColor="#8F8F8F"
          secureTextEntry={hidePassword}

          {...rest}
        />
      }

      {secureTextEntryToggle && (
        <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
          <Icon
            source={hidePassword ? imageIndex.Addressicone : imageIndex.Addressicone}
            size={20}
            colorIcon="#A59F9F"
          />
        </TouchableOpacity>
      )}

      {rightIcon && <View style={styles.leftIcon}>{rightIcon}</View>}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: '#F7F8F8',
    paddingHorizontal: 15,
    height: 60,
    marginTop: 15,
    borderColor: "#708090",
    width: "100%"
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 16,
    fontFamily: font.MonolithRegular,

  },
});

export default CustomInput;
