import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getAppHost = () => {
  if (Platform.OS === 'web') {
    return 'localhost';
  }
  const debuggerHost = Constants.manifest?.debuggerHost || Constants.manifest2?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  // Força usar IP local do PC quando debuggerHost não funciona
  return '10.0.0.172';
};

const API_HOST = getAppHost();
const API_URL = `http://${API_HOST}:3000/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  googleAuth: (idToken) => api.post('/auth/google/mobile', { idToken }),
};

export default api;
