import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../lib/api';
import { colors, radius, spacing, rolAccent, estadoRutaColor } from '../lib/theme';

const VERDE = rolAccent.OPERADOR_CAMION;

// Modo prueba: el conductor puede elegir CUALQUIER ruta del sistema (no solo
// las suyas) para hacer pruebas de proximidad donde le sea más cómodo —
// por ejemplo, si el ciudadano de prueba está en otra zona. El backend ya
// permite a cualquier cuenta con rol OPERADOR_CAMION transmitir ubicación
// en cualquier ruta; esta pantalla solo expone esa flexibilidad.
export default function ElegirRuta() {
  const router = useRouter();
  const [rutas, setRutas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [iniciando, setIniciando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try { const { data } = await api.get('/rutas'); setRutas(data.data || []); } catch {}
    setCargando(false);
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const elegir = async (r: any) => {
    setIniciando(r._id);
    try {
      if (r.estado !== 'EN_PROGRESO') {
        await api.put(`/rutas/${r._id}/estado`, { estado: 'EN_PROGRESO' });
      }
      router.replace({ pathname: '/(operador)/miruta', params: { ruta: r._id } });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo iniciar esta ruta');
    } finally {
      setIniciando(null);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}>
      <View style={s.top}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.titulo}>Elegir ruta (modo prueba)</Text>
      </View>
      <View style={s.aviso}>
        <MaterialCommunityIcons name="flask-outline" size={18} color={colors.warning} />
        <Text style={s.avisoTxt}>
          Solo para pruebas: puedes conducir cualquier ruta del sistema, no solo las tuyas.
          Útil para probar la proximidad en la zona donde estés físicamente.
        </Text>
      </View>

      {cargando && <ActivityIndicator color={VERDE} style={{ marginTop: spacing.xl }} />}
      {!cargando && rutas.map((r) => (
        <TouchableOpacity key={r._id} style={s.ruta} onPress={() => elegir(r)} disabled={!!iniciando}>
          <View style={{ flex: 1 }}>
            <Text style={s.rutaNom}>{r.nombre}</Text>
            <Text style={s.rutaSub}>{r.zona?.nombre || 'Sin zona'} · {r.paradas?.length || 0} paradas · {r.operador?.nombre || 'sin conductor'}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: (estadoRutaColor[r.estado] || colors.textMuted) + '22' }]}>
            <Text style={[s.badgeTxt, { color: estadoRutaColor[r.estado] || colors.textMuted }]}>{r.estado}</Text>
          </View>
          {iniciando === r._id ? <ActivityIndicator color={VERDE} style={{ marginLeft: spacing.sm }} /> : <Feather name="chevron-right" size={18} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />}
        </TouchableOpacity>
      ))}
      {!cargando && rutas.length === 0 && <Text style={s.vacio}>No hay rutas registradas.</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  titulo: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', flex: 1 },
  aviso: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.warning + '15', borderWidth: 1, borderColor: colors.warning, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  avisoTxt: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  ruta: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  rutaNom: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  rutaSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  vacio: { color: colors.textMuted, fontSize: 14, marginTop: spacing.lg },
});
