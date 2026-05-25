import font from '../theme/font';
import SvgIndex from '../assets/svgIndex';
import strings from '../localization/Localization';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import DeliveryHome from '../screen/DeliveryBottomTab/Delivery/DeliveryHome/DeliveryHome';
import DeliverOrders from '../screen/DeliveryBottomTab/Delivery/DeliverOrders/DeliverOrders';
import Inbox from '../screen/BottomTab/Inbox/Inbox';
import DeliveryProfile from '../screen/DeliveryBottomTab/DeliveryProfile/DeliveryProfile';
import NewOrderNotificationModal from '../compoent/NewOrderNotificationModal';
import OfferAcceptedModal from '../compoent/OfferAcceptedModal';
import InboxDeliver from '../screen/DeliveryBottomTab/InboxDeliver/InboxDeliver';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 70;
const ICON_SIZE = 26;

export default function DeliveryTabNavigator() {
  const insets = useSafeAreaInsets();

  const TAB_CONFIG: any = {
    Home: {
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
    <>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TAB_CONFIG[route.name];
          return {
            headerShown: false,
            tabBarLabel: ({ focused }) => {
              const animatedTextStyle = useAnimatedStyle(() => {
                return {
                  transform: [{ scale: withSpring(focused ? 1.05 : 1) }],
                  opacity: withTiming(focused ? 1 : 0.8),
                };
              });

              return (
                <Animated.Text
                  allowFontScaling={false}
                  style={[
                    {
                      fontSize: 11,
                      color: focused ? '#FFCC00' : '#2F4858',
                      marginTop: 2,
                      fontFamily: font.MonolithRegular,
                    },
                    animatedTextStyle,
                  ]}
                >
                  {tab?.label ?? route.name}
                </Animated.Text>
              );
            },
            tabBarIcon: ({ focused }) => {
              const Icon = focused ? tab?.iconActive : tab?.iconInactive;
              const animatedIconStyle = useAnimatedStyle(() => {
                return {
                  transform: [{ scale: withSpring(focused ? 1.2 : 1) }],
                };
              });

              return (
                <Animated.View style={animatedIconStyle}>
                  {typeof Icon === 'function' ? (
                    <Icon width={ICON_SIZE} height={ICON_SIZE} />
                  ) : (
                    <Image
                      source={Icon}
                      style={{
                        width: ICON_SIZE,
                        height: ICON_SIZE,
                        resizeMode: 'contain',
                      }}
                    />
                  )}
                </Animated.View>
              );
            },
            tabBarStyle: {
              position: 'absolute',
              left: 20,
              right: 20,
              backgroundColor: 'white',
              height: TAB_BAR_HEIGHT + insets.bottom,
              paddingBottom: insets.bottom,
              paddingTop: 8,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderTopColor: 'rgba(125, 154, 155, 0.15)',
              borderLeftColor: 'rgba(125, 154, 155, 0.15)',
              borderRightColor: 'rgba(125, 154, 155, 0.15)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            },
          };

        }}
      >
        <Tab.Screen name="Home" component={DeliveryHome} />
        <Tab.Screen name="Orders" component={DeliverOrders} />
        <Tab.Screen name="Inbox" component={InboxDeliver} />
        <Tab.Screen name="Profile" component={DeliveryProfile} />
      </Tab.Navigator>

    </>
  );
}
