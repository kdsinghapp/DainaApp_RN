// components/AppIcon.tsx
import React from 'react';
import { Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { color } from '../constant';

type IconProps = {
  source: ImageSourcePropType;
  size?: number;
  colorIcon?: string;
};

const Icon: React.FC<IconProps> = ({ source, size = 24, colorIcon = color.primary }) => {
  return (
    <Image
      source={source}
      style={[styles.icon, { width: size, height: size, tintColor: colorIcon }]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  icon: {
    tintColor: '#000',
  },
});

export default Icon;
