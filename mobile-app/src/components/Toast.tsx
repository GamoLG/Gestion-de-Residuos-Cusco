import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

// Aviso global no bloqueante ("toast"): se puede disparar desde CUALQUIER
// parte de la app (incluido lib/api.ts, que no es un componente) llamando a
// mostrarToast(). <ToastHost/> se monta una sola vez en el layout raíz.
type Oyente = (msg: string) => void;
let oyentes: Oyente[] = [];
let contador = 0;
let ultimoMsg = '';
let ultimoTs = 0;

export function mostrarToast(mensaje: string) {
  // Evita ráfagas del mismo mensaje (ej. varias pantallas fallando a la vez)
  const ahora = Date.now();
  if (mensaje === ultimoMsg && ahora - ultimoTs < 4000) return;
  ultimoMsg = mensaje;
  ultimoTs = ahora;
  oyentes.forEach((o) => o(mensaje));
}

export function ToastHost() {
  const [item, setItem] = useState<{ id: number; msg: string } | null>(null);
  const opacidad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const oyente: Oyente = (msg) => {
      contador++;
      const id = contador;
      setItem({ id, msg });
      Animated.timing(opacidad, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(opacidad, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
          setItem((actual) => (actual?.id === id ? null : actual));
        });
      }, 3500);
    };
    oyentes.push(oyente);
    return () => { oyentes = oyentes.filter((o) => o !== oyente); };
  }, [opacidad]);

  if (!item) return null;
  return (
    <View style={s.wrap} pointerEvents="none">
      <Animated.View style={[s.toast, { opacity: opacidad }]}>
        <Text style={s.txt}>{item.msg}</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 100, alignItems: 'center', zIndex: 999 },
  toast: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, maxWidth: '90%', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  txt: { color: colors.textPrimary, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
