import React from "react";
import { View, TextInput, StyleSheet, Platform, StyleProp, ViewStyle, TextInputProps } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import font from "../theme/font";

interface SearchBarProps extends Omit<TextInputProps, "onChangeText"> {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  value,
  onChangeText,
  containerStyle,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Icon name="search-outline" size={20} color="#94A3B8" style={styles.icon} />
      <TextInput
        allowFontScaling={false}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="black"
        onChangeText={onChangeText}
        value={value}
        returnKeyType="search"
        clearButtonMode="while-editing"
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 55,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    paddingVertical: 0,
  },
});

export default SearchBar;
