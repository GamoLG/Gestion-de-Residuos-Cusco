import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { colors, radius, spacing, acentoDe, WHATSAPP_SOPORTE } from '../lib/theme';

const ROL_LABEL: Record<string, string> = {
  CIUDADANO: 'Ciudadano', OPERADOR_CAMION: 'Conductor', ADMIN_ZONA: 'Admin de zona',
  ADMIN_MUNICIPAL: 'Admin municipal', SUPER_ADMIN: 'Administrador',
};

// Pantalla de perfil compartida por ciudadano, operador y admin
export function PerfilView() {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const acento = acentoDe(usuario?.rol);

  const salir = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const abrirWhatsApp = () => {
    const msg = encodeURIComponent('Hola, necesito ayuda con el servicio de recolección de residuos (app Residuos Cusco).');
    Linking.openURL(`https://wa.me/${WHATSAPP_SOPORTE}?text=${msg}`).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp')
    );
  };

  const fila = (icon: any, label: string, valor?: string | null) => (
    <View style={s.fila}>
      <Feather name={icon} size={18} color={colors.textMuted} />
      <Text style={s.filaLbl}>{label}</Text>
      <Text style={s.filaVal}>{valor || '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: spacing.lg, paddingTop: 56 }}>
      <View style={s.avatarWrap}>
        <View style={[s.avatar, { borderColor: acento, backgroundColor: acento + '22' }]}>
          <Text style={[s.avatarTxt, { color: acento }]}>{usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={s.nombre}>{usuario?.nombre}</Text>
        <View style={[s.rolBadge, { backgroundColor: acento + '22' }]}>
          <Text style={[s.rolTxt, { color: acento }]}>{ROL_LABEL[usuario?.rol || ''] || usuario?.rol}</Text>
        </View>
      </View>

      <View style={s.card}>
        {fila('mail', 'Correo', usuario?.email)}
        {fila('credit-card', 'DNI', usuario?.dni)}
        {fila('phone', 'Teléfono', usuario?.telefono)}
        {fila('map-pin', 'Zona', usuario?.zonaNombre)}
        {fila('home', 'Dirección', usuario?.direccion)}
      </View>

      <TouchableOpacity style={[s.accion, { borderColor: acento }]} onPress={() => router.push('/editar-perfil')}>
        <Feather name="edit-2" size={18} color={acento} />
        <Text style={[s.accionTxt, { color: acento }]}>Editar perfil y contraseña</Text>
      </TouchableOpacity>

      <Text style={s.sec}>Ayuda y soporte</Text>
      <TouchableOpacity style={s.soporte} onPress={abrirWhatsApp}>
        <FontAwesome name="whatsapp" size={22} color="#25D366" />
        <View style={{ flex: 1 }}>
          <Text style={s.soporteT}>WhatsApp de la municipalidad</Text>
          <Text style={s.soporteS}>Quejas, soporte y consultas del servicio</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity style={s.soporte} onPress={() => router.push('/chatbot')}>
        <MaterialCommunityIcons name="robot-outline" size={22} color={acento} />
        <View style={{ flex: 1 }}>
          <Text style={s.soporteT}>Asistente virtual</Text>
          <Text style={s.soporteS}>Te guía a la pantalla que necesitas</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={s.tip}>
        <MaterialCommunityIcons name="shield-check" size={18} color={colors.success} />
        <Text style={s.tipTxt}>Tus datos están protegidos según la Ley N.° 29733 de Protección de Datos Personales.</Text>
      </View>

      <TouchableOpacity style={s.salir} onPress={salir}>
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text style={s.salirTxt}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={s.pie}>Residuos Cusco · v2.0.0 (Entrega 3)</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 32, fontWeight: '800' },
  nombre: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  rolBadge: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: spacing.sm },
  rolTxt: { fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  filaLbl: { color: colors.textSecondary, fontSize: 14, width: 80 },
  filaVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right' },
  accion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, height: 50, marginTop: spacing.lg },
  accionTxt: { fontSize: 15, fontWeight: '700' },
  sec: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  soporte: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  soporteT: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  soporteS: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  tip: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.lg },
  tipTxt: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  salir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, height: 50, marginTop: spacing.xl },
  salirTxt: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  pie: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
});
