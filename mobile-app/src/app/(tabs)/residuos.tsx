import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { colors, radius, spacing, categoriaColor } from '../../lib/theme';

const CAT_LABEL: Record<string, string> = {
  ORGANICO: 'Orgánico', RECICLABLE: 'Reciclable', NO_RECICLABLE: 'No reciclable', PELIGROSO: 'Peligroso',
};

export default function Residuos() {
  const [items, setItems] = useState<any[]>([]);
  const cargar = useCallback(async () => {
    try { const { data } = await api.get('/residuos'); setItems(data.data || []); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}>
      <Text style={s.titulo}>Aprende a segregar</Text>
      <Text style={s.sub}>Separa correctamente tus residuos para una ciudad más limpia.</Text>

      {items.map((r) => (
        <View key={r._id} style={[s.card, { borderLeftColor: categoriaColor[r.categoria] || colors.primary, borderLeftWidth: 4 }]}>
          <View style={s.row}>
            <MaterialCommunityIcons name="recycle" size={22} color={categoriaColor[r.categoria] || colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.nom}>{r.nombre}</Text>
              <Text style={[s.cat, { color: categoriaColor[r.categoria] }]}>{CAT_LABEL[r.categoria] || r.categoria}</Text>
            </View>
          </View>
          {!!r.descripcion && <Text style={s.desc}>{r.descripcion}</Text>}
          {!!r.ejemplos?.length && <Text style={s.ej}>Ejemplos: {r.ejemplos.join(', ')}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  titulo: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 14, marginTop: 2, marginBottom: spacing.lg },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nom: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  cat: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  desc: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.sm, lineHeight: 19 },
  ej: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs, fontStyle: 'italic' },
});
