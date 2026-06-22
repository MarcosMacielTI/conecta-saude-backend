import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const expoExtra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
// Default to production backend on Railway; local/dev can override via expo extra or env
// FORCE LOCAL DEVELOPMENT
const apiUrl = 'http://localhost:3000'; // OVERRIDE: use localhost for development
const BASE_URL = apiUrl.replace(/\/+$/, '');
export const API_BASE_URL = `${BASE_URL}/api`;
export const BASE_API_URL = BASE_URL;

console.log('🔧 API Config:', {
    expoExtra,
    apiUrl,
    BASE_URL,
    API_BASE_URL
});

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    config.headers = config.headers || {};
    if (token) {
        console.log('🔑 Token found, adding to Authorization header');
        console.log('🔑 Token preview:', token.substring(0, 20) + '...');
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn('⚠️ No token found in AsyncStorage');
    }
    return config;
});

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

// Function to set auth token
export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (name, email, password, cpf, role) => api.post('/auth/register', { name, email, password, cpf, role }),
    me: () => api.get('/auth/me'),
};

export const professionalsAPI = {
    getAll: () => api.get('/professionals'),
    getProfessional: () => api.get('/professionals/professional'),
    getPatientsAll: () => api.get('/professionals/patients'),
    getById: (id) => api.get(`/professionals/${id}`),
    getPatients: (id) => api.get(`/professionals/${id}/patients`),
    search: (q) => api.get('/professionals/search', { params: { q } }),
};

export const usersAPI = {
    getAll: (role) => api.get('/users', { params: { role } }),
};

export const connectionsAPI = {
    connect: (professionalId) => api.post('/connect', { professionalId }),
    getProfessionalForPatient: (patientId) => api.get(`/patient/${patientId}/professional`),
    getPatientsForProfessional: (professionalId) => api.get(`/professional/${professionalId}/patients`),
    searchPatients: (q, professionalId) => api.get('/patients/search', { params: { q, professionalId } }),
    getConnections: () => api.get('/connections'),
};

export const messagesAPI = {
    sendMessage: (content, connectionId) => api.post('/messages', { content, connectionId }),
    getMessages: (connectionId) => api.get(`/messages/${connectionId}`),
    getConversation: () => api.get('/conversation'),
    getConversations: () => api.get('/conversations'),
};

export const subscriptionsAPI = {
    create: (data) => api.post('/subscriptions', data),
    getActive: () => api.get('/subscriptions/active'),
    updatePlan: (id, plan) => api.put(`/subscriptions/${id}`, { plan }),
    cancel: (id) => api.delete(`/subscriptions/${id}`),
};

export const paymentsAPI = {
    createPix: (data) => api.post('/payments/create-pix', data),
    createCard: (data) => api.post('/payments/create-card', data),
    getStatus: (paymentId) => api.get(`/payments/${paymentId}`),
    cancel: (paymentId, reason) => api.post(`/payments/${paymentId}/cancel`, { reason }),
    getHistory: () => api.get('/payments'),
};

export const appointmentsAPI = {
    create: (data) => api.post('/appointments', data),
    getAll: () => api.get('/appointments'),
    updateStatus: (id, status) => api.put(`/appointments/${id}`, { status }),
};