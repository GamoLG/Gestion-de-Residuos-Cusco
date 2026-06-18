import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import { MapaOSM } from '../components/MapaOSM';
import { colors, radius, spacing } from '../lib/theme';

const CUSCO = { lat: -13.52264, lng: -71.96734 };

export default function Register() {
  const { registrar } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ nombre: '', dni: '', email: '', password: '', telefono: '', direccion: '' });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zona, setZona] = useState<{ nombre: string; color: string } | null>(null);
  const [zonaMsg, setZonaMsg] = useState('');
  const [dniCargando, setDniCargando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const up = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const buscarDni = async () => {
    if (!/^\d{8}$/.test(f.dni)) return Alert.alert('DNI', 'Ingresa un DNI de 8 dígitos');
    setDniCargando(true);
    try {
      const { data } = await api.get(`/dni/${f.dni}`);
      if (data.success && data.data?.nombre) up('nombre', data.data.nombre);
      else Alert.alert('DNI', data.message || 'No se encontraron datos');
    } catch (e: any) {
      Alert.alert('DNI', e?.response?.data?.message || 'No se pudo consultar el DNI');
    } finally {
      setDniCargando(false);
    }
  };

  const detectarZona = async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    try {
      const { data } = await api.post('/zonas/detect', { lat, lng });
      if (data.data?.matched) { setZona(data.data.zona); setZonaMsg(''); }
      else { setZona(null); setZonaMsg('Zona pendiente — un administrador la asignará'); }
    } catch { setZonaMsg('No se pudo detectar la zona'); }
  };

  const usarGps = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso', 'Activa el permiso de ubicación');
    const loc = await Location.getCurrentPositionAsync({});
    detectarZona(loc.coords.latitude, loc.coords.longitude);
  };

  const crear = async () => {
    if (!f.nombre || !f.email || !f.password) return Alert.alert('Faltan datos', 'Nombre, correo y contraseña son obligatorios');
    if (f.password.length < 6) return Alert.alert('Contraseña', 'Mínimo 6 caracteres');
    setCargando(true);
    try {
      const datos: Record<string, unknown> = { ...f };
      if (coords) { datos.latitud = coords.lat; datos.longitud = coords.lng; }
      await registrar(datos);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'No se pudo registrar');
    } finally {
      setCargando(false);
    }
  };

  const campo = (k: string, label: string, icon: any, extra: any = {}) => (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <Feather name={icon} size={18} color={colors.textMuted} />
        <TextInput
          style={s.input}
          placeholderTextColor={colors.textMuted}
          value={(f as any)[k]}
          onChangeText={(v) => up(k, v)}
          {...extra}
        />
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.cont} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.titulo}>Crear cuenta</Text>
        </View>

        <View style={s.card}>
          {campo('dni', 'DNI', 'credit-card', { placeholder: '12345678', keyboardType: 'numeric', maxLength: 8 })}
          <TouchableOpacity style={s.btnSec} onPress={buscarDni} disabled={dniCargando}>
            {dniCargando ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="search" size={14} color={colors.primary} />}
            <Text style={s.btnSecTxt}>Autocompletar con mi DNI</Text>
          </TouchableOpacity>

          {campo('nombre', 'NOMBRE COMPLETO', 'user', { placeholder: 'Juan Pérez', autoCapitalize: 'words' })}
          {campo('email', 'CORREO', 'mail', { placeholder: 'correo@ejemplo.com', autoCapitalize: 'none', keyboardType: 'email-address' })}
          {campo('password', 'CONTRASEÑA', 'lock', { placeholder: '••••••••', secureTextEntry: true })}
          {campo('telefono', 'TELÉFONO (opcional)', 'phone', { placeholder: '984111222', keyboardType: 'phone-pad' })}
          {campo('direccion', 'DIRECCIÓN', 'map-pin', { placeholder: 'Av. Sol 123, Cusco', autoCapitalize: 'words' })}

          <TouchableOpacity style={s.btnSec} onPress={usarGps}>
            <Feather name="navigation" size={14} color={colors.primary} />
            <Text style={s.btnSecTxt}>Usar mi ubicación (GPS)</Text>
          </TouchableOpacity>

          {zona && <Text style={[s.zonaTxt, { color: zona.color }]}>✓ Tu zona: {zona.nombre}</Text>}
          {!!zonaMsg && <Text style={[s.zonaTxt, { color: colors.warning }]}>{zonaMsg}</Text>}

          <Text style={s.hint}>Toca el mapa para marcar tu ubicación exacta</Text>
          <View style={s.mapBox}>
            <MapaOSM
              centro={coords ?? CUSCO}
              zoom={coords ? 16 : 13}
              marcadores={coords ? [{ id: 'yo', lat: coords.lat, lng: coords.lng, color: colors.primary }] : []}
              onTocarMapa={detectarZona}
            />
          </View>

          <TouchableOpacity style={s.btn} onPress={crear} disabled={cargando} activeOpacity={0.85}>
            {cargando ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnTxt}>Completar registro</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  cont: { padding: spacing.xl, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  titulo: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.xs },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: spacing.md },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16 },
  btnSec: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.md, height: 44, marginTop: spacing.sm },
  btnSecTxt: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  zonaTxt: { fontSize: 14, fontWeight: '600', marginTop: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md, marginBottom: spacing.xs },
  mapBox: { height: 200, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  btn: { backgroundColor: colors.primaryDark, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  btnTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
