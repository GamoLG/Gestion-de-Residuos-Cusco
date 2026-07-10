import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, radius, spacing, acentoDe, WHATSAPP_SOPORTE } from '../lib/theme';

interface Msg { de: 'bot' | 'yo'; texto: string }

// Chatbot navegador: por botones lleva al usuario a la pantalla que necesita,
// y con IA (Gemini) responde dudas de segregación en lenguaje natural.
export default function Chatbot() {
  const { usuario, esOperador } = useAuth();
  const router = useRouter();
  const acento = acentoDe(usuario?.rol);
  const scrollRef = useRef<ScrollView>(null);

  const [mensajes, setMensajes] = useState<Msg[]>([
    { de: 'bot', texto: `¡Hola ${usuario?.nombre?.split(' ')[0] || ''}! 👋 Soy tu asistente. Toca una opción o escríbeme tu duda sobre residuos.` },
  ]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);

  const agregar = (m: Msg) => {
    setMensajes((prev) => [...prev, m]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const irA = (ruta: string, aviso: string) => {
    agregar({ de: 'bot', texto: aviso });
    setTimeout(() => router.push(ruta as any), 600);
  };

  const OPCIONES = [
    ...(esOperador
      ? [
          { icono: 'truck', label: '🚛 Iniciar mi jornada', accion: () => irA('/(operador)/jornada', 'Te llevo a tu Jornada para que inicies tu ruta…') },
          { icono: 'map', label: '🗺️ Ver mi ruta', accion: () => irA('/(operador)/miruta', 'Abriendo tu ruta con el mapa…') },
        ]
      : [
          { icono: 'clock', label: '🕐 ¿Cuándo pasa el camión?', accion: () => irA('/(tabs)/horarios', 'Te muestro los horarios de recojo de tu zona…') },
          { icono: 'map', label: '🚛 Ver el camión en vivo', accion: () => irA('/(tabs)/mapa', 'Abriendo el mapa con el camión en tiempo real…') },
          { icono: 'alert-triangle', label: '📸 Reportar basura', accion: () => irA('/(tabs)/incidencias', 'Te llevo a Incidencias para que reportes con foto y GPS…') },
          { icono: 'refresh-cw', label: '♻️ ¿Dónde va este residuo?', accion: () => agregar({ de: 'bot', texto: 'Escríbeme el residuo (ej. "botella de plástico", "pilas usadas") y te digo dónde va. También puedes clasificarlo con una FOTO en la pestaña Segregar.' }) },
        ]),
    {
      icono: 'help-circle', label: '🆘 Ayuda / queja (WhatsApp)',
      accion: () => {
        agregar({ de: 'bot', texto: 'Te conecto con el WhatsApp de soporte de la municipalidad…' });
        setTimeout(() => Linking.openURL(`https://wa.me/${WHATSAPP_SOPORTE}`).catch(() => {}), 600);
      },
    },
  ];

  const enviarTexto = async () => {
    const q = texto.trim();
    if (!q) return;
    setTexto('');
    agregar({ de: 'yo', texto: q });
    setPensando(true);
    try {
      const { data } = await api.post('/ia/segregar', { pregunta: q });
      agregar({ de: 'bot', texto: data.data.respuesta });
    } catch (e: any) {
      agregar({ de: 'bot', texto: e?.response?.data?.message || 'No pude procesar tu pregunta. Intenta de nuevo.' });
    } finally { setPensando(false); }
  };

  return (
    <View style={s.root}>
      <View style={s.top}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="robot-outline" size={22} color={acento} />
        <Text style={s.titulo}>Asistente virtual</Text>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
        {mensajes.map((m, i) => (
          <View key={i} style={[s.burbuja, m.de === 'yo' ? [s.mia, { backgroundColor: acento }] : s.bot]}>
            <Text style={[s.burbujaTxt, m.de === 'yo' && { color: colors.white }]}>{m.texto}</Text>
          </View>
        ))}
        {pensando && (
          <View style={[s.burbuja, s.bot, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={acento} />
            <Text style={s.burbujaTxt}>Pensando…</Text>
          </View>
        )}

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          {OPCIONES.map((o, i) => (
            <TouchableOpacity key={i} style={s.opcion} onPress={o.accion}>
              <Text style={s.opcionTxt}>{o.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Pregunta: ¿dónde boto las pilas?"
          placeholderTextColor={colors.textMuted}
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={enviarTexto}
          returnKeyType="send"
        />
        <TouchableOpacity style={[s.enviar, { backgroundColor: acento }]} onPress={enviarTexto} disabled={pensando}>
          <Feather name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  titulo: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  burbuja: { maxWidth: '85%', borderRadius: radius.lg, padding: spacing.md },
  bot: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  mia: { alignSelf: 'flex-end' },
  burbujaTxt: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  opcion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  opcionTxt: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgElevated },
  input: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, color: colors.textPrimary, paddingHorizontal: spacing.lg, height: 46, fontSize: 14 },
  enviar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
