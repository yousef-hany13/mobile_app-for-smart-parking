import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// هذا هو الـ IP الجديد لجهازك بعد تغيير الواي فاي، والبورت 8000 الخاص بالـ API Server
const API_BASE_URL = 'http://172.20.10.4:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// إضافة التوكن (Token) في كل طلب إذا كان المستخدم مسجل دخوله
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// Authentication Endpoints
// ─────────────────────────────────────────────────────────────────────────────
export const auth = {
  login:  (data) => api.post('/auth/web_login', data),
  signup: (data) => api.post('/auth/signup', data),
  logout: () => api.post('/auth/logout'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Customer Data
// ─────────────────────────────────────────────────────────────────────────────
export const customer = {
  profile: (plate) => api.get(`/customer/${plate}`),
  update:  (plate, data) => api.put(`/customer/${plate}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// Parking Data & Real-time
// ─────────────────────────────────────────────────────────────────────────────
export const parking = {
  getStatus:   () => api.get('/parking/status'),
  getFloors:   () => api.get('/parking/floors'),
  getPricing:  () => api.get('/pricing/current'),
  getStats:    () => api.get('/stats'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────────────────────
export const booking = {
  create: (data) => api.post('/booking/create', data),
  cancel: (id)   => api.post(`/booking/cancel/${id}`),
  list:   (plate)=> api.get(`/booking/list/${plate}`),
};

export default api;
export { API_BASE_URL };
