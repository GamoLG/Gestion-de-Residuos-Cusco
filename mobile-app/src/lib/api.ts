// Proyecto realizado por el estudiante Jhoel Alex Luicho Quispe, estudiante de la Escuela Profesional de Ingeniería Informática y de Sistemas - UNSAAC.
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { mostrarToast } from '../components/Toast';

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

// Aviso global cuando el servidor no responde (sin internet, backend
// "dormido" en el plan gratuito, timeout, error 5xx). Antes muchas pantallas
// fallaban en silencio (catch{}) sin decirle nada al usuario. Los errores
// 4xx (credenciales, validaciones) NO se tocan aquí: cada pantalla ya los
// muestra con su propio mensaje específico.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (!error.response) {
      mostrarToast('No se pudo conectar con el servidor. Revisa tu internet e inténtalo de nuevo.');
    } else if (error.response.status >= 500) {
      mostrarToast('El servidor tuvo un problema. Inténtalo de nuevo en unos segundos.');
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE };
