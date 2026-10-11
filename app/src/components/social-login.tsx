import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { T } from '@/components/ui';
import { colors, radius } from '@/theme';

export type Provider = 'apple' | 'google';

/** "ou" + Continuar com Apple / Google. Simulado: carrega um instante e entra. */
export function SocialLogin({ onDone, caption = 'ou', note }: { onDone: (p: Provider) => void; caption?: string; note?: ReactNode }) {
  const [busy, setBusy] = useState<Provider | null>(null);

  const press = (p: Provider) => {
    if (busy) return;
    setBusy(p);
    setTimeout(() => {
      // se a tela não mudar (ex.: "nenhuma conta ligada"), os botões voltam a funcionar
      setBusy(null);
      onDone(p);
    }, 800);
  };

  const Btn = ({ p, label, icon, apple }: { p: Provider; label: string; icon: 'logo-apple' | 'logo-google'; apple?: boolean }) => {
    const fg = apple ? '#000' : colors.text;
    return (
      <Pressable
        onPress={() => press(p)}
        disabled={!!busy}
        style={({ pressed }) => [s.btn, apple ? s.apple : s.google, (pressed || (busy && busy !== p)) && { opacity: 0.6 }]}>
        {busy === p ? <ActivityIndicator color={fg} /> : <Ionicons name={icon} size={19} color={fg} />}
        <T v="semibold" size={15} color={fg}>
          {label}
        </T>
      </Pressable>
    );
  };

  return (
    <View>
      <View style={s.divider}>
        <View style={s.line} />
        <T size={12} color={colors.muted}>
          {caption}
        </T>
        <View style={s.line} />
      </View>
      <View style={{ gap: 10 }}>
        <Btn p="apple" label="Continuar com Apple" icon="logo-apple" apple />
        <Btn p="google" label="Continuar com Google" icon="logo-google" />
      </View>
      {note}
      <T size={11} color={colors.dim} style={{ textAlign: 'center', marginTop: 10 }}>
        Simulado nesta demonstração
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  btn: { height: 52, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  apple: { backgroundColor: '#fff' },
  google: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
});
