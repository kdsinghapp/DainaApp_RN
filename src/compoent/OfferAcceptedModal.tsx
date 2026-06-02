import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import font from '../theme/font';
import strings from '../localization/Localization';
import { useDashboardContext } from '../context/DashboardContext';

const OfferAcceptedModal: React.FC = () => {
  const ctx = useDashboardContext();
  if (!ctx) return null;

  const { counterOfferAcceptedModal, setCounterOfferAcceptedModal } = ctx;
  const closeModal = () => {
    setCounterOfferAcceptedModal({ visible: false, data: null });
  };
  const data = counterOfferAcceptedModal?.data;
  const driver = data?.driver as { name?: string; image?: string } | undefined;

  return (
    <Modal
      isVisible={!!counterOfferAcceptedModal?.visible}
      onBackdropPress={closeModal}
      onBackButtonPress={closeModal}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.5}
      useNativeDriver
      hideModalContentWhileAnimating
      style={styles.modalContainer}
    >
      <View style={styles.modalCard}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          style={styles.accentBar}
        />
        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
          <Text style={styles.title}>
            {data?.title ?? strings.OfferAccepted}
          </Text>
        </Animated.View>

        {driver != null && (
          <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
            <Text style={styles.extra}>{driver?.name}</Text>
          </Animated.View>
        )}

        {driver?.image != null && driver.image !== '' && (
          <Animated.View entering={ZoomIn.delay(400).duration(500).springify()}>
            <Image
              source={{ uri: driver.image }}
              style={styles.driverImage}
            />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(500).duration(500).springify()}>
          <Text style={styles.message}>
            {data?.message ?? strings.DriverAcceptedOffer}
          </Text>
        </Animated.View>

        {data?.parcelId != null && (
          <Animated.View entering={FadeInDown.delay(600).duration(500).springify()}>
            <Text style={styles.extra}>{strings.Order} #{data.parcelId}</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(700).duration(500).springify()} style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.btnDismiss}
            onPress={closeModal}
            activeOpacity={0.8}
          >
            <Text style={styles.btnDismissText}>{strings.OK}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
    }),
  },
  accentBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#22C55E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: font.MonolithRegular,
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
    paddingHorizontal: 8,
    fontFamily: font.MonolithRegular,
  },
  extra: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    fontFamily: font.MonolithRegular,
  },
  driverImage: {
    height: 60,
    width: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  btnDismiss: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  btnDismissText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: font.MonolithRegular,
  },
});

export default OfferAcceptedModal;
