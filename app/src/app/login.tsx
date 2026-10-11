import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmsCode } from '@/components/sms-code';
import { SocialLogin } from '@/components/social-login';
import { Field, GoldButton, IconButton, Logo, T } from '@/components/ui';
import { isPhone, maskPhone } from '@/lib/format';
import { useStore } from '@/store';
import { colors, space } from '@/theme';

export default function Login() {
  const { top, bottom } = useSafeAreaInsets();
  const login = useStore((s) => s.login);
  const [phone, setPhone] = useState('(61) 98225-0725');
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  const enter = () => {
    login();
    router.replace('/inicio');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: top + 8, paddingHorizontal: space.gutter }}>
        <IconButton icon="chevron-left" onPress={() => (step === 'code' ? setStep('phone') : router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.gutter, paddingTop: 24, paddingBottom: bottom + 24 }}>
        <Logo size={56} />
        <T v="serif" size={32} style={{ marginTop: 24 }}>
          {step === 'phone' ? 'Bem-vindo de volta' : 'Confirme o código'}
        </T>

        {step === 'phone' ? (
          <>
            <T size={14} color={colors.muted} style={{ marginTop: 8, lineHeight: 21 }}>
              Entre com seu celular. Enviaremos um código por SMS.
            </T>
            <Field
              label="Celular"
              prefix="+55"
              value={phone}
              onChangeText={(t) => setPhone(maskPhone(t))}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              placeholder="(61) 90000-0000"
              style={{ marginTop: 28, marginBottom: 16 }}
            />
            <GoldButton label="Receber código" disabled={!isPhone(phone)} onPress={() => setStep('code')} />
            <SocialLogin onDone={enter} />
            <View style={{ flex: 1, minHeight: 24 }} />
            <T size={13} color={colors.muted} style={{ textAlign: 'center' }}>
              Não tem conta?{' '}
              <T v="semibold" size={13} color={colors.gold} onPress={() => router.replace('/cadastro')}>
                Criar conta
              </T>
            </T>
          </>
        ) : (
          <SmsCode phone={phone} onDone={enter} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
