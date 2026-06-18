import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { MapaOSM, Marcador } from '../../components/MapaOSM';
import { colors, spacing } from '../../lib/theme';

const CUSCO = { lat: -13.52264, lng: -71.96734 };

export default function Mapa() {
  const [marcadores, setMarcadores] = useState<Marcador[]>([]);
  const [activos, setActivos] = useState(0);
  const timer = useRef<any>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/rutas/activas');
      const rutas = data.data || [];
      const ms: Marcador[] = rutas
        .filter((r: any) => r.latitudActual && r.longitudActual)
        .map((r: any) => ({
          id: r._id,
          lat: r.latitudActual,
          lng: r.longitudActual,
          color: colors.success,
          titulo: `${r.nombre} (${r.camionPlaca || 's/placa'})`,
        }));
      setMarcadores(ms);
      setActivos(rutas.length);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
      timer.current = setInterval(cargar, 8000); // refresco cada 8s
      return () => clearInterval(timer.current);
    }, [cargar])
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.titulo}>Camiones en vivo</Text>
        <View style={s.pill}>
          <View style={s.dot} />
          <Text style={s.pillTxt}>{activos} activos</Text>
        </View>
      </View>
      <MapaOSM centro={marcadores[0] ?? CUSCO} zoom={13} marcadores={marcadores} style={{ flex: 1 }} />
      {marcadores.length === 0 && (
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
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  pillTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  aviso: { position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md },
  avisoTxt: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
});
