import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { PermissionsAndroid, Platform } from 'react-native';

export interface ApiRequest {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT';
  data?: any;
  headers?: Record<string, string>;
  token?: string;
  redirect?: any
}
// https://python.aitechnotech.in/DAINA/docs
// DAINA API - Swagger UI
// wss://python.aitechnotech.in/DAINA/ws
// DAINA API - Swagger UI
// export const base_url = 'https://python.aitechnotech.in/DAINA/api';
// export const WebSocket_Url = `wss://python.aitechnotech.in/DAINA/ws`
export const base_url = 'https://api.daina.tech/api';
export const WebSocket_Url = `wss://api.daina.tech/ws`

// export const base_url = 'https://aitechnotech.in/DAINA/api';
// Prepr CMS (headless) – GraphQL client and helpers
export {
  preprRequest,
  getPreprPageBySlug,
  getPreprArticles,
  PREPR_ACCESS_TOKEN,
  PREPR_GRAPHQL_URL,
} from './prepr';
export type { PreprGraphQLVariables, PreprGraphQLResponse } from './prepr';
export const image_url = 'https://python.aitechnotech.in/DAINA';
export const GoogleClientId = '43208932533-6ktmlm2uusaqdgv42pj9u94eq9q6q8h7.apps.googleusercontent.com';
export const GOOGLE_MAPS_APIKEY = 'AIzaSyDgFGS91BvviXh_f-nmvtEggUHJcaGyUwA'; // Replace with your Key
export const callMultipleApis = async (requests: ApiRequest[]) => {
  try {
    const responses: AxiosResponse[] = await Promise.all(
      requests.map((req) => {

        const config: AxiosRequestConfig = {
          method: req.method || 'GET',
          url: `${base_url}${req.endpoint}`,
          data: (req.method === 'POST' || req.method === 'PUT') ? req.data : undefined,
          headers: {
            'Content-Type': req.data instanceof FormData ? 'multipart/form-data' : 'application/json',
            ...(req.token ? { Authorization: `Bearer ${req.token}` } : {}),
            ...req.headers,
          },
        };

        return axios(config);
      })
    );

    // Return only data from all responses
    return responses.map((res) => res.data);

  } catch (error) {
    console.error('API Error:', error);

    // Optional: You can customize how you want to handle the error (log, rethrow, etc.)
    throw error;
  }
};


export const callApi = async (
  method: string,
  url: string,
  headers: any = {},
  data: any = null
): Promise<any> => {
  try {
    // Configure the API request
    const config: AxiosRequestConfig = {
      method: method,
      url: url,
      headers: {
        'Content-Type': 'application/json',
        ...headers, // Add custom headers if provided
      },
      data: data, // Add request body if method is POST/PUT
    };

    // Make the API call using axios
    const response: AxiosResponse = await axios(config);

    // Return the response data
    return response.data;

  } catch (error) {
    console.error('Error occurred while making API call:', error);

    // Handle error, you can throw or return a custom error message
    if (error.response) {
      // Server responded with an error
      throw new Error(`API call failed: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      // No response was received
      throw new Error('No response received from API');
    } else {
      // Something else went wrong
      throw new Error(`API call failed: ${error.message}`);
    }
  }
};



/** Request camera permission. On iOS, add NSCameraUsageDescription in Info.plist; system will prompt on first use. */
export const requestCameraPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'This app needs camera access to take photos for your parcel or profile.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('Camera permission request error:', error);
    return false;
  }
};

/** Request location permission (for map and current location). On iOS, add NSLocation*UsageDescription in Info.plist; system will prompt on first use. */
export const requestLocationPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs your location to show you on the map and for delivery tracking.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('Location permission request error:', error);
    return false;
  }
};

/** Request both camera and location (e.g. before opening map or camera). */
export const requestCameraAndLocationPermissions = async (): Promise<{ camera: boolean; location: boolean }> => {
  const [camera, location] = await Promise.all([
    requestCameraPermissions(),
    requestLocationPermissions(),
  ]);
  return { camera, location };
};


