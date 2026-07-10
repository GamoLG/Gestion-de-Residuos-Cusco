import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, radius, spacing, acentoDe } from '../lib/theme';

export default function EditarPerfil() {
  const { usuario, actualizarUsuario } = useAuth();
  const router = useRouter();
  const acento = acentoDe(usuario?.rol);

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [telefono, setTelefono] = useState(usuario?.telefono || '');
  const [direccion, setDireccion] = useState(usuario?.direccion || '');
  const [guardando, setGuardando] = useState(false);

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [cambiando, setCambiando] = useState(false);

  const guardar = async () => {
    if (!nombre.trim()) return Alert.alert('Falta', 'El nombre es obligatorio');
    setGuardando(true);
    try {
      const { data } = await api.put('/usuarios/me', {
        nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim(),
      });
      await actualizarUsuario(data.data);
      Alert.alert('Listo', 'Perfil actualizado', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar');
    } finally { setGuardando(false); }
  };

  const actualizarUbicacion = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso', 'Activa la ubicación');
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const { latitud, longitud } = { latitud: loc.coords.latitude, longitud: loc.coords.longitude };
      const { data } = await api.put('/usuarios/me', { latitud, longitud });
      // el backend puede reasignar zona si se envía; detectamos zona con el endpoint público
      const det = await api.post('/zonas/detect', { lat: latitud, lng: longitud });
      if (det.data?.data?.matched) {
        await api.put('/usuarios/me', { zona: det.data.data.zona.id });
        await actualizarUsuario({ latitud, longitud, zonaId: det.data.data.zona.id, zonaNombre: det.data.data.zona.nombre });
        Alert.alert('Listo', `Ubicación actualizada. Tu zona: ${det.data.data.zona.nombre}`);
      } else {
        await actualizarUsuario({ latitud, longitud });
        Alert.alert('Listo', 'Ubicación actualizada (sin zona detectada)');
      }
      void data;
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo actualizar la ubicación');
    }
  };

  const cambiarPass = async () => {
    if (!passActual || !passNueva) return Alert.alert('Falta', 'Completa ambas contraseñas');
    if (passNueva.length < 6) return Alert.alert('Atención', 'La nueva contraseña debe tener al menos 6 caracteres');
    setCambiando(true);
    try {
      await api.put('/usuarios/me/password', { actual: passActual, nueva: passNueva });
      setPassActual(''); setPassNueva('');
      Alert.alert('Listo', 'Contraseña actualizada');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo cambiar la contraseña');
    } finally { setCambiando(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}>
      <View style={s.top}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.titulo}>Editar perfil</Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>NOMBRE</Text>
        <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholderTextColor={colors.textMuted} />
        <Text style={s.label}>TELÉFONO</Text>
        <TextInput style={s.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
        <Text style={s.label}>DIRECCIÓN</Text>
        <TextInput style={s.input} value={direccion} onChangeText={setDireccion} placeholderTextColor={colors.textMuted} />

        <TouchableOpacity style={[s.btn, { backgroundColor: acento }]} onPress={guardar} disabled={guardando}>
          {guardando ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnTxt}>Guardar cambios</Text>}
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.secT}>Mi ubicación y zona</Text>
        <Text style={s.secS}>
          {usuario?.zonaNombre ? `Zona actual: ${usuario.zonaNombre}` : 'Sin zona asignada'}. Usa tu GPS para actualizar tu domicilio y detectar tu zona.
        </Text>
        <TouchableOpacity style={[s.btnGhost, { borderColor: acento }]} onPress={actualizarUbicacion}>
          <Feather name="map-pin" size={16} color={acento} />
          <Text style={[s.btnGhostTxt, { color: acento }]}>Actualizar mi ubicación (GPS)</Text>
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.secT}>Cambiar contraseña</Text>
        <Text style={s.label}>CONTRASEÑA ACTUAL</Text>
        <TextInput style={s.input} value={passActual} onChangeText={setPassActual} secureTextEntry placeholderTextColor={colors.textMuted} />
        <Text style={s.label}>NUEVA CONTRASEÑA</Text>
        <TextInput style={s.input} value={passNueva} onChangeText={setPassNueva} secureTextEntry placeholderTextColor={colors.textMuted} />
        <TouchableOpacity style={[s.btn, { backgroundColor: colors.bgSurface }]} onPress={cambiarPass} disabled={cambiando}>
          {cambiando ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnTxt}>Cambiar contraseña</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  titulo: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: spacing.sm, marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.textPrimary, padding: spacing.md, fontSize: 15 },
  btn: { borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  btnTxt: { color: colors.white, fontSize: 15, fontWeight: '700' },
  btnGhost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, height: 46, marginTop: spacing.md },
  btnGhostTxt: { fontSize: 14, fontWeight: '700' },
  secT: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  secS: { color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
});
