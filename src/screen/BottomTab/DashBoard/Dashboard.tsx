import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import font from "../../../theme/font";
import imageIndex from "../../../assets/imageIndex";
import CustomButton from "../../../compoent/CustomButton";
import HomeHeaderBar from "../../../compoent/HomeHeaderBar";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import ScreenNameEnum from "../../../routes/screenName.enum";
import AddressModalInput from "../../../compoent/AutocompleteData";
import useDashboard from "./useDashboard";
import CurrentLocation from "../../../CurrentLocation";
import LoadingModal from "../../../utils/Loader";
import { FlatList } from "react-native-gesture-handler";
import OrderCard from "../../../compoent/OrderCard";
import strings from "../../../localization/Localization";
const ShippingScreen = () => {
  const {
    navigation,
    isLoading,
    locationRef,
    currentlocation,
    address,
    setAddress,
    location,
    setLocation,
    locationModal,
    setlocationModal,
    orderData,
    counterOfferAcceptedModal,
    setCounterOfferAcceptedModal,
    getParceldetailsApi,
  } = useDashboard();

  const closeOfferAcceptedModal = () => {
    setCounterOfferAcceptedModal({ visible: false, data: null });
  };

  const renderItem = useCallback(({ item }: any) => {
    return (
      <OrderCard
        order={item}
        onPress={() => {
          navigation.navigate(ScreenNameEnum.ViewDetails, { item });
        }}
      />
    );
  }, [navigation]);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyWrap}>
      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationBg} />
        <Image source={imageIndex.ordePracle} style={styles.emptyIcon} />
      </View>
      <Text style={styles.emptyTitle}>{strings.NoOrder}</Text>
      <Text style={styles.emptySubtitle}>{strings.NoOrdersFound1}</Text>
    </View>
  ), []);

  const ItemSeparatorComponent = useCallback(() => <View style={{ height: 14 }} />, []);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CurrentLocation ref={locationRef} />
      <HomeHeaderBar
        location={currentlocation || address}
        onNotificationPress={() => navigation.navigate(ScreenNameEnum.NotificationsScreen)}
        hasNotification={false}
      />

      {/* <TouchableOpacity style={styles.inputBox} 
      onPress={()=> navigation.navigate(ScreenNameEnum.PickupLocation)}
      >
        <Text style={{ color: "black" ,fontSize:14, fontFamily:font.MonolithRegular}}>Enter Pickup Location</Text>
      <Image source={imageIndex.Next} 
      style={{
        height:20,
        width:20
      }}
      />
       </TouchableOpacity> */}
      <View style={{
        marginTop: 11, marginBottom: 5
      }}>
        <CustomButton title={strings.CreateParcel}
          textStyle={{
            color: "white"
          }}
          onPress={() => navigation.navigate(ScreenNameEnum.CreateParcelFrom)}
        />
      </View>
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 18,
        marginBottom: 10
      }}>
        <Text style={styles.sectionTitle}>{strings.ShippingHistory}</Text>
      </View>
      <FlatList
        contentContainerStyle={{ paddingBottom: 120 }}
        data={orderData}
        keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparatorComponent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ListEmptyComponent}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={11}
        removeClippedSubviews={true}
      />
      <AddressModalInput
        value={address}
        modalVisible={locationModal}
        setModalVisible={() => setlocationModal(false)}
        onChange={setAddress}
        onSelect={(loc) => setLocation(loc)}
        placeholder={strings.SelectDeliveryAddress}
      />

      {/* Counter offer accepted – driver accepted user's offer */}
      <Modal
        visible={counterOfferAcceptedModal.visible}
        transparent
        animationType="fade"
      >
        <TouchableOpacity
          activeOpacity={1}
          style={offerAcceptedStyles.overlay}
          onPress={closeOfferAcceptedModal}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={offerAcceptedStyles.modalCard}>
              <View style={offerAcceptedStyles.accentBar} />
              <Text style={offerAcceptedStyles.title}>
                {counterOfferAcceptedModal?.data?.title ?? strings.OfferAccepted}
              </Text>
              {counterOfferAcceptedModal?.data?.driver != null && (
                <Text style={offerAcceptedStyles.extra}>
                  {counterOfferAcceptedModal?.data?.driver?.name}
                </Text>
              )}
              <Image source={{ uri: counterOfferAcceptedModal?.data?.driver?.image }}
                style={{
                  height: 60,
                  width: 60,
                  borderRadius: 60
                }}
              />
              <Text style={offerAcceptedStyles.message}>
                {counterOfferAcceptedModal?.data?.message ??
                  strings.DriverAcceptedOffer}
              </Text>
              {counterOfferAcceptedModal?.data?.parcelId != null && (
                <Text style={offerAcceptedStyles.extra}>
                  Order #{counterOfferAcceptedModal?.data?.parcelId}
                </Text>
              )}

              {/* {(counterOfferAcceptedModal.data?.pickupOtp ||
                counterOfferAcceptedModal.data?.deliveryOtp) && (
                <View style={offerAcceptedStyles.otpRow}>
                  {counterOfferAcceptedModal.data?.pickupOtp && (
                    <View style={offerAcceptedStyles.otpBox}>
                      <Text style={offerAcceptedStyles.otpLabel}>Pickup OTP</Text>
                      <Text style={offerAcceptedStyles.otpValue}>
                        {counterOfferAcceptedModal.data.pickupOtp}
                      </Text>
                    </View>
                  )}
                  {counterOfferAcceptedModal.data?.deliveryOtp && (
                    <View style={offerAcceptedStyles.otpBox}>
                      <Text style={offerAcceptedStyles.otpLabel}>Delivery OTP</Text>
                      <Text style={offerAcceptedStyles.otpValue}>
                        {counterOfferAcceptedModal.data.deliveryOtp}
                      </Text>
                    </View>
                  )}
                </View>
              )} */}
              <View style={offerAcceptedStyles.buttonRow}>
                <TouchableOpacity
                  style={offerAcceptedStyles.btnDismiss}
                  onPress={closeOfferAcceptedModal}
                  activeOpacity={0.8}
                >
                  <Text style={offerAcceptedStyles.btnDismissText}>{strings.OK}</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity
                  style={offerAcceptedStyles.btnView}
                  onPress={handleViewOrder}
                  activeOpacity={0.8}
                >
                  <Text style={offerAcceptedStyles.btnViewText}>View order</Text>
                </TouchableOpacity> */}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default ShippingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  illustrationWrap: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: 'relative',
  },
  illustrationBg: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFCC00",
    opacity: 0.1,
  },
  emptyIcon: {
    height: 120,
    width: 120,
    resizeMode: 'contain',
  },
  emptyTitle: {
    fontSize: 22,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
    marginBottom: 10,
    textAlign: 'center',

  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 6,
    fontFamily: font.MonolithRegular

  },
  inputBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
    marginHorizontal: 2,
    marginTop: 11,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    // Android shadow


    flexDirection: "row",
    justifyContent: "space-between"
  },
  createBtn: {
    backgroundColor: "#FFD600",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 22,
  },
  createBtnText: {
    fontSize: 16,
    color: "#000",
    fontFamily: font.MonolithRegular,

  },
  sectionTitle: {
    fontSize: 16,
    color: "black",
    fontFamily: font.MonolithRegular,

  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 17,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    marginHorizontal: 1,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    // Android shadow

  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  cardId: {
    fontSize: 15,
    marginRight: 8,
    fontFamily: font.MonolithRegular

  },
  cardDate: {
    fontSize: 14,
    color: "#BABFC5",
    fontFamily: font.MonolithRegular

  },
  label: {
    fontSize: 14,
    color: "#BABFC5",

    marginTop: 6,
    fontFamily: font.MonolithRegular

  },
  value: {
    fontSize: 14,
    color: "#76889A",
    fontFamily: font.MonolithRegular
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  statusText: {
    fontSize: 12,
    color: "#555",
    marginRight: 6,
    fontFamily: font.MonolithRegular
  },
  statusValue: {
    fontSize: 13,
    color: "#555",
    fontFamily: font.MonolithRegular

  },
});

const offerAcceptedStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
    }),
  },
  accentBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#22C55E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: "#0F172A",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: font.MonolithRegular,
  },
  message: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
    paddingHorizontal: 8,
    fontFamily: font.MonolithRegular,
  },
  extra: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 12,
    fontFamily: font.MonolithRegular,
  },
  otpRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  otpBox: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  otpLabel: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
    marginBottom: 4,
  },
  otpValue: {
    fontSize: 18,
    color: "#0F172A",
    fontFamily: font.MonolithRegular,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 14,
    width: "100%",
  },
  btnDismiss: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  btnDismissText: {
    fontSize: 16,
    color: "#64748B",
    fontFamily: font.MonolithRegular,
  },
  btnView: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#FFD600",
    alignItems: "center",
  },
  btnViewText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
});
