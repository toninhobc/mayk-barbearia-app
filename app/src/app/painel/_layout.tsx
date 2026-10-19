import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, Slot, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, type IconName } from '@/components/ui';
import { barbers, OWNER_ID, ownerProfile, unitOf } from '@/data/mock';
import { useStore } from '@/store';
import { colors, goldGradient, radius, space } from '@/theme';

const tabs: { href: '/painel' | '/painel/resumo'; label: string; icon: IconName }[] = [
  { href: '/painel', label: 'Agenda', icon: 'calendar' },
  { href: '/painel/resumo', label: 'Resumo', icon: 'bar-chart-2' },
];

/** Painel da equipe: cabeçalho com quem está logado + barra inferior própria. */
export default function PainelLayout() {
  const path = usePathname();
  const { top, bottom } = useSafeAreaInsets();
  const { staff, staffLogout } = useStore();
  if (!staff) return <Redirect href="/equipe" />;
  const owner = staff.barberId === OWNER_ID;
  const barber = barbers.find((b) => b.id === staff.barberId);
  const me = barber ?? ownerProfile;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[s.head, { paddingTop: top + 10 }]}>
        <View style={s.badge}>
          <T v="serif" size={18} color={colors.goldLight}>
            {me.short[0]}
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T v="semibold" size={16}>
            {me.short}
          </T>
          <T size={12} color={owner ? colors.goldLight : colors.muted}>
            {owner || !barber ? 'Gerência · todas as unidades' : `Barbeiro · Dom Cabral ${unitOf(barber.unitId).name}`}
          </T>
        </View>
        <Pressable
          onPress={() => {
            staffLogout();
            // volta à boas-vindas que já está no histórico, sem empilhar outra cópia
            router.dismissTo('/');
          }}
          hitSlop={8}
          style={({ pressed }) => [s.exit, pressed && { opacity: 0.7 }]}>
          <Feather name="log-out" size={15} color={colors.muted} />
          <T size={12} color={colors.muted}>
            Sair
          </T>
        </Pressable>
      </View>

      <Slot />

      <View style={[s.bar, { bottom: Math.max(bottom, 14) + 8 }]}>
        {tabs.map((t) => {
          const on = path === t.href;
          return on ? (
            <LinearGradient key={t.href} colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.on}>
              <Feather name={t.icon} size={16} color={colors.onGold} />
              <T v="bold" size={13} color={colors.onGold}>
                {t.label}
              </T>
            </LinearGradient>
          ) : (
            <Pressable key={t.href} onPress={() => router.navigate(t.href)} hitSlop={10} style={s.item}>
              <Feather name={t.icon} size={18} color="#A89A88" />
              <T size={13} color="#A89A88">
                {t.label}
              </T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  badge: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  exit: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  bar: { position: 'absolute', left: 60, right: 60, height: 64, borderRadius: radius.pill, backgroundColor: 'rgba(36,28,21,0.96)', borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 },
  on: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 11 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
});
