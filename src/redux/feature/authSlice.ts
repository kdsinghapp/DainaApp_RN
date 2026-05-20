import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isLogin: boolean;
  isLogOut: boolean;
  userData: any;
  token: string | null;
  appLanguage: string | null;
}

const initialState: AuthState = {
  isLoading: false,
  isError: false,
  isSuccess: false,
  isLogin: false,
  isLogOut: false,
  userData: null,
  token: null,
  appLanguage: 'en',
};

const AuthSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ userData: any; token: string }>) {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.isLogin = true;
      state.isLogOut = false;
      state.userData = action.payload.userData;
      state.token = action.payload.token;
    },
    restoreLogin(state, action: PayloadAction<{ userData: any; token: string }>) {
      state.isLogin = true;
      state.userData = action.payload.userData;
      state.token = action.payload.token;
    },
    setAppLanguage(state, action: PayloadAction<string>) {
      state.appLanguage = action.payload;
    },
    logout(state) {
      state.isLogin = false;
      state.isLogOut = true;
      state.userData = null;
      state.token = null;

      // 🔥 Clear AsyncStorage on logout
      AsyncStorage.removeItem('authData');
    },
  },
});

export const { loginSuccess, restoreLogin, logout, setAppLanguage } = AuthSlice.actions;
export default AuthSlice.reducer;
