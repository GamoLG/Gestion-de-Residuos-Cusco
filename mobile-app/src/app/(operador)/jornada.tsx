import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing, estadoRutaColor, rolAccent } from '../../lib/theme';

const VERDE = rolAccent.OPERADOR_CAMION;

export default function Jornada() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [rutas, setRutas] = useState<any[]>([]);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try { const { data } = await api.get('/rutas/mias'); setRutas(data.data || []); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  const onRefresh = async () => { setRefrescando(true); await cargar(); setRefrescando(false); };

  const cambiarEstado = async (ruta: any, estado: string, msg: string) => {
    try {
      await api.put(`/rutas/${ruta._id}/estado`, { estado });
      await cargar();
      if (estado === 'EN_PROGRESO') {
        Alert.alert('Jornada iniciada 🚛', 'Ve a "Mi Ruta" para transmitir tu ubicación en vivo.', [
          { text: 'Ir a Mi Ruta', onPress: () => router.push('/(operador)/miruta') },
          { text: 'Después' },
        ]);
      } else {
        Alert.alert('Listo', msg);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo cambiar el estado');
    }
  };

  const enCurso = rutas.find((r) => r.estado === 'EN_PROGRESO');

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={VERDE} />}
    >
      <Text style={s.hola}>Hola, {usuario?.nombre?.split(' ')[0]} 🚛</Text>
      <Text style={s.sub}>Conductor · {rutas.length} ruta(s) asignada(s)</Text>

      {enCurso ? (
        <TouchableOpacity style={s.enCurso} onPress={() => router.push('/(operador)/miruta')} activeOpacity={0.85}>
          <MaterialCommunityIcons name="truck-fast" size={26} color={VERDE} />
          <View style={{ flex: 1 }}>
            <Text style={s.enCursoT}>EN RUTA: {enCurso.nombre}</Text>
            <Text style={s.enCursoS}>Transmitiendo… toca para ver el mapa y tus paradas</Text>
          </View>
          <Feather name="chevron-right" size={20} color={VERDE} />
        </TouchableOpacity>
      ) : (
        <View style={s.descanso}>
          <Text style={s.descansoTxt}>Sin jornada activa. Inicia una de tus rutas asignadas para comenzar a transmitir tu ubicación.</Text>
        </View>
      )}

      <Text style={s.sec}>Mis rutas asignadas</Text>
      {rutas.length === 0 && <Text style={s.vacio}>El administrador aún no te asignó rutas.</Text>}
      {rutas.map((r) => {
        const atendidas = (r.paradas || []).filter((p: any) => p.atendida).length;
        return (
          <View key={r._id} style={s.ruta}>
            <View style={s.rutaHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.rutaNom}>{r.nombre}</Text>
                <Text style={s.rutaSub}>
                  {r.zona?.nombre || 'Sin zona'} · Placa {r.camionPlaca || '—'} · {atendidas}/{r.paradas?.length || 0} paradas
                </Text>
              </View>
              <View style={[s.badge, { backgroundColor: (estadoRutaColor[r.estado] || colors.textMuted) + '22' }]}>
                <Text style={[s.badgeTxt, { color: estadoRutaColor[r.estado] || colors.textMuted }]}>{r.estado}</Text>
              </View>
            </View>
            <View style={s.acciones}>
              {r.estado === 'PENDIENTE' && (
                <TouchableOpacity style={[s.btn, { backgroundColor: VERDE }]} onPress={() => cambiarEstado(r, 'EN_PROGRESO', '')}>
                  <Feather name="play" size={15} color={colors.white} />
                  <Text style={s.btnTxt}>Iniciar jornada</Text>
                </TouchableOpacity>
              )}
              {r.estado === 'EN_PROGRESO' && (
                <>
                  <TouchableOpacity style={[s.btn, { backgroundColor: colors.primaryDark }]} onPress={() => router.push('/(operador)/miruta')}>
                    <Feather name="map" size={15} color={colors.white} />
                    <Text style={s.btnTxt}>Ver mi ruta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.btn, { backgroundColor: colors.bgSurface }]}
                    onPress={() =>
                      Alert.alert('Finalizar ruta', '¿Marcar la ruta como COMPLETADA?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Finalizar', onPress: () => cambiarEstado(r, 'COMPLETADA', 'Ruta completada. ¡Buen trabajo!') },
                      ])
                    }
                  >
                    <Feather name="check-circle" size={15} color={colors.white} />
                    <Text style={s.btnTxt}>Finalizar</Text>
                  </TouchableOpacity>
                </>
              )}
              {r.estado === 'COMPLETADA' && (
                <TouchableOpacity style={[s.btn, { backgroundColor: colors.bgSurface }]} onPress={() => cambiarEstado(r, 'PENDIENTE', 'Ruta reiniciada para una nueva jornada.')}>
                  <Feather name="rotate-ccw" size={15} color={colors.white} />
                  <Text style={s.btnTxt}>Nueva jornada</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hola: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  enCurso: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: VERDE + '15', borderWidth: 1.5, borderColor: VERDE, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
  enCursoT: { color: VERDE, fontSize: 15, fontWeight: '800' },
  enCursoS: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  descanso: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
  descansoTxt: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  sec: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  vacio: { color: colors.textMuted, fontSize: 14 },
  ruta: { backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  rutaHead: { flexDirection: 'row', alignItems: 'center' },
  rutaNom: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  rutaSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  acciones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, height: 42 },
  btnTxt: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
