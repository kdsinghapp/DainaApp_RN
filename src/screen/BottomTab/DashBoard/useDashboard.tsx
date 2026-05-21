import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { GetProfileApi } from '../../../Api/apiRequest';
import { loginSuccess } from '../../../redux/feature/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDashboardContext } from '../../../context/DashboardContext';
import strings from '../../../localization/Localization';
export type { CounterOfferAcceptedPayload } from '../../../context/DashboardContext';

const useDashboard = () => {
  const navigation = useNavigation();
  const ctx = useDashboardContext();
  const [address, setAddress] = useState("");
  const [locationModal, setlocationModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [currentlocation, setcurrentlocation] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const locationRef: any = useRef(null);
  const orderData = ctx?.orderData ?? [];
  const counterOfferAcceptedModal = ctx?.counterOfferAcceptedModal ?? { visible: false, data: null };
  const setCounterOfferAcceptedModal = ctx?.setCounterOfferAcceptedModal ?? (() => { });
  const getParceldetailsApi = ctx?.getParceldetailsApi ?? (async () => { });
  const registerOrderUpdateCallback = ctx?.registerOrderUpdateCallback ?? (() => { });
  const initialFetchDone = useRef(false);

  useEffect(() => {
    // Add a small delay to ensure refs are attached and system is ready
    const timer = setTimeout(() => {
      handleGetLocation();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getProfileApi();
  }, []);

  useEffect(() => {
    if (ctx && !initialFetchDone.current) {
      initialFetchDone.current = true;
      getParceldetailsApi(setLoading);
    }
  }, [ctx]);

  useEffect(() => {
    getParceldetailsApi(setLoading)
  }, [])

  useEffect(() => {
    if (ctx) {
      registerOrderUpdateCallback(() => getParceldetailsApi(setLoading));
    }
  }, [ctx]);

  const getProfileApi = async () => {
    try {
      const response = await GetProfileApi(setLoading);
      if (response) {
        dispatch(loginSuccess({ userData: response }));
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)

    }
  };
  // Inside your component
  const [pickupLocation, setPickupLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const handleGetLocation = async (retryCount = 0) => {
    try {
      if (!locationRef?.current) {
        if (retryCount < 3) {
          console.log(`Location ref not ready, retrying... (${retryCount + 1})`);
          setTimeout(() => handleGetLocation(retryCount + 1), 1000);
        }
        return;
      }

      const data = await locationRef?.current?.fetchLocation();
      if (data?.error) {
         if (retryCount < 2) {
           setTimeout(() => handleGetLocation(retryCount + 1), 2000);
        } else {
          // Fallback to cached location before giving up
          const cached = await AsyncStorage.getItem('pickupLocation');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed?.address) {
                setcurrentlocation(parsed.address);
                setCurrentLocation(parsed.address);
                setPickupLocation(parsed);
                return;
              }
            } catch (e) {}
          }
          setcurrentlocation(strings?.Locationu);
        }
      } else if (data && data.address) {
        // Store in AsyncStorage
        await AsyncStorage.setItem('pickupLocation', JSON.stringify(data));
        setcurrentlocation(data.address);
        // Update state
        setCurrentLocation(data.address);
        setPickupLocation(data);

       }

    } catch (error) {
      console.error('Error getting location:', error);
    }
  };
  const fetchParcels = () => getParceldetailsApi(setLoading);

  return {
    navigation,
    address,
    setAddress,
    location,
    setLocation,
    locationModal,
    setlocationModal,
    locationRef,
    currentlocation,
    isLoading,
    orderData,
    counterOfferAcceptedModal,
    setCounterOfferAcceptedModal,
    getParceldetailsApi: fetchParcels,
  };
};

export default useDashboard;
