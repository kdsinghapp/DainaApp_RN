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
  const isFromProps = propsVisible !== undefined;
  if (!isFromProps && (!ctx || String(userData?.type || '').trim().toLowerCase() !== 'delivery')) return null;
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
  // Robustly merge parcel data if it exists nested
  let parsedParcel = rawData?.parcel;
  if (typeof parsedParcel === 'string') {
    try { parsedParcel = JSON.parse(parsedParcel); } catch (e) { }
  }
  let parsedDataObj = rawData?.data;
  if (typeof parsedDataObj === 'string') {
    try { parsedDataObj = JSON.parse(parsedDataObj); } catch (e) { }
  }

  const data = {
    ...rawData,
    ...(parsedParcel ?? {}),
    ...(parsedDataObj ?? {})
  };

  // Normalize fields that might come in snake_case from FCM
  if (!data.id && data.parcel_id) data.id = data.parcel_id;
  if (!data.parcelId && data.parcel_id) data.parcelId = data.parcel_id;

  const pickupAddress = data?.pickup?.location || data?.sender?.address || data?.pickupLocation || data?.pickup_address || data?.pickup_location;
  const dropAddress = data?.drop?.location || data?.receiver?.address || data?.dropLocation || data?.drop_address || data?.drop_location;

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
            ...data,
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
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerIconWrapper}>
            <View style={styles.headerIconCircle}>
              <Icon
                name={isCounterOffer ? "cash-outline" : "cube"}
                size={wp(7)}
                color={color.black}
              />
            </View>
          </View>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {isCounterOffer ? strings.CounterOfferReceived : strings.NewDeliveryRequest}
            </Text>
            <View style={styles.badgeRow}>
              {(data?.trackingId || data?.id) && (
                <View style={styles.trackingBadge}>
                  <Text style={styles.trackingIdText}>#{data.trackingId || data.id}</Text>
                </View>
              )}
            </View>
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
          {/* Price/Amount Section */}
          {(data?.price || data?.amount || data?.total_amount) && (
            <View style={styles.priceContainer}>
              <View style={styles.priceIndicator} />
              <View style={styles.priceInfo}>
                <Text style={styles.priceLabel}>{isCounterOffer ? strings.OfferPrice : strings.EstimatedEarnings}</Text>
                <Text style={styles.priceValue}>$ {data?.price || data?.amount || data?.total_amount}</Text>
              </View>
            </View>
          )}

          {/* Location Path (Timeline) */}
          {(pickupAddress || dropAddress) ? (
            <View style={styles.pathContainer}>
              {/* Row 1: Pickup */}
              <View style={styles.timelineRow}>
                {/* Left Col: Dot & Line */}
                <View style={styles.leftCol}>
                  <View style={[styles.iconCircle, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]}>
                    <Icon name="ellipse" size={wp(2.2)} color="#10B981" />
                  </View>
                  <View style={styles.verticalLine} />
                </View>

                {/* Right Col: Label & Address */}
                <View style={styles.rightCol}>
                  <Text style={styles.pathLabel}>{strings.Pickup || 'Pickup'}</Text>
                  <Text style={styles.pathAddress}>{pickupAddress || 'N/A'}</Text>
                </View>
              </View>

              {/* Row 2: Drop-off */}
              <View style={[styles.timelineRow, { marginBottom: 0 }]}>
                {/* Left Col: Dot */}
                <View style={styles.leftCol}>
                  <View style={[styles.iconCircle, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
                    <Icon name="location" size={wp(3.8)} color="#EF4444" />
                  </View>
                </View>

                {/* Right Col: Label & Address */}
                <View style={[styles.rightCol, { paddingBottom: 0 }]}>
                  <Text style={styles.pathLabel}>{strings.Drop || 'Drop-off'}</Text>
                  <Text style={styles.pathAddress}>{dropAddress || 'N/A'}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Customer / Receiver Info */}
          {(data?.receiver_name || data?.receiverName) && (
            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <Icon name="person-outline" size={wp(4.5)} color="#64748B" />
                <View>
                  <Text style={styles.infoBoxLabel}>{strings.ReceiverName || 'Receiver'}</Text>
                  <Text style={styles.infoBoxValue}>{data.receiver_name || data.receiverName}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Additional Info Grid */}
          {(data?.weight || data?.package_size || data?.packageSize) && (
            <View style={styles.infoGrid}>
              {(data?.weight || data?.package_size || data?.packageSize) && (
                <View style={styles.infoBox}>
                  <Icon name="scale-outline" size={wp(4.5)} color="#64748B" />
                  <View>
                    <Text style={styles.infoBoxLabel}>{strings.Weight || 'Weight'}</Text>
                    <Text style={styles.infoBoxValue}>{data.weight || data.package_size || data.packageSize}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.btnLater}
            onPress={closeNotification}
          >
            <Text style={styles.btnLaterText}>{strings.Later || strings.Cancel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, acceptCounterOfferLoading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            disabled={acceptCounterOfferLoading}
            onPress={handleAccept}
          >
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
    margin: wp(5),
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(8),
    paddingHorizontal: wp(6),
    paddingVertical: hp(3),
    maxHeight: hp(85),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
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
    marginBottom: hp(3),

  },
  headerIconWrapper: {
    width: wp(15),
    height: wp(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(4.5),
    backgroundColor: '#FFCC00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: wp(4),
  },
  headerTitle: {
    fontSize: wp(5.5),
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
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
    padding: wp(2.5),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(3.5),
  },
  scrollContent: {
    paddingBottom: hp(2),
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
    backgroundColor: '#FFFFFF',
    borderRadius: wp(5),
    padding: wp(5),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: hp(2.5),
  },
  timelineRow: {
    flexDirection: 'row',
  },
  leftCol: {
    alignItems: 'center',
    width: wp(8),
  },
  iconCircle: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    minHeight: hp(4),
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  rightCol: {
    flex: 1,
    marginLeft: wp(3),
    paddingBottom: hp(2.5),
  },
  pathLabel: {
    fontSize: wp(3),
    color: '#94A3B8',
    fontFamily: font.MonolithRegular,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  pathAddress: {
    fontSize: wp(3.5),
    color: '#334155',
    fontFamily: font.MonolithRegular,
    lineHeight: wp(4.8),
  },
  footer: {
    flexDirection: 'row',
    gap: wp(4),
    paddingTop: hp(2),

  },
  btnLater: {
    flex: 1,
    height: hp(6.9),
    borderRadius: wp(2.9),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLaterText: {
    fontSize: wp(4),
    color: '#64748B',
    fontFamily: font.MonolithRegular,
  },
  btnAction: {
    flex: 2,
    height: hp(6.9),
    borderRadius: wp(2.9),
    backgroundColor: '#FFCC00',
    justifyContent: 'center',
    alignItems: 'center',

  },
  btnActionText: {
    fontSize: wp(4.5),
    color: '#000000',
    fontFamily: font.MonolithRegular,

  },
});

export default NewOrderNotificationModal;
