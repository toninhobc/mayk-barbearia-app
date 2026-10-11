import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmsCode } from '@/components/sms-code';
import { SocialLogin } from '@/components/social-login';
import { Field, GoldButton, IconButton, Logo, OutlineButton, T } from '@/components/ui';
import { isPhone, maskPhone } from '@/lib/format';
import { accountKey, useStore, type Provider } from '@/store';
import { colors, radius, space } from '@/theme';

const providerName: Record<Provider, string> = { apple: 'Apple', google: 'Google' };

export default function Login() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { login, hasAccount, socialLinks } = useStore();
  const [phone, setPhone] = useState(params.phone ? maskPhone(params.phone) : '(61) 98225-0725');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  // conta não encontrada: pelo celular digitado ou pelo login social
  const [missing, setMissing] = useState<'phone' | Provider | null>(null);

  const sendCode = () => {
    if (!hasAccount(phone)) return setMissing('phone');
    setStep('code');
  };

  const social = (p: Provider) => {
    const key = socialLinks[p];
    if (!key) return setMissing(p);
    login(key);
    router.replace('/inicio');
  };

  const enter = () => {
    login(accountKey(phone));
    router.replace('/inicio');
  };

  const signUp = () =>
    router.replace(missing === 'phone' ? { pathname: '/cadastro', params: { phone: accountKey(phone) } } : '/cadastro');

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
              onChangeText={(t) => {
                setPhone(maskPhone(t));
                if (missing === 'phone') setMissing(null);
              }}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              placeholder="(61) 90000-0000"
              style={{ marginTop: 28, marginBottom: 16 }}
            />

            {missing && (
              <View style={s.missing}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Feather name="user-x" size={18} color={colors.gold} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <T v="semibold" size={14}>
                      {missing === 'phone' ? 'Não encontramos uma conta com este celular.' : `Nenhuma conta ligada ao ${providerName[missing]}.`}
                    </T>
                    <T size={12} color={colors.muted} style={{ marginTop: 4, lineHeight: 18 }}>
                      {missing === 'phone' ? 'Confira o número ou crie sua conta em menos de um minuto.' : 'Entre pelo celular ou crie sua conta.'}
                    </T>
                  </View>
                </View>
                <OutlineButton label={missing === 'phone' ? 'Criar conta com este número' : 'Criar conta'} icon="user-plus" onPress={signUp} />
              </View>
            )}

            <GoldButton label="Receber código" disabled={!isPhone(phone)} onPress={sendCode} />
            <SocialLogin onDone={social} />
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

const s = StyleSheet.create({
  missing: { gap: 12, padding: 16, marginBottom: 16, borderRadius: radius.md, backgroundColor: 'rgba(200,161,90,0.08)', borderWidth: 1, borderColor: 'rgba(200,161,90,0.35)' },
});
