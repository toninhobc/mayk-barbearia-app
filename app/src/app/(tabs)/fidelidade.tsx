import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldButton, Kicker, Logo, SectionHeader, T, type IconName } from '@/components/ui';
import { REFERRAL_CODE, coupons } from '@/data/mock';
import { monthName } from '@/lib/format';
import { LOYALTY_GOAL as GOAL, REWARD_SERVICE, useStore } from '@/store';
import { colors, radius, space } from '@/theme';

const perks: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'scissors', title: 'Corte grátis', sub: 'A cada 10 atendimentos' },
  { icon: 'gift', title: 'Presente de aniversário', sub: '20% off no mês do seu aniversário' },
  { icon: 'users', title: 'Indique um amigo', sub: 'Vocês dois ganham R$ 10 de desconto' },
];

export default function Fidelidade() {
  const { top } = useSafeAreaInsets();
  const points = useStore((s) => s.points);
  const birthday = useStore((s) => s.birthday);
  const rewards = useStore((s) => s.rewards);
  const { resetDraft, toggleService, setUseReward } = useStore.getState();

  const bookFreeCut = () => {
    resetDraft();
    toggleService(REWARD_SERVICE);
    setUseReward(true);
    router.push('/servicos');
  };
  const [copied, setCopied] = useState(false);
  const code = REFERRAL_CODE;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: top + 14, paddingHorizontal: space.gutter, paddingBottom: 130 }}>
      <T v="serif" size={32}>
        Clube Mayk
      </T>
      <T size={13} color={colors.muted} style={{ marginTop: 6 }}>
        Cada visita conta. Junte selos e ganhe recompensas.
      </T>

      {rewards > 0 && (
        <LinearGradient colors={['#3A2F1C', '#1B1710']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.reward}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={s.rewardIcon}>
              <Feather name="gift" size={20} color={colors.onGold} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="semibold" size={16}>
                {rewards === 1 ? 'Você tem 1 corte grátis' : `Você tem ${rewards} cortes grátis`}
              </T>
              <T size={12} color={colors.muted} style={{ marginTop: 2 }}>
                Cartão completo! Use no próximo agendamento.
              </T>
            </View>
          </View>
          <GoldButton label="Agendar corte grátis" icon="arrow-right" style={{ marginTop: 14 }} onPress={bookFreeCut} />
        </LinearGradient>
      )}

      {/* Cartão de fidelidade */}
      <LinearGradient colors={['#2A2318', '#141414']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Kicker>Cartão fidelidade</Kicker>
            <T v="serif" size={40} color={colors.goldLight} style={{ marginTop: 8 }}>
              {points}
              <T v="serif" size={20} color={colors.muted}>
                {' '}
                / {GOAL}
              </T>
            </T>
          </View>
          <Logo size={44} />
        </View>
        <View style={s.stamps}>
          {Array.from({ length: GOAL }).map((_, i) => (
            <View key={i} style={[s.stamp, i < points && s.stampOn]}>
              <Feather name={i === GOAL - 1 ? 'gift' : 'scissors'} size={14} color={i < points ? colors.onGold : colors.dim} />
            </View>
          ))}
        </View>
        <T size={12} color={colors.muted} style={{ marginTop: 14 }}>
          {GOAL - points === 1 ? 'Falta 1 atendimento para seu próximo corte grátis.' : `Faltam ${GOAL - points} atendimentos para seu próximo corte grátis.`}
        </T>
      </LinearGradient>

      <SectionHeader title="Benefícios" />
      {perks.map((p) => ({
        ...p,
        sub:
          p.icon === 'gift'
            ? birthday
              ? `20% off em ${monthName(birthday.month)}, o mês do seu aniversário`
              : '20% off no mês do aniversário · cadastre a data no Perfil'
            : p.sub,
      })).map((p) => (
        <View key={p.title} style={s.perk}>
          <View style={s.perkIcon}>
            <Feather name={p.icon} size={19} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="semibold" size={15}>
              {p.title}
            </T>
            <T size={12} color={colors.muted} style={{ marginTop: 2 }}>
              {p.sub}
            </T>
          </View>
        </View>
      ))}

      <SectionHeader title="Seu código" />
      <Pressable
        style={s.code}
        onPress={async () => {
          await Clipboard.setStringAsync(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}>
        <T v="serif" size={24} color={colors.goldLight} style={{ letterSpacing: 2 }}>
          {code}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name={copied ? 'check' : 'copy'} size={16} color={colors.gold} />
          <T v="semibold" size={13} color={colors.gold}>
            {copied ? 'Copiado' : 'Copiar'}
          </T>
        </View>
      </Pressable>
      <T size={12} color={colors.muted} style={{ marginTop: 10 }}>
        Use no pagamento e ganhe {coupons[REFERRAL_CODE]}% de desconto.
      </T>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  reward: { marginTop: 18, padding: 18, borderRadius: 24, borderWidth: 1, borderColor: colors.gold },
  rewardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  card: { marginTop: 22, borderRadius: 26, padding: 22, borderWidth: 1, borderColor: 'rgba(200,161,90,0.35)' },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  stamp: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  stampOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginBottom: 10 },
  perkIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center' },
  code: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.gold, backgroundColor: 'rgba(200,161,90,0.06)' },
});
