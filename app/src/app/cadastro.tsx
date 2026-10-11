import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BirthdaySheet } from '@/components/birthday-sheet';
import { PhotoSheet } from '@/components/photo-sheet';
import { Sheet } from '@/components/sheet';
import { SmsCode } from '@/components/sms-code';
import { SocialLogin, type Provider } from '@/components/social-login';
import { Field, GoldButton, IconButton, T } from '@/components/ui';
import { UserAvatar } from '@/components/user-avatar';
import { birthdayLabel, isEmail, isPhone, maskPhone } from '@/lib/format';
import { useStore } from '@/store';
import { colors, radius, space } from '@/theme';

type Doc = 'termos' | 'privacidade';

const docs: Record<Doc, { title: string; body: string[] }> = {
  termos: {
    title: 'Termos de uso',
    body: [
      'Ao criar uma conta, você pode agendar, remarcar e cancelar horários na Mayk Barbearia pelo aplicativo.',
      'Cancelamentos devem ser feitos com pelo menos 2 horas de antecedência. Faltas sem aviso podem limitar novos agendamentos.',
      'Pontos do Clube Mayk não têm valor em dinheiro e valem apenas na barbearia.',
      'Texto de demonstração: a versão final será definida com a barbearia.',
    ],
  },
  privacidade: {
    title: 'Política de privacidade',
    body: [
      'Usamos seu nome, celular e e-mail para confirmar agendamentos e enviar lembretes. A data de aniversário e a foto são opcionais.',
      'Seus dados não são vendidos nem compartilhados com terceiros, exceto o processador de pagamentos quando você paga pelo app.',
      'Conforme a LGPD, você pode pedir a qualquer momento uma cópia dos seus dados ou a exclusão da sua conta.',
      'Texto de demonstração: a versão final será definida com a barbearia.',
    ],
  },
};

export default function Cadastro() {
  const { top, bottom } = useSafeAreaInsets();
  const { birthday, register, setPhoto, setBirthday } = useStore();
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [sheet, setSheet] = useState<'photo' | 'birthday' | Doc | null>(null);

  // conta nova: não herda foto nem aniversário de quem usou o app antes
  useEffect(() => {
    setPhoto(null);
    setBirthday(null);
  }, [setPhoto, setBirthday]);

  const errors = {
    name: name.trim().length < 2 ? 'Informe seu nome.' : null,
    phone: !isPhone(phone) ? 'Celular com DDD, 11 dígitos.' : null,
    email: !isEmail(email) ? 'E-mail inválido.' : null,
  };
  const valid = !errors.name && !errors.phone && !errors.email && terms;
  const touch = (k: keyof typeof touched) => setTouched((t) => ({ ...t, [k]: true }));

  const finish = () => {
    register({ name: name.trim().replace(/\s+/g, ' '), phone, email: email.trim().toLowerCase() });
    router.replace('/inicio');
  };

  // Apple/Google devolvem nome e e-mail da conta (celular não). Simulado: usa o que já foi digitado ou um exemplo.
  const finishSocial = (p: Provider) => {
    register({
      name: errors.name ? 'Cliente Mayk' : name.trim().replace(/\s+/g, ' '),
      phone: errors.phone ? '' : phone,
      email: errors.email ? `cliente@${p === 'apple' ? 'icloud' : 'gmail'}.com` : email.trim().toLowerCase(),
    });
    router.replace('/inicio');
  };

  const doc = sheet === 'termos' || sheet === 'privacidade' ? docs[sheet] : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: top + 8, paddingHorizontal: space.gutter }}>
        <IconButton icon="chevron-left" onPress={() => (step === 'code' ? setStep('form') : router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.gutter, paddingTop: 16, paddingBottom: bottom + 24 }}>
        <T v="serif" size={32}>
          {step === 'form' ? 'Criar conta' : 'Confirme seu celular'}
        </T>

        {step === 'code' ? (
          <SmsCode phone={phone} onDone={finish} label="Criar conta" />
        ) : (
          <>
            <T size={14} color={colors.muted} style={{ marginTop: 8, lineHeight: 21 }}>
              Leva menos de um minuto. Depois é só agendar.
            </T>

            {/* Foto (opcional) */}
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Pressable onPress={() => setSheet('photo')} accessibilityLabel="Adicionar foto de perfil">
                <UserAvatar size={88} ring name={name} />
                <View style={s.camera}>
                  <Feather name="camera" size={14} color={colors.onGold} />
                </View>
              </Pressable>
              <T size={12} color={colors.muted} style={{ marginTop: 8 }}>
                Foto · opcional
              </T>
            </View>

            <View style={{ gap: 14, marginTop: 20 }}>
              <Field
                label="Nome completo"
                value={name}
                onChangeText={setName}
                onBlur={() => touch('name')}
                placeholder="Seu nome"
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                error={touched.name ? errors.name : null}
              />
              <Field
                label="Celular"
                prefix="+55"
                value={phone}
                onChangeText={(t) => setPhone(maskPhone(t))}
                onBlur={() => touch('phone')}
                placeholder="(61) 90000-0000"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                error={touched.phone ? errors.phone : null}
              />
              <Field
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                onBlur={() => touch('email')}
                placeholder="voce@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                error={touched.email ? errors.email : null}
              />

              {/* Aniversário (opcional) */}
              <Pressable onPress={() => setSheet('birthday')} style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
                <Feather name="gift" size={18} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <T v="medium" size={14}>
                    Data de aniversário
                  </T>
                  <T size={12} color={colors.muted} style={{ marginTop: 2 }}>
                    Opcional · ganhe 20% off no mês do seu aniversário
                  </T>
                </View>
                <T v="semibold" size={13} color={birthday ? colors.text : colors.gold}>
                  {birthday ? birthdayLabel(birthday) : 'Adicionar'}
                </T>
              </Pressable>
            </View>

            {/* LGPD */}
            <Pressable onPress={() => setTerms(!terms)} style={s.terms} hitSlop={6} accessibilityRole="checkbox" accessibilityState={{ checked: terms }}>
              <View style={[s.check, terms && s.checkOn]}>{terms && <Feather name="check" size={13} color={colors.onGold} />}</View>
              <T size={13} color={colors.text} style={{ flex: 1, lineHeight: 19 }}>
                Li e aceito os{' '}
                <T v="semibold" size={13} color={colors.gold} onPress={() => setSheet('termos')}>
                  Termos de uso
                </T>{' '}
                e a{' '}
                <T v="semibold" size={13} color={colors.gold} onPress={() => setSheet('privacidade')}>
                  Política de privacidade
                </T>
                .
              </T>
            </Pressable>

            <GoldButton
              label="Criar conta"
              disabled={!valid}
              onPress={() => {
                setTouched({ name: true, phone: true, email: true });
                if (valid) setStep('code');
              }}
            />

            <SocialLogin
              onDone={finishSocial}
              caption="ou cadastre-se com"
              note={
                <T size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
                  Ao continuar com Apple ou Google, você aceita os{' '}
                  <T v="semibold" size={12} color={colors.gold} onPress={() => setSheet('termos')}>
                    Termos de uso
                  </T>{' '}
                  e a{' '}
                  <T v="semibold" size={12} color={colors.gold} onPress={() => setSheet('privacidade')}>
                    Política de privacidade
                  </T>
                  .
                </T>
              }
            />

            <View style={{ flex: 1, minHeight: 24 }} />
            <T size={13} color={colors.muted} style={{ textAlign: 'center' }}>
              Já tem conta?{' '}
              <T v="semibold" size={13} color={colors.gold} onPress={() => router.replace('/login')}>
                Entrar
              </T>
            </T>
          </>
        )}
      </ScrollView>

      <PhotoSheet visible={sheet === 'photo'} onClose={() => setSheet(null)} />
      <BirthdaySheet visible={sheet === 'birthday'} onClose={() => setSheet(null)} />
      <Sheet visible={!!doc} onClose={() => setSheet(null)} title={doc?.title ?? ''}>
        <ScrollView style={{ maxHeight: 360 }}>
          {doc?.body.map((p) => (
            <T key={p} size={13} color={colors.muted} style={{ lineHeight: 20, marginBottom: 12 }}>
              {p}
            </T>
          ))}
        </ScrollView>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  camera: { position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.gold, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 22, marginBottom: 18 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.dim, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkOn: { backgroundColor: colors.gold, borderColor: colors.gold },
});
