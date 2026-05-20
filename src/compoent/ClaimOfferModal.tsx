import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import font from '../theme/font';
import strings from '../localization/Localization';

const { width } = Dimensions.get('window');

interface ClaimOfferModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: string;
}

const ClaimOfferModal: React.FC<ClaimOfferModalProps> = ({
  visible,
  onClose,
  onConfirm,
  amount,
}) => {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      useNativeDriver
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="hand-pointing-right" size={40} color="#FFCC00" />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{strings.ClaimOffer || "Claim Offer"}</Text>
          <Text style={styles.description}>
            {`Are you sure you want to claim this delivery for ${amount}?`}
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>{strings.Cancel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={onConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmButtonText}>{strings.Confirm || "Confirm"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  content: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    color: '#1F2937',
    fontFamily: font.MonolithRegular,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: font.MonolithRegular,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#FFCC00',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#4B5563',
    fontFamily: font.MonolithRegular,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: font.MonolithRegular,
  },
});

export default ClaimOfferModal;
