
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import strings from '../localization/Localization';
import font from '../theme/font';


const PillButton = ({ label, onPress, variant = 'primary', disabled = false, loading = false }: any) => {
  const bg = variant === 'primary' ? '#F2C200' : '#2D3A3A';
  const text = variant === 'primary' ? '#1A1A1A' : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled || loading ? 0.6 : pressed ? 0.9 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.buttonLabel, { color: text }]}>{loading ? '...' : label}</Text>
    </Pressable>
  );
};

/** Common: AppModal (centered card with backdrop) */
const AppModal = ({ visible, onRequestClose, children }: any) => {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, {
      toValue: visible ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.center}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.card}>{children}</View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/** Feature: CounterOfferModal */
const CounterOfferModal = ({
  visible,
  defaultValue = '',
  currency = '₹',
  min,
  max,
  onCancel,
  onSubmit,
  loading = false,
  title = strings.MakeOffer,
  showMessage = false,
  messagePlaceholder = strings.TypeMessageHere || 'Type message here...',
}: any) => {
  const [value, setValue] = useState(String(defaultValue ?? ''));
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (visible) {
      setValue(String(defaultValue ?? ''));
      setMessage('');
    }
  }, [visible, defaultValue]);

  const error = useMemo(() => {
    const n = Number(value);
    if (value === '') return null;
    if (Number.isNaN(n)) return strings.EnterValidAmount;
    if (min != null && n < min) return `${strings.MinimumIs} ${currency}${min}`;
    if (max != null && n > max) return `${strings.MaximumIs} ${currency}${max}`;
    return null;
  }, [value, min, max, currency]);

  const handleSubmit = () => {
    if (!error && value !== '') {
      onSubmit?.(Number(value), message.trim());
    }
  };

  return (
    <AppModal visible={visible} onRequestClose={onCancel}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.inputWrap}>
        <Text style={styles.currency}>{currency}</Text>
        <TextInput
          value={String(value)}
          onChangeText={(t) => setValue(t.replace(/[^0-9.]/g, ''))}
          placeholder={`${currency} 0`}
          keyboardType="decimal-pad"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {showMessage && (
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={messagePlaceholder}
          style={styles.messageInput}
          multiline
          textAlignVertical="top"
        />
      )}

      <View style={styles.row}>
        <PillButton label={strings.Cancel} variant="secondary" onPress={onCancel} />
        <View style={{ width: 12 }} />
        <PillButton label={strings.Submit} onPress={handleSubmit} disabled={!!error || value === ''} loading={loading} />
      </View>
    </AppModal>
  );
};

export default CounterOfferModal;

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
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    color: '#222',
    marginTop: 6,
    marginBottom: 14,
    fontFamily: font.MonolithRegular
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  currency: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    color: '#9CA3AF',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1F2937',
    paddingVertical: 4,
    fontFamily: font.MonolithRegular

  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
    fontFamily: font.MonolithRegular

  },
  error: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: font.MonolithRegular

  },
  messageInput: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F2937',
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    marginTop: 10,
  },
});
