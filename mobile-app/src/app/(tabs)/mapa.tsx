import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { MapaOSM, Marcador, Polilinea, PuntoCalor } from '../../components/MapaOSM';
import { colors, spacing, acentoDe } from '../../lib/theme';

const CUSCO = { lat: -13.52264, lng: -71.96734 };

export default function Mapa() {
  const { usuario } = useAuth();
  const acento = acentoDe(usuario?.rol);
  const [marcadores, setMarcadores] = useState<Marcador[]>([]);
  const [lineas, setLineas] = useState<Polilinea[]>([]);
  const [activos, setActivos] = useState(0);
  const [eta, setEta] = useState<string | null>(null);
  const [verCalor, setVerCalor] = useState(false);
  const [calor, setCalor] = useState<PuntoCalor[]>([]);
  const [compartirUbicacion, setCompartirUbicacion] = useState(true); // el ciudadano controla si transmite su posición
  const timer = useRef<any>(null);
  const gpsWatch = useRef<Location.LocationSubscription | null>(null);
  const miPos = useRef<{ lat: number; lng: number } | null>(null);
  const enFoco = useRef(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/rutas/activas');
      const rutas = data.data || [];
      setActivos(rutas.length);

      const ms: Marcador[] = [];
      const ls: Polilinea[] = [];

      for (const r of rutas) {
        // Camión en vivo
        if (r.latitudActual && r.longitudActual) {
          ms.push({
            id: `camion-${r._id}`, lat: r.latitudActual, lng: r.longitudActual,
            icono: '🚛', pulso: true, titulo: `${r.nombre} (${r.camionPlaca || 's/placa'}) · en vivo`,
          });
        }
        // Paradas: verdes atendidas, grises pendientes + línea de la ruta planificada
        const paradas = r.paradas || [];
        paradas.forEach((p: any, i: number) => {
          if (p.latitud && p.longitud) {
            ms.push({
              id: `parada-${r._id}-${i}`, lat: p.latitud, lng: p.longitud,
              color: p.atendida ? colors.success : colors.textMuted,
              titulo: `${p.nombre || 'Parada'} · ${p.horaEstimada || ''} ${p.atendida ? '✅ atendida' : '⏳ pendiente'}`,
            });
          }
        });
        // Recorrido planificado: sigue las calles reales (calculado con OSRM al
        // sembrar los datos). Si no hay datos guardados, cae de vuelta a unir
        // las paradas en línea recta.
        const real = (r.recorridoPlanificado || []).map((p: any) => ({ lat: p.latitud, lng: p.longitud }));
        if (real.length >= 2) {
          ls.push({ id: `plan-${r._id}`, puntos: real, color: r.zona?.color || colors.primary, discontinua: true });
        } else {
          const puntos = paradas.filter((p: any) => p.latitud && p.longitud).map((p: any) => ({ lat: p.latitud, lng: p.longitud }));
          if (puntos.length >= 2) ls.push({ id: `plan-${r._id}`, puntos, color: r.zona?.color || colors.primary, discontinua: true });
        }

        // Recorrido real del camión (traza GPS)
        try {
          const t = await api.get(`/rutas/${r._id}/traza`);
          const tp = (t.data.data || []).map((x: any) => ({ lat: x.latitud, lng: x.longitud }));
          if (tp.length >= 2) ls.push({ id: `traza-${r._id}`, puntos: tp, color: colors.success });
        } catch {}
      }

      // Mi ubicación
      if (miPos.current) {
        ms.push({ id: 'yo', lat: miPos.current.lat, lng: miPos.current.lng, icono: '📍', titulo: 'Tú estás aquí' });
      }

      setMarcadores(ms);
      setLineas(ls);

      // ETA de la primera ruta activa hasta mi posición
      if (rutas.length && (miPos.current || usuario?.latitud)) {
        try {
          const lat = miPos.current?.lat ?? usuario?.latitud;
          const lng = miPos.current?.lng ?? usuario?.longitud;
          const e = await api.get(`/rutas/${rutas[0]._id}/eta?lat=${lat}&lng=${lng}`);
          const d = e.data.data;
          setEta(`🚛 ${rutas[0].nombre}: a ${d.distanciaM >= 1000 ? (d.distanciaM / 1000).toFixed(1) + ' km' : d.distanciaM + ' m'} · llega en ~${d.etaMin} min`);
        } catch { setEta(null); }
      } else setEta(null);
    } catch {}
  }, [usuario?.latitud, usuario?.longitud]);

  // Zonas críticas: mapa de calor con las incidencias reportadas
  const cargarCalor = useCallback(async () => {
    try { const { data } = await api.get('/incidentes/puntos'); setCalor(data.data || []); } catch {}
  }, []);

  const alternarCalor = () => {
    const nuevo = !verCalor;
    setVerCalor(nuevo);
    if (nuevo && calor.length === 0) cargarCalor();
  };

  // Transmitir MI ubicación en vivo mientras veo el mapa (el admin la ve en su panel).
  // El ciudadano puede apagarlo con el interruptor "Compartiendo ubicación".
  const iniciarGPS = useCallback(async () => {
    if (gpsWatch.current) return; // ya está transmitiendo
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      gpsWatch.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20 },
        async (loc) => {
          miPos.current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          try { await api.put('/usuarios/me/ubicacion', { latitud: loc.coords.latitude, longitud: loc.coords.longitude }); } catch {}
        }
      );
    } catch {}
  }, []);

  const detenerGPS = useCallback(() => {
    gpsWatch.current?.remove();
    gpsWatch.current = null;
    miPos.current = null;
  }, []);

  // Reacciona al interruptor mientras la pantalla está abierta
  useEffect(() => {
    if (!enFoco.current) return;
    if (compartirUbicacion) iniciarGPS();
    else detenerGPS();
  }, [compartirUbicacion, iniciarGPS, detenerGPS]);

  useFocusEffect(
    useCallback(() => {
      enFoco.current = true;
      cargar();
      if (compartirUbicacion) iniciarGPS();
      timer.current = setInterval(cargar, 8000); // refresco cada 8s
      return () => {
        enFoco.current = false;
        clearInterval(timer.current);
        detenerGPS();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar, iniciarGPS, detenerGPS])
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.titulo}>Camiones en vivo</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity style={[s.pill, verCalor && { borderColor: colors.danger }]} onPress={alternarCalor}>
            <Text style={[s.pillTxt, verCalor && { color: colors.danger }]}>🔥 Zonas críticas</Text>
          </TouchableOpacity>
          <View style={s.pill}>
            <View style={[s.dot, { backgroundColor: activos ? colors.success : colors.textMuted }]} />
            <Text style={s.pillTxt}>{activos} activos</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[s.compartir, compartirUbicacion ? { borderColor: colors.success } : { borderColor: colors.textMuted }]}
        onPress={() => setCompartirUbicacion((v) => !v)}
      >
        <View style={[s.dot, { backgroundColor: compartirUbicacion ? colors.success : colors.textMuted }]} />
        <Text style={s.compartirTxt}>
          {compartirUbicacion ? 'Compartiendo tu ubicación en vivo' : 'Ubicación oculta (no se comparte)'}
        </Text>
        <Text style={[s.compartirAccion, { color: compartirUbicacion ? colors.danger : colors.success }]}>
          {compartirUbicacion ? 'Apagar' : 'Activar'}
        </Text>
      </TouchableOpacity>
      <MapaOSM centro={CUSCO} zoom={13} marcadores={marcadores} polilineas={lineas} calor={verCalor ? calor : []} style={{ flex: 1 }} />
      {eta && (
        <View style={[s.eta, { borderColor: acento }]}>
          <Text style={s.etaTxt}>{eta}</Text>
        </View>
      )}
      {activos === 0 && (
        <View style={s.aviso}>
          <Text style={s.avisoTxt}>No hay camiones transmitiendo ahora. Aparecerán cuando un conductor inicie su ruta.</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm, backgroundColor: colors.bg },
  titulo: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  compartir: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.bgElevated, borderWidth: 1, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: 8 },
  compartirTxt: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  compartirAccion: { fontSize: 11, fontWeight: '800' },
  eta: { position: 'absolute', top: 140, left: spacing.lg, right: spacing.lg, backgroundColor: colors.bgElevated, borderWidth: 1.5, borderRadius: 10, padding: spacing.md },
  etaTxt: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  aviso: { position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md },
  avisoTxt: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
});
