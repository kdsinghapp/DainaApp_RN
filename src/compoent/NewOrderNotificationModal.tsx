import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import font from '../theme/font';
import ScreenNameEnum from '../routes/screenName.enum';
import strings from '../localization/Localization';
import { STATUS } from '../utils/Constant';
import { useDeliveryContext } from '../context/DeliveryContext';
import { stopNotificationSound } from '../utils/soundPlayer';
import { color } from '../constant';

import { useSelector } from 'react-redux';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NewOrderNotificationModalProps {
  visible?: boolean;
  data?: any;
  onAccept?: () => void;
  onReject?: () => void;
}

const NewOrderNotificationModal: React.FC<NewOrderNotificationModalProps> = ({
  visible: propsVisible,
  data: propsData,
  onAccept,
  onReject,
}) => {
  const ctx = useDeliveryContext();
  const navigation = useNavigation();
  const userData = useSelector((state: any) => state.auth.userData);

  // If props are provided, we use them. 
  // Otherwise, we fallback to context (Delivery flow).
  const isFromProps = propsVisible !== undefined;

  if (!isFromProps && (!ctx || userData?.type !== 'Delivery')) return null;

  const {
    newOrderNotification,
    setNewOrderNotification,
    acceptCounterOffer,
    acceptCounterOfferLoading,
    RejectcounterOffer,
  } = ctx || {};

  const visible = isFromProps ? propsVisible : !!newOrderNotification?.visible;
  const rawData = isFromProps ? propsData : newOrderNotification?.data;

  // Robustly merge parcel data if it exists nested
  const data = { ...rawData, ...(rawData?.parcel ?? {}), ...(rawData?.data ?? {}) };
  const pickupAddress = data?.pickup?.location || data?.sender?.address || data?.pickupLocation || data?.pickup_address;
  const dropAddress = data?.drop?.location || data?.receiver?.address || data?.dropLocation || data?.drop_address;
  const trackingId = data?.trackingId || data?.tracking_id || data?.parcelTrackingId;
  const amount = data?.offerAmount || data?.deliveryPrice || data?.price || data?.amount || data?.counterAmount;
  const customerName = data?.sender?.name || data?.customerName || data?.user?.name || data?.receiver?.name;
  const parcelType = data?.shipmentType || data?.parcelType || data?.consignmentType || data?.typeLabel;

  if (!visible) return null;

  const isCounterOffer = data?.type === 'counter_offer';

  const closeNotification = () => {
    if (isFromProps) {
      onReject?.();
    } else {
      setNewOrderNotification?.(null);
    }
    stopNotificationSound();
  };

  const handleAccept = () => {
    if (isFromProps) {
      onAccept?.();
      stopNotificationSound();
    } else {
      if (isCounterOffer) {
        if (data?.offerId != null) {
          acceptCounterOffer?.(data.offerId);
          stopNotificationSound();
        }
      } else {

        navigation.navigate(ScreenNameEnum.ParcelDetails as never, {
          item: {
            data: data,
            deliveryStatus: STATUS.PENDING,
          },
        } as never);
        setNewOrderNotification?.(null);
        stopNotificationSound();
      }
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={closeNotification}
      onBackButtonPress={closeNotification}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      backdropOpacity={0.4}
      deviceHeight={SCREEN_HEIGHT}
      deviceWidth={SCREEN_WIDTH}
      useNativeDriver
      hideModalContentWhileAnimating
      statusBarTranslucent
      style={styles.modalContainer}
    >
      <View style={styles.modalCard}>
        <View style={styles.accentBar} />
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerIconWrapper}>
            <View style={styles.headerIconCircle}>
              <Icon
                name={isCounterOffer ? "cash-outline" : "cube-outline"}
                size={wp(6)}
                color={color.primary || '#FFCC00'}
              />
            </View>
          </View>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {isCounterOffer ? strings.CounterOfferReceived : strings.NewDeliveryRequest}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isCounterOffer ? (strings.ReviewAcceptDeliveryOffer || "Review the updated offer") : (strings.NewDeliveryRequestMessage || "A new delivery is available")}
            </Text>
          </View>

          <TouchableOpacity
            onPress={closeNotification}
            style={styles.closeIconButton}
          >
            <Icon name="close" size={wp(5.5)} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <Icon name={isCounterOffer ? "swap-horizontal" : "flash-outline"} size={wp(5)} color="#111827" />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>{isCounterOffer ? (strings.CounterOfferLabel || "Counter Offer") : (strings.NewDeliveryRequest || "Delivery Request")}</Text>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {trackingId ? `#${trackingId}` : (customerName || strings.NewDeliveryRequest || "New Delivery")}
              </Text>
            </View>
            {!!amount && (
              <View style={styles.amountPill}>
                <Text style={styles.amountText}>{amount}</Text>
              </View>
            )}
          </View>



          {/* Location Path (Timeline) */}
          {(pickupAddress || dropAddress) ? (
            <View style={styles.pathContainer}>
              {/* Row 1: Pickup */}
              <View style={styles.timelineRow}>
                {/* Left Col: Dot & Line */}
                <View style={styles.leftCol}>
                  <View style={[styles.iconCircle, { borderColor: color.success, backgroundColor: '#ECFDF5' }]}>
                    <View style={styles.pickupDot} />
                  </View>
                  <View style={styles.verticalLine} />
                </View>

                {/* Right Col: Label & Address */}
                <View style={styles.rightCol}>
                  <Text style={styles.pathLabel}>{strings.Pickup || 'Pickup Location'}</Text>
                  <Text style={styles.pathAddress}  >{pickupAddress || 'N/A'}</Text>
                </View>
              </View>

              {/* Row 2: Drop-off */}
              <View style={[styles.timelineRow, { marginBottom: 0 }]}>
                {/* Left Col: Dot */}
                <View style={styles.leftCol}>
                  <View style={[styles.iconCircle, { borderColor: color.error, backgroundColor: '#FEF2F2' }]}>
                    <Icon name="location-sharp" size={wp(3.5)} color={color.error} />
                  </View>
                </View>

                {/* Right Col: Label & Address */}
                <View style={[styles.rightCol, { paddingBottom: 0 }]}>
                  <Text style={styles.pathLabel}>{strings.Drop || 'Drop-off Location'}</Text>
                  <Text style={styles.pathAddress}  >{dropAddress || 'N/A'}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Customer / Receiver Info */}


          {/* Additional Info Grid */}


        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.btnLater}
            onPress={closeNotification}
          >
            <Icon name="close-circle-outline" size={wp(4.6)} color="#64748B" />
            <Text style={styles.btnLaterText}>{strings.Later || strings.Cancel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, acceptCounterOfferLoading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            disabled={acceptCounterOfferLoading}
            onPress={handleAccept}
          >
            <Icon name={isFromProps || isCounterOffer ? "checkmark-circle" : "arrow-forward-circle"} size={wp(5)} color="#111827" />
            <Text style={styles.btnActionText}>
              {isFromProps ? strings.Accept : (isCounterOffer ? strings.Accept : strings.ViewDetails || 'View Details')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalContainer: {
    margin: wp(4),
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(2.4),
    paddingBottom: hp(2.2),
    maxHeight: hp(85),
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: color.primary || '#FFCC00',
  },
  handleBar: {
    width: wp(12),
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: hp(2.5),

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.8),
    paddingBottom: hp(1.6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // subtle separator line
  },
  headerIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: '#FFF7CC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: wp(3.5),
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: wp(4.4),
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
    lineHeight: wp(5.8),
  },
  headerSubtitle: {
    fontSize: wp(3.1),
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trackingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackingIdText: {
    fontSize: wp(3.2),
    color: '#475569',
    fontFamily: font.MonolithRegular,
  },
  closeIconButton: {
    padding: wp(2),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(3.5),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollContent: {
    paddingBottom: hp(1.6),
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: wp(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: wp(3.5),
    marginBottom: hp(1.5),
  },
  summaryIconWrap: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#FFF7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),

  },
  summaryCopy: {
    flex: 1,
    paddingRight: wp(2),
  },
  summaryLabel: {
    fontSize: wp(2.8),
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    marginBottom: 3,
  },
  summaryTitle: {
    fontSize: wp(4),
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
  },
  amountPill: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: 999,
    backgroundColor: '#FFCC00',
  },
  amountText: {
    fontSize: wp(3.6),
    color: '#111827',
    fontFamily: font.MonolithRegular,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: hp(1.5),
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
  },
  metaText: {
    marginLeft: 6,
    fontSize: wp(3.1),
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    flexShrink: 1,
  },
  priceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2.5),
    padding: wp(4),

  },
  priceIndicator: {
    width: 4,
    height: '70%',
    backgroundColor: '#FFCC00',
    borderRadius: 2,
    marginRight: wp(3),
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    color: '#64748B',
    fontSize: wp(3.2),
    fontFamily: font.MonolithRegular,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    color: '#0F172A',
    fontSize: wp(6.5),
    fontFamily: font.MonolithRegular,
  },
  priceIconCircle: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: wp(4),
    marginBottom: hp(2),
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: wp(4),
    paddingVertical: wp(3.5),
    paddingHorizontal: wp(3),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    gap: 8,
  },
  infoBoxLabel: {
    fontSize: wp(2.6),
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    marginBottom: 2,
  },
  infoBoxValue: {
    fontSize: wp(3.5),
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
  },
  pathContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: wp(4),
    paddingVertical: wp(4),
    paddingHorizontal: wp(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hp(2),
  },
  timelineRow: {
    flexDirection: 'row',
  },
  leftCol: {
    alignItems: 'center',
    width: wp(8),
  },
  iconCircle: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  pickupDot: {
    width: wp(2.8),
    height: wp(2.8),
    borderRadius: wp(1.4),
    backgroundColor: color.success,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    minHeight: hp(3.5),
    backgroundColor: '#CBD5E1', // Slightly darker border for better visibility
    marginVertical: hp(0.5),
  },
  rightCol: {
    flex: 1,
    marginLeft: wp(3),
    paddingBottom: hp(2.5),
    justifyContent: 'center',
  },
  pathLabel: {
    fontSize: wp(3),
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    marginBottom: hp(0.4),
  },
  pathAddress: {
    fontSize: wp(3.8),
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
    lineHeight: wp(5.1),
  },
  footer: {
    flexDirection: 'row',
    gap: wp(3),
    paddingTop: hp(0.5),
  },
  btnLater: {
    flex: 1,
    height: hp(6.2),
    borderRadius: wp(3.5),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnLaterText: {
    fontSize: wp(3.7),
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    marginLeft: 6,
  },
  btnAction: {
    flex: 1.55,
    height: hp(6.2),
    borderRadius: wp(3.5),
    backgroundColor: '#FFCC00',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnActionText: {
    fontSize: wp(4),
    color: '#000000',
    fontFamily: font.MonolithRegular,
    marginLeft: 7,
  },
});

export default NewOrderNotificationModal;
