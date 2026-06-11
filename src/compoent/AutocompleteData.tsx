import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Image
} from "react-native";
import font from "../theme/font";
import imageIndex from "../assets/imageIndex";
import strings from "../localization/Localization";
import { GOOGLE_MAPS_APIKEY } from "../Api";


const AddressModalInput = ({ modalVisible, setModalVisible, value, onChange, onSelect }: any) => {
  const [searchText, setSearchText] = useState(value || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [countryCode] = useState("mn");

  useEffect(() => {
    if (modalVisible) {
      setSearchText(value || "");
      setSuggestions([]);
      setHasSearched(false);
    }
  }, [modalVisible, value]);

  /* 2. Fetch Suggestions with Country Filter */
  const fetchSuggestions = async (text: string) => {
    setSearchText(text);
    setHasSearched(true);

    if (!text.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Restriction added via &components=country:XX
      const countryFilter = countryCode ? `&components=country:${countryCode}` : "";
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_MAPS_APIKEY}&types=address${countryFilter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Autocomplete Error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (placeId: string, description: string) => {
    onChange?.(description);
    setModalVisible?.(false);
    setSuggestions([]);
    Keyboard.dismiss();

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        const location = data.result?.geometry?.location;
        if (location) {
          onSelect?.({
            address: description,
            latitude: location.lat,
            longitude: location.lng,
          });
        }
      }
    } catch (error) {
      console.log("Details Error:", error);
    }
  };

  return (
    <Modal
      visible={Boolean(modalVisible)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setModalVisible?.(false)}
    >
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>{strings.SearchAddress}</Text>
              {/* <Text style={styles.countryHint}>Searching in {countryCode.toUpperCase()}</Text> */}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible?.(false)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Image source={imageIndex.search1} style={styles.searchIconImg} />
            <TextInput
              style={styles.searchInput}
              placeholder={strings.EnterAddressPlaceholder}
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={fetchSuggestions}
              autoFocus={true}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Results */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFCC00" />
              <Text style={styles.loadingText}>{strings.SearchingNearby}</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelect(item.place_id, item.description)}
                >
                  <View style={styles.locationIcon}>
                    <Text>📍</Text>
                  </View>
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionPrimary}>
                      {item.structured_formatting?.main_text || item.description}
                    </Text>
                    <Text style={styles.suggestionSecondary} numberOfLines={1}>
                      {item.structured_formatting?.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                hasSearched && searchText.length > 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>{strings.NoResultsRegion}</Text>
                    {/* <Text style={styles.emptyStateText}>We only found addresses within {countryCode.toUpperCase()}.</Text> */}
                  </View>
                ) : null
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0", paddingTop: 50 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 15 },
  title: { fontSize: 20, fontFamily: font.MonolithRegular, color: "#000" },
  countryHint: { fontSize: 10, color: "#FFCC00", fontFamily: font.MonolithRegular, marginTop: 2 },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: 'center' },
  closeText: { fontSize: 16, color: "#333" },
  searchContainer: { padding: 20 },
  searchInputContainer: {
    backgroundColor: "white", borderRadius: 10, paddingHorizontal: 14, height: 48,
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#eee",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2
  },
  searchIconImg: { height: 20, width: 20 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: font.MonolithRegular, color: "#000", marginLeft: 10 },
  content: { flex: 1 },
  loadingContainer: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#666" },
  suggestionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 20 },
  locationIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0f7ff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  suggestionTextContainer: { flex: 1 },
  suggestionPrimary: { fontSize: 15, fontFamily: font.MonolithRegular, color: "#000" },
  suggestionSecondary: { fontSize: 13, fontFamily: font.MonolithRegular, color: "#777", marginTop: 2 },
  separator: { height: 1, backgroundColor: "#f0f0f0", marginLeft: 65 },
  emptyState: { flex: 1, marginTop: 50, alignItems: 'center', paddingHorizontal: 40 },
  emptyStateTitle: { fontSize: 16, fontFamily: font.MonolithRegular, color: '#000' },
  emptyStateText: { textAlign: 'center', color: '#666', marginTop: 5 }
});

export default AddressModalInput;
