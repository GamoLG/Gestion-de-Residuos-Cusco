import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { colors, radius, spacing } from '../lib/theme';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    if (!email || !password) return Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña');
    setCargando(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const entrarGoogle = () => {
    Alert.alert('Próximamente', 'El inicio de sesión con Google estará disponible en una próxima actualización.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.cont} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logoBadge}>
            <MaterialCommunityIcons name="recycle" size={44} color={colors.success} />
          </View>
          <Text style={s.titulo}>Residuos Cusco</Text>
          <Text style={s.sub}>Gestión inteligente de residuos sólidos</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>CORREO ELECTRÓNICO</Text>
          <View style={s.inputWrap}>
            <Feather name="mail" size={18} color={colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={s.label}>CONTRASEÑA</Text>
          <View style={s.inputWrap}>
            <Feather name="lock" size={18} color={colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!ver}
            />
            <TouchableOpacity onPress={() => setVer((v) => !v)} hitSlop={10}>
              <Feather name={ver ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/forgot')} style={s.olvido} hitSlop={8}>
            <Text style={s.olvidoTxt}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btn} onPress={entrar} disabled={cargando} activeOpacity={0.85}>
            {cargando ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnTxt}>Iniciar sesión</Text>}
          </TouchableOpacity>

          <View style={s.divisor}>
            <View style={s.linea} /><Text style={s.o}>o</Text><View style={s.linea} />
          </View>

          <TouchableOpacity style={s.google} onPress={entrarGoogle} activeOpacity={0.85}>
            <AntDesign name="google" size={18} color="#EA4335" />
            <Text style={s.googleTxt}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.link} onPress={() => router.push('/register')}>
            <Text style={s.linkTxt}>¿No tienes cuenta? <Text style={{ color: colors.primary }}>Regístrate</Text></Text>
          </TouchableOpacity>
        </View>

        <Text style={s.pie}>Municipalidad del Cusco · 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  cont: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logoBadge: {
    width: 84, height: 84, borderRadius: radius.xl, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  titulo: { color: colors.textPrimary, fontSize: 26, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, gap: spacing.sm,
  },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: spacing.sm },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16 },
  olvido: { alignSelf: 'flex-end', marginTop: spacing.sm },
  olvidoTxt: { color: colors.primary, fontSize: 13 },
  btn: { backgroundColor: colors.primaryDark, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  btnTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  linea: { flex: 1, height: 1, backgroundColor: colors.border },
  o: { color: colors.textMuted, fontSize: 13 },
  google: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.md, height: 50,
  },
  googleTxt: { color: '#1f1f1f', fontSize: 15, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkTxt: { color: colors.textSecondary, fontSize: 14 },
  pie: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.xl },
});
