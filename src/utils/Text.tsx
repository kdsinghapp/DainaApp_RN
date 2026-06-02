import React from 'react';
import { StyleSheet, Text, PixelRatio } from 'react-native';

export const Size = {
  XXXSmall: 12,
  XXSmall: 14,
  XSmall: 16,
  Small: 15,
  Medium: 20,
  Large: 24,
  XLarge: 28,
  XXLarge: 30,
  XXXLarge: 34,
};

const TextCompoent = ({
  children,
  onTextLayout,
  numberOfLines,
  lineBreakMode,
  style,
  size = 14,
  color = '#0B040F',
  ellipsizeMode,
  adjustsFontSizeToFit = false,
  lineHeight,
}: any) => {
  const fs = PixelRatio.getFontScale();
  return (
    <Text
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      onTextLayout={onTextLayout}
      numberOfLines={numberOfLines}
      lineBreakMode={lineBreakMode}
      ellipsizeMode={ellipsizeMode}
      style={[
        styles.text,
        style,
        {
          fontSize: size / fs,
          color: color,
          lineHeight: lineHeight
            ? lineHeight
            : size && size > 0
              ? size + 8
              : undefined,
        },
      ]}>
      {children}
    </Text>
  );
};

export default TextCompoent;

const styles = StyleSheet.create({
  text: {
    fontFamily: 'opensans',
  },
});