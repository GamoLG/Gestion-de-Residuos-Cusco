import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing } from '../../lib/theme';

const ROL_LABEL: Record<string, string> = {
  CIUDADANO: 'Ciudadano', OPERADOR_CAMION: 'Conductor', ADMIN_ZONA: 'Admin de zona',
  ADMIN_MUNICIPAL: 'Admin municipal', SUPER_ADMIN: 'Administrador',
};

export default function Perfil() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  const salir = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
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
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={s.nombre}>{usuario?.nombre}</Text>
        <View style={s.rolBadge}>
          <Text style={s.rolTxt}>{ROL_LABEL[usuario?.rol || ''] || usuario?.rol}</Text>
        </View>
      </View>

      <View style={s.card}>
        {fila('mail', 'Correo', usuario?.email)}
        {fila('credit-card', 'DNI', usuario?.dni)}
        {fila('phone', 'Teléfono', usuario?.telefono)}
        {fila('map-pin', 'Zona', usuario?.zonaNombre)}
        {fila('home', 'Dirección', usuario?.direccion)}
      </View>

      <View style={s.tip}>
        <MaterialCommunityIcons name="shield-check" size={18} color={colors.success} />
        <Text style={s.tipTxt}>Tus datos están protegidos según la Ley N.° 29733 de Protección de Datos Personales.</Text>
      </View>

      <TouchableOpacity style={s.salir} onPress={salir}>
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text style={s.salirTxt}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={s.pie}>Residuos Cusco · v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: colors.primary, fontSize: 32, fontWeight: '800' },
  nombre: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  rolBadge: { backgroundColor: colors.bgSurface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: spacing.sm },
  rolTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  filaLbl: { color: colors.textSecondary, fontSize: 14, width: 80 },
  filaVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right' },
  tip: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.lg },
  tipTxt: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  salir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, height: 50, marginTop: spacing.xl },
  salirTxt: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  pie: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.xl },
});
