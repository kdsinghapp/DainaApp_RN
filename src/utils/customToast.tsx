import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import font from '../theme/font';

const toastConfig = {
  successResponse: ({ text1 }: any) => (
    <View style={styles.successContainer}>
      <View style={styles.iconBadgeSuccess}>
        <Text style={styles.iconText}>✓</Text>
      </View>
      <Text style={[styles.textStyle, styles.textSuccess]} numberOfLines={3}>
        {text1}
      </Text>
    </View>
  ),
  errorResponse: ({ text1 }: any) => (
    <View style={styles.errorContainer}>
      <View style={styles.iconBadgeError}>
        <Text style={styles.iconText}>✕</Text>
      </View>
      <Text style={[styles.textStyle, styles.textError]} numberOfLines={3}>
        {text1}
      </Text>
    </View>
  ),
  normalResponse: ({ text1 }: any) => (
    <View style={styles.normalContainer}>
      <View style={styles.iconBadgeNormal}>
        <Text style={styles.iconText}>•</Text>
      </View>
      <Text style={[styles.textStyle, styles.textNormal]} numberOfLines={3}>
        {text1}
      </Text>
    </View>
  ),
};

// Toast functions
export const successToast = (message: string, time = 2000) => {
  Toast.show({
    type: 'successResponse',
    text1: message,
    position: 'top',
    visibilityTime: time,
    topOffset: 50,
  });
};

export const errorToast = (
  message: string,
  time = 2000,
  position: 'top' | 'bottom' = 'top',
) => {
  Toast.show({
    type: 'errorResponse',
    text1: message,
    position,
    visibilityTime: time,
    topOffset: 50,
  });
};

export const normalToast = (message: string, time = 2000) => {
  Toast.show({
    type: 'normalResponse',
    text1: message,
    position: 'top',
    visibilityTime: time,
    topOffset: 50,
  });
};

export default toastConfig;

const styles = StyleSheet.create({
  textStyle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.MonolithRegular,


  },
  textSuccess: { color: '#065F46' },
  textError: { color: '#B91C1C' },
  textNormal: { color: '#334155' },
  iconText: {
    fontSize: 14,
    color: '#FFF',
  },
  iconBadgeSuccess: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeError: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeNormal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  successContainer: {
    minHeight: 56,
    width: '90%',
    maxWidth: 340,
    alignSelf: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  errorContainer: {
    minHeight: 56,
    width: '90%',
    maxWidth: 340,
    alignSelf: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  normalContainer: {
    minHeight: 56,
    width: '90%',
    maxWidth: 340,
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#64748B',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
});

