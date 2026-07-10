import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from './api';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  latitud?: number | null;
  longitud?: number | null;
  zonaId?: string | null;
  zonaNombre?: string | null;
}

interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  esAdmin: boolean;
  esOperador: boolean;
  esCiudadano: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginConGoogle: (idToken: string) => Promise<void>;
  registrar: (data: Record<string, unknown>) => Promise<void>;
  actualizarUsuario: (u: Partial<Usuario>) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync('token');
        const u = await SecureStore.getItemAsync('usuario');
        if (t && u) setUsuario(JSON.parse(u));
      } catch {}
      finally { setCargando(false); }
    })();
  }, []);

  const guardar = async (token: string, u: Usuario) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('usuario', JSON.stringify(u));
    setUsuario(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success) throw new Error(data.message || 'Error de login');
    await guardar(data.data.token, data.data.usuario);
  }, []);

  const loginConGoogle = useCallback(async (idToken: string) => {
    const { data } = await api.post('/auth/google', { idToken });
    if (!data.success) throw new Error(data.message || 'Error con Google');
    await guardar(data.data.token, data.data.usuario);
  }, []);

  const registrar = useCallback(async (datos: Record<string, unknown>) => {
    const { data } = await api.post('/auth/register', datos);
    if (!data.success) throw new Error(data.message || 'Error de registro');
    await guardar(data.data.token, data.data.usuario);
  }, []);

  // Actualiza los datos del usuario en memoria y en el almacenamiento seguro
  const actualizarUsuario = useCallback(async (patch: Partial<Usuario>) => {
    setUsuario((prev) => {
      const nuevo = prev ? { ...prev, ...patch } : prev;
      if (nuevo) SecureStore.setItemAsync('usuario', JSON.stringify(nuevo)).catch(() => {});
      return nuevo;
    });
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('usuario');
    setUsuario(null);
  }, []);

  const rol = usuario?.rol;
  const value: AuthCtx = {
    usuario,
    cargando,
    esAdmin: rol === 'ADMIN_MUNICIPAL' || rol === 'SUPER_ADMIN' || rol === 'ADMIN_ZONA',
    esOperador: rol === 'OPERADOR_CAMION',
    esCiudadano: rol === 'CIUDADANO',
    login,
    loginConGoogle,
    registrar,
    actualizarUsuario,
    logout,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return c;
}
