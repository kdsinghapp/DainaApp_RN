
import { base_url } from './index';
import ScreenNameEnum from '../routes/screenName.enum';
import { loginSuccess, logout } from '../redux/feature/authSlice';
import { errorToast, successToast } from '../utils/customToast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '../utils/Toast';
import { color } from '../constant';
import axios from 'axios';
import strings from '../localization/Localization';
const handleLogout = async (dispatch: any) => {
  try {
    dispatch(logout());    // reset Redux state
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

const saveAuthData = async (userData: any, token: any) => {
  try {
    await AsyncStorage.setItem('authData', JSON.stringify({ userData, token }));
    console.log('Auth data saved successfully');
  } catch (error) {
    console.error('Error saving auth data:', error);
  }
};
const getAuthData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('authData');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error reading auth data:', error);
    return null;
  }
};

const LogiApi = async (
  param: any,
  setLoading: (loading: boolean) => void,
) => {
  setLoading(true);

  try {
    // ✅ Create FormData object
    const formdata = new FormData();
    formdata.append('countryCode', param?.code || '');
    formdata.append('phoneNumber', param?.phone || '');
    formdata.append('Type', param?.type || '');

    console.log('FormData:', {
      countryCode: param?.code,
      phoneNumber: param?.phone,
      Type: param?.type,
    });

    // ✅ Send FormData instead of JSON
    const response = await fetch(`${base_url}/register`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        // ❌ Do NOT set Content-Type manually for FormData
        // The browser/react-native will handle the correct boundary automatically
      },
      body: formdata,
    });

    const textResponse = await response.text();

    // ✅ Try parsing response safely
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (error) {
      errorToast(strings.InvalidServerResponse);
      return;
    }

    // ✅ Handle API response
    if (parsedResponse?.status === 1) {
      successToast(strings.LoginSuccess);
      param.navigation.navigate(ScreenNameEnum.OtpScreen, {
        code: param?.code,
        phone: param?.phone,
      });
      return parsedResponse;
    } else {
      errorToast(strings.LoginFailed);
      return parsedResponse;
    }

  } catch (error) {
    console.error('Login error:', error);
    errorToast(strings.NetworkErrorTryAgain);
  } finally {
    setLoading(false);
  }
};

const Verifyotp = async (param: any, setLoading: any, dispatch: any, setGeneralAlert?: any) => {
  setLoading(true);


  try {
    const fcmToken = await AsyncStorage.getItem('fcmToken');
    console.log("fcmToken ------", fcmToken);

    const formdata = new FormData();
    formdata.append('countryCode', param?.code || '');
    formdata.append('phoneNumber', param?.phone || '');
    formdata.append('otp', param?.otp || '');
    formdata.append('fcmToken', fcmToken || '');

    const response = await fetch(`${base_url}/verify-otp`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formdata,
    });

    const textResponse = await response.text();
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (error) {
      throw new Error(strings.InvalidServerResponse);
    }

    console.log("Verify OTP Response:", parsedResponse);

    setLoading(false)
    if (parsedResponse?.status == 1) {
      successToast(strings.VerificationSuccess);
      await AsyncStorage.setItem('token', parsedResponse?.token);
      dispatch(loginSuccess({ userData: parsedResponse, token: parsedResponse?.token }));
      await saveAuthData(parsedResponse, parsedResponse?.token);
      setLoading(false)

      const languageId = strings.getLanguage() === 'en' ? 1 : 2;
      await SetLanguageApi({ languageId }, setLoading);
      console.log("parsedResponse OTP Response:", parsedResponse);

      if (parsedResponse?.type === "Delivery") {
        setLoading(false)
        const completion = parsedResponse?.completionStatus;

        if (completion?.isProfileComplete && completion?.isDocumentsUploaded) {
          param.navigation.reset({
            index: 0,
            routes: [{ name: ScreenNameEnum.DeliveryTabNavigator }],
          });
        } else if (!completion?.isProfileComplete) {
          param.navigation.reset({
            index: 0,
            routes: [{ name: ScreenNameEnum.ProfileSetup, params: { type: "otp" } }],
          });
        } else {
          param.navigation.reset({
            index: 0,
            routes: [{ name: ScreenNameEnum.UploadDocumentsScreen }],
          });
        }
      } else {
        setLoading(false)

        param.navigation.reset({
          index: 0,
          routes: [{ name: ScreenNameEnum.ProfileSetup, params: { type: "otp" } }],
        });
      }
    } else {
      setLoading(false)

      const errorMessage = strings.InvalidOTP;

      errorToast(errorMessage);

    }
  } catch (error: any) {
    setLoading(false)

    console.error('Verify OTP error:', error);
    const errorMessage = error?.message || strings.NetworkErrorTryAgain;

    errorToast(errorMessage);

  } finally {
    setLoading(false);
  }
};

const Resend_otp = async (param: any, setLoading: any) => {
  setLoading(true);
  try {
    const body = `countryCode=${encodeURIComponent(param?.code || '')}&phoneNumber=${encodeURIComponent(param?.phone || '')}`;

    const response = await fetch(`${base_url}/resend-otp`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    const textResponse = await response.text();
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (error) {
      errorToast(strings.InvalidServerResponse);
      return;
    }

    if (parsedResponse?.status === 1) {
      successToast(strings.ResendSuccess);
      return parsedResponse;
    } else {
      errorToast(strings.ResendFailed);
      return parsedResponse;
    }

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    errorToast(strings.NetworkErrorTryAgain);
  } finally {
    setLoading(false);
  }
};

const UpdateProfile = async (
  param: any,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);

    const token = await AsyncStorage.getItem("token");

    const formdata = new FormData();

    if (param.username) formdata.append("firstName", param.username);
    if (param.email) formdata.append("email", param.email);
    if (param.address) formdata.append("address", param.address);

    // ✅ Append image only if exists
    if (param.imagePrfoile && param.imagePrfoile.uri) {
      const fileName = param.imagePrfoile.fileName || "profile.jpg";
      const fileType = param.imagePrfoile.type || "image/jpeg";

      formdata.append("imageFile", {
        uri: param.imagePrfoile.uri,
        name: fileName,
        type: fileType,
      });
    }

    // ✅ Do NOT manually set 'Content-Type' header
    const headers: any = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    // ✅ Use POST (most servers expect POST for FormData upload)
    const response = await fetch(`${base_url}/setup-profile`, {
      method: "POST",
      headers,
      body: formdata,
    });
    console.log("response", response)
    const textResponse = await response.text();
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(textResponse);
    } catch {
      throw new Error("Invalid server response");
    }
    console.log("parsedResponse", parsedResponse)

    if (parsedResponse.status == "1") {
      successToast(parsedResponse.message);
      return parsedResponse;
    } else {
      errorToast(parsedResponse.message);
      return parsedResponse;
    }
  } catch (error) {
    console.log("parsedResponse", error)

    console.error("UpdateProfile error:", error);
    errorToast(error?.message || "");
    return null;
  } finally {
    setLoading(false);
  }
};



const GetProfileApi = async (
  setLoading: (loading: boolean) => void
): Promise<any | null> => {
  setLoading(true);
  const token = await AsyncStorage.getItem('token');
  console.log("token", token);
  try {
    const response = await fetch(`${base_url}/setup-profile`, {
      method: 'GET',  // agar get ho toh GET use karna
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    console.log("responseData", responseData);

    if (responseData.status === "1" || responseData.status === 1) {
      return responseData;
    } else {
      Toast(responseData.error || responseData.message || "Something went wrong", color.red, 10);
      return null;
    }
  } catch (error) {
    console.error("API call error:", error);
    errorToast(strings.NetworkErrorTryAgain);
    return null;
  } finally {
    setLoading(false);
  }
};


const Privacypolicy = async (setLoading: any) => {
  setLoading(true);
  try {
    const response = await fetch(`${base_url}/privacy-policy`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const textResponse = await response.text();
    const parsedResponse = JSON.parse(textResponse);

    console.log("parsedResponse", parsedResponse);

    if (parsedResponse?.status === 1) {
      // successToast(parsedResponse?.message);
      return parsedResponse; // ✅ Return the data
    } else {
      errorToast(parsedResponse?.message);
      return null; // Optional: return null on failure
    }

  } catch (error: any) {
    console.error('Privacy Policy error:', error);
    errorToast(error.message);
    return null;
  } finally {
    setLoading(false);
  }
};


const Termsconditions = async (setLoading: any) => {
  setLoading(true);
  try {
    const response = await fetch(`${base_url}/terms-and-conditions`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const textResponse = await response.text();
    const parsedResponse = JSON.parse(textResponse);

    console.log("parsedResponse", parsedResponse);

    if (parsedResponse?.status === 1) {
      // successToast(parsedResponse?.message);
      return parsedResponse; // ✅ Return the data
    } else {
      errorToast(parsedResponse?.message);
      return null; // Optional: return null on failure
    }

  } catch (error: any) {
    console.error('Privacy Policy error:', error);
    errorToast(error.message);
    return null;
  } finally {
    setLoading(false);
  }
};


const DeliveryUploadDocument = async (
  param: any,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    const formdata = new FormData();

    if (param.drivingLicense?.uri) {
      formdata.append("drivingLicense", {
        uri: param.drivingLicense.uri,
        name: param.drivingLicense.name || "license.jpg",
        type: param.drivingLicense.type || "image/jpeg",
      });
    }

    if (param.idDocument?.uri) {
      formdata.append("idDocument", {
        uri: param.idDocument.uri,
        name: param.idDocument.name || "id.jpg",
        type: param.idDocument.type || "image/jpeg",
      });
    }

    if (param.vehiclePapers?.uri) {
      formdata.append("vehiclePapers", {
        uri: param.vehiclePapers.uri,
        name: param.vehiclePapers.name || "vehicle.jpg",
        type: param.vehiclePapers.type || "image/jpeg",
      });
    }



    const response = await axios.post(`${base_url}/upload-document`, formdata, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Upload Success Response:", response.data);
    console.log(" Success Response:", response);
    if (response.data.status == "1" || response.data.status == 1) {
      successToast(response.data.message || "Documents uploaded successfully");
    } else {
      errorToast(response.data.message || "Upload failed");
    }

    return response.data;
  } catch (error: any) {
    console.log("Upload Error Details:", error.response?.data || error.message);

    let errorMessage = strings.SomethingWentWrong;

    if (error.response?.status === 413) {
      // Specifically handle Nginx "413 Request Entity Too Large"
      errorMessage = strings.FileTooLarge;
    } else {
      // Extract from response data if available
      const data = error.response?.data;
      errorMessage =
        data?.message ||
        data?.detail?.[0]?.msg ||
        error.message ||
        strings.SomethingWentWrong;
    }

    errorToast(errorMessage);
    return null;
  } finally {
    setLoading(false);
  }
};


const DeliveryVehicleDocument = async (
  param: any,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    const formdata = new FormData();

    if (param.vehicleType) {
      formdata.append("vehicleType", param.vehicleType);
    }

    if (param.vehicleNumber) {
      formdata.append("vehicleNumber", param.vehicleNumber);
    }

    if (param.vehicleRegistration?.uri) {
      formdata.append("vehicleRegistration", {
        uri: param.vehicleRegistration.uri,
        name: param.vehicleRegistration.name || "vehicle_registration.jpg",
        type: param.vehicleRegistration.type || "image/jpeg",
      });
    }
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${base_url}/vehicle-setup`, {
      method: "POST",
      headers,
      body: formdata,
    });

    const textResponse = await response.text();
    let parsedResponse;
    console.log("textResponse", textResponse)
    console.log("parsedResponse", parsedResponse)
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch {
      throw new Error("Invalid server response");
    }

    console.log("Vehicle Upload Response:", parsedResponse);

    if (parsedResponse.status == "1") {
      successToast(parsedResponse.message || "Document uploaded successfully!");
    } else {
      errorToast(parsedResponse.message || "Upload failed.");
    }

    return parsedResponse;
  } catch (error) {
    console.error("DeliveryVehicleDocument error:", error);
    errorToast(strings.SomethingWentWrong);
    return null;
  } finally {
    setLoading(false);
  }
};

const DeliveryBankSetup = async (
  param: any,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    const body = `bankName=${encodeURIComponent(param.bankName)}&bankAccountNumber=${encodeURIComponent(param.bankAccountNumber)}&bankIfscCode=${encodeURIComponent(param.bankIfscCode)}`;

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${base_url}/bank-setup`, {
      method: "POST",
      headers,
      body,
    });

    const textResponse = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch {
      throw new Error("Invalid server response");
    }

    if (parsedResponse.status == "1" || parsedResponse.status == 1) {
      successToast(parsedResponse.message);
    } else {
      errorToast(parsedResponse.message);
    }

    return parsedResponse;
  } catch (error) {
    console.error("DeliveryBankSetup error:", error);
    errorToast(strings.SomethingWentWrong);
    return null;
  } finally {
    setLoading(false);
  }
};

const GetuploadDocument = async (
  setLoading: (loading: boolean) => void
): Promise<any | null> => {
  setLoading(true);
  const token = await AsyncStorage.getItem('token');
  console.log("token", token);
  try {
    const response = await fetch(`${base_url}/upload-document`, {
      method: 'GET',  // agar get ho toh GET use karna
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    console.log("responseData", responseData);

    if (responseData.status == "1" || responseData.status == 1) {
      return responseData;
    } else {
      Toast(responseData.error || responseData.message || "Something went wrong", color.red, 10);
      return null;
    }
  } catch (error) {
    console.error("API call error:", error);
    errorToast(strings.NetworkErrorTryAgain);
    return null;
  } finally {
    setLoading(false);
  }
};
const AddParcelApi = async (param: any, setLoading: (loading: boolean) => void) => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    const formdata = new FormData();
    if (param?.image && param?.image?.uri) {
      const fileName = param.image.fileName || "profile.jpg";
      const fileType = param.image.type || "image/jpeg";
      formdata.append("imageFile", {
        uri: param.image.uri,
        name: fileName,
        type: fileType,
      });
    }
    if (param?.pickupLocation) formdata.append("pickupLocation", param.pickupLocation?.address);
    if (param?.dropLocation) formdata.append("dropLocation", param.dropLocation);
    // image
    if (param?.pickupLat?.latitude) formdata.append("pickupLocationLat", param.pickupLat.latitude.toString());
    if (param?.pickupLat?.longitude) formdata.append("pickupLocationLon", param.pickupLat.longitude.toString());
    if (param?.droplat?.latitude) formdata.append("dropLocationLat", param.droplat.latitude.toString());
    if (param?.droplat?.longitude) formdata.append("dropLocationLon", param.droplat.longitude.toString());
    if (param.shipmentType) formdata.append("shipmentType", param.shipmentType);
    if (param.senderName) formdata.append("senderName", param.senderName);
    if (param.senderMobile) formdata.append("senderMobileNumber", param.senderMobile);
    if (param.senderAddress) formdata.append("senderAddress", param.senderAddress);
    if (param.pickupDate) {
      formdata.append("pickupDate", param.pickupDate instanceof Date ? param.pickupDate.toISOString() : param.pickupDate);
    }
    if (param.pickupTime) {
      formdata.append("pickupTime", param.pickupTime instanceof Date ? param.pickupTime.toISOString() : param.pickupTime);
    }
    if (param.consignmentType) formdata.append("consignmentType", param.consignmentType);
    if (param.packageSize) formdata.append("packageSize", param.packageSize);
    if (param.deliveryType) formdata.append("deliveryType", param.deliveryType);
    if (param.price) formdata.append("price", param.price);

    if (param.receiverName) formdata.append("receiverName", param.receiverName);
    if (param.receiverMobile) formdata.append("receiverMobileNumber", param.receiverMobile);
    if (param.receiverAddress) formdata.append("receiverAddress", param.receiverAddress);
    if (param.extraMessage) formdata.append("message", param.extraMessage);

    if (param.pickupLat?.latitude) formdata.append("pickupLat", param.pickupLat.latitude.toString());
    if (param.pickupLat?.longitude) formdata.append("pickupLon", param.pickupLat.longitude.toString());
    if (param.droplat?.latitude) formdata.append("droplat", param.droplat.latitude.toString());
    if (param.droplat?.longitude) formdata.append("dropLon", param.droplat.longitude.toString());

    console.log("FormData Lat/Lon:", formdata);
    const headers: any = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${base_url}/parcel-details`, {
      method: "POST",
      headers,
      body: formdata,
    });

    const textResponse = await response.text();
    let parsedResponse;
    try {
      setLoading(false);

      parsedResponse = JSON.parse(textResponse);
    } catch {
      setLoading(false);

      throw new Error("Invalid server response");
    }

    if (parsedResponse.status == "1" || parsedResponse.status == 1) {
      setLoading(false);

      successToast(parsedResponse.message || strings.PickupRequestSuccess);
      return parsedResponse;
    } else {
      setLoading(false);

      errorToast(parsedResponse.message || strings.SomethingWentWrong);
      return parsedResponse;
    }
  } catch (error) {
    setLoading(false);

    console.error("AddParcelApi error:", error);
    return null;
  } finally {
    setLoading(false);
  }
};

const GetApi = async (param: any, setLoading: (loading: boolean) => void) => {
  // console.log("API PARAM:", param);

  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions: any = {
      method: param.method || "GET",
      headers: myHeaders,
    };

    // ✅ ADD BODY ONLY IF EXISTS
    if (param.data && Object.keys(param.data).length > 0) {
      requestOptions.body = JSON.stringify(param.data);
    }

    const response = await fetch(base_url + param.url, requestOptions);
    const resText = await response.text();
    const result = JSON.parse(resText);

    // console.log("API RESPONSE:", result);

    setLoading(false);
    return result;

  } catch (error) {
    setLoading(false);
    errorToast(strings.NetworkErrorTryAgain);
    return null;
  }
};

export const PostApi = async (param, setLoading) => {
  try {
    setLoading && setLoading(true);

    const headers = {
      Accept: "application/json",
      ...(param?.isFormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" }),
      ...(param?.token && { Authorization: `Bearer ${param.token}` }),
    };
    console.log(base_url + param.url,
      param.data,
      { headers })
    const response = await axios.post(
      base_url + param.url,
      param.data,
      { headers }
    );
    console.log("ssss", response)
    return response.data;
  } catch (error) {
    console.log("POST API ERROR 👉", error?.response || error);

    return {
      status: false,
      message:
        error?.response?.data?.message ||
        "Something went wrong. Please try again.",
    };
  } finally {
    setLoading && setLoading(false);
  }
};




const Parceldetails = async (
  setLoading: (loading: boolean) => void
): Promise<any | null> => {
  setLoading(true);
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await fetch(`${base_url}/parcel-details`, {
      method: 'GET',  // agar get ho toh GET use karna
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    console.log("responseData", responseData);

    if (responseData.status == "1" || responseData.status == 1) {
      return responseData;
    } else {
      Toast(responseData.error || responseData.message || "Something went wrong", color.red, 10);
      return null;
    }
  } catch (error) {
    console.error("API call error:", error);
    errorToast(strings.NetworkErrorTryAgain);
    return null;
  } finally {
    setLoading(false);
  }
};






const DeliveryAvailableRequests = async (
  setLoading: (loading: boolean) => void
): Promise<any | null> => {
  setLoading(true);
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await fetch(`${base_url}/delivery/available-requests`, {
      method: 'GET',  // agar get ho toh GET use karna
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    console.log("responseData", responseData);

    if (responseData.status === "1" || responseData.status === 1) {
      return responseData;
    } else {
      Toast(responseData.error || responseData.message || "Something went wrong", color.red, 10);
      return null;
    }
  } catch (error) {
    errorToast("Network error");
    return null;
  } finally {
    setLoading(false);
  }
};
const SetLanguageApi = async (param: any, setLoading: (loading: boolean) => void) => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    const body = `languageId=${encodeURIComponent(param.languageId)}`;

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${base_url}/set-language`, {
      method: "POST",
      headers,
      body,
    });
    console.log("SetLanguageApi response", response);
    const textResponse = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch {
      throw new Error("Invalid server response");
    }
    console.log("parsedResponse parsedResponse", parsedResponse);

    return parsedResponse;
  } catch (error) {
    console.error("SetLanguageApi error:", error);
    return null;
  } finally {
    setLoading(false);
  }
};

const GetNotifications = async (
  setLoading: (loading: boolean) => void
): Promise<any | null> => {
  setLoading(true);
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await fetch(`${base_url}/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    console.log("Notifications Response:", responseData);

    if (responseData.status === "1" || responseData.status === 1) {
      return responseData;
    } else {
      // If unauthorized, you might want to handle it (e.g. status 0 or 401)
      if (responseData.status === 0 || responseData.message === "Not authenticated") {
        console.warn("User not authenticated for notifications");
      }
      return responseData;
    }
  } catch (error) {
    console.error("GetNotifications API call error:", error);
    errorToast(strings.NetworkErrorTryAgain);
    return null;
  } finally {
    setLoading(false);
  }
};

const GetDashboardCounts = async (
  setLoading: (loading: boolean) => void
): Promise<any | null> => {
  setLoading(true);
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await fetch(`${base_url}/dispatcher/dashboard/counts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    console.log("Dashboard Counts Response:", responseData);

    if (responseData.status === "1" || responseData.status === 1) {
      return responseData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("GetDashboardCounts API call error:", error);
    return null;
  } finally {
    setLoading(false);
  }
};

const GetVerificationStatusApi = async (): Promise<any | null> => {
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await fetch(`${base_url}/driver/verification-status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    console.log("Verification Status Response:", responseData);

    if (responseData.status === 1 || responseData.status === "1") {
      return responseData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("GetVerificationStatusApi error:", error);
    return null;
  }
};

const CancelParcelApi = async (
  id: string | number,
  setLoading: (loading: boolean) => void
): Promise<any | null> => {
  setLoading(true);
  const token = await AsyncStorage.getItem('token');
  try {
    const response = await fetch(`${base_url}/parcel-details/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("CancelParcelApi API call error:", error);
    return null;
  } finally {
    setLoading(false);
  }
};

const MarkNotificationsAsReadApi = async (
  param: { notificationId?: number | null },
  setLoading?: (loading: boolean) => void
) => {
  try {
    setLoading?.(true);
    const token = await AsyncStorage.getItem("token");

    let body = "";
    if (param?.notificationId) {
      body = `notificationId=${encodeURIComponent(param.notificationId)}`;
    }

    const response = await fetch(`${base_url}/notifications/mark-read`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const textResponse = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch {
      throw new Error(strings.InvalidServerResponse);
    }

    return parsedResponse;
  } catch (error: any) {
    console.error("MarkNotificationsAsReadApi error:", error);
    return null;
  } finally {
    setLoading?.(false);
  }
};

const RateDeliveryApi = async (
  param: { parcelId: number; rating: number; review?: string },
  setLoading?: (loading: boolean) => void
) => {
  try {
    setLoading?.(true);
    const token = await AsyncStorage.getItem("token");

    // Construct urlencoded body
    let body = `parcelId=${encodeURIComponent(param.parcelId)}&rating=${encodeURIComponent(param.rating)}`;
    if (param.review) {
      body += `&review=${encodeURIComponent(param.review)}`;
    }

    const response = await fetch(`${base_url}/user/rate-delivery`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const textResponse = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch {
      throw new Error(strings.InvalidServerResponse);
    }
    console.log("RatingSuccess parsedResponse", parsedResponse);

    if (parsedResponse.status == 1 || parsedResponse.status == "1") {
      successToast(parsedResponse.message || strings.RatingSuccess);
    } else {
      errorToast(parsedResponse.message);
    }

    return parsedResponse;
  } catch (error: any) {
    console.error("RateDeliveryApi error:", error);
    errorToast(error?.message || strings.SomethingWentWrong);
    return null;
  } finally {
    setLoading?.(false);
  }
};

const DeleteAccountApi = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${base_url}/delete-account`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const textResponse = await response.text();
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (error) {
      errorToast(strings.InvalidServerResponse);
      return;
    }

    if (parsedResponse?.status === 1 || parsedResponse?.status === "1") {
      successToast(parsedResponse?.message || "Account deleted successfully");
      return parsedResponse;
    } else {
      errorToast(parsedResponse?.message || "Failed to delete account");
      return parsedResponse;
    }

  } catch (error: any) {
    console.error('Delete account error:', error);
    errorToast(strings.NetworkErrorTryAgain);
  } finally {
  }
};

export {
  LogiApi,
  Verifyotp,
  Resend_otp,
  UpdateProfile,
  GetProfileApi,
  Privacypolicy,
  Termsconditions,
  DeliveryUploadDocument,
  DeliveryVehicleDocument,
  DeliveryBankSetup,
  GetuploadDocument,
  AddParcelApi,
  GetApi,
  Parceldetails,
  DeliveryAvailableRequests,
  SetLanguageApi,
  GetNotifications,
  GetDashboardCounts,
  GetVerificationStatusApi,
  CancelParcelApi,
  RateDeliveryApi,
  MarkNotificationsAsReadApi,
  getAuthData,
  saveAuthData,
  handleLogout,
  DeleteAccountApi,
};
