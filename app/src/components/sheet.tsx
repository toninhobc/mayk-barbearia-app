import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { IconButton, T } from '@/components/ui';
import { colors, radius, space } from '@/theme';

/** Janela sobre a tela (funciona em iOS, Android e web). Tocar fora fecha. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={s.card}>
          <View style={s.head}>
            <T v="serif" size={24} style={{ flex: 1 }}>
              {title}
            </T>
            <IconButton icon="x" onPress={onClose} />
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: space.gutter, backgroundColor: 'rgba(0,0,0,0.7)' },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', padding: 22, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
});
