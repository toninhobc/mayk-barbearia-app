import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { GoldButton, T } from '@/components/ui';
import { colors } from '@/theme';

const RESEND_SECONDS = 30;

/** Etapa do código por SMS (4 dígitos). Na demonstração qualquer código vale. */
export function SmsCode({ phone, onDone, label = 'Entrar' }: { phone: string; onDone: () => void; label?: string }) {
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(RESEND_SECONDS);
  const ref = useRef<TextInput>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  return (
    <View style={{ flex: 1 }}>
      <T size={14} color={colors.muted} style={{ marginTop: 8, lineHeight: 21 }}>
        Enviamos um código de 4 dígitos para {phone}.
      </T>

      <Pressable onPress={() => ref.current?.focus()} style={s.row}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[s.box, code.length === i && { borderColor: colors.gold }]}>
            <T v="serif" size={28}>
              {code[i] ?? ''}
            </T>
          </View>
        ))}
        <TextInput
          ref={ref}
          value={code}
          onChangeText={(t) => {
            const c = t.replace(/\D/g, '').slice(0, 4);
            setCode(c);
            if (c.length === 4) setTimeout(onDone, 250);
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          style={s.hidden}
        />
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        <T size={12} color={colors.muted}>
          Demonstração: digite qualquer código.{' '}
          <T v="semibold" size={12} color={colors.gold} onPress={onDone}>
            Pular
          </T>
        </T>
        {wait > 0 ? (
          <T size={12} color={colors.dim}>
            Reenviar em {wait}s
          </T>
        ) : (
          <T v="semibold" size={12} color={colors.gold} onPress={() => setWait(RESEND_SECONDS)}>
            Reenviar código
          </T>
        )}
      </View>

      <View style={{ flex: 1 }} />
      <GoldButton label={label} disabled={code.length < 4} onPress={onDone} />
    </View>
  );
}

const s = StyleSheet.create({
  row: { marginTop: 32, flexDirection: 'row', gap: 12 },
  box: { flex: 1, height: 70, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
