import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import { colors, radius, spacing, estadoRutaColor } from '../../lib/theme';

export default function Home() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [rutas, setRutas] = useState<any[]>([]);
  const [activas, setActivas] = useState(0);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/rutas');
      const lista = data.data || [];
      setRutas(lista);
      setActivas(lista.filter((r: any) => r.estado === 'EN_PROGRESO').length);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onRefresh = async () => { setRefrescando(true); await cargar(); setRefrescando(false); };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={s.hola}>Hola, {usuario?.nombre?.split(' ')[0] || 'vecino'} 👋</Text>
      <Text style={s.sub}>
        {usuario?.zonaNombre ? `Zona: ${usuario.zonaNombre}` : 'Zona pendiente de asignación'}
      </Text>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statNum}>{activas}</Text>
          <Text style={s.statLbl}>Camiones activos</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statNum}>{rutas.length}</Text>
          <Text style={s.statLbl}>Rutas registradas</Text>
        </View>
      </View>

      <TouchableOpacity style={s.cta} onPress={() => router.push('/(tabs)/mapa')} activeOpacity={0.85}>
        <Feather name="map-pin" size={20} color={colors.white} />
        <Text style={s.ctaTxt}>Ver camiones en el mapa</Text>
      </TouchableOpacity>

      <Text style={s.secTitle}>Rutas de recolección</Text>
      {rutas.length === 0 && <Text style={s.vacio}>No hay rutas registradas aún.</Text>}
      {rutas.map((r) => (
        <View key={r._id} style={s.ruta}>
          <View style={{ flex: 1 }}>
            <Text style={s.rutaNom}>{r.nombre}</Text>
            <Text style={s.rutaSub}>{r.zona?.nombre || 'Sin zona'} · {r.paradas?.length || 0} paradas</Text>
          </View>
          <View style={[s.badge, { backgroundColor: (estadoRutaColor[r.estado] || colors.textMuted) + '22' }]}>
            <Text style={[s.badgeTxt, { color: estadoRutaColor[r.estado] || colors.textMuted }]}>{r.estado}</Text>
          </View>
        </View>
      ))}

      <View style={s.tip}>
        <MaterialCommunityIcons name="recycle" size={20} color={colors.success} />
        <Text style={s.tipTxt}>Separa tus residuos: orgánicos, reciclables y no reciclables. Revisa la pestaña "Segregar".</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hola: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  stat: { flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  statNum: { color: colors.primary, fontSize: 28, fontWeight: '800' },
  statLbl: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primaryDark, borderRadius: radius.md, height: 52, marginTop: spacing.lg },
  ctaTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
  secTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  vacio: { color: colors.textMuted, fontSize: 14 },
  ruta: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  rutaNom: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rutaSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  tip: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.xl },
  tipTxt: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
