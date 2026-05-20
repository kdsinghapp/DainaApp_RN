// localeStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'appLanguage';

export const saveLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export const getLanguage = async () => {
  try {
    const languageCode = await AsyncStorage.getItem(LANGUAGE_KEY);
    return languageCode || 'en';
  } catch (error) {
    console.error('Error reading language:', error);
    return 'en';
  }
};
