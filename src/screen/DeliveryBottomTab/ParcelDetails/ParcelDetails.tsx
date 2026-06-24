


import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  Dimensions,
} from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import imageIndex from "../../../assets/imageIndex";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import CustomButton from "../../../compoent/CustomButton";
import { useParcelDetails } from "./useParcelDetails";
import LoadingModal from "../../../utils/Loader";
import font from "../../../theme/font";
import { SafeAreaView } from "react-native-safe-area-context";
import { errorToast, successToast } from "../../../utils/customToast";
import strings from "../../../localization/Localization";
import NewOrderNotificationModal from "../../../compoent/NewOrderNotificationModal";
import OfferAcceptedModal from "../../../compoent/OfferAcceptedModal";

const STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  GOING_TO_PICKUP: 'going_to_pickup',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  ARRIVING: 'arriving',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};


const STATUS_COLORS = {
  [STATUS.PENDING]: '#FF9500',
  [STATUS.ASSIGNED]: '#007AFF',
  [STATUS.GOING_TO_PICKUP]: '#5856D6',
  [STATUS.PICKED_UP]: '#34C759',
  [STATUS.ON_THE_WAY]: '#5AC8FA',
  [STATUS.DELIVERED]: '#32D74B',
  [STATUS.CANCELLED]: '#FF3B30'
};

const ParcelDetails = () => {
  const {
    isLoading,
    setIsLoading,
    requests,
    Phone, setPhoneNumber,
    setRequests,
    item,
    navigation,
    makeOffer,
    fullImageUrl,
    handleSendOffer,
    amount, setAmount,
    message, setMessage,
    imgloading, setImgloading,
    updateParcelStatus
  } = useParcelDetails();
  const [actionLoading, setActioLoading] = useState(false);
  // Get button configuration based on status - CORRECTED COLOR ACCESS
  const getButtonConfig = () => {
    const currentStatus = item?.deliveryStatus || item?.deliveryStatus;

    switch (currentStatus) {
      case STATUS.PENDING:
        if (item?.parcel?.isOffered) {
          return {
            title: strings.OfferSent,
            onPress: null,
            color: "#64748B",
            icon: "checkmark-circle-outline",
            showInputs: false,
            disabled: true
          };
        }
        return {
          title: strings.SendOffer,
          onPress: handleSendOffer,
          color: "#FFD700", // Golden color for offer
          icon: "send-outline",
          showInputs: true
        };

      case STATUS.ASSIGNED:
        return {
          title: strings.StartPickup,
          onPress: () => handleStatusUpdate(STATUS.GOING_TO_PICKUP),
          color: STATUS_COLORS[STATUS.GOING_TO_PICKUP], // Fixed
          icon: "send-outline",
          showInputs: false
        };

      case STATUS.GOING_TO_PICKUP:
        return {
          title: strings.MarkAsPickedUp,
          onPress: () => handleStatusUpdate(STATUS.PICKED_UP),
          color: STATUS_COLORS[STATUS.PICKED_UP], // Fixed
          icon: "cube-outline",
          showInputs: false
        };

      case STATUS.PICKED_UP:
        return {
          title: strings.StartDelivery,
          onPress: () => handleStatusUpdate(STATUS.ON_THE_WAY),
          color: STATUS_COLORS[STATUS.ON_THE_WAY], // Fixed
          icon: "navigate-outline",
          showInputs: false
        };

      case STATUS.ON_THE_WAY:
        return {
          title: strings.MarkAsDelivered,
          onPress: () => handleStatusUpdate(STATUS.DELIVERED),
          color: STATUS_COLORS[STATUS.DELIVERED], // Fixed
          icon: "checkmark-circle-outline",
          showInputs: false
        };

      case STATUS.DELIVERED:
        return {
          title: strings.OrderCompleted,
          onPress: null,
          color: STATUS_COLORS[STATUS.COMPLETED], // Fixed
          icon: "checkmark-done-outline",
          showInputs: false,
          disabled: true
        };

      case STATUS.CANCELLED:
        return {
          title: strings.OrderCancelled,
          onPress: null,
          color: STATUS_COLORS[STATUS.CANCELLED], // Fixed
          icon: "close-circle-outline",
          showInputs: false,
          disabled: true
        };

      default:
        return {
          title: strings.SendOffer,
          onPress: handleSendOffer,
          color: "#FFD700",
          icon: "send-outline",
          showInputs: true
        };
    }
  };
  useEffect(() => {

  }, [item?.parcelId])
  const handleStatusUpdate = async (newStatus: any) => {
    console.log("newStatus", newStatus)
    try {
      if (newStatus == STATUS.PICKED_UP && pickupOtp == '') {
        Alert.alert(strings.EnterPickupOTPShared)
        return;
      }
      if (newStatus == STATUS.DELIVERED && deliveryOtp == '') {
        Alert.alert(strings.EnterDeliveryOTPShared)
        return;
      }

      const result = await updateParcelStatus(item?.parcelId, newStatus, newStatus == STATUS.DELIVERED ? deliveryOtp : pickupOtp);
      console.log(result)
      if (result.status == 1) {
        successToast(strings.SuccessLabel)
        navigation.goBack();
      } else {
        errorToast(result.message ?? "Failed to update status")
      }
    } catch (error) {
      console.error("Status update error:", error);
      Alert.alert(strings.ErrorLabel, strings.SomethingWentWrong);
    } finally {
    }
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    Alert.alert(
      strings.CancelOrder,
      strings.CancelOrderConfirm,
      [
        { text: strings.No, style: "cancel" },
        {
          text: strings.Yes,
          style: "destructive",
          onPress: () => handleStatusUpdate(STATUS.CANCELLED)
        }
      ]
    );
  };
  const [pickupOtp, setPickupOtp] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const buttonConfig = getButtonConfig();
  const canCancel = item?.deliveryStatus &&
    [STATUS.ASSIGNED, STATUS.GOING_TO_PICKUP, STATUS.PICKED_UP, STATUS.ON_THE_WAY].includes(item.deliveryStatus);

  const scrollToOfferSection = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 320);
    });
    return () => showSub.remove();
  }, []);

  return (
    <View style={styles.container}>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent,]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >


          <StatusBarComponent />
          <LoadingModal visible={isLoading} />

          <NewOrderNotificationModal />
          <OfferAcceptedModal />
          {fullImageUrl ? (
            <ImageBackground
              source={{
                uri: fullImageUrl
              }}
              style={styles.backgroundImage}
              resizeMode="cover"
              onLoadStart={() => setImgloading(true)}
              onLoadEnd={() => setImgloading(false)}
            >
              {imgloading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
              <View>
                <SafeAreaView edges={['top']} />
                <CustomHeader label={strings.ParcelDetails} />
              </View>
            </ImageBackground>
          ) : (
            <ImageBackground
              source={imageIndex.Rectangle}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <View  >
                <SafeAreaView edges={['top']} />
                <CustomHeader label={strings.ParcelDetails} />
              </View>
            </ImageBackground>
          )}

          <View style={styles.cardContainer}>
            {/* Pickup & Drop */}
            <View style={styles.locationBox}>
              <View style={styles.dotLine}>
                <View style={styles.dot} />
                <View style={styles.verticalLine} />
                <View style={[styles.dot, styles.bottomDot]} />
              </View>
              <View style={styles.locationDetails}>
                <View style={styles.locationItem}>
                  <Text style={styles.locationTitle}>{strings.PickupLocation}</Text>
                  <Text style={styles.locationValue}>{item?.pickupLocation || item?.data?.pickup?.location || item?.pickup?.location || ""}</Text>
                </View>
                <View style={styles.locationItem}>
                  <Text style={styles.locationTitle}>{strings.DropLocation}</Text>
                  <Text style={styles.locationValue}>{item?.dropLocation || item?.data?.drop?.location || item?.drop?.location || ''}</Text>
                </View>
              </View>
            </View>

            {item?.deliveryStatus === STATUS?.PENDING && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{strings.ParcelInformation}</Text>


                <Text style={styles.sectionTitle}>{strings.Price} {item?.proposedPrice || item?.data?.price}

                </Text>



                <View style={styles.infoRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{strings.SenderName}</Text>
                    <Text style={styles.value}>{item?.senderName || item?.data?.sender?.name || item?.sender?.name || ''}  </Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{strings.ReceiverName}</Text>
                    <Text style={styles.value}>{item?.receiver?.name || item?.data?.receiver?.name || item?.receiver?.name || ''}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{strings.ReceiverPhone}</Text>
                    <Text style={styles.value}>{item?.receiver?.mobileNumber || item?.data?.receiver?.phone || item?.senderPhone ||
                      ''}

                    </Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{strings.PackageSize}</Text>
                    <Text style={styles.value}>{item?.packageSize || item?.data?.packageSize || ''}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{strings.ConsignmentType}</Text>
                    <Text style={styles.value}>{item?.consignmentType || item?.data?.consignmentType || ''}</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{strings.ShipmentType}</Text>
                    <Text style={styles.value}>{item?.shipmentType || item?.data?.shipmentType || ''}</Text>
                  </View>
                </View>


              </View>
            )}

            {buttonConfig.showInputs && item?.deliveryStatus === STATUS.PENDING && !item?.parcel?.isOffered && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{strings.MakeOffer}</Text>

                <View style={styles.inputContainer1}>
                  <Text style={styles.inputLabel}>{strings.AmountWithCurrency}</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder={strings.EnterAmount}
                    value={amount}
                    onChangeText={setAmount}
                    placeholderTextColor={'#999'}
                    onFocus={scrollToOfferSection}
                  />
                </View>

                <View style={styles.inputContainer1}>
                  <Text style={styles.inputLabel}>{strings.MessageLabel}</Text>
                  <TextInput
                    style={[styles.textInput, styles.messageInput]}
                    placeholder={strings.TypeMessageHere}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    placeholderTextColor={'#999'}
                    onFocus={scrollToOfferSection}
                  />
                </View>
              </View>
            )}


            {item?.deliveryStatus === STATUS.GOING_TO_PICKUP && (
              <OtpSection
                label={strings.EnterPickupOTPShared}
                value={pickupOtp}
                onChange={setPickupOtp}
              />
            )}

            {item?.deliveryStatus === STATUS.ON_THE_WAY && (
              <OtpSection
                label={strings.EnterDeliveryOTPShared}
                value={deliveryOtp}
                onChange={setDeliveryOtp}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              {item?.parcel?.isOffered && item?.deliveryStatus === STATUS.PENDING ? (
                <View style={styles.waitingContainer}>
                  <View style={styles.statusCircle}>
                    <Icon name="hourglass-outline" size={28} color="#FFCC00" />
                  </View>
                  <Text style={styles.waitingTitle}>{strings.OfferPending}</Text>
                  <Text style={styles.waitingDescription}>
                    {strings.WaitingForUserResponse}
                  </Text>
                </View>
              ) : (
                <CustomButton
                  title={actionLoading ? strings.Processing : buttonConfig.title}
                  onPress={buttonConfig.onPress}
                  disabled={actionLoading || buttonConfig.disabled}
                  style={{
                    backgroundColor: buttonConfig.color,
                    opacity: (actionLoading || buttonConfig.disabled) ? 0.6 : 1,
                  }}
                  txtcolor={'white'}
                  icon={
                    <Icon
                      name={buttonConfig.icon}
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  }
                />
              )}

              {/* Cancel Button (for certain statuses) */}
              {canCancel && !buttonConfig?.disabled && (
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: STATUS_COLORS[STATUS.CANCELLED] }]}
                  onPress={handleCancelOrder}
                  disabled={actionLoading}
                >
                  <Icon
                    name="close-circle-outline"
                    size={20}
                    color={STATUS_COLORS[STATUS.CANCELLED]}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.cancelButtonText, { color: STATUS_COLORS[STATUS.CANCELLED] }]}>
                    {strings.CancelOrder}
                  </Text>
                </TouchableOpacity>
              )}


            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};


const OtpSection = ({ label, value, onChange }: any) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.inputContainer1}>
        <Text style={styles.inputLabel}>{label}</Text>

        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          placeholder={strings.EnterOTP}
          maxLength={6}
          value={value}
          onChangeText={onChange}
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );
};


export default ParcelDetails;

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",


  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: WINDOW_HEIGHT + 200,
  },
  scrollPaddingBottom: {
    paddingBottom: Platform.OS === "ios" ? 460 : 400,
  },
  backgroundImage: {
    height: 300,
    justifyContent: "flex-start",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: -15,
    zIndex: 1,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontFamily: font.MonolithRegular
    ,
    fontSize: 14,
  },
  cardContainer: {
    flex: 1,
    marginTop: -10,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,

  },
  locationBox: {
    backgroundColor: "#FFFFFF", // pure white better shadow deta hai
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,

    // Border (optional soft look)
    borderColor: "#F0F0F0",

    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,

    flexDirection: "row",
  },
  dotLine: {
    width: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
  bottomDot: {
    backgroundColor: '#007AFF',
  },
  verticalLine: {
    width: 2,
    height: 68,
    backgroundColor: '#D0D0D0',
    marginVertical: 5,
  },
  locationDetails: {
    flex: 1,
  },
  locationItem: {
    marginBottom: 15,
  },
  locationTitle: {
    fontFamily: font.MonolithRegular
    ,
    color: "#000",
    fontSize: 16,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 12,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 15,
    fontFamily: font.MonolithRegular
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#3B4051",
    marginBottom: 6,
    fontFamily: font.MonolithRegular

  },
  value: {
    color: "#666",
    fontSize: 14,
    fontFamily: font.MonolithRegular
  },
  inputContainer1: {
    marginBottom: 15,
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    padding: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: "#3B4051",
    marginBottom: 8,
    fontFamily: font.MonolithRegular

  },
  textInput: {
    color: "#000",
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    padding: 0,
  },
  messageInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionContainer: {
    marginBottom: 30,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 10,
    backgroundColor: '#FFF5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular

  },
  progressContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  waitingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    marginBottom: 20,

  },
  statusCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FEF3C7',
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: font.MonolithRegular,
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: font.MonolithRegular,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
});