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

  // Use Android emulator localhost mapping if available
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  // Fallback para iOS/emulador físico se não houver debuggerHost
  return '127.0.0.1';
};

const configuredApiUrl = Constants.expoConfig?.extra?.API_URL || Constants.manifest?.extra?.API_URL || Constants.manifest2?.extra?.API_URL;
const API_HOST = getAppHost();
const normalizedApiUrl = configuredApiUrl ? configuredApiUrl.replace(/\/+$/, '') : null;
const API_URL = normalizedApiUrl ? `${normalizedApiUrl}/api` : `http://${API_HOST}:3000/api`;
if (__DEV__) {
  console.log('[API] baseURL =', API_URL);
}

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

export const API_BASE_URL = API_URL;
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  googleAuth: (idToken) => api.post('/auth/google/mobile', { idToken }),
  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

export default api;
