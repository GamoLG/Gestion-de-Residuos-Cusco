import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';

export default function Forgot() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const recuperar = async () => {
    if (!email || !dni || !password) return Alert.alert('Faltan datos', 'Completa correo, DNI y nueva contraseña');
    if (password.length < 6) return Alert.alert('Contraseña', 'Mínimo 6 caracteres');
    setCargando(true);
    try {
      const { data } = await api.post('/auth/recuperar', { email: email.trim(), dni: dni.trim(), password });
      if (!data.success) throw new Error(data.message);
      Alert.alert('Listo', 'Contraseña actualizada. Ya puedes iniciar sesión.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'No se pudo recuperar');
    } finally {
      setCargando(false);
    }
  };

  const campo = (label: string, icon: any, val: string, set: (v: string) => void, extra: any = {}) => (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <Feather name={icon} size={18} color={colors.textMuted} />
        <TextInput style={s.input} placeholderTextColor={colors.textMuted} value={val} onChangeText={set} {...extra} />
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.cont} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.titulo}>Recuperar contraseña</Text>
        </View>

        <View style={s.card}>
          <Text style={s.ayuda}>Ingresa tu correo y DNI para verificar tu identidad y definir una nueva contraseña.</Text>
          {campo('CORREO', 'mail', email, setEmail, { placeholder: 'correo@ejemplo.com', autoCapitalize: 'none', keyboardType: 'email-address' })}
          {campo('DNI', 'credit-card', dni, setDni, { placeholder: '12345678', keyboardType: 'numeric', maxLength: 8 })}
          {campo('NUEVA CONTRASEÑA', 'lock', password, setPassword, { placeholder: '••••••••', secureTextEntry: true })}

          <TouchableOpacity style={s.btn} onPress={recuperar} disabled={cargando} activeOpacity={0.85}>
            {cargando ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnTxt}>Actualizar contraseña</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  cont: { flexGrow: 1, padding: spacing.xl, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  titulo: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.xs },
  ayuda: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm, lineHeight: 19 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16 },
  btn: { backgroundColor: colors.primaryDark, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  btnTxt: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
