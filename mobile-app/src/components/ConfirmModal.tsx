import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../lib/theme';

interface Props {
  visible: boolean;
  icono?: keyof typeof Feather.glyphMap;
  colorIcono?: string;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  colorConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Modal de confirmación con el estilo propio de la app (fondo oscuro, acento
// de color), en vez del Alert.alert por defecto del sistema operativo.
export function ConfirmModal({
  visible, icono = 'help-circle', colorIcono = colors.warning, titulo, mensaje,
  textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', colorConfirmar = colors.danger,
  onConfirmar, onCancelar,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar} statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={[s.iconoWrap, { backgroundColor: colorIcono + '22' }]}>
            <Feather name={icono} size={26} color={colorIcono} />
          </View>
          <Text style={s.titulo}>{titulo}</Text>
          <Text style={s.mensaje}>{mensaje}</Text>
          <View style={s.botones}>
            <TouchableOpacity style={s.btnCancelar} onPress={onCancelar} activeOpacity={0.8}>
              <Text style={s.btnCancelarTxt}>{textoCancelar}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnConfirmar, { backgroundColor: colorConfirmar }]} onPress={onConfirmar} activeOpacity={0.85}>
              <Text style={s.btnConfirmarTxt}>{textoConfirmar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: 340, backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center' },
  iconoWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  titulo: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  mensaje: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: spacing.sm, lineHeight: 19 },
  botones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, width: '100%' },
  btnCancelar: { flex: 1, height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  btnCancelarTxt: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  btnConfirmar: { flex: 1, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnConfirmarTxt: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
