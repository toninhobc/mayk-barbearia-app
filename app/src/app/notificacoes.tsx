import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

function NoticeRow({ n, onPress }: { n: Notice; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, !n.read && s.unread, pressed && { opacity: 0.7 }]}>
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
    </Pressable>
  );
}

export default function Notificacoes() {
  const { inbox, markRead, markAllRead, notifications, toggleNotifications } = useStore();
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
              <NoticeRow key={n.id} n={n} onPress={() => open(n)} />
            ))}
          </>
        )}

        {read.length > 0 && (
          <>
            <T v="semibold" size={12} color={colors.muted} style={s.group}>
              ANTERIORES
            </T>
            {read.map((n) => (
              <NoticeRow key={n.id} n={n} onPress={() => open(n)} />
            ))}
          </>
        )}

        {sorted.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 80, gap: 12 }}>
            <Feather name="bell" size={32} color={colors.dim} />
            <T color={colors.muted}>Nenhuma notificação por aqui.</T>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  group: { letterSpacing: 1.6, marginTop: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, marginBottom: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  unread: { borderColor: 'rgba(200,161,90,0.35)', backgroundColor: '#17140F' },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginTop: 6 },
  off: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 6, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.gold },
});
