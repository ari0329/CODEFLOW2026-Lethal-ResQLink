import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';

export const getStoredToken = () => AsyncStorage.getItem('resqlink_token');
export const getStoredUser = async () => {
  const json = await AsyncStorage.getItem('resqlink_user');
  return json ? JSON.parse(json) : null;
};

export const verifyToken = async () => {
  try {
    const res = await authAPI.me();
    return res.data;
  } catch {
    return null;
  }
};