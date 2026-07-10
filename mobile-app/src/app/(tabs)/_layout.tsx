import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { colors, acentoDe } from '../../lib/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: acentoDe(usuario?.rol),
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
        name="home"
        options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="mapa"
        options={{ title: 'Mapa', tabBarIcon: ({ color, size }) => <Feather name="map" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="horarios"
        options={{ title: 'Horarios', tabBarIcon: ({ color, size }) => <Feather name="clock" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="incidencias"
        options={{ title: 'Incidencias', tabBarIcon: ({ color, size }) => <Feather name="alert-triangle" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="residuos"
        options={{ title: 'Segregar', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="recycle" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
