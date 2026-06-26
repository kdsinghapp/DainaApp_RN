import { Platform } from 'react-native';
import colors from './colors';

export const shadows = {
  // Soft, modern shadow for floating cards
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    android: {
      elevation: 6,
    },
  }),
  
  // High elevation for modals/bottom sheets
  modal: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: {
      elevation: 20,
    },
  }),

  // Subtle glow around primary actions (like the matching circle)
  primaryGlow: Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
      shadowColor: colors.primaryDark,
    },
  }),

  // Header shadow
  header: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
  }),
};

export default shadows;
