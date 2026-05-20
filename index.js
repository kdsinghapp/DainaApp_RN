import 'react-native-gesture-handler'; // MUST be first

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import NotificationService from './src/services/NotificationService';

messaging().setBackgroundMessageHandler(async remoteMessage => {
    try {
        if (typeof NotificationService.onBackgroundMessage === 'function') {
            await NotificationService.onBackgroundMessage(remoteMessage);
        } else {
            console.log('onBackgroundMessage is not defined');
        }
    } catch (error) {
        console.log('Background handler error:', error);
    }
});

// ✅ Register App (always at bottom)
AppRegistry.registerComponent(appName, () => App);