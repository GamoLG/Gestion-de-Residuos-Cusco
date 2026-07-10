import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing, categoriaColor, DIAS_SEMANA, acentoDe } from '../../lib/theme';

const CAT_LABEL: Record<string, string> = {
  ORGANICO: 'Orgánico', RECICLABLE: 'Reciclable', NO_RECICLABLE: 'No reciclable', PELIGROSO: 'Peligroso',
};
const TIPO_ICON: Record<string, string> = {
  PROXIMIDAD: '🔔', LLEGADA: '✅', PASO: '⏭️', RETRASO: '⚠️', INCIDENCIA: '📸', SISTEMA: 'ℹ️',
};

export default function Horarios() {
  const { usuario } = useAuth();
  const acento = acentoDe(usuario?.rol);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [h, a] = await Promise.all([
        api.get(usuario?.zonaId ? `/horarios?zona=${usuario.zonaId}` : '/horarios'),
        api.get('/alertas/mias'),
      ]);
      setHorarios(h.data.data || []);
      setAlertas((a.data.data || []).slice(0, 15));
    } catch {}
  }, [usuario?.zonaId]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  const onRefresh = async () => { setRefrescando(true); await cargar(); setRefrescando(false); };

  const hoy = new Date().getDay();
  // Próximo recojo: el horario más cercano a partir de hoy
  const proximo = [...horarios].sort((a, b) => {
    const da = (a.diaSemana - hoy + 7) % 7, db = (b.diaSemana - hoy + 7) % 7;
    return da - db || a.hora.localeCompare(b.hora);
  })[0];

  const porDia: Record<number, any[]> = {};
  horarios.forEach((h) => { (porDia[h.diaSemana] ||= []).push(h); });

  const marcarLeidas = async () => {
    try { await api.put('/alertas/leer-todas'); cargar(); } catch {}
  };
  const noLeidas = alertas.filter((a) => !a.leida).length;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={acento} />}
    >
      <Text style={s.titulo}>Horarios de recojo</Text>
      <Text style={s.sub}>{usuario?.zonaNombre ? `Zona: ${usuario.zonaNombre}` : 'Mostrando todas las zonas (asigna tu zona en Perfil)'}</Text>

      {proximo && (
        <View style={[s.proximo, { borderColor: acento }]}>
          <MaterialCommunityIcons name="truck-fast" size={26} color={acento} />
          <View style={{ flex: 1 }}>
            <Text style={s.proximoT}>Próxima recolección</Text>
            <Text style={s.proximoV}>
              {proximo.diaSemana === hoy ? '¡HOY!' : DIAS_SEMANA[proximo.diaSemana]} a las {proximo.hora} · {CAT_LABEL[proximo.tipoResiduo] || proximo.tipoResiduo}
            </Text>
          </View>
        </View>
      )}

      {DIAS_SEMANA.map((dia, i) =>
        porDia[i] ? (
          <View key={i} style={[s.dia, i === hoy && { borderColor: acento }]}>
            <Text style={[s.diaT, i === hoy && { color: acento }]}>{dia}{i === hoy ? ' · HOY' : ''}</Text>
            {porDia[i].map((h) => (
              <View key={h._id} style={s.hora}>
                <Feather name="clock" size={14} color={colors.textMuted} />
                <Text style={s.horaTxt}>{h.hora}</Text>
                <View style={[s.cat, { backgroundColor: (categoriaColor[h.tipoResiduo] || colors.textMuted) + '22' }]}>
                  <Text style={[s.catTxt, { color: categoriaColor[h.tipoResiduo] || colors.textMuted }]}>
                    {CAT_LABEL[h.tipoResiduo] || h.tipoResiduo}
                  </Text>
                </View>
                {!usuario?.zonaId && <Text style={s.zonaTag}>{h.zona?.nombre}</Text>}
              </View>
            ))}
          </View>
        ) : null
      )}
      {horarios.length === 0 && <Text style={s.vacio}>Aún no hay horarios registrados para tu zona.</Text>}

      <View style={s.avisosHead}>
        <Text style={s.sec}>Avisos del camión</Text>
        {noLeidas > 0 && (
          <TouchableOpacity onPress={marcarLeidas}>
            <Text style={[s.marcar, { color: acento }]}>Marcar leídas ({noLeidas})</Text>
          </TouchableOpacity>
        )}
      </View>
      {alertas.length === 0 && <Text style={s.vacio}>Sin avisos por ahora. Te avisaremos cuando el camión esté próximo, llegue o pase por tu zona.</Text>}
      {alertas.map((a) => (
        <View key={a._id} style={[s.alerta, !a.leida && { borderColor: acento }]}>
          <Text style={{ fontSize: 18 }}>{TIPO_ICON[a.tipo] || 'ℹ️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.alertaT}>{a.titulo || a.tipo}</Text>
            <Text style={s.alertaM}>{a.mensaje}</Text>
            <Text style={s.alertaF}>{new Date(a.createdAt).toLocaleString('es-PE')}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  titulo: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 2, marginBottom: spacing.lg },
  proximo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgElevated, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  proximoT: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  proximoV: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
  dia: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  diaT: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  hora: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  horaTxt: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', width: 46 },
  cat: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  catTxt: { fontSize: 11, fontWeight: '700' },
  zonaTag: { color: colors.textMuted, fontSize: 11, marginLeft: 'auto' },
  avisosHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm },
  sec: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  marcar: { fontSize: 12, fontWeight: '700' },
  vacio: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md },
  alerta: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  alertaT: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  alertaM: { color: colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
  alertaF: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
