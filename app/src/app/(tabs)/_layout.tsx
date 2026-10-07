import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Slot, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, type IconName } from '@/components/ui';
import { colors, goldGradient, radius } from '@/theme';

const tabs: { href: '/inicio' | '/agenda' | '/fidelidade' | '/perfil'; label: string; icon: IconName }[] = [
  { href: '/inicio', label: 'Início', icon: 'home' },
  { href: '/agenda', label: 'Agenda', icon: 'calendar' },
  { href: '/fidelidade', label: 'Pontos', icon: 'gift' },
  { href: '/perfil', label: 'Perfil', icon: 'user' },
];

/** Navegação flutuante em pílula (conceito aprovado). */
export default function TabsLayout() {
  const path = usePathname();
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
              <Feather name={t.icon} size={21} color="#9A9A9A" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { position: 'absolute', left: 22, right: 22, height: 70, borderRadius: radius.pill, backgroundColor: 'rgba(28,28,28,0.96)', borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
  on: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12 },
  item: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
