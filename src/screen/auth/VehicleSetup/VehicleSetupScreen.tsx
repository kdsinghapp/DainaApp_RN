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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { pickDocument } from "../../../utils/documentPickerHelper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

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
  const route: any = useRoute();
  const hideHeaderBack = route?.params?.type === "header";
  const vehicleOptions = [
    { label: strings.Car, value: "Car", icon: "car" },
    { label: strings.Bike, value: "Bike", icon: "motorbike" },
    { label: strings.Van, value: "Van", icon: "van-passenger" },
    { label: strings.Truck, value: "Truck", icon: "truck-outline" }
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
      navigation.replace(
        ScreenNameEnum.BankSetupScreen,
        hideHeaderBack ? { type: "header" } : undefined,
      );
    }
  };

  const selectedVehicle = vehicleOptions.find(o => o.value === vehicleType);
  const registrationName = vehicleRegistration?.name || "registration_document";
  const isRegistrationPdf = vehicleRegistration?.type === "application/pdf";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader label={strings.VehicleSetup} hideLeftIcon={hideHeaderBack} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >


          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>{strings.VehicleInformation}</Text>

            <Text style={styles.fieldLabel}>{strings.VehicleType}</Text>
            <TouchableOpacity
              style={[styles.dropdown,]}
              onPress={() => setShowDropdown(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownLeft}>
                <View style={[styles.fieldIconBox, vehicleType && styles.fieldIconBoxActive]}>
                  <MaterialCommunityIcons
                    name={selectedVehicle?.icon || "car-outline"}
                    size={22}
                    color={vehicleType ? "#111827" : "#9CA3AF"}
                  />
                </View>
                <Text style={[styles.dropdownText,]}>
                  {selectedVehicle?.label || strings.SelectVehicleType}
                </Text>
              </View>
              <Image source={imageIndex.dounArroww} style={styles.arrowIcon} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>{strings.VehicleNumber}</Text>
            <View style={[styles.inputWrap,]}>
              <View style={[styles.fieldIconBox,]}>
                <MaterialCommunityIcons
                  name="card-text-outline"
                  size={21}
                  color={vehicleNumber ? "#111827" : "#9CA3AF"}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder={strings.EnterVehicleNumber}
                value={vehicleNumber}
                onChangeText={(text) => setVehicleNumber(text.toUpperCase())}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>

            <Text style={styles.fieldLabel}>{strings.UploadVehicleRegistration}</Text>
            <TouchableOpacity
              style={[styles.uploadBox, vehicleRegistration && styles.uploadBoxFilled]}
              onPress={handlePickDocument}
              activeOpacity={0.86}
            >
              {vehicleRegistration ? (
                <View style={styles.previewContainer}>
                  {isRegistrationPdf ? (
                    <View style={styles.pdfPreview}>
                      <Image source={imageIndex.document} style={styles.icon} />
                    </View>
                  ) : (
                    <Image source={{ uri: vehicleRegistration.uri }} style={styles.previewImage} />
                  )}
                  <View style={styles.previewOverlay}>
                    <View style={styles.previewInfo}>
                      <MaterialCommunityIcons
                        name={isRegistrationPdf ? "file-pdf-box" : "image-outline"}
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.previewName} numberOfLines={1}>
                        {registrationName}
                      </Text>
                    </View>
                    <View style={styles.changePill}>
                      <MaterialCommunityIcons name="pencil" size={13} color="#111827" />
                      <Text style={styles.changeText}>{strings.Change}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadEmpty}>
                  <View style={styles.uploadIconCircle}>
                    <Image
                      source={imageIndex.document}
                      style={styles.uploadIcon}
                    />
                  </View>
                  <Text style={styles.uploadText}>{strings.UploadVehicleRegistration}</Text>
                  <Text style={styles.uploadHint}>{strings.VehicleUploadHint}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Modal visible={showDropdown} transparent animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDropdown(false)}
            >
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>{strings.SelectVehicleType}</Text>
                </View>
                <FlatList
                  data={vehicleOptions}
                  renderItem={({ item }) => {
                    const isSelected = vehicleType === item.value;
                    return (
                      <TouchableOpacity
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                        onPress={() => {
                          setVehicleType(item.value);
                          setShowDropdown(false);
                        }}
                      >
                        <View style={styles.dropdownItemLeft}>
                          <View style={[styles.vehicleIconBox, isSelected && styles.vehicleIconBoxActive]}>
                            <MaterialCommunityIcons
                              name={item.icon}
                              size={22}
                              color={isSelected ? "#111827" : "#6B7280"}
                            />
                          </View>
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                            {item.label}
                          </Text>
                        </View>
                        {isSelected ? (
                          <MaterialCommunityIcons name="check-circle" size={22} color="#FFCC00" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(item) => item.value}
                  ItemSeparatorComponent={() => <View style={styles.dropdownSeparator} />}
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
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{strings.ChooseOption}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsDocModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity style={styles.optionItem} onPress={handleCamera}>
                <View style={[styles.optionIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="camera" size={26} color="#1E88E5" />
                </View>
                <View>
                  <Text style={styles.optionText}>{strings.Camera}</Text>
                  <Text style={styles.optionSubText}>{strings.TakeClearPhoto}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem} onPress={handleGallery}>
                <View style={[styles.optionIconContainer, { backgroundColor: '#F3E5F5' }]}>
                  <MaterialCommunityIcons name="image" size={26} color="#8E24AA" />
                </View>
                <View>
                  <Text style={styles.optionText}>{strings.Gallery || "Gallery"}</Text>
                  <Text style={styles.optionSubText}>{strings.ChooseFromPhone}</Text>
                </View>
              </TouchableOpacity>

              {vehicleRegistration ? (
                <TouchableOpacity style={styles.optionItem} onPress={handleRemove}>
                  <View style={[styles.optionIconContainer, { backgroundColor: '#FFEBEE' }]}>
                    <MaterialCommunityIcons name="delete" size={26} color="#E53935" />
                  </View>
                  <View>
                    <Text style={[styles.optionText, { color: '#E53935' }]}>{strings.Remove}</Text>
                    <Text style={styles.optionSubText}>{strings.RemoveSelectedDocument}</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </ReactNativeModal>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isLoading && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={styles.buttonText}>{strings.SaveAndContinue}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VehicleSetupScreen;
