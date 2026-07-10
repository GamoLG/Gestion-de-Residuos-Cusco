import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { colors, radius, spacing, categoriaColor } from '../../lib/theme';

const CAT_LABEL: Record<string, string> = {
  ORGANICO: 'Orgánico', RECICLABLE: 'Reciclable', NO_RECICLABLE: 'No reciclable', PELIGROSO: 'Peligroso',
};

export default function Residuos() {
  const [items, setItems] = useState<any[]>([]);
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try { const { data } = await api.get('/residuos'); setItems(data.data || []); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const preguntarIA = async (fotoBase64?: string) => {
    if (!fotoBase64 && !pregunta.trim()) return Alert.alert('Falta', 'Escribe tu duda o toma una foto');
    setConsultando(true);
    setRespuesta(null);
    try {
      const { data } = await api.post('/ia/segregar', {
        pregunta: pregunta.trim() || undefined,
        fotoBase64,
        mimeType: fotoBase64 ? 'image/jpeg' : undefined,
      });
      setRespuesta(data.data.respuesta);
    } catch (e: any) {
      setRespuesta(e?.response?.data?.message || 'No se pudo consultar a la IA. Intenta de nuevo.');
    } finally { setConsultando(false); }
  };

  const clasificarFoto = async (deCamara: boolean) => {
    const permiso = deCamara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permiso.status !== 'granted') return Alert.alert('Permiso', 'Se necesita acceso a la cámara/galería');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5, base64: true, allowsEditing: true };
    const res = deCamara ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]?.base64) return;
    setFotoUri(res.assets[0].uri);
    await preguntarIA(res.assets[0].base64);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}>
      <Text style={s.titulo}>Aprende a segregar</Text>
      <Text style={s.sub}>Separa correctamente tus residuos para una ciudad más limpia.</Text>

      {/* Asistente IA de segregación (Gemini) */}
      <View style={s.ia}>
        <View style={s.iaHead}>
          <MaterialCommunityIcons name="robot-outline" size={20} color={colors.primary} />
          <Text style={s.iaT}>¿Dónde va este residuo? (IA)</Text>
        </View>
        <TextInput
          style={s.iaInput}
          placeholder='Ej. "botella de plástico", "pilas usadas"…'
          placeholderTextColor={colors.textMuted}
          value={pregunta}
          onChangeText={setPregunta}
          onSubmitEditing={() => preguntarIA()}
        />
        <View style={s.iaBtns}>
          <TouchableOpacity style={s.iaBtn} onPress={() => preguntarIA()} disabled={consultando}>
            <Feather name="send" size={14} color={colors.white} />
            <Text style={s.iaBtnTxt}>Preguntar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.iaBtn, { backgroundColor: colors.bgSurface }]} onPress={() => clasificarFoto(true)} disabled={consultando}>
            <Feather name="camera" size={14} color={colors.white} />
            <Text style={s.iaBtnTxt}>Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.iaBtn, { backgroundColor: colors.bgSurface }]} onPress={() => clasificarFoto(false)} disabled={consultando}>
            <Feather name="image" size={14} color={colors.white} />
            <Text style={s.iaBtnTxt}>Galería</Text>
          </TouchableOpacity>
        </View>
        {consultando && (
          <View style={s.iaResp}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.iaRespTxt}>Analizando…</Text>
          </View>
        )}
        {!consultando && (respuesta || fotoUri) && (
          <View style={s.iaResp}>
            {fotoUri && <Image source={{ uri: fotoUri }} style={s.iaFoto} />}
            {respuesta && <Text style={s.iaRespTxt}>{respuesta}</Text>}
          </View>
        )}
      </View>

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
  ia: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  iaHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  iaT: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  iaInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.textPrimary, padding: spacing.md, fontSize: 14 },
  iaBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  iaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primaryDark, borderRadius: radius.md, height: 40 },
  iaBtnTxt: { color: colors.white, fontSize: 13, fontWeight: '700' },
  iaResp: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  iaRespTxt: { flex: 1, color: colors.textPrimary, fontSize: 13, lineHeight: 19 },
  iaFoto: { width: 64, height: 64, borderRadius: radius.sm },
});
