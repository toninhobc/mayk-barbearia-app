import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Header, T, type IconName } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useStore, type Notice, type NoticeKind } from '@/store';
import { colors, radius, space } from '@/theme';

const icons: Record<NoticeKind, IconName> = {
  lembrete: 'clock',
  agendamento: 'calendar',
  pagamento: 'check-circle',
  fidelidade: 'gift',
  promo: 'tag',
  avaliacao: 'star',
};

function NoticeRow({ n }: { n: Notice }) {
  return (
    <View style={[s.row, !n.read && s.unread]}>
      <View style={s.icon}>
        <Feather name={icons[n.kind]} size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T v={n.read ? 'medium' : 'semibold'} size={15} style={{ flex: 1 }}>
            {n.title}
          </T>
          <T size={11} color={colors.muted}>
            {timeAgo(n.at)}
          </T>
        </View>
        <T size={13} color={n.read ? colors.muted : '#CFCFCF'} style={{ marginTop: 4, lineHeight: 19 }}>
          {n.body}
        </T>
      </View>
      {!n.read && <View style={s.dot} />}
    </View>
  );
}

const DELETE_AT = 110; // px arrastados para apagar

/** Arrastar para a direita apaga (como na central de notificações do celular). */
function SwipeToDelete({ onDelete, onPress, children }: { onDelete: () => void; onPress: () => void; children: ReactNode }) {
  const x = useSharedValue(0);
  const width = useSharedValue(400);
  const pressed = useSharedValue(false);

  const pan = Gesture.Pan()
    .activeOffsetX([-1000, 12]) // só ativa indo para a direita
    .failOffsetY([-12, 12]) // deixa a rolagem vertical funcionar
    .onUpdate((e) => {
      x.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (x.value > DELETE_AT || e.velocityX > 900) {
        x.value = withTiming(width.value, { duration: 180 }, () => scheduleOnRN(onDelete));
      } else {
        x.value = withSpring(0, { damping: 18 });
      }
    });

  // toque e arraste competem: se o dedo andar, vale o arraste e o toque é cancelado
  const tap = Gesture.Tap()
    .maxDistance(10)
    .onBegin(() => {
      pressed.value = true;
    })
    .onFinalize((_e, success) => {
      pressed.value = false;
      if (success) scheduleOnRN(onPress);
    });

  const card = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], opacity: pressed.value ? 0.7 : 1 }));
  const behind = useAnimatedStyle(() => ({ opacity: Math.min(1, x.value / DELETE_AT) }));

  return (
    <Animated.View layout={LinearTransition} exiting={FadeOut} onLayout={(e) => (width.value = e.nativeEvent.layout.width)} style={{ marginBottom: 10 }}>
      <Animated.View style={[s.trash, behind]}>
        <Feather name="trash-2" size={18} color={colors.text} />
        <T v="semibold" size={13}>
          Apagar
        </T>
      </Animated.View>
      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <Animated.View accessibilityRole="button" style={card}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export default function Notificacoes() {
  const { inbox, markRead, markAllRead, removeNotice, restoreNotice, notifications, toggleNotifications } = useStore();
  const [removed, setRemoved] = useState<Notice | null>(null);

  // o aviso de "Desfazer" some sozinho depois de alguns segundos
  useEffect(() => {
    if (!removed) return;
    const t = setTimeout(() => setRemoved(null), 4000);
    return () => clearTimeout(t);
  }, [removed]);

  const remove = (n: Notice) => {
    removeNotice(n.id);
    setRemoved(n);
  };
  const sorted = [...inbox].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const unread = sorted.filter((n) => !n.read);
  const read = sorted.filter((n) => n.read);

  const open = (n: Notice) => {
    markRead(n.id);
    if (n.href) router.push(n.href as Href);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Notificações"
        subtitle={unread.length ? `${unread.length} não lida${unread.length > 1 ? 's' : ''}` : 'Tudo em dia'}
        right={
          <Pressable onPress={markAllRead} disabled={!unread.length} hitSlop={8} style={{ width: 44, alignItems: 'flex-end' }}>
            <Feather name="check-square" size={20} color={unread.length ? colors.gold : colors.dim} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingTop: 8, paddingBottom: 40 }}>
        {!notifications && (
          <Pressable onPress={toggleNotifications} style={s.off}>
            <Feather name="bell-off" size={18} color={colors.gold} />
            <T size={13} color="#D2D2D2" style={{ flex: 1, lineHeight: 19 }}>
              Os lembretes estão desativados. Toque para ativar.
            </T>
          </Pressable>
        )}

        {unread.length > 0 && (
          <>
            <T v="semibold" size={12} color={colors.gold} style={s.group}>
              NOVAS
            </T>
            {unread.map((n) => (
              <SwipeToDelete key={n.id} onDelete={() => remove(n)} onPress={() => open(n)}>
                <NoticeRow n={n} />
              </SwipeToDelete>
            ))}
          </>
        )}

        {read.length > 0 && (
          <>
            <T v="semibold" size={12} color={colors.muted} style={s.group}>
              ANTERIORES
            </T>
            {read.map((n) => (
              <SwipeToDelete key={n.id} onDelete={() => remove(n)} onPress={() => open(n)}>
                <NoticeRow n={n} />
              </SwipeToDelete>
            ))}
          </>
        )}

        {sorted.length > 0 && (
          <T size={12} color={colors.dim} style={{ textAlign: 'center', marginTop: 8 }}>
            Arraste uma notificação para a direita para apagar.
          </T>
        )}

        {sorted.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 80, gap: 12 }}>
            <Feather name="bell" size={32} color={colors.dim} />
            <T color={colors.muted}>Nenhuma notificação por aqui.</T>
          </View>
        )}
      </ScrollView>

      {removed && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={s.toast}>
          <T size={13} style={{ flex: 1 }}>
            Notificação apagada
          </T>
          <Pressable
            onPress={() => {
              restoreNotice(removed);
              setRemoved(null);
            }}
            hitSlop={10}>
            <T v="semibold" size={13} color={colors.gold}>
              Desfazer
            </T>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  group: { letterSpacing: 1.6, marginTop: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  unread: { borderColor: 'rgba(200,161,90,0.35)', backgroundColor: '#17140F' },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center' },
  trash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 22, borderRadius: radius.md, backgroundColor: colors.danger },
  toast: { position: 'absolute', left: space.gutter, right: space.gutter, bottom: 30, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 15, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginTop: 6 },
  off: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 6, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.gold },
});
