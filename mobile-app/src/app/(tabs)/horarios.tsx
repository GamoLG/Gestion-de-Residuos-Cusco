import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
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
  const [zonaGPS, setZonaGPS] = useState<{ id: string; nombre: string } | null>(null);
  const [detectando, setDetectando] = useState(false);
  const timer = useRef<any>(null);

  // Detecta la zona SEGÚN LA UBICACIÓN ACTUAL (GPS), no solo la del perfil.
  // Así, si estás físicamente en San Sebastián ves su horario, y si estás
  // en el Centro ves el suyo, sin tener que ir a cambiar tu zona en Perfil.
  const detectarZonaPorGPS = useCallback(async () => {
    setDetectando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setZonaGPS(null); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { data } = await api.post('/zonas/detect', { lat: loc.coords.latitude, lng: loc.coords.longitude });
      if (data.data?.matched) {
        setZonaGPS({ id: data.data.zona.id, nombre: data.data.zona.nombre });
      } else {
        setZonaGPS(null); // fuera de toda zona conocida: se usa la del perfil como respaldo
      }
    } catch {
      setZonaGPS(null);
    } finally {
      setDetectando(false);
    }
  }, []);

  const zonaActivaId = zonaGPS?.id || usuario?.zonaId;
  const zonaActivaNombre = zonaGPS?.nombre || usuario?.zonaNombre;

  const cargar = useCallback(async () => {
    try {
      const [h, a] = await Promise.all([
        api.get(zonaActivaId ? `/horarios?zona=${zonaActivaId}` : '/horarios'),
        api.get('/alertas/mias'),
      ]);
      setHorarios(h.data.data || []);
      setAlertas((a.data.data || []).slice(0, 15));
    } catch {}
  }, [zonaActivaId]);

  useFocusEffect(
    useCallback(() => {
      detectarZonaPorGPS();
      cargar();
      timer.current = setInterval(cargar, 8000); // refresco en vivo mientras la pantalla está abierta
      return () => clearInterval(timer.current);
    }, [cargar, detectarZonaPorGPS])
  );
  const onRefresh = async () => { setRefrescando(true); await detectarZonaPorGPS(); await cargar(); setRefrescando(false); };

  const hoy = new Date().getDay();
  // Próximo recojo: el horario más cercano a partir de hoy
  const proximo = [...horarios].sort((a, b) => {
    const da = (a.diaSemana - hoy + 7) % 7, db = (b.diaSemana - hoy + 7) % 7;
    return da - db || a.hora.localeCompare(b.hora);
  })[0];
  const rango = (h: any) => (h.horaFin ? `${h.hora}–${h.horaFin}` : h.hora);

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

      <TouchableOpacity style={s.ubicacionBox} onPress={detectarZonaPorGPS} disabled={detectando}>
        <Feather name="map-pin" size={15} color={zonaGPS ? colors.success : colors.textMuted} />
        <Text style={s.ubicacionTxt}>
          {detectando
            ? 'Detectando tu ubicación…'
            : zonaGPS
              ? `Según tu ubicación actual: ${zonaGPS.nombre}`
              : zonaActivaNombre
                ? `Zona de tu perfil: ${zonaActivaNombre}`
                : 'Sin zona detectada — activa la ubicación'}
        </Text>
        {detectando ? <ActivityIndicator size="small" color={acento} /> : <Feather name="refresh-cw" size={14} color={colors.textMuted} />}
      </TouchableOpacity>

      {proximo && (
        <View style={[s.proximo, { borderColor: acento }]}>
          <MaterialCommunityIcons name="truck-fast" size={26} color={acento} />
          <View style={{ flex: 1 }}>
            <Text style={s.proximoT}>Próxima recolección</Text>
            <Text style={s.proximoV}>
              {proximo.diaSemana === hoy ? '¡HOY!' : DIAS_SEMANA[proximo.diaSemana]} · {rango(proximo)} · {CAT_LABEL[proximo.tipoResiduo] || proximo.tipoResiduo}
            </Text>
            {!!proximo.sector && <Text style={s.proximoSec}>{proximo.sector}</Text>}
          </View>
        </View>
      )}

      {DIAS_SEMANA.map((dia, i) =>
        porDia[i] ? (
          <View key={i} style={[s.dia, i === hoy && { borderColor: acento }]}>
            <Text style={[s.diaT, i === hoy && { color: acento }]}>{dia}{i === hoy ? ' · HOY' : ''}</Text>
            {porDia[i].map((h) => (
              <View key={h._id} style={s.horaFila}>
                <View style={s.hora}>
                  <Feather name="clock" size={14} color={colors.textMuted} />
                  <Text style={s.horaTxt}>{rango(h)}</Text>
                  <View style={[s.cat, { backgroundColor: (categoriaColor[h.tipoResiduo] || colors.textMuted) + '22' }]}>
                    <Text style={[s.catTxt, { color: categoriaColor[h.tipoResiduo] || colors.textMuted }]}>
                      {CAT_LABEL[h.tipoResiduo] || h.tipoResiduo}
                    </Text>
                  </View>
                  {!zonaActivaId && <Text style={s.zonaTag}>{h.zona?.nombre}</Text>}
                </View>
                {!!h.sector && <Text style={s.sectorTxt}>📍 {h.sector}</Text>}
              </View>
            ))}
          </View>
        ) : null
      )}
      {horarios.length === 0 && <Text style={s.vacio}>Aún no hay horarios registrados para esta zona.</Text>}

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
  ubicacionBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg },
  ubicacionTxt: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  proximo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgElevated, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  proximoT: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  proximoV: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
  proximoSec: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  dia: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  diaT: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  horaFila: { paddingVertical: 4 },
  hora: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  horaTxt: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', width: 92 },
  sectorTxt: { color: colors.textMuted, fontSize: 11, marginLeft: 22, marginTop: 1 },
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
