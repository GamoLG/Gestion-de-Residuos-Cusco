import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../../lib/api';
import { colors, radius, spacing } from '../../lib/theme';

const TIPOS = [
  { k: 'BASURA_ACUMULADA', l: 'Basura acumulada' },
  { k: 'CONTENEDOR_DANADO', l: 'Contenedor dañado' },
  { k: 'RECOLECCION_NO_REALIZADA', l: 'No recogieron' },
  { k: 'DERRAME', l: 'Derrame' },
  { k: 'OTRO', l: 'Otro' },
];
const ESTADO_COLOR: Record<string, string> = { PENDIENTE: colors.warning, EN_PROCESO: colors.primary, RESUELTO: colors.success };

export default function Incidencias() {
  const [tipo, setTipo] = useState('BASURA_ACUMULADA');
  const [descripcion, setDescripcion] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mios, setMios] = useState<any[]>([]);

  const cargar = useCallback(async () => {
    try { const { data } = await api.get('/incidentes/mis-reportes'); setMios(data.data || []); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const ubicar = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso', 'Activa la ubicación');
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  const enviar = async () => {
    if (!descripcion.trim()) return Alert.alert('Falta', 'Describe el problema');
    setEnviando(true);
    try {
      await api.post('/incidentes', {
        tipo, descripcion: descripcion.trim(),
        latitud: coords?.lat, longitud: coords?.lng,
      });
      setDescripcion(''); setCoords(null);
      Alert.alert('Listo', 'Incidencia reportada. ¡Gracias!');
      cargar();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo reportar');
    } finally { setEnviando(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}>
      <Text style={s.titulo}>Reportar incidencia</Text>

      <View style={s.card}>
        <Text style={s.label}>TIPO</Text>
        <View style={s.tipos}>
          {TIPOS.map((t) => (
            <TouchableOpacity
              key={t.k}
              style={[s.chip, tipo === t.k && s.chipOn]}
              onPress={() => setTipo(t.k)}
            >
              <Text style={[s.chipTxt, tipo === t.k && s.chipTxtOn]}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>DESCRIPCIÓN</Text>
        <TextInput
          style={s.area}
          placeholder="Describe lo que ves…"
          placeholderTextColor={colors.textMuted}
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />

        <TouchableOpacity style={s.gps} onPress={ubicar}>
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={s.gpsTxt}>{coords ? 'Ubicación marcada ✓' : 'Adjuntar mi ubicación'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btn} onPress={enviar} disabled={enviando}>
          {enviando ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnTxt}>Enviar reporte</Text>}
        </TouchableOpacity>
      </View>

      <Text style={s.sec}>Mis reportes</Text>
      {mios.length === 0 && <Text style={s.vacio}>Aún no tienes reportes.</Text>}
      {mios.map((i) => (
        <View key={i._id} style={s.item}>
          <View style={{ flex: 1 }}>
            <Text style={s.itemT}>{TIPOS.find((t) => t.k === i.tipo)?.l || i.tipo}</Text>
            <Text style={s.itemD} numberOfLines={2}>{i.descripcion}</Text>
          </View>
          <Text style={[s.estado, { color: ESTADO_COLOR[i.estado] || colors.textMuted }]}>{i.estado}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  titulo: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: spacing.md },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: spacing.sm, marginBottom: spacing.sm },
  tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipTxt: { color: colors.textSecondary, fontSize: 13 },
  chipTxtOn: { color: colors.primary, fontWeight: '700' },
  area: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.textPrimary, padding: spacing.md, minHeight: 90, textAlignVertical: 'top', fontSize: 15 },
  gps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.md, height: 44, marginTop: spacing.md },
  gpsTxt: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  btn: { backgroundColor: colors.primaryDark, borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  btnTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
  sec: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  vacio: { color: colors.textMuted, fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  itemT: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  itemD: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  estado: { fontSize: 10, fontWeight: '700' },
});
