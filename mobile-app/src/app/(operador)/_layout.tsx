import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, rolAccent } from '../../lib/theme';

// Interfaz del Operador/Conductor — acento verde
export default function OperadorLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: rolAccent.OPERADOR_CAMION,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="jornada"
        options={{ title: 'Jornada', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="truck-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="miruta"
        options={{ title: 'Mi Ruta', tabBarIcon: ({ color, size }) => <Feather name="map" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="horario"
        options={{ title: 'Horario', tabBarIcon: ({ color, size }) => <Feather name="clock" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
