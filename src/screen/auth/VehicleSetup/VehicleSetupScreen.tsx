import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { pickDocument } from "../../../utils/documentPickerHelper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import imageIndex from "../../../assets/imageIndex";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { DeliveryVehicleDocument } from "../../../Api/apiRequest";
import { errorToast } from "../../../utils/customToast";
import { styles } from "./style";
import strings from "../../../localization/Localization";
import ReactNativeModal from "react-native-modal";
import { openCamera } from "../../../utils/cameraHelper";
import { openGallery } from "../../../utils/galleryHelper";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const VehicleSetupScreen = () => {
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleRegistration, setVehicleRegistration] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<any>();
  const vehicleOptions = [
    { label: strings.Car, value: "Car" },
    { label: strings.Bike, value: "Bike" },
    { label: strings.Van, value: "Van" },
    { label: strings.Truck, value: "Truck" }
  ];

  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handlePickDocument = async () => {
    setIsDocModalVisible(true);
  };

  const handleSelectPDF = async () => {
    setPendingAction("pdf");
    setIsDocModalVisible(false);
  };

  const handleCamera = async () => {
    setPendingAction("camera");
    setIsDocModalVisible(false);
  };

  const handleGallery = async () => {
    setPendingAction("gallery");
    setIsDocModalVisible(false);
  };

  const onModalHide = async () => {
    if (!pendingAction) return;

    const action = pendingAction;
    setPendingAction(null);

    if (action === "camera") {
      await openCamera((result) => {
        if ("asset" in result && result.asset.uri) {
          const doc = {
            uri: result.asset.uri,
            name: result.asset.fileName || `img_${Date.now()}.jpg`,
            type: result.asset.type || "image/jpeg",
          };
          setVehicleRegistration(doc);
        }
      });
    } else if (action === "gallery") {
      const result = await openGallery();
      if ("asset" in result && result.asset.uri) {
        const doc = {
          uri: result.asset.uri,
          name: result.asset.fileName || `img_${Date.now()}.jpg`,
          type: result.asset.type || "image/jpeg",
        };
        setVehicleRegistration(doc);
      }
    } else if (action === "pdf") {
      const result = await pickDocument();
      if (result) {
        setVehicleRegistration(result);
      }
    }
  };

  const handleRemove = () => {
    setIsDocModalVisible(false);
    setVehicleRegistration(null);
  };

  const handleContinue = async () => {
    if (!vehicleType?.trim()) {
      errorToast(strings.SelectVehicleTypeError);
      return;
    }
    if (!vehicleNumber?.trim()) {
      errorToast(strings.EnterVehicleNumberError);
      return;
    }

    if (!vehicleRegistration) {
      errorToast(strings.UploadVehicleRegistrationError);
      return;
    }
    const params = {
      vehicleType,
      vehicleNumber,
      vehicleRegistration,
    };
    const response = await DeliveryVehicleDocument(params, setIsLoading);
    if (response?.status == "1") {
      navigation.replace(ScreenNameEnum.BankSetupScreen);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader label={strings.VehicleSetup} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownText, !vehicleType && { color: "#999" }]}>
            {vehicleType ? (vehicleOptions.find(o => o.value === vehicleType)?.label || vehicleType) : strings.SelectVehicleType}
          </Text>
          <Image
            source={imageIndex.dounArroww}
            style={{ height: 18, width: 18 }}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder={strings.EnterVehicleNumber}
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.uploadBox, vehicleRegistration && { paddingVertical: 0, height: 150 }]}
          onPress={handlePickDocument}
        >
          {vehicleRegistration ? (
            <View style={styles.previewContainer}>
              {vehicleRegistration.type === "application/pdf" ? (
                <View style={{ alignItems: "center" }}>
                  <Image source={imageIndex.document} style={styles.icon} />
                  <Text style={[styles.uploadText, { fontSize: 12, marginTop: 5 }]} numberOfLines={1}>
                    {vehicleRegistration.name}
                  </Text>
                </View>
              ) : (
                <Image source={{ uri: vehicleRegistration.uri }} style={styles.previewImage} />
              )}
              {/* <View style={styles.editBadge}>
                <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
              </View> */}
            </View>
          ) : (
            <>
              <Image
                source={imageIndex.document}
                style={{ width: 22, height: 22, tintColor: "#FFCC00" }}
              />
              <Text style={styles.uploadText}>{strings.UploadVehicleRegistration}</Text>
            </>
          )}
        </TouchableOpacity>

        <Modal visible={showDropdown} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <FlatList
                data={vehicleOptions}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setVehicleType(item.value);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.value}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>

      {/* Document Selection Modal */}
      <ReactNativeModal
        isVisible={isDocModalVisible}
        onModalHide={onModalHide}
        onBackdropPress={() => setIsDocModalVisible(false)}
        onBackButtonPress={() => setIsDocModalVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{strings.ChooseOption}</Text>
            <TouchableOpacity onPress={() => setIsDocModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TouchableOpacity style={styles.optionItem} onPress={handleCamera}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="camera" size={26} color="#1E88E5" />
              </View>
              <Text style={styles.optionText}>{strings.Camera}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={handleGallery}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#F3E5F5' }]}>
                <MaterialCommunityIcons name="image" size={26} color="#8E24AA" />
              </View>
              <Text style={styles.optionText}>{strings.Gallery || "Gallery"}</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.optionItem} onPress={handleSelectPDF}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={26} color="#FB8C00" />
              </View>
              <Text style={styles.optionText}>{strings.PDF}</Text>
            </TouchableOpacity> */}

            {vehicleRegistration ? (
              <TouchableOpacity style={styles.optionItem} onPress={handleRemove}>
                <View style={[styles.optionIconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <MaterialCommunityIcons name="delete" size={26} color="#E53935" />
                </View>
                <Text style={[styles.optionText, { color: '#E53935' }]}>{strings.Remove}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ReactNativeModal>

      <TouchableOpacity
        style={[styles.button, isLoading && { opacity: 0.7 }]}
        onPress={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={styles.buttonText}>{strings.SaveAndContinue}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default VehicleSetupScreen;