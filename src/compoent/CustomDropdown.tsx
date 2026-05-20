import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { color } from "../constant";
import font from "../theme/font";
import imageIndex from "../assets/imageIndex";

interface DropdownItem {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  data: DropdownItem[];
  placeholder?: string;
  onSelect: (value: string) => void;
  leftIcon?: React.ReactNode;
  search?: boolean;
  selectedValue?: string | null;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  data,
  placeholder = "Select",
  onSelect,
  leftIcon,
  search = false,
  selectedValue,
}) => {
  const [internalValue, setInternalValue] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const activeValue = selectedValue !== undefined ? selectedValue : internalValue;

  const filteredData = data.filter((item) =>
    item.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dropdown, leftIcon && { paddingLeft: 40 }]}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[
            styles.selectedText,
            !activeValue && { color: "#ADA4A5", fontFamily: font.MonolithRegular },
          ]}
        >
          {activeValue
            ? data.find((item) => item.value === activeValue)?.label || activeValue
            : placeholder}
        </Text>
        <Image
          source={imageIndex.arrowqdown}
          style={{
            height: 22,
            width: 22,
          }}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            {search && (
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={setSearchText}
              />
            )}

            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    setInternalValue(item.value);
                    onSelect(item.value);
                    setVisible(false);
                    setSearchText("");
                  }}
                >
                  <Text style={styles.itemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noDataText}>No results found</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 15,
    marginBottom: 15
  },
  dropdown: {
    height: 55,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#F7F8F8",
    flexDirection: "row",
    alignItems: "center"
  },
  iconWrapper: {
    position: "absolute",
    left: 15,
  },
  selectedText: {
    fontSize: 16,
    color: "#000",
    fontFamily: font.MonolithRegular,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "60%",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    fontFamily: font.MonolithRegular,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  itemText: {
    fontSize: 16,
    color: "#000",
    fontFamily: font.MonolithRegular,
  },
  noDataText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 15,
    fontFamily: font.MonolithRegular,
  },
});

export default CustomDropdown;
