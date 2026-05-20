import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform, Image } from 'react-native';
import ScreenNameEnum from '../routes/screenName.enum';
import HomeStack from './HomeStack';
import font from '../theme/font';
import SvgIndex from '../assets/svgIndex';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Orders from '../screen/BottomTab/Orders/Orders';
import Inbox from '../screen/BottomTab/Inbox/Inbox';
import UserProfile from '../screen/BottomTab/Profile/UserProfile';

import strings from '../localization/Localization';

const Tab = createBottomTabNavigator();

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 70;
const ICON_SIZE = 26;

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  const TAB_CONFIG: any = {
    [ScreenNameEnum.HomeStack]: {
      label: strings.Home,
      iconActive: SvgIndex.HomeAtive,
      iconInactive: SvgIndex.Home,
    },

    Orders: {
      label: strings.Orders,
      iconActive: SvgIndex.Box,
      iconInactive: SvgIndex.Box1,
    },
    Inbox: {
      label: strings.Inbox,
      iconActive: SvgIndex.MessageActive,
      iconInactive: SvgIndex.Message,
    },
    Profile: {
      label: strings.Profile,
      iconActive: SvgIndex.UserActive,
      iconInactive: SvgIndex.User,
    },
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TAB_CONFIG[route.name];
        return {
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 12,
                color: focused ? '#FFCC00' : '#2F4858',
                marginTop: 4,
                fontFamily: font.MonolithRegular,
              }}
            >
              {tab?.label ?? route.name}
            </Text>
          ),
          tabBarIcon: ({ focused }) => {
            const Icon = focused ? tab.iconActive : tab.iconInactive;
            if (typeof Icon === 'function') {
              return <Icon width={ICON_SIZE} height={ICON_SIZE} />;
            } else {
              return (
                <Image
                  source={Icon}
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    resizeMode: 'contain',
                  }}
                />
              );
            }
          },
          tabBarStyle: {
            position: 'absolute',
            left: 20,
            right: 20,
            backgroundColor: 'white', // your desired background
            height: TAB_BAR_HEIGHT + insets.bottom, // safe height including bottom inset
            paddingBottom: insets.bottom,
            paddingTop: 8,

            // Rounded corners
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,

            // Borders

            borderTopColor: 'rgba(125, 154, 155, 0.15)',
            borderLeftColor: 'rgba(125, 154, 155, 0.15)',
            borderRightColor: 'rgba(125, 154, 155, 0.15)',

            // Optional shadow for iOS
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,

            // Optional elevation for Android


          },
        };
      }}
    >
      <Tab.Screen name={ScreenNameEnum.HomeStack} component={HomeStack} />
      {/* <Tab.Screen name="MyTrack" component={MyTrack} /> */}
      <Tab.Screen name="Orders" component={Orders} />
      <Tab.Screen name="Inbox" component={Inbox} />
      <Tab.Screen name="Profile" component={UserProfile} />
    </Tab.Navigator>
  );
}
