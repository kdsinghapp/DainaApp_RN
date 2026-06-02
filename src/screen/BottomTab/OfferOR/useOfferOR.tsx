import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../../Api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { errorToast, successToast } from '../../../utils/customToast';
import ScreenNameEnum from '../../../routes/screenName.enum';

export const useOfferOR = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [offerData, setOfferData] = useState<any>({ offers: [] });
  const rou: any = useRoute()
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null)
  const { id } = rou?.params || ""
  useEffect(() => {
    fetchOffers();
  }, []);
  const navgation = useNavigation<any>()
  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${base_url}/offers/${id?.parcel.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      console.log("api end point  ---  ", response)
      console.log("id?.parcel.id  ---  ", id?.parcel.id)
      console.log("result offers ---  ", result)
      if (result?.status == 1 || result?.success === true) {
        setOfferData(result);
        setIsLoading(false)
      }
    } catch (err) {
      console.log('Error fetching offers:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const onAccept = async (id: any) => {
    try {

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn("No token found");
        return;
      }
      //  const apiUrl = `${base_url}/ooffers/${id}/accept`;
      const apiUrl = `${base_url}/offers/${id}/accept`;
      //  const apiUrl = `https://aitechnotech.in/DAINA/api/offers/${id}/accept`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // include Bearer if API expects it
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // add body data if needed
      });

      const result = await response.json();
      console.log("result ---- ", result)

      if (response.ok) {
        successToast("Offer accepted successfully!"),
          navgation.replace(ScreenNameEnum.TabNavigator);

      } else {
        errorToast(result?.message)
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      alert("Something went wrong. Please try again.");
    }
  };



  // const CounterOffer = async (id: any, amount: number) => {
  //   try {
  //     const token = await AsyncStorage.getItem('token');
  //     console.log("token",)
  //     if (!token) return;
  //      const apiUrl = `${base_url}/offers/counter-offer`;
  //     const response = await fetch(apiUrl, {
  //       method: 'POST',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         counterAmount: amount,
  //         counterMessage: 'hi',
  //         offerId: id
  //       }),
  //     });
  // console.log("response",response)
  //     const result = await response.json();
  //     console.log("result", result);
  //     if (response.ok && (result.status === 1 || result.success === true)) {
  //       navgation.goBack()
  //       successToast("Counter offer sent successfully!");
  //     } else {


  //       errorToast(result?.message || 'Failed to send counter offer');
  //     }
  //   } catch (error) {

  //     console.error("Error counter offer:", error);
  //     errorToast('Something went wrong. Please try again.');
  //   }
  // };
  const CounterOffer = async (id: number, amount: number) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        errorToast("Token not found");
        return;
      }

      // offerId in URL path; body as application/x-www-form-urlencoded
      const apiUrl = `${base_url}/offers/${id}/counter-offer`;
      const body = new URLSearchParams({
        counterAmount: String(amount),
        counterMessage: "hi",
      }).toString();

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const result = await response.json();

      if (response.ok && (result.status == 1 || result.success === true)) {
        successToast("Counter offer sent successfully!");
        navgation.goBack();
      } else {
        errorToast(result?.message || "Failed to send counter offer");
      }
    } catch (error) {
      console.log("Counter offer error:", error);
      errorToast("Something went wrong");
    }
  };


  return {
    // States
    isLoading,
    offerData,
    location,
    setLocation,
    // Functions
    fetchOffers,
    onAccept,
    navgation,
    CounterOffer,
    selectedOfferId, setSelectedOfferId
  };
};
