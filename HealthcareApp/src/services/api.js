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
    config.headers = config.headers || {};
    const token = await AsyncStorage.getItem('token');
    if (token) {
      console.log('🔑 Token found, adding to Authorization header');
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in AsyncStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Token is invalid or expired');
      console.error('Response error:', error.response?.data);
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const API_BASE_URL = API_URL;
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  googleAuth: (idToken) => api.post('/auth/google/mobile', { idToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data, config = {}) => api.put('/auth/me', data, config),
  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

export default api;
