// style.ts
import { Dimensions, StyleSheet } from 'react-native';
import font from '../../../theme/font';
import { color } from '../../../constant';
import { Platform } from 'react-native';
const { width, height } = Dimensions.get('window');
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 30,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  image: {
    height: 80,
    width: 180,
    marginBottom: 40,
  },
  headerTextWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: font.MonolithRegular,
    textAlign: 'center',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: '#64748B',
    textAlign: 'center',

  },
  optionsWrap: {
    width: '100%',
    paddingHorizontal: 4,
  },
  touchContainer: {
    marginBottom: 16,
    width: '100%',
  },
  option: {
    height: 90,
    borderRadius: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,


    borderWidth: 1,
    borderColor: "#d6e1f9ff",
  },
  optionSelected: {
    borderColor: '#FFCC00',
    backgroundColor: '#FFFDF0',

  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconWrapSelected: {
    backgroundColor: '#FFCC00',
  },
  optionIcon: {
    height: 28,
    width: 28,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: font.MonolithRegular,
    marginBottom: 2,
  },
  optionTextSelected: {
    color: '#000',
  },
  optionDesc: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: font.MonolithRegular,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FFCC00',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFCC00',
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 10 : 24,

  },
  nextButton: {
    backgroundColor: '#FFCC00',
    borderRadius: 20,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',

  },
  nextButtonText: {
    color: '#000',
    fontSize: 17,

    fontFamily: font.MonolithRegular,
  },
  nextButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
  },
  nextButtonTextDisabled: {
    color: '#94A3B8',
  },
});
