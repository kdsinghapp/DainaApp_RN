import { Dimensions, StyleSheet } from 'react-native';
import font from '../../../theme/font';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');
const YELLOW = '#FFCC00';
const DARK = '#FFCC00';
const GRAY_BG = '#F2F2F7';
const LIGHT_TEXT = '#8E8E93';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    padding: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: "center"
  },
  activeTabButton: {
    backgroundColor: YELLOW,
    ...Platform.select({
      ios: {
        shadowColor: YELLOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: '#64748B',
  },
  activeTabText: {
    color: '#000',
    fontFamily: font.MonolithRegular,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    color: '#94A3B8',
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginBottom: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#d6e1f9ff",
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: font.MonolithRegular,
    color: DARK,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontFamily: font.MonolithRegular,
    letterSpacing: 1,
  },
  verifiedBadge: { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
  reviewBadge: { backgroundColor: 'rgba(0, 122, 255, 0.1)' },
  pendingBadge: { backgroundColor: 'rgba(255, 149, 0, 0.1)' },
  verifiedText: {
    color: '#34C759', fontFamily: font.MonolithRegular,
  },
  reviewText: {
    color: '#007AFF', fontFamily: font.MonolithRegular,
  },
  pendingText: {
    color: '#FF9500', fontFamily: font.MonolithRegular,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  infoItem: {
    width: '50%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: LIGHT_TEXT,
    marginBottom: 4,
    fontFamily: font.MonolithRegular,
  },
  infoValue: {
    fontSize: 15,

    color: DARK,
    fontFamily: font.MonolithRegular,
  },
  docImageWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: GRAY_BG,
    marginTop: 10,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: GRAY_BG,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  bankCard: {
    backgroundColor: '#FFCC00',
    borderRadius: 32,
    padding: 28,
    minHeight: 220,
    justifyContent: 'space-between',

  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: font.MonolithRegular,
    letterSpacing: 0.5,
  },
  bankChip: {
    width: 52,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    opacity: 0.95,
  },
  accountNumber: {
    color: '#FFF',
    fontSize: 24,
    letterSpacing: 4,
    marginVertical: 28,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    opacity: 0.9,
  },
  bankFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bankLabel: {
    color: 'white',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: font.MonolithRegular,
    letterSpacing: 1,
  },
  bankValue: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: font.MonolithRegular,
    color: DARK,
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    fontFamily: font.MonolithRegular,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontFamily: font.MonolithRegular,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    flex: 1,
    width: width,
  },
});
