import React from "react";
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import imageIndex from "../assets/imageIndex";
import font from "../theme/font";
import strings from "../localization/Localization";

type DriverVerificationModalProps = {
  visible: boolean;
  driver?: any;
  onClose: () => void;
  onSelectImage: (url: string) => void;
};

const getFirstValue = (...values: Array<string | undefined | null>) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) || "";

const DriverVerificationModal = ({
  visible,
  driver,
  onClose,
  onSelectImage,
}: DriverVerificationModalProps) => {
  const vehicleType = getFirstValue(
    driver?.vehicle?.vehicleType,
    driver?.vehicleType,
    driver?.vehicle_setup?.vehicleType,
  );
  const vehicleNumber = getFirstValue(
    driver?.vehicle?.vehicleNumber,
    driver?.vehicleNumber,
    driver?.vehicle_setup?.vehicleNumber,
  );
  const idDocument = getFirstValue(
    driver?.documents?.idDocumentUrl,
    driver?.idDocument,
    driver?.upload_document?.idDocument,
  );
  const drivingLicense = getFirstValue(
    driver?.documents?.drivingLicenseUrl,
    driver?.drivingLicense,
    driver?.upload_document?.drivingLicense,
  );
  const vehicleRegistration = getFirstValue(
    driver?.vehicle?.vehicleRegistrationUrl,
    driver?.documents?.vehiclePapersUrl,
    driver?.vehicleRegistration,
    driver?.vehicle_setup?.vehicleRegistration,
  );
  const documents = [
    { label: strings.IDDocumentLabel || "ID Document", url: idDocument },
    { label: strings.LicensePhotoLabel || "License Photo", url: drivingLicense },
    { label: strings.RegistrationLabel || "Registration", url: vehicleRegistration },
  ].filter((doc) => doc.url);
  const verificationStatus = getFirstValue(driver?.verificationStatus, driver?.status);
  const isVerified = verificationStatus.toLowerCase() === "verified";
  const phone = getFirstValue(driver?.phone, driver?.mobile, driver?.phoneNumber);
  const email = getFirstValue(driver?.email);

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIcon}>
                <Icon name="shield-checkmark" size={22} color="#FFCC00" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{strings.SecurityAndVerification || "Security & Verification"}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {strings.VerifiedProfileVehicleDocs || "Verified profile, vehicle & documents"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.securityBanner}>
              <Icon name="lock-closed" size={17} color="#065F46" style={styles.inlineIcon} />
              <Text style={styles.securityBannerText}>
                {strings.VerifiedProfileVehicleDocsDesc ||
                  "This driver profile is fully verified for security and parcel safety."}
              </Text>
            </View>

            <View style={styles.profileHeader}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={driver?.image ? { uri: driver.image } : imageIndex.dpuser}
                  style={styles.avatar}
                />

              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {driver?.name || "Driver"}
                </Text>
                {email ? (
                  <Text style={styles.profileMetaText} numberOfLines={1}>
                    {email}
                  </Text>
                ) : null}

              </View>
            </View>

            {(phone || driver?.address) && (
              <View style={styles.detailCard}>
                {phone ? (
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelWithIcon}>
                      <Icon name="call-outline" size={16} color="#64748B" style={styles.inlineIcon} />
                      <View>

                        <Text style={styles.callButtonText}>{phone}</Text>

                      </View>

                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.callButton}
                      onPress={handleCall}
                    >
                      <Image source={imageIndex.Calls}

                        style={{
                          height: 42,
                          width: 42
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}
                {phone && driver?.address ? <View style={styles.divider} /> : null}
                {driver?.address ? (
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelWithIcon}>
                      <Icon name="location-outline" size={16} color="#64748B" style={styles.inlineIcon} />
                      <Text style={styles.infoValue}  >
                        {driver.address}
                      </Text>
                    </View>

                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Icon name="car-outline" size={18} color="#0F172A" style={styles.inlineIcon} />
              <Text style={styles.sectionHeaderText}>
                {strings.VehicleSetupRegistration || "Vehicle Setup & Registration"}
              </Text>
            </View>


            {documents.length > 0 ? (
              <View style={styles.documentsContainer}>
                {documents.map((doc) => (
                  <TouchableOpacity
                    key={doc.label}
                    style={styles.docItem}
                    activeOpacity={0.85}
                    onPress={() => onSelectImage(doc.url)}
                  >
                    <Image source={{ uri: doc.url }} style={styles.docThumb} />
                    <View style={styles.docLabelOverlay}>
                      <Icon name="eye-outline" size={13} color="#FFFFFF" style={styles.docIcon} />
                      <Text style={styles.docText} numberOfLines={1}>{doc.label}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyDocsCard}>
                <Icon name="document-lock-outline" size={24} color="#94A3B8" />
                <Text style={styles.emptyDocsText}>No documents available</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DriverVerificationModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "86%",
    paddingBottom: 28,
  },
  dragHandle: {
    width: 42,
    height: 5,
    backgroundColor: "#CBD5E1",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerCopy: { flex: 1 },
  title: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
    marginTop: 2,

  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  inlineIcon: { marginRight: 8 },
  smallInlineIcon: { marginRight: 4 },
  securityBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#065F46",
    lineHeight: 17,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
    marginBottom: 18,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: "#FFCC00",
  },
  verifiedBadgeIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 1,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
    marginBottom: 3,
  },
  profileMetaText: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
    marginBottom: 8,
  },
  verifiedPartnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedPartnerBadgeText: {
    fontSize: 10,
    fontFamily: font.MonolithRegular,
    color: "#065F46",
  },
  pendingPartnerBadge: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  pendingPartnerBadgeText: {
    color: "#92400E",
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
    lineHeight: 18, flex: 1
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 7,
  },
  callButtonText: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeaderText: {
    flex: 1,
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  licensePlateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#0F172A",
    borderRadius: 7,
    paddingLeft: 5,
    paddingRight: 10,
    paddingVertical: 5,
    minWidth: 105,
    justifyContent: "center",
  },
  licensePlateLeftStrip: {
    width: 4,
    height: 17,
    backgroundColor: "#3B82F6",
    borderRadius: 2,
    marginRight: 8,
  },
  licensePlateText: {
    fontSize: 13,
    fontFamily: font.MonolithRegular,
    color: "#0F172A",
  },
  documentsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  docItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  docThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  docLabelOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    paddingHorizontal: 4,
    paddingVertical: 6,
    alignItems: "center",
  },
  docIcon: { marginBottom: 2 },
  docText: {
    fontSize: 9,
    fontFamily: font.MonolithRegular,
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptyDocsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    backgroundColor: "#F8FAFC",
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 8,
  },
  emptyDocsText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
  },
});
