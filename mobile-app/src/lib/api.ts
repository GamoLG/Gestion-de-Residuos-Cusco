import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL del backend. En el APK se inyecta desde EXPO_PUBLIC_API_URL.
// Emulador Android local: http://10.0.2.2:4000
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 60000, // tolera el "despertar" del backend gratuito
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
export { API_BASE };
