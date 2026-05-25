import SocialLogin from "../screen/auth/SocialLogin/SocialLogin";
import OnboardingScreen from "../screen/auth/Onboarding/Onboarding";
import ScreenNameEnum from "./screenName.enum";
import TabNavigator from "../navigators/TabNavigation";
import NotificationsScreen from "../screen/Notification/Notification";
import HelpScreen from "../screen/Profile/Help/Helps";
import Splash from "../screen/auth/Splash/Splash";
import UploadDocumentsScreen from "../screen/auth/UploadDocumentsScreen/UploadDocumentsScreen";
import PhoneLogin from "../screen/auth/PhoneLogin/PhoneLogin";
import OtpScreen from "../screen/auth/OTPScreen/OtpScreen";
import ProfileSetup from "../screen/auth/ProfileSetup/ProfileSetup";
import OfferOR from "../screen/BottomTab/OfferOR/OfferOR";
import ViewDetails from "../screen/BottomTab/Orders/ViewDetails";
import EditProfile from "../screen/Profile/EditProfile/EditProfile";
import ChatScreen from "../screen/BottomTab/ChatScreen/ChatScreen";
import OrdersPrfile from "../screen/Profile/OrdersPrfile/OrdersPrfile";
import CourierTrackingScreen from "../screen/BottomTab/CourierTracking/CourierTracking";
import DeliveryTabNavigator from "../navigators/DeliveryTabNavigator";
import TripMap from "../screen/DeliveryBottomTab/TripMap/TripMap";
import WalletScreen from "../screen/DeliveryBottomTab/WalletScreen/WalletScreen";
import EarningsScreen from "../screen/DeliveryBottomTab/EarningsScreen/EarningsScreen";
import NotificationsSetting from "../screen/DeliveryBottomTab/NotificationsSetting/NotificationsSetting";
import ParcelDetails from "../screen/DeliveryBottomTab/ParcelDetails/ParcelDetails";
import VehicleSetupScreen from "../screen/auth/VehicleSetup/VehicleSetupScreen";
import ChooseRole from "../screen/auth/ChooseRole/ChooseRole";
import AllOrder from "../screen/DeliveryBottomTab/Delivery/DeliveryHome/AllOrder";
import RequestLoading from "../screen/BottomTab/DashBoard/RequestSend/RequestLoading";
import DocumentShow from "../screen/auth/DocumentShow/DocumentShow";
import DeliveryRequest from "../screen/DeliveryBottomTab/Delivery/DeliveryHome/DeliveryRequest";
import PickupLocationRapido from "../screen/BottomTab/PickupLocationRapido/PickupLocationRapido";
import CreateParcelFrom from "../screen/BottomTab/DashBoard/CreateParcel/CreateParcelFrom";
import NearbyDriversMap from "../screen/BottomTab/NearbyDriversMap/NearbyDriversMap";
import LanguageSelection from "../screen/Profile/LanguageSelection/LanguageSelection";
import BankSetupScreen from "../screen/auth/BankSetup/BankSetupScreen";
import EditProfileDeliver from "../screen/DeliveryBottomTab/EditProfileDeliver/EditProfileDeliver";
import VerificationPending from "../screen/DeliveryBottomTab/VerificationPending/VerificationPending";
import WebViewScreen from "../screen/Profile/WebViewScreen";
const _routes: any = {
  REGISTRATION_ROUTE: [
    {
      name: ScreenNameEnum.SPLASH_SCREEN,
      Component: Splash,
    },
    {
      name: ScreenNameEnum.BankSetupScreen,
      Component: BankSetupScreen,
    },

    {
      name: ScreenNameEnum.ChooseRole,
      Component: ChooseRole,
    },
    {
      name: ScreenNameEnum.WalletScreen,
      Component: WalletScreen,
    },
    {
      name: ScreenNameEnum.NotificationsSetting,
      Component: NotificationsSetting,
    },
    {
      name: ScreenNameEnum.CreateParcelFrom,
      Component: CreateParcelFrom,
    },
    {
      name: ScreenNameEnum.VehicleSetupScreen,
      Component: VehicleSetupScreen,
    },

    {
      name: ScreenNameEnum.EarningsScreen,
      Component: EarningsScreen,
    },


    {
      name: ScreenNameEnum.DocumentShow,
      Component: DocumentShow,
    },



    {
      name: ScreenNameEnum.NearbyDriversMap,
      Component: NearbyDriversMap,
    },


    {
      name: ScreenNameEnum.ProfileSetup,
      Component: ProfileSetup,
    },

    {
      name: ScreenNameEnum.UploadDocumentsScreen,
      Component: UploadDocumentsScreen,
    },
    {
      name: ScreenNameEnum.OnboardingScreen,
      Component: OnboardingScreen,
    },
    {
      name: ScreenNameEnum.CourierTrackingScreen,
      Component: CourierTrackingScreen,
    },

    {
      name: ScreenNameEnum.OrdersPrfile,
      Component: OrdersPrfile,
    },
    {
      name: ScreenNameEnum.ChatScreen,
      Component: ChatScreen,
    },
    {
      name: ScreenNameEnum.EditProfile,
      Component: EditProfile,
    },
    {
      name: ScreenNameEnum.OtpScreen,
      Component: OtpScreen,
    },

    {
      name: ScreenNameEnum.SocialLogin,
      Component: SocialLogin,
    },
    {
      name: ScreenNameEnum.PhoneLogin,
      Component: PhoneLogin,
    },


    {
      name: ScreenNameEnum.Help,
      Component: HelpScreen,
    },
    {
      name: ScreenNameEnum.TabNavigator,
      Component: TabNavigator,
    },


    {
      name: ScreenNameEnum.PickupLocationRapido,
      Component: PickupLocationRapido,
    },

    {
      name: ScreenNameEnum.ViewDetails,
      Component: ViewDetails,
    },
    {
      name: ScreenNameEnum.EditProfileDeliver,
      Component: EditProfileDeliver,
    },
    {
      name: ScreenNameEnum.VerificationPending,
      Component: VerificationPending,
    },


    {
      name: ScreenNameEnum.NotificationsScreen,
      Component: NotificationsScreen,
    },

    {
      name: ScreenNameEnum.OfferOR,
      Component: OfferOR,
    },

    {
      name: ScreenNameEnum.DeliveryRequest,
      Component: DeliveryRequest,
    },

    {
      name: ScreenNameEnum.PickupFromLocation,
      Component: CreateParcelFrom,
    },
    {
      name: ScreenNameEnum.DeliveryTabNavigator,
      Component: DeliveryTabNavigator,
    },

    {
      name: ScreenNameEnum.TripMap,
      Component: TripMap,
    },

    {
      name: ScreenNameEnum.ParcelDetails,
      Component: ParcelDetails,
    },
    {
      name: ScreenNameEnum.AllOrder,
      Component: AllOrder,
    },
    {
      name: ScreenNameEnum.RequestLoading,
      Component: RequestLoading,
    },
    {
      name: ScreenNameEnum.language,
      Component: LanguageSelection,
    },
    {
      name: ScreenNameEnum.WebViewScreen,
      Component: WebViewScreen,
    },
    //    {
    //   name: ScreenNameEnum.DocumentShow,
    //   Component: DocumentShow,
    // },

  ],


};

export default _routes;