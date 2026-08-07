// Proyecto realizado por el estudiante Jhoel Alex Luicho Quispe, estudiante de la Escuela Profesional de Ingeniería Informática y de Sistemas - UNSAAC.
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../lib/auth';
import { ToastHost } from '../components/Toast';
import { colors } from '../lib/theme';

export default function RootLayout() {
  const router = useRouter();

  // Al tocar una notificación push (con la app cerrada, en background o abierta)
  // se navega a la pantalla de Horarios, donde está el detalle del aviso.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/horarios');
    });
    return () => sub.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          />
          <ToastHost />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
