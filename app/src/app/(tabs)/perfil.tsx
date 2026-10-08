import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BirthdaySheet } from '@/components/birthday-sheet';
import { barberOf } from '@/components/cards';
import { Sheet } from '@/components/sheet';
import { OutlineButton, SectionHeader, T, type IconName } from '@/components/ui';
import { shop } from '@/data/mock';
import { birthdayLabel, brl } from '@/lib/format';
import { LOYALTY_GOAL, mine, useStore, type Appointment } from '@/store';
import { colors, radius, space } from '@/theme';

const methodName = { pix: 'Pix', cartao: 'Cartão', local: 'Na barbearia' } as const;

/** Barbeiro com mais atendimentos concluídos (empate: o mais recente). */
function favoriteBarber(done: Appointment[]): string | null {
  const count = new Map<string, { n: number; last: number }>();
  for (const a of done) {
    const c = count.get(a.barberId) ?? { n: 0, last: 0 };
    count.set(a.barberId, { n: c.n + 1, last: Math.max(c.last, +new Date(a.start)) });
  }
  let best: string | null = null;
  for (const [id, c] of count) {
    const b = best ? count.get(best)! : null;
    if (!b || c.n > b.n || (c.n === b.n && c.last > b.last)) best = id;
  }
  return best;
}

function Row({ icon, label, value, onPress, danger }: { icon: IconName; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surface2 }]}>
      <Feather name={icon} size={18} color={danger ? colors.danger : colors.gold} />
      <T v="medium" size={14} color={danger ? colors.danger : colors.text} style={{ flex: 1 }}>
        {label}
      </T>
      {value ? (
        <T size={13} color={colors.muted}>
          {value}
        </T>
      ) : null}
      {onPress && !danger ? <Feather name="chevron-right" size={18} color={colors.dim} /> : null}
    </Pressable>
  );
}

export default function Perfil() {
  const { top } = useSafeAreaInsets();
  const { me, appointments, points, logout, birthday, notifications, toggleNotifications, savedCard, removeCard } = useStore();
  const [sheet, setSheet] = useState<'birthday' | 'cards' | null>(null);
  const all = mine(appointments);
  const paid = all.filter((a) => a.paid && a.status !== 'cancelado').sort((a, b) => +new Date(b.start) - +new Date(a.start));
  const done = all.filter((a) => a.status === 'concluido');
  const favorite = favoriteBarber(done);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: top + 14, paddingHorizontal: space.gutter, paddingBottom: 130 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={s.avatar}>
          <T v="serif" size={36} color={colors.goldLight}>
            {me.name[0]}
          </T>
        </View>
        <T v="serif" size={26} style={{ marginTop: 14 }}>
          {me.name}
        </T>
        <T size={13} color={colors.muted} style={{ marginTop: 4 }}>
          {me.phone} · {me.email}
        </T>
      </View>

      <View style={s.stats}>
        {[
          { v: String(done.length), l: 'Visitas', onPress: () => router.navigate('/agenda') },
          { v: `${points}/${LOYALTY_GOAL}`, l: 'Pontos', onPress: () => router.navigate('/fidelidade') },
          {
            v: favorite ? barberOf(favorite).short : '—',
            l: 'Favorito',
            onPress: favorite ? () => router.push({ pathname: '/barbeiro/[id]', params: { id: favorite } }) : undefined,
          },
        ].map((x, i) => (
          <Pressable
            key={x.l}
            disabled={!x.onPress}
            onPress={x.onPress}
            style={({ pressed }) => [s.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }, pressed && { opacity: 0.6 }]}>
            <T v="serif" size={20} color={colors.goldLight} numberOfLines={1} adjustsFontSizeToFit>
              {x.v}
            </T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
              <T size={11} color={x.onPress ? colors.gold : colors.muted}>
                {x.l}
              </T>
              {x.onPress && <Feather name="chevron-right" size={11} color={colors.gold} />}
            </View>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Pagamentos" />
      <View style={s.group}>
        {paid.slice(0, 4).map((a, i) => (
          <View key={a.id} style={[s.payRow, i > 0 && s.sep]}>
            <View style={{ flex: 1 }}>
              <T v="medium" size={14}>
                {new Date(a.start).toLocaleDateString('pt-BR')}
              </T>
              <T size={12} color={colors.muted}>
                {methodName[a.method]}
              </T>
            </View>
            <T v="semibold" size={14}>
              {brl(a.totalCents)}
            </T>
            <Feather name="file-text" size={16} color={colors.gold} style={{ marginLeft: 12 }} />
          </View>
        ))}
      </View>

      <SectionHeader title="Conta" />
      <View style={s.group}>
        <Row icon="calendar" label="Data de aniversário" value={birthday ? birthdayLabel(birthday) : 'Cadastrar'} onPress={() => setSheet('birthday')} />
        <Row icon="credit-card" label="Cartões salvos" value={savedCard ? `•••• ${savedCard}` : 'Nenhum'} onPress={() => setSheet('cards')} />
        <Row icon={notifications ? 'bell' : 'bell-off'} label="Notificações" value={notifications ? 'Ativadas' : 'Desativadas'} onPress={toggleNotifications} />
      </View>

      <SectionHeader title="A barbearia" />
      <View style={s.group}>
        <Row icon="clock" label="Horário" value={shop.hours} />
        <Row icon="map-pin" label="Endereço" value={shop.address} onPress={() => Linking.openURL('https://maps.google.com/?q=Mayk+Barbearia+Brasilia')} />
        <Row icon="instagram" label="Instagram" value={shop.instagram} onPress={() => Linking.openURL(`https://instagram.com/${shop.instagram.replace('@', '')}`)} />
        <Row icon="message-circle" label="WhatsApp" value="Fale conosco" onPress={() => Linking.openURL('https://wa.me/')} />
      </View>

      <View style={[s.group, { marginTop: 18 }]}>
        <Row
          icon="log-out"
          label="Sair"
          danger
          onPress={() => {
            logout();
            router.replace('/');
          }}
        />
      </View>

      <BirthdaySheet visible={sheet === 'birthday'} onClose={() => setSheet(null)} />
      <Sheet visible={sheet === 'cards'} onClose={() => setSheet(null)} title="Cartões salvos">
        {savedCard ? (
          <>
            <View style={s.card}>
              <Feather name="credit-card" size={20} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <T v="semibold" size={15}>
                  Mastercard •••• {savedCard}
                </T>
                <T size={12} color={colors.muted} style={{ marginTop: 2 }}>
                  Usado no pagamento por cartão
                </T>
              </View>
            </View>
            <OutlineButton label="Remover cartão" icon="trash-2" danger onPress={removeCard} />
          </>
        ) : (
          <T size={13} color={colors.muted} style={{ lineHeight: 19 }}>
            Nenhum cartão salvo. Você pode salvar um cartão ao pagar um agendamento.
          </T>
        )}
      </Sheet>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', marginTop: 22, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center' },
  group: { borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 14, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  sep: { borderTopWidth: 1, borderTopColor: colors.line },
});
