import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '../../lib/api';
import { colors, radius, spacing, categoriaColor, DIAS_SEMANA, rolAccent } from '../../lib/theme';

const VERDE = rolAccent.OPERADOR_CAMION;
const CAT_LABEL: Record<string, string> = {
  ORGANICO: 'Orgánico', RECICLABLE: 'Reciclable', NO_RECICLABLE: 'No reciclable', PELIGROSO: 'Peligroso',
};

// Programación semanal del conductor: qué días y a qué hora le toca cada ruta/zona
export default function HorarioOperador() {
  const [rutas, setRutas] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/rutas/mias');
      const mias = data.data || [];
      setRutas(mias);
      const zonas = [...new Set(mias.map((r: any) => r.zona?._id).filter(Boolean))];
      const hs: any[] = [];
      for (const z of zonas) {
        const h = await api.get(`/horarios?zona=${z}`);
        hs.push(...(h.data.data || []));
      }
      setHorarios(hs);
    } catch {}
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  const onRefresh = async () => { setRefrescando(true); await cargar(); setRefrescando(false); };

  const hoy = new Date().getDay();
  const porDia: Record<number, any[]> = {};
  horarios.forEach((h) => { (porDia[h.diaSemana] ||= []).push(h); });

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={VERDE} />}
    >
      <Text style={s.titulo}>Mi horario semanal</Text>
      <Text style={s.sub}>Programación de recojo de tus zonas asignadas</Text>

      <Text style={s.sec}>Mis rutas y paradas</Text>
      {rutas.map((r) => (
        <View key={r._id} style={s.ruta}>
          <Text style={s.rutaN}>{r.nombre} · {r.zona?.nombre || 'Sin zona'}</Text>
          {(r.paradas || []).map((p: any, i: number) => (
            <View key={i} style={s.parada}>
              <Feather name="map-pin" size={12} color={colors.textMuted} />
              <Text style={s.paradaTxt}>{p.nombre || `Parada ${i + 1}`}</Text>
              <Text style={s.paradaHora}>{p.horaEstimada || ''}</Text>
            </View>
          ))}
        </View>
      ))}
      {rutas.length === 0 && <Text style={s.vacio}>Sin rutas asignadas.</Text>}

      <Text style={s.sec}>Días de recojo por zona</Text>
      {DIAS_SEMANA.map((dia, i) =>
        porDia[i] ? (
          <View key={i} style={[s.dia, i === hoy && { borderColor: VERDE }]}>
            <Text style={[s.diaT, i === hoy && { color: VERDE }]}>{dia}{i === hoy ? ' · HOY' : ''}</Text>
            {porDia[i].map((h) => (
              <View key={h._id} style={s.hora}>
                <Feather name="clock" size={13} color={colors.textMuted} />
                <Text style={s.horaTxt}>{h.hora}</Text>
                <Text style={s.horaZona}>{h.zona?.nombre}</Text>
                <View style={[s.cat, { backgroundColor: (categoriaColor[h.tipoResiduo] || colors.textMuted) + '22' }]}>
                  <Text style={[s.catTxt, { color: categoriaColor[h.tipoResiduo] || colors.textMuted }]}>
                    {CAT_LABEL[h.tipoResiduo] || h.tipoResiduo}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null
      )}
      {horarios.length === 0 && <Text style={s.vacio}>Tus zonas aún no tienen horarios registrados.</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  titulo: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  sec: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  ruta: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  rutaN: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  parada: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  paradaTxt: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  paradaHora: { color: colors.textMuted, fontSize: 12 },
  dia: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  diaT: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: spacing.xs },
  hora: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  horaTxt: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', width: 44 },
  horaZona: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  cat: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  catTxt: { fontSize: 10, fontWeight: '700' },
  vacio: { color: colors.textMuted, fontSize: 13 },
});
