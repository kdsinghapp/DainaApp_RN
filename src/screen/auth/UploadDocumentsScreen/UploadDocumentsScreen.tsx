import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { pickDocument } from "../../../utils/documentPickerHelper";
import imageIndex from "../../../assets/imageIndex";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import CustomButton from "../../../compoent/CustomButton";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeliveryUploadDocument } from "../../../Api/apiRequest";
import LoadingModal from "../../../utils/Loader";
import { errorToast } from "../../../utils/customToast";
import { styles } from "./style";
import strings from "../../../localization/Localization";
import Modal from "react-native-modal";
import { openCamera } from "../../../utils/cameraHelper";
import { openGallery } from "../../../utils/galleryHelper";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const UploadDocumentsScreen = () => {
  const [idDoc, setIdDoc] = useState<any>(null);
  const [licenseDoc, setLicenseDoc] = useState<any>(null);
  const [vehicleDoc, setVehicleDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation: any = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handlePickDocument = async (type: string) => {
    setActiveType(type);
    setIsModalVisible(true);
  };

  const handleCamera = () => {
    setPendingAction("camera");
    setIsModalVisible(false);
  };

  const handleGallery = () => {
    setPendingAction("gallery");
    setIsModalVisible(false);
  };

  const handleSelectPDF = () => {
    setPendingAction("pdf");
    setIsModalVisible(false);
  };

  const onModalHide = async () => {
    if (!pendingAction) return;

    const action = pendingAction;
    setPendingAction(null);

    if (action === "camera") {
      await openCamera((result) => {
        if ("asset" in result && result.asset.uri && activeType) {
          const doc = {
            uri: result.asset.uri,
            name: result.asset.fileName || `img_${Date.now()}.jpg`,
            type: result.asset.type || "image/jpeg",
          };
          if (activeType === "id") setIdDoc(doc);
          if (activeType === "license") setLicenseDoc(doc);
          if (activeType === "vehicle") setVehicleDoc(doc);
        }
      });
    } else if (action === "gallery") {
      const result = await openGallery();
      if ("asset" in result && result.asset.uri && activeType) {
        const doc = {
          uri: result.asset.uri,
          name: result.asset.fileName || `img_${Date.now()}.jpg`,
          type: result.asset.type || "image/jpeg",
        };
        if (activeType === "id") setIdDoc(doc);
        if (activeType === "license") setLicenseDoc(doc);
        if (activeType === "vehicle") setVehicleDoc(doc);
      }
    } else if (action === "pdf") {
      const result = await pickDocument();
      if (result && activeType) {
        if (activeType === "id") setIdDoc(result);
        if (activeType === "license") setLicenseDoc(result);
        if (activeType === "vehicle") setVehicleDoc(result);
      }
    }
  };

  const handleRemove = () => {
    setIsModalVisible(false);
    if (activeType === "id") setIdDoc(null);
    if (activeType === "license") setLicenseDoc(null);
    if (activeType === "vehicle") setVehicleDoc(null);
  };

  const handleContinue = async () => {
    if (!idDoc || !licenseDoc || !vehicleDoc) {
      errorToast(strings.UploadDocumentsError);
      return;
    }


    const params = {
      idDocument: idDoc,
      drivingLicense: licenseDoc,
      vehiclePapers: vehicleDoc,

    };
    const response = await DeliveryUploadDocument(params, setIsLoading);
    console.log("response status ", JSON.stringify(response));
    if (response && response.status == "1") {
      navigation.replace(ScreenNameEnum.VehicleSetupScreen);
    }
  };







  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader
        label={strings.UploadDocuments}
        leftPress={() => navigation.goBack()}
      />
      <LoadingModal visible={isLoading} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* ID Document */}
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => handlePickDocument("id")}
        >
          {idDoc ? (
            <View style={styles.previewContainer}>
              {idDoc.type === "application/pdf" ? (
                <View style={{ alignItems: "center" }}>
                  <Image source={imageIndex.document} style={styles.icon} />
                  <Text style={[styles.placeholderText, { fontSize: 12 }]} numberOfLines={1}>
                    {idDoc.name}
                  </Text>
                </View>
              ) : (
                <Image source={{ uri: idDoc.uri }} style={styles.previewImage} />
              )}
              {/* <View style={styles.editBadge}>
                <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
              </View> */}
            </View>
          ) : (
            <>
              <Image source={imageIndex.document} style={styles.icon} />
              <Text style={styles.placeholderText}>{strings.UploadIdDocument}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Driving License */}
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => handlePickDocument("license")}
        >
          {licenseDoc ? (
            <View style={styles.previewContainer}>
              {licenseDoc.type === "application/pdf" ? (
                <View style={{ alignItems: "center" }}>
                  <Image source={imageIndex.document} style={styles.icon} />
                  <Text style={[styles.placeholderText, { fontSize: 12 }]} numberOfLines={1}>
                    {licenseDoc.name}
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: licenseDoc.uri }}
                  style={styles.previewImage}
                />
              )}
              {/* <View style={styles.editBadge}>
                <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
              </View> */}
            </View>
          ) : (
            <>
              <Image source={imageIndex.document} style={styles.icon} />
              <Text style={styles.placeholderText}>{strings.UploadDrivingLicense}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Vehicle Papers */}
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => handlePickDocument("vehicle")}
        >
          {vehicleDoc ? (
            <View style={styles.previewContainer}>
              {vehicleDoc.type === "application/pdf" ? (
                <View style={{ alignItems: "center" }}>
                  <Image source={imageIndex.document} style={styles.icon} />
                  <Text style={[styles.placeholderText, { fontSize: 12 }]} numberOfLines={1}>
                    {vehicleDoc.name}
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: vehicleDoc.uri }}
                  style={styles.previewImage}
                />
              )}
              {/* <View style={styles.editBadge}>
                <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
              </View> */}
            </View>
          ) : (
            <>
              <Image source={imageIndex.document} style={styles.icon} />
              <Text style={styles.placeholderText}>{strings.UploadVehiclePapers}</Text>
            </>
          )}
        </TouchableOpacity>


      </ScrollView>

      {/* Selection Modal */}
      <Modal
        isVisible={isModalVisible}
        onModalHide={onModalHide}
        onBackdropPress={() => setIsModalVisible(false)}
        onBackButtonPress={() => setIsModalVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{strings.ChooseOption}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
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
              <Text style={styles.optionText}>{strings.Gallery || ""}</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.optionItem} onPress={handleSelectPDF}>
              <View style={[styles.optionIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={26} color="#FB8C00" />
              </View>
              <Text style={styles.optionText}>{strings.PDF}</Text>
            </TouchableOpacity> */}

            {(activeType === 'id' && idDoc) || (activeType === 'license' && licenseDoc) || (activeType === 'vehicle' && vehicleDoc) ? (
              <TouchableOpacity style={styles.optionItem} onPress={handleRemove}>
                <View style={[styles.optionIconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <MaterialCommunityIcons name="delete" size={26} color="#E53935" />
                </View>
                <Text style={[styles.optionText, { color: '#E53935' }]}>{strings.Remove}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>

      <View style={styles.buttonWrapper}>
        <CustomButton title={strings.Continue} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
};

export default UploadDocumentsScreen;
