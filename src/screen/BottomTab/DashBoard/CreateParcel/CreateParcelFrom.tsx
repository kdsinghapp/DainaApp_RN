import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { launchImageLibrary } from "react-native-image-picker";
import { openCamera } from "../../../../utils/cameraHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import font from "../../../../theme/font";
import ImagePickerModal from "../../../../compoent/ImagePickerModal";
import AddressModalInput from "../../../../compoent/AutocompleteData";
import CustomButton from "../../../../compoent/CustomButton";
import imageIndex from "../../../../assets/imageIndex";
import CustomDropdown from "../../../../compoent/CustomDropdown";
import ScreenNameEnum from "../../../../routes/screenName.enum";
import StatusBarComponent from "../../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../../compoent/CustomHeader";
import LoadingModal from "../../../../utils/Loader";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddParcelApi } from "../../../../Api/apiRequest";
import { styles } from "./style";
import { errorToast, successToast } from "../../../../utils/customToast";
import strings from "../../../../localization/Localization";

const CreateParcelFrom = () => {
  const navgatoon = useNavigation()
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [shipmentType, setShipmentType] = useState("");
  const [consignmentType, setConsignmentType] = useState("document");
  const [deliveryType, setDeliveryType] = useState("normal");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupLat, setpickupLat] = useState<{ latitude: number; longitude: number } | null>(null);
  const [droplat, sedroplat] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropLocation, setDropLocation] = useState("");
  const [dropModal, setDropModal] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderMobile, setSenderMobile] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [extraMessage, setExtraMessage] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<any>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const pickImageFromGallery = () => {
    launchImageLibrary({ mediaType: "photo" }, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.log("ImagePicker Error: ", response.errorMessage);
        errorToast(response.errorMessage || "Something went wrong");
      } else if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0]);
      }
    });
  };
  // Validation states
  const [errors, setErrors] = useState({
    pickupLocation: "",
    dropLocation: "",
    shipmentType: "",
    senderName: "",
    senderMobile: "",
    pickupDate: "",
    pickupTime: "",
    consignmentType: "",
    deliveryType: "",
    price: "",
    receiverName: "",
    receiverMobile: "",
  });

  // Dropdown data
  const shipmentTypeData = [
    { label: strings.Standard, value: "standard" },
    { label: strings.Express, value: "express" },
  ];
  const consignmentTypeData = [
    { label: strings.DocumentLabel, value: "document" },
    { label: strings.ParcelLabel, value: "parcel" },
  ];
  const deliveryTypeData = [
    { label: strings.Normal, value: "normal" },
    { label: strings.Fast, value: "fast" },
  ];

  const [packageSize, setPackageSize] = useState("");

  // Validation functions
  const validateField = (fieldName: string, value: any): boolean => {
    let error = "";

    switch (fieldName) {
      // case "senderName":
      // case "receiverName":
      //   if (!value.trim()) error = "This field is required";

      // case "senderMobile":
      // case "receiverMobile":
      //   if (!value.trim()) error = "Mobile number is required";
      //   break;

      // case "senderAddress":
      // case "receiverAddress":
      //   if (!value.trim()) error = "This field is required";
      //   break;

      case "pickupLocation":
        if (!value || !value.address) error = strings.PickupLocationRequired;
        break;

      case "dropLocation":
        if (!value.trim()) error = strings.DropLocationRequired;
        break;

      // case "price":
      //   if (!value.trim()) error = "Price is required";
      //   break;

      // case "shipmentType":
      // case "consignmentType":
      // case "deliveryType":
      //   if (!value.trim()) error = "Please select an option";
      //   break;

      // case "pickupDate":
      //   if (!value) error = "Pickup date is required";
      //   else if (value < new Date()) error = "Pickup date cannot be in the past";
      //   break;

      // case "pickupTime":
      //   if (!value) error = "Pickup time is required";
      //   break;

      // case "image":
      //   if (!value) error = "Please add a parcel image";
      //   break;

      // default:
      //   break;
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return error === "";
  };

  const validateForm = () => {
    const fieldsToValidate = {
      pickupLocation,
      dropLocation,
      shipmentType,
      senderName,
      senderMobile,
      senderAddress,
      pickupDate: pickupDate ? "hasValue" : "",
      pickupTime: pickupTime ? "hasValue" : "",
      consignmentType,
      deliveryType,
      price,
      receiverName,
      receiverMobile,

      receiverAddress,
    };

    let isValid = true;

    Object.entries(fieldsToValidate).forEach(([fieldName, value]) => {
      if (!validateField(fieldName, value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const formDataObj = {
        shipmentType,
        senderName,
        senderMobile,
        senderAddress,
        pickupDate,
        pickupTime,
        consignmentType,
        packageSize,
        deliveryType,
        price,
        receiverName,
        receiverMobile,
        receiverAddress,
        extraMessage,
        pickupLat,
        droplat,
        pickupLocation,
        dropLocation,
        image
      };
      const response = await AddParcelApi(formDataObj, setIsLoading);
      console.log("response -- create ", response)
      if (response && (response.status == "1" || response.status == 1)) {
        navgatoon.replace(ScreenNameEnum.NearbyDriversMap, {
          parcelId: response,
          pickupLocation: pickupLocation?.address
        });
      }
    } else {
      console.log("Form has validation errors");

      const firstErrorField = Object.keys(errors).find(key => errors[key]);
      if (firstErrorField) {
        console.log(`First error in: ${firstErrorField}`);
        // scrollToErrorField(firstErrorField);
      }

      errorToast(strings.FillRequiredFieldsError);
    }
  };



  const handleInputChange = (fieldName: string, value: string) => {
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }

    // Update the corresponding state
    switch (fieldName) {
      case "senderName":
        setSenderName(value);
        break;
      case "senderMobile":
        setSenderMobile(value);
        break;
      case "senderAddress":
        setSenderAddress(value);
        break;
      case "receiverName":
        setReceiverName(value);
        break;
      case "receiverMobile":
        setReceiverMobile(value);
        break;
      case "receiverAddress":
        setReceiverAddress(value);
        break;
      case "price":
        setPrice(value);
        break;
      default:
        break;
    }
  };

  const handleDropdownSelect = (fieldName: string, value: string) => {
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }

    switch (fieldName) {
      case "shipmentType":
        setShipmentType(value);
        break;
      case "consignmentType":
        setConsignmentType(value);
        break;
      case "deliveryType":
        setDeliveryType(value);
        break;
      default:
        break;
    }
  };

  const handleLocationSelect = (type: 'pickup' | 'drop', item: any) => {
    const fieldName = type === 'pickup' ? 'pickupLocation' : 'dropLocation';

    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }

    if (type === 'pickup') {
      // setPickupLocation(item.address || item.name || "Pickup Location");
      // setpickupLat({
      //   latitude: item.latitude,
      //   longitude: item.longitude,
      // });
    } else {
      // setDropLocation(item.address || item.name || "Drop Location");
      sedroplat({
        latitude: item.latitude,
        longitude: item.longitude,
      });
    }
  };
  const takePhotoFromCamera = () => {
    openCamera((result) => {
      if ("cancelled" in result) return;
      if ("error" in result) {
        errorToast(result.error);
        return;
      }
      setImage(result.asset);
    });
  };

  useEffect(() => {
    const fetchPickupLocation = async () => {
      try {
        setIsLoading(true);
        const storedLocation = await AsyncStorage.getItem('pickupLocation');

        if (storedLocation) {
          const location1 = JSON.parse(storedLocation);

          // Update states
          setPickupLocation(location1);
          setSenderAddress(location1?.address)
          setpickupLat({
            latitude: location1.latitude,
            longitude: location1.longitude,
          });

          console.log("Fetched address:", location1.address);
        }
      } catch (error) {
        console.error('Error fetching pickup location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPickupLocation();
  }, []); // Runs on mount




  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: "white"
    }}>
      <StatusBarComponent />
      <CustomHeader label={strings.CreateParcel}
      />
      <LoadingModal visible={isLoading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : 'height'} // undefined often works best for Android with adjustResize
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.container}
        >
          {/* Pickup & Drop */}
          <Text style={styles.sectionTitle}>{strings.PickupAndDrop}</Text>

          <TouchableOpacity
            onPress={() =>
              navgatoon.navigate(ScreenNameEnum.PickupLocationRapido, {
                onLocationSelect: (data) => {
                  setPickupLocation(data);
                }
              })
            }
            style={[styles.input, { height: "auto", minHeight: 55, paddingVertical: 12 }, errors.pickupLocation ? styles.inputError : null]}
          >
            <Text style={{
              color: pickupLocation?.address ? "black" : "#ADA4A5",
              fontSize: 15,
              fontFamily: font.MonolithRegular,
              flex: 1,
              paddingRight: 10,
            }}>
              {pickupLocation ? pickupLocation?.address : strings.AddPickupLocation}
            </Text>
            <Image style={{
              height: 22,
              width: 22,
              resizeMode: "contain"
            }} source={imageIndex.location1} />
          </TouchableOpacity>
          {errors.pickupLocation ? <Text style={styles.errorText}>{errors.pickupLocation}</Text> : null}

          <TouchableOpacity
            onPress={() =>
              navgatoon.navigate(ScreenNameEnum.PickupLocationRapido, {
                onLocationSelect: (data) => {
                  setDropLocation(data?.address);
                  sedroplat({
                    latitude: data?.latitude,
                    longitude: data?.longitude,
                  });

                }
              })
            }
            style={[styles.input, { height: "auto", minHeight: 55, paddingVertical: 12 }, errors.dropLocation ? styles.inputError : null]}
          >
            <Text style={{
              color: dropLocation ? "black" : "#ADA4A5",
              fontSize: 15,
              fontFamily: font.MonolithRegular,
              flex: 1,
              paddingRight: 10,
            }}>
              {dropLocation ? dropLocation : strings.AddDropLocation}
            </Text>
            <Image style={{
              height: 22,
              width: 22,
              resizeMode: "contain"
            }} source={imageIndex.location1} />
          </TouchableOpacity>
          {errors.dropLocation ? <Text style={styles.errorText}>{errors.dropLocation}</Text> : null}

          {/* Shipment & Sender Details */}
          <Text style={styles.sectionTitle}>{strings.ShipmentSenderDetails}</Text>

          <CustomDropdown
            data={shipmentTypeData}
            placeholder={strings.ShipmentType}
            selectedValue={shipmentType}
            onSelect={(value) => handleDropdownSelect("shipmentType", value)}
          />
          {errors.shipmentType ? <Text style={styles.errorText}>{errors.shipmentType}</Text> : null}

          <TextInput
            placeholderTextColor={"#ADA4A5"}
            value={senderName}
            onChangeText={(value) => handleInputChange("senderName", value)}
            style={[styles.input, errors.senderName ? styles.inputError : null]}
            placeholder={strings.SenderName}
          />
          {errors.senderName ? <Text style={styles.errorText}>{errors.senderName}</Text> : null}

          <TextInput
            style={[styles.input, errors.senderMobile ? styles.inputError : null]}
            placeholder={strings.SenderMobileNumber}
            keyboardType="phone-pad"
            placeholderTextColor="#ADA4A5"
            value={senderMobile}
            onChangeText={(value) => handleInputChange("senderMobile", value)}
            maxLength={10}
          />
          {errors.senderMobile ? <Text style={styles.errorText}>{errors.senderMobile}</Text> : null}

          {/* <TextInput
            placeholderTextColor={"#ADA4A5"}
            value={senderAddress}
            onChangeText={(value) => handleInputChange("senderAddress", value)}
            style={[styles.input, errors.senderAddress ? styles.inputError : null]}
            placeholder="Sender Address"
          />
          {errors.senderAddress ? <Text style={styles.errorText}>{errors.senderAddress}</Text> : null} */}

          <TouchableOpacity
            style={[styles.input, errors.pickupDate ? styles.inputError : null]}
            onPress={() => setShowDate(true)}
          >
            <Text style={styles.placeholderText}>
              {pickupDate ? pickupDate.toDateString() : strings.PickupDate}
            </Text>
          </TouchableOpacity>
          {errors.pickupDate ? <Text style={styles.errorText}>{errors.pickupDate}</Text> : null}

          {showDate && (
            <DateTimePicker
              value={pickupDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(e, date) => {
                setShowDate(false);
                if (date) {
                  setPickupDate(date);
                  if (errors.pickupDate) {
                    setErrors(prev => ({ ...prev, pickupDate: "" }));
                  }
                }
              }}
            />
          )}

          <TouchableOpacity
            style={[styles.input, errors.pickupTime ? styles.inputError : null]}
            onPress={() => setShowTime(true)}
          >
            <Text style={styles.placeholderText}>
              {pickupTime
                ? pickupTime.toLocaleTimeString()
                : strings.PickupTime}
            </Text>
          </TouchableOpacity>
          {errors?.pickupTime ? <Text style={styles.errorText}>{errors.pickupTime}</Text> : null}

          {showTime && (
            <DateTimePicker
              value={pickupTime || new Date()}
              mode="time"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(e, time) => {
                setShowTime(false);
                if (time) {
                  setPickupTime(time);
                  if (errors.pickupTime) {
                    setErrors(prev => ({ ...prev, pickupTime: "" }));
                  }
                }
              }}
            />
          )}

          <CustomDropdown
            data={consignmentTypeData}
            placeholder={strings.ConsignmentType}
            selectedValue={consignmentType}
            onSelect={(value) => handleDropdownSelect("consignmentType", value)}
          />
          {errors.consignmentType ? <Text style={styles.errorText}>{errors.consignmentType}</Text> : null}

          {/* Package Size */}
          <Text style={styles.sectionTitle}>{strings.PackageSize}</Text>
          <View style={styles.packageRow}>
            {[
              { label: strings.SmallSize, value: "1 KG" },
              { label: strings.MediumSize, value: "3KG-10KG" },
              { label: strings.LargeSize, value: "10kG" }
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.packageBox,
                  packageSize === item.value && styles.selectedBox,
                ]}
                onPress={() => setPackageSize(item.value)}
              >
                <Text
                  style={[
                    styles.packageText,
                    packageSize === item.value && styles.selectedText,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Delivery Type */}
          <CustomDropdown
            data={deliveryTypeData}
            placeholder={strings.DeliveryType}
            selectedValue={deliveryType}
            onSelect={(value) => handleDropdownSelect("deliveryType", value)}
          />
          {errors.deliveryType ? <Text style={styles.errorText}>{errors.deliveryType}</Text> : null}

          <TextInput
            placeholderTextColor={"#ADA4A5"}
            value={price}
            onChangeText={(value) => handleInputChange("price", value)}
            style={[styles.input, errors.price ? styles.inputError : null]}
            placeholder={strings.Price}
            keyboardType="numeric"
          />
          {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}

          {/* Receiver Details */}
          <Text style={styles.sectionTitle}>{strings.ReceiverDetails}</Text>
          <TextInput
            style={[styles.input, errors.receiverName ? styles.inputError : null]}
            placeholderTextColor={"#ADA4A5"}
            value={receiverName}
            onChangeText={(value) => handleInputChange("receiverName", value)}
            placeholder={strings.ReceiverName}
          />
          {errors.receiverName ? <Text style={styles.errorText}>{errors.receiverName}</Text> : null}

          <TextInput
            style={[styles.input, errors.receiverMobile ? styles.inputError : null]}
            placeholder={strings.ReceiverMobileNumber}
            keyboardType="phone-pad"
            placeholderTextColor={"#ADA4A5"}
            value={receiverMobile}
            onChangeText={(value) => handleInputChange("receiverMobile", value)}
            maxLength={10}
          />
          {errors.receiverMobile ? <Text style={styles.errorText}>{errors.receiverMobile}</Text> : null}

          {/* <TextInput
            style={[styles.input, errors.receiverAddress ? styles.inputError : null]}
            placeholder="Receiver Address"
            placeholderTextColor={"#ADA4A5"}
            value={receiverAddress}
            onChangeText={(value) => handleInputChange("receiverAddress", value)}
          />
          {errors.receiverAddress ? <Text style={styles.errorText}>{errors.receiverAddress}</Text> : null} */}

          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder={strings.ExtraMessage}
            multiline
            placeholderTextColor={"#ADA4A5"}
            value={extraMessage}
            onChangeText={setExtraMessage}
          />
          {image?.uri ? (
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              style={styles.imagePreviewContainer}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: image?.uri || image }}
                style={styles.parcelImage}
              />
              <View style={styles.imageEditBadge}>
                <Icon name="camera" size={16} color="#0F172A" style={{ marginRight: 4 }} />
                <Text style={styles.imageEditBadgeText}>{strings.Edit || "Change"}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              style={styles.imageUploadButton}
              activeOpacity={0.7}
            >
              <Icon name="cloud-upload-outline" size={32} color="#FFD600" style={{ marginBottom: 6 }} />
              <Text style={styles.imageUploadPlaceholderText}>{strings.AddParcelImage}</Text>
              <Text style={styles.imageUploadSubText}>Supports JPG, PNG formats</Text>
            </TouchableOpacity>
          )}


          {/* Submit Button */}
          <View style={{
            marginBottom: 50,
            marginTop: 11
          }}>
            <CustomButton title={strings.SendRequest} onPress={handleSubmit}

              textStyle={{
                color: "white"
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* 
      <AddressModalInput
        value={pickupLocation}
        modalVisible={pickupModal}
        setModalVisible={() => setPickupModal(false)}
        onChange={setPickupLocation}
        onSelect={(item: any) => handleLocationSelect('pickup', item)}
        placeholder="Select Pickup Address"
      /> */}
      <AddressModalInput
        value={dropLocation}
        modalVisible={dropModal}
        setModalVisible={() => setDropModal(false)}
        onChange={setDropLocation}
        onSelect={(item: any) => handleLocationSelect('drop', item)}
        placeholder="Select Drop Address"
      />
      <ImagePickerModal
        modalVisible={isModalVisible}
        setModalVisible={setIsModalVisible}
        pickImageFromGallery={pickImageFromGallery}
        handleTakePhoto={takePhotoFromCamera}
      />
    </SafeAreaView>
  );
};




export default CreateParcelFrom;
