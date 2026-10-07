import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kicker, Logo, SectionHeader, T, type IconName } from '@/components/ui';
import { useStore } from '@/store';
import { colors, radius, space } from '@/theme';

const GOAL = 10;
const perks: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'scissors', title: 'Corte grátis', sub: 'A cada 10 atendimentos' },
  { icon: 'gift', title: 'Presente de aniversário', sub: '20% off no mês do seu aniversário' },
  { icon: 'users', title: 'Indique um amigo', sub: 'Vocês dois ganham R$ 10 de desconto' },
];

export default function Fidelidade() {
  const { top } = useSafeAreaInsets();
  const points = useStore((s) => s.points);
  const [copied, setCopied] = useState(false);
  const code = 'ANTONIO10';

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: top + 14, paddingHorizontal: space.gutter, paddingBottom: 130 }}>
      <T v="serif" size={32}>
        Clube Mayk
      </T>
      <T size={13} color={colors.muted} style={{ marginTop: 6 }}>
        Cada visita conta. Junte selos e ganhe recompensas.
      </T>

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
          Faltam {GOAL - points} atendimentos para seu corte grátis.
        </T>
      </LinearGradient>

      <SectionHeader title="Benefícios" />
      {perks.map((p) => (
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
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { marginTop: 22, borderRadius: 26, padding: 22, borderWidth: 1, borderColor: 'rgba(200,161,90,0.35)' },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  stamp: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  stampOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginBottom: 10 },
  perkIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center' },
  code: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.gold, backgroundColor: 'rgba(200,161,90,0.06)' },
});
