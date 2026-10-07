import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { colors, fonts, goldGradient, radius, space } from '@/theme';

export const logo = require('../../assets/images/mayk-logo.jpg');
export type IconName = keyof typeof Feather.glyphMap;

/* ---------- Tipografia ---------- */

type Variant = 'serif' | 'serifItalic' | 'regular' | 'medium' | 'semibold' | 'bold';

export function T({
  v = 'regular',
  size = 14,
  color = colors.text,
  style,
  ...rest
}: TextProps & { v?: Variant; size?: number; color?: string }) {
  return <Text {...rest} style={[{ fontFamily: fonts[v], fontSize: size, color }, style]} />;
}

/** Rótulo pequeno em caixa alta, dourado. */
export const Kicker = ({ children, color = colors.gold }: { children: ReactNode; color?: string }) => (
  <T v="semibold" size={11} color={color} style={{ letterSpacing: 2.2, textTransform: 'uppercase' }}>
    {children}
  </T>
);

/* ---------- Foto (real ou espaço reservado) ---------- */

export function Photo({
  source,
  label = 'Foto',
  style,
  radius: r = 0,
}: {
  source?: ImageSourcePropType | null;
  label?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}) {
  if (source) {
    return (
      <View style={[{ borderRadius: r, overflow: 'hidden' }, style]}>
        <Image source={source} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={[{ borderRadius: r, overflow: 'hidden', backgroundColor: '#24201B' }, style]}>
      <LinearGradient colors={['#3A342C', '#1B1916']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="stripes" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Line x1="0" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stripes)" />
      </Svg>
      {label ? (
        <View style={s.photoLabelWrap} pointerEvents="none">
          <View style={s.photoLabel}>
            <T v="medium" size={9} color="rgba(255,255,255,0.4)" style={{ letterSpacing: 2, textTransform: 'uppercase' }}>
              {label}
            </T>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* ---------- Botões ---------- */

export function GoldButton({
  label,
  onPress,
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [{ opacity: disabled ? 0.35 : pressed ? 0.85 : 1 }, style]}>
      <LinearGradient colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
        <T v="bold" size={16} color={colors.onGold}>
          {label}
        </T>
        {icon && <Feather name={icon} size={18} color={colors.onGold} />}
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, icon, danger }: { label: string; onPress: () => void; icon?: IconName; danger?: boolean }) {
  const c = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.btn, s.outline, pressed && { opacity: 0.7 }]}>
      {icon && <Feather name={icon} size={17} color={c} />}
      <T v="semibold" size={15} color={c}>
        {label}
      </T>
    </Pressable>
  );
}

/** Botão redondo escuro (sino, voltar...). `glass` = translúcido sobre foto. */
export function IconButton({ icon, onPress, glass, color, badge }: { icon: IconName; onPress?: () => void; glass?: boolean; color?: string; badge?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[s.iconBtn, glass && s.glass]}>
      <Feather name={icon} size={19} color={color ?? colors.text} />
      {badge && <View style={s.badge} />}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipOn]}>
      {icon && <Feather name={icon} size={13} color={active ? colors.goldLight : '#CFCFCF'} />}
      <T v={active ? 'semibold' : 'medium'} size={12} color={active ? colors.goldLight : '#CFCFCF'}>
        {label}
      </T>
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.section}>
      <T v="serif" size={22}>
        {title}
      </T>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <T size={12} color={colors.muted}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style, onPress, highlight }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; highlight?: boolean }) {
  const Comp: any = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} style={[s.card, highlight && { borderColor: colors.gold }, style]}>
      {children}
    </Comp>
  );
}

/** Cabeçalho de tela interna: voltar + título serifado. */
export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: top + 8 }]}>
      <IconButton icon="chevron-left" onPress={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <T v="serif" size={20}>
          {title}
        </T>
        {subtitle ? (
          <T size={12} color={colors.muted} style={{ marginTop: 2 }}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right ?? <View style={{ width: 44 }} />}
    </View>
  );
}

/** Barra inferior fixa (total + botão). */
export function Footer({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return <View style={[s.footer, { paddingBottom: bottom + 18 }]}>{children}</View>;
}

export const Logo = ({ size = 84, ring = true }: { size?: number; ring?: boolean }) => (
  <Image
    source={logo}
    style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring ? 1 : 0, borderColor: 'rgba(200,161,90,0.6)' }}
  />
);

export const Stars = ({ value, size = 12 }: { value: number; size?: number }) => (
  <T size={size} color={colors.gold}>
    {'★'.repeat(Math.round(value))}
    <T size={size} color={colors.dim}>
      {'★'.repeat(5 - Math.round(value))}
    </T>
  </T>
);

const s = StyleSheet.create({
  photoLabelWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  photoLabel: { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  btn: { height: 58, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 22 },
  outline: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, height: 50 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  glass: { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.15)' },
  badge: { position: 'absolute', top: 11, right: 12, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'transparent' },
  chipOn: { backgroundColor: 'rgba(200,161,90,0.12)', borderColor: colors.gold },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: space.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingBottom: 12, gap: 12, backgroundColor: colors.bg },
  footer: { paddingHorizontal: space.gutter, paddingTop: 14, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 16 },
});
