import React, { memo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { color } from '../constant';
import font from '../theme/font';
import strings from '../localization/Localization';

interface ImagePickerModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  pickImageFromGallery: () => void;
  handleTakePhoto: () => void;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  modalVisible,
  setModalVisible,
  pickImageFromGallery,
  handleTakePhoto,
}) => {
  const onSelectGallery = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => {
      pickImageFromGallery();
    }, 500);
  }, [pickImageFromGallery, setModalVisible]);

  const onTakePhoto = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => {
      handleTakePhoto();
    }, 500);
  }, [handleTakePhoto, setModalVisible]);

  const handleCancel = useCallback(() => {
    setModalVisible(false);
  }, [setModalVisible]);

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.handleBar} />
            <Text allowFontScaling={false} style={styles.title}>
              {strings.ChooseOption}
            </Text>

            <OptionButton text={`📷 ${strings.SelectGallery}`} onPress={onSelectGallery} />
            <OptionButton text={`📸 ${strings.TakePhoto}`} onPress={onTakePhoto} />

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text allowFontScaling={false} style={styles.cancelText}>
                {strings.Cancel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

interface OptionButtonProps {
  text: string;
  onPress: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = memo(({ text, onPress }) => (
  <TouchableOpacity style={styles.optionButton} onPress={onPress}>
    <Text allowFontScaling={false} style={[styles.optionText]}>
      {text}
    </Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#d6e1f9ff",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: color.primary,
    borderRadius: 3,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    color: 'black',
    marginBottom: 10,
    fontFamily: font.TrialRegular
  },
  optionButton: {
    width: '100%',
    backgroundColor: '#f1f1f1',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: "center"
  },
  optionText: {
    fontSize: 15,
    color: '#333',
    fontFamily: font.TrialRegular, textAlign: "center",
  },
  cancelButton: {
    width: '100%',
    backgroundColor: color.primary,
    alignItems: 'center',
    marginTop: 10,
    justifyContent: "center",
    marginBottom: 15,
    height: 58,
    borderRadius: 30
  },
  cancelText: {
    fontSize: 15,
    color: 'black',
    fontFamily: font.MonolithRegular
  },
});

export default memo(ImagePickerModal);
