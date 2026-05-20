import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { LogiApi } from '../../../Api/apiRequest';
import AsyncStorage from '@react-native-async-storage/async-storage';
const useChooseRoleScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isLoading, setisLoading] = useState(false)


  return {


    isLoading,

    navigation
  };
};

export default useChooseRoleScreen;
