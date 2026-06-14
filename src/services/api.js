import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// هذا هو الـ IP الجديد لجهازك بعد تغيير الواي فاي، والبورت 8000 الخاص بالـ API Server
const API_BASE_URL = 'http://172.20.10.5:8000/api/v1';

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
  login: (data) => api.post('/auth/web_login', data),
  signup: (data) => api.post('/auth/signup', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change_password', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// Customer Data
// ─────────────────────────────────────────────────────────────────────────────
export const customer = {
  profile: (plate) => api.get(`/customer/profile?plate=${plate}`),
  update: (data) => api.post('/customer/update', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// Parking Data & Real-time
// ─────────────────────────────────────────────────────────────────────────────
export const parking = {
  getStatus: () => api.get('/parking/status'),
  getFloors: () => api.get('/parking/floors'),
  getPricing: () => api.get('/pricing/current'),
  getStats: () => api.get('/stats'),
  getLive: () => axios.get(`${API_BASE_URL}/live`), // no auth needed
  getCurrentSession: (plate) => api.get(`/sessions/current?plate=${plate}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────────────────────
export const booking = {
  create: (data) => api.post('/booking/create', data),
  cancel: (id) => api.post('/booking/cancel', { id }),
  list: (plate) => api.get(`/booking/list?plate=${plate}`),
  extend: (id, hours) => api.post('/booking/extend', { id, extra_hours: hours }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Session History
// ─────────────────────────────────────────────────────────────────────────────
export const sessions = {
  history: (plate, limit = 30) => api.get(`/sessions/history?plate=${plate}&limit=${limit}`),
  current: (plate) => api.get(`/sessions/current?plate=${plate}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Wallet
// ─────────────────────────────────────────────────────────────────────────────
export const wallet = {
  balance: (plate) => api.get(`/wallet/balance?plate=${plate}`),
  topup: (plate, amount, method) => api.post('/wallet/topup', { plate, amount, method }),
  pay: (plate, amount, note) => api.post('/wallet/pay', { plate, amount, note }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────
export const notifications = {
  list: (plate) => api.get(`/notifications?plate=${plate}`),
  markRead: (plate, id) => api.post('/notifications/mark_read', { plate, id }),
  markAllRead: (plate) => api.post('/notifications/mark_read', { plate }),
};

export default api;
export { API_BASE_URL };
