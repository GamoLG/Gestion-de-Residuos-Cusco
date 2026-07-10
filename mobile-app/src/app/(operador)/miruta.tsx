import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../../lib/api';
import { MapaOSM, Marcador, Polilinea } from '../../components/MapaOSM';
import { colors, radius, spacing, rolAccent } from '../../lib/theme';

const VERDE = rolAccent.OPERADOR_CAMION;
const CUSCO = { lat: -13.52264, lng: -71.96734 };

// Mi Ruta: mapa con paradas + transmisión de la ubicación GPS en tiempo real.
// Cada posición se envía al backend, que la guarda (traza) y dispara los avisos
// a los ciudadanos (próximo / llegó / pasó).
export default function MiRuta() {
  const router = useRouter();
  const [ruta, setRuta] = useState<any | null>(null);
  const [transmitiendo, setTransmitiendo] = useState(false);
  const [ultimoEnvio, setUltimoEnvio] = useState<string | null>(null);
  const [avisos, setAvisos] = useState(0);
  const watch = useRef<Location.LocationSubscription | null>(null);
  const rutaId = useRef<string | null>(null);
  const ultimoPut = useRef(0);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/rutas/mias');
      const activa = (data.data || []).find((r: any) => r.estado === 'EN_PROGRESO') || (data.data || [])[0] || null;
      setRuta(activa);
      rutaId.current = activa?._id || null;
    } catch {}
  }, []);

  const detener = useCallback(() => {
    watch.current?.remove();
    watch.current = null;
    setTransmitiendo(false);
  }, []);

  const transmitir = useCallback(async () => {
    if (!rutaId.current) return Alert.alert('Atención', 'No tienes una ruta activa. Inicia tu jornada primero.');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso', 'Activa la ubicación para transmitir tu posición');
    setTransmitiendo(true);
    watch.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      async (loc) => {
        const ahora = Date.now();
        if (ahora - ultimoPut.current < 7000) return; // enviar cada ~8 s
        ultimoPut.current = ahora;
        try {
          const { data } = await api.put(`/rutas/${rutaId.current}/ubicacion`, {
            latitud: loc.coords.latitude,
            longitud: loc.coords.longitude,
          });
          setRuta(data.data.ruta);
          setUltimoEnvio(new Date().toLocaleTimeString('es-PE'));
          if (data.data.avisosGenerados) setAvisos((n) => n + data.data.avisosGenerados);
        } catch {}
      }
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
      return () => detener();
    }, [cargar, detener])
  );

  const marcarParada = async (idx: number, atendida: boolean) => {
    if (!ruta) return;
    try {
      const { data } = await api.put(`/rutas/${ruta._id}/paradas/${idx}`, { atendida });
      setRuta(data.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo marcar la parada');
    }
  };

  const finalizar = () => {
    if (!ruta) return;
    Alert.alert('Finalizar ruta', '¿Marcar la ruta como COMPLETADA?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: async () => {
          detener();
          try {
            await api.put(`/rutas/${ruta._id}/estado`, { estado: 'COMPLETADA' });
            Alert.alert('Ruta completada ✅', '¡Buen trabajo!', [{ text: 'OK', onPress: () => router.push('/(operador)/jornada') }]);
          } catch {}
        },
      },
    ]);
  };

  const paradas = ruta?.paradas || [];
  const marcadores: Marcador[] = [];
  const lineas: Polilinea[] = [];
  if (ruta?.latitudActual && ruta?.longitudActual) {
    marcadores.push({ id: 'yo', lat: ruta.latitudActual, lng: ruta.longitudActual, icono: '🚛', titulo: 'Tu camión' });
  }
  paradas.forEach((p: any, i: number) => {
    if (p.latitud && p.longitud) {
      marcadores.push({
        id: `p${i}`, lat: p.latitud, lng: p.longitud,
        color: p.atendida ? colors.success : colors.textMuted,
        titulo: `${p.nombre || `Parada ${i + 1}`} ${p.atendida ? '✅' : '⏳'}`,
      });
    }
  });
  const pts = paradas.filter((p: any) => p.latitud && p.longitud).map((p: any) => ({ lat: p.latitud, lng: p.longitud }));
  if (pts.length >= 2) lineas.push({ id: 'plan', puntos: pts, color: VERDE, discontinua: true });

  if (!ruta) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center', padding: spacing.xl }]}>
        <MaterialCommunityIcons name="truck-outline" size={48} color={colors.textMuted} />
        <Text style={s.vacioT}>No tienes rutas asignadas</Text>
        <Text style={s.vacioS}>Pide al administrador que te asigne una ruta, o revisa tu Jornada.</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.titulo}>{ruta.nombre}</Text>
          <Text style={s.sub}>{ruta.zona?.nombre || 'Sin zona'} · {ruta.estado}</Text>
        </View>
        {ruta.estado === 'EN_PROGRESO' && (
          <TouchableOpacity
            style={[s.gpsBtn, { backgroundColor: transmitiendo ? colors.danger : VERDE }]}
            onPress={() => (transmitiendo ? detener() : transmitir())}
          >
            <Feather name={transmitiendo ? 'pause' : 'navigation'} size={14} color={colors.white} />
            <Text style={s.gpsBtnTxt}>{transmitiendo ? 'Pausar GPS' : 'Transmitir GPS'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {transmitiendo && (
        <View style={s.vivo}>
          <View style={s.vivoDot} />
          <Text style={s.vivoTxt}>
            EN VIVO — los ciudadanos te ven en el mapa{ultimoEnvio ? ` · último envío ${ultimoEnvio}` : ''}{avisos ? ` · ${avisos} aviso(s) enviados` : ''}
          </Text>
        </View>
      )}

      <MapaOSM
        centro={ruta.latitudActual ? { lat: ruta.latitudActual, lng: ruta.longitudActual } : pts[0] || CUSCO}
        zoom={14}
        marcadores={marcadores}
        polilineas={lineas}
        ajustar
        style={{ flex: 1 }}
      />

      <ScrollView style={s.paradas} contentContainerStyle={{ padding: spacing.md }}>
        <View style={s.paradasHead}>
          <Text style={s.paradasT}>
            Paradas ({paradas.filter((p: any) => p.atendida).length}/{paradas.length})
          </Text>
          {ruta.estado === 'EN_PROGRESO' && (
            <TouchableOpacity onPress={finalizar}>
              <Text style={s.finalizar}>Finalizar ruta</Text>
            </TouchableOpacity>
          )}
        </View>
        {paradas.map((p: any, i: number) => (
          <TouchableOpacity
            key={i}
            style={s.parada}
            onPress={() => marcarParada(i, !p.atendida)}
            disabled={ruta.estado !== 'EN_PROGRESO'}
          >
            <Feather
              name={p.atendida ? 'check-circle' : 'circle'}
              size={20}
              color={p.atendida ? colors.success : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.paradaN, p.atendida && { textDecorationLine: 'line-through', color: colors.textMuted }]}>
                {p.nombre || `Parada ${i + 1}`}
              </Text>
              <Text style={s.paradaH}>{p.horaEstimada ? `Hora estimada: ${p.horaEstimada}` : ''}{p.atendida && p.horaAtencion ? ` · atendida ${new Date(p.horaAtencion).toLocaleTimeString('es-PE')}` : ''}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {paradas.length === 0 && <Text style={s.vacioS}>Esta ruta no tiene paradas registradas.</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm },
  titulo: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 14, height: 38 },
  gpsBtnTxt: { color: colors.white, fontSize: 12, fontWeight: '800' },
  vivo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: VERDE + '15', paddingHorizontal: spacing.lg, paddingVertical: 6 },
  vivoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: VERDE },
  vivoTxt: { color: VERDE, fontSize: 11, fontWeight: '700', flex: 1 },
  paradas: { maxHeight: 240, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgElevated },
  paradasHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  paradasT: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  finalizar: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  parada: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  paradaN: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  paradaH: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  vacioT: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  vacioS: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
});
