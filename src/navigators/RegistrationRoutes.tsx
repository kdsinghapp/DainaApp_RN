import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import _routes from '../routes/routes';
import ScreenNameEnum from '../routes/screenName.enum';
import { DashboardProvider } from '../context/DashboardContext';
import NewOrderNotificationModal from '../compoent/NewOrderNotificationModal';
import OfferAcceptedModal from '../compoent/OfferAcceptedModal';

export type RegistrationStackParamList = {
  [ScreenNameEnum.SPLASH_SCREEN]: undefined;
  [ScreenNameEnum.OnboardingScreen]: undefined;
  [ScreenNameEnum.ChooseRole]: undefined;
  [ScreenNameEnum.ReadyScreen]: undefined;
  [ScreenNameEnum.LoginScreen]: undefined;
  [ScreenNameEnum.OtpScreen]: undefined;
  [ScreenNameEnum.CreatePassword]: undefined;
  [ScreenNameEnum.PasswordReset]: undefined;
  [ScreenNameEnum.DrawerNavgation]: undefined;
  [ScreenNameEnum.DashBoardScreen]: undefined;
  [ScreenNameEnum.DashBoardDetail]: undefined;
  [ScreenNameEnum.PatientScreen]: undefined;
  [ScreenNameEnum.NewTripScreen]: undefined;
  [ScreenNameEnum.AddPatient]: undefined;
  [ScreenNameEnum.AddContract]: undefined;
  [ScreenNameEnum.AddDriver]: undefined;
  [ScreenNameEnum.SuccessScreen]: undefined;
  [ScreenNameEnum.MapScreen]: undefined;
  [ScreenNameEnum.Billing]: undefined;
  [ScreenNameEnum.setting]: undefined;
  [ScreenNameEnum.language]: undefined;
  [ScreenNameEnum.personalInfo]: undefined;
  [ScreenNameEnum.changePassword]: undefined;
  [ScreenNameEnum.DriverHome]: undefined;
  [ScreenNameEnum.TripDetail]: undefined;
  [ScreenNameEnum.TripSuccess]: undefined;
  [ScreenNameEnum.TripMap]: undefined;
  [ScreenNameEnum.CaptureDoc]: undefined;
  [ScreenNameEnum.CaptureSuccess]: undefined;
  [ScreenNameEnum.Patient_Driver]: undefined;
  [ScreenNameEnum.RaceDetail]: undefined;
  DrawerNavDriver: undefined;
  DrawerNav: undefined;
};

type RegistrationRouteType = {
  name: keyof RegistrationStackParamList;
  Component: React.ComponentType<any>;
};

const Stack = createNativeStackNavigator<RegistrationStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animation: 'slide_from_right',
};

import { useSelector, useDispatch } from 'react-redux';
import { setAppLanguage } from '../redux/feature/authSlice';
import { getLanguage } from '../localization/localeStorage';

import AppAlert from '../compoent/AppAlert';

const RegistrationRoutes: React.FC = () => {
  const language = useSelector((state: any) => state.auth.appLanguage);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const syncLanguage = async () => {
      const storedLang = await getLanguage();
      if (storedLang !== language) {
        dispatch(setAppLanguage(storedLang));
      }
    };
    syncLanguage();
  }, []);

  return (
    <DashboardProvider>
      <View style={{ flex: 1 }} key={language}>
        <Stack.Navigator screenOptions={screenOptions}>
          {_routes.REGISTRATION_ROUTE.map((screen: RegistrationRouteType) => (
            <Stack.Screen
              key={screen.name}
              name={screen.name}
              component={screen.Component}
              options={{
                animation: screen?.name === ScreenNameEnum.SuccessScreen ? 'fade' : 'slide_from_right',
              }}
            />
          ))}
        </Stack.Navigator>

        <NewOrderNotificationModal />
        <OfferAcceptedModal />
        {/* <AppAlert /> */}
      </View>

    </DashboardProvider>
  );
};

export default RegistrationRoutes;
