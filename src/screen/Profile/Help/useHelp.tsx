import { useNavigation } from '@react-navigation/native';
import {   useEffect,useState } from 'react';
 import { NativeStackNavigationProp } from '@react-navigation/native-stack';
 import { GethelpApi } from '../../../Api/apiRequest';

const useHelp = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
const [FaqData,setFaqData]= useState([])
const [Loading,setLoading]= useState(false)
const [search, setSearch] = useState('');

const filteredData = FaqData.filter(item =>
    item?.question?.toLowerCase().includes(search?.toLowerCase())
);
useEffect(()=>{
  getPrivacyPolicy()
},[])

  const getPrivacyPolicy = async () => {
    try {
      const state = await GethelpApi(setLoading);
      if (state) {
          setFaqData(state?.data);
      }
    } catch (error) {
      setFaqData([]);
    }
  };
   return {
    navigation, 
    FaqData,setFaqData ,
    Loading,setLoading ,search, setSearch ,
    filteredData,
    };
};

export default useHelp;
