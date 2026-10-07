import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldButton, IconButton, Logo, T } from '@/components/ui';
import { useStore } from '@/store';
import { colors, fonts, radius, space } from '@/theme';

const maskPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export default function Login() {
  const { top, bottom } = useSafeAreaInsets();
  const login = useStore((s) => s.login);
  const [phone, setPhone] = useState('(61) 98225-0725');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState('');
  const codeRef = useRef<TextInput>(null);
  const phoneOk = phone.replace(/\D/g, '').length === 11;

  const enter = () => {
    login();
    router.replace('/inicio');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: top + 8, paddingHorizontal: space.gutter }}>
        <IconButton icon="chevron-left" onPress={() => (step === 'code' ? setStep('phone') : router.back())} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: space.gutter, paddingTop: 28 }}>
        <Logo size={56} />
        <T v="serif" size={32} style={{ marginTop: 24 }}>
          {step === 'phone' ? 'Bem-vindo de volta' : 'Confirme o código'}
        </T>
        <T size={14} color={colors.muted} style={{ marginTop: 8, lineHeight: 21 }}>
          {step === 'phone'
            ? 'Entre com seu celular. Enviaremos um código por SMS.'
            : `Enviamos um código de 4 dígitos para ${phone}.`}
        </T>

        {step === 'phone' ? (
          <View style={s.field}>
            <T v="medium" size={15} color={colors.muted}>
              +55
            </T>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(maskPhone(t))}
              keyboardType="phone-pad"
              placeholder="(61) 90000-0000"
              placeholderTextColor={colors.dim}
              style={s.input}
            />
          </View>
        ) : (
          <Pressable onPress={() => codeRef.current?.focus()} style={s.codeRow}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[s.codeBox, code.length === i && { borderColor: colors.gold }]}>
                <T v="serif" size={28}>
                  {code[i] ?? ''}
                </T>
              </View>
            ))}
            <TextInput
              ref={codeRef}
              value={code}
              onChangeText={(t) => {
                const c = t.replace(/\D/g, '').slice(0, 4);
                setCode(c);
                if (c.length === 4) setTimeout(enter, 250);
              }}
              keyboardType="number-pad"
              autoFocus
              style={s.hidden}
            />
          </Pressable>
        )}
        {step === 'code' && (
          <T size={12} color={colors.muted} style={{ marginTop: 14 }}>
            Demonstração: digite qualquer código.{' '}
            <T v="semibold" size={12} color={colors.gold} onPress={enter}>
              Pular
            </T>
          </T>
        )}
      </View>
      <View style={{ paddingHorizontal: space.gutter, paddingBottom: bottom + 24 }}>
        {step === 'phone' ? (
          <GoldButton label="Receber código" disabled={!phoneOk} onPress={() => setStep('code')} />
        ) : (
          <GoldButton label="Entrar" disabled={code.length < 4} onPress={enter} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  field: { marginTop: 32, flexDirection: 'row', alignItems: 'center', gap: 14, height: 62, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 18 },
  codeRow: { marginTop: 32, flexDirection: 'row', gap: 12 },
  codeBox: { flex: 1, height: 70, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
