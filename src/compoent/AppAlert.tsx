import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import font from '../theme/font';
import { useDashboardContext } from '../context/DashboardContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import strings from '../localization/Localization';

const AppAlert: React.FC = () => {
  const ctx = useDashboardContext();
  if (!ctx) return null;

  const { generalAlert, setGeneralAlert } = ctx;

  const closeModal = () => {
    generalAlert.onClose?.();
    setGeneralAlert({ ...generalAlert, visible: false });
  };

  const getIcon = () => {
    switch (generalAlert.type) {
      case 'success': return 'check-circle';
      case 'error': return 'close-circle';
      default: return 'information';
    }
  };

  const getColor = () => {
    switch (generalAlert.type) {
      case 'success': return '#22C55E';
      case 'error': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  return (
    <Modal
      isVisible={generalAlert.visible}
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
        <View style={[styles.accentBar, { backgroundColor: getColor() }]} />

        <View style={[styles.iconWrap, { backgroundColor: getColor() + '10' }]}>
          <Icon name={getIcon()} size={48} color={getColor()} />
        </View>

        <Text style={styles.title}>
          {generalAlert.title || (generalAlert.type === 'error' ? 'Error' : 'Success')}
        </Text>

        <Text style={styles.message}>
          {generalAlert.message}
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btnDismiss, { backgroundColor: getColor() }]}
            onPress={closeModal}
            activeOpacity={0.8}
          >
            <Text style={styles.btnDismissText}>{strings.OK}</Text>
          </TouchableOpacity>
        </View>
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
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',

    borderWidth: 1,
    borderColor: "#d6e1f9ff",
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginBottom: 20,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
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
    marginBottom: 28,
    paddingHorizontal: 8,
    fontFamily: font.MonolithRegular,
  },
  buttonRow: {
    width: '100%',
  },
  btnDismiss: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnDismissText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: font.MonolithRegular,
  },
});

export default AppAlert;
