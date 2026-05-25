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
import Icon from "react-native-vector-icons/Ionicons";
import font from "../theme/font";

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
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.selectedText,
            !activeValue && { color: "#94A3B8" },
          ]}
        >
          {activeValue
            ? data.find((item) => item.value === activeValue)?.label || activeValue
            : placeholder}
        </Text>
        <Icon name="chevron-down-outline" size={20} color="#64748B" />
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
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>{placeholder}</Text>
            </View>

            {search && (
              <View style={styles.searchContainer}>
                <Icon name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#94A3B8"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            )}

            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = activeValue === item.value;
                return (
                  <TouchableOpacity
                    style={[styles.item, isSelected && styles.itemSelected]}
                    onPress={() => {
                      setInternalValue(item.value);
                      onSelect(item.value);
                      setVisible(false);
                      setSearchText("");
                    }}
                  >
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={20} color="#B28E00" />
                    )}
                  </TouchableOpacity>
                );
              }}
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
  },
  dropdown: {
    height: 56,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center"
  },
  selectedText: {
    fontSize: 15,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    maxHeight: "65%",
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden"
  },
  dropdownHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  dropdownTitle: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#1E293B",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#F8FAFC",
  },
  itemSelected: {
    backgroundColor: "#FFFBE6",
  },
  itemText: {
    fontSize: 15,
    color: "#334155",
    fontFamily: font.MonolithRegular,
  },
  itemTextSelected: {
    color: "#B28E00",
  },
  noDataText: {
    textAlign: "center",
    color: "#94A3B8",
    paddingVertical: 20,
    fontFamily: font.MonolithRegular,
  },
});

export default CustomDropdown;
