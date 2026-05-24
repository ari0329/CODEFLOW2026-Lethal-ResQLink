import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('resqlink_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// Normalise error responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Network error';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
};

export const alertsAPI = {
  getAll: (params = {}) => api.get('/api/alerts', { params }),
  getById: (id) => api.get(`/api/alerts/${id}`),
  submit: (text, source = 'mobile') =>
    api.post('/api/ingest/manual', { text, source }),
  updateStatus: (id, status, notes) =>
    api.patch(`/api/alerts/${id}/status`, { status, notes }),
};

export const analyticsAPI = {
  summary: () => api.get('/api/analytics/summary'),
  heatmap: () => api.get('/api/analytics/heatmap'),
};

export default api;