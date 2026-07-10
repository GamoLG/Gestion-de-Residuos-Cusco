import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

export default function Index() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!usuario) return <Redirect href="/login" />;
  // Cada rol entra a su propia interfaz
  if (usuario.rol === 'OPERADOR_CAMION') return <Redirect href="/(operador)/jornada" />;
  return <Redirect href="/(tabs)/home" />;
}
