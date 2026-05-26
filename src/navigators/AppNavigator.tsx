import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RegistrationRoutes from './RegistrationRoutes';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '../redux/store';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import NetworkStatusModal from '../compoent/NetworkStatusModal';
import Toast from 'react-native-toast-message';
import toastConfig from '../utils/customToast';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import strings from '../localization/Localization';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
const AppNavigator: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView  >
          <NavigationContainer>
            <NetworkStatusModal
              modalVisible={!isConnected}
              offlineText={strings.NoInternetConnection}
            />
            <SafeAreaView style={{ flex: 1 }} edges={['bottom']} >
              <RegistrationRoutes />
            </SafeAreaView>
            <Toast config={toastConfig} />
          </NavigationContainer>
        </GestureHandlerRootView>

      </PersistGate>
    </Provider>
  );
};

export default AppNavigator;