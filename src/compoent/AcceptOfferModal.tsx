import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import strings from '../localization/Localization';
import font from '../theme/font';

const PillButton = ({ label, onPress, variant = 'primary', disabled }: any) => {


  const bg = variant === 'primary' ? '#F2C200' : 'gray';
  const text = variant === 'primary' ? '#1A1A1A' : '#FFFFFF';


  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
      ]}
    >
      <Text style={[styles.buttonLabel, { color: text }]}>{label}</Text>
    </Pressable>
  );
};

interface AcceptOfferModalProps {
  visible: boolean;
  offerAmount: string;
  message?: string;
  currency?: string;
  onCancel: () => void;
  onAccept: () => void;
  onCounterPress: () => void;
}

const AcceptOfferModal = ({
  visible,
  offerAmount,
  message,
  currency = '$',
  onCancel,
  onAccept,
  onCounterPress,
}: AcceptOfferModalProps) => {

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.center}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.card}>
            <Text style={styles.title}>{strings.OfferInformation}</Text>

            <View style={styles.section}>
              <Text style={styles.label}>{strings.ProposedAmount}</Text>
              <Text style={styles.value}>{currency}{offerAmount}</Text>
            </View>

            {!!message && (
              <View style={styles.section}>
                <Text style={styles.label}>{strings.Message}</Text>
                <Text style={styles.message}>"{message}"</Text>
              </View>
            )}

            <View style={styles.row}>
              <PillButton label={strings.Cancel} variant="secondary" onPress={onCounterPress} />
              <View style={{ width: 12 }} />
              <PillButton label={strings.Accept} onPress={onAccept} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

export default AcceptOfferModal;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    width: '86%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    color: '#222',
    marginTop: 6,
    marginBottom: 16,
    fontFamily: font.MonolithRegular,
  },
  section: {
    marginBottom: 14,
    paddingHorizontal: 4,
    textAlign: "center"
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: font.MonolithRegular,
    textAlign: "center"

  },
  value: {
    fontSize: 26,
    color: 'black',
    marginTop: 4,
    fontFamily: font.MonolithRegular,
    textAlign: "center"

  },
  message: {
    fontSize: 15,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 4,
    fontFamily: font.MonolithRegular,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
  },
});
