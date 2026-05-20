import React, { memo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import strings from '../localization/Localization';
import font from '../theme/font';

const LogoutModal = ({ visible, onLogout, onCancel }: any) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
          <Text allowFontScaling={false} style={styles.title}>
            {strings.Logout}
          </Text>
          <Text allowFontScaling={false} style={styles.message}>
            {strings.LogoutConfirmMessage}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text allowFontScaling={false} style={styles.cancelText}>{strings.Cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text allowFontScaling={false} style={styles.logoutText}>{strings.Yes}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDEDED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeText: {
    fontSize: 22,
    color: '#A0A0A0',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    color: '#333',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    fontFamily: font.MonolithRegular,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#FFCC00',
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: font.MonolithRegular,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EDEDED',
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelText: {
    color: '#333',
    fontSize: 16,
    fontFamily: font.MonolithRegular,
  },
});

export default memo(LogoutModal);
