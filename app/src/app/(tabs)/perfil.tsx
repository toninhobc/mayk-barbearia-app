import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, T, type IconName } from '@/components/ui';
import { shop } from '@/data/mock';
import { brl } from '@/lib/format';
import { mine, useStore } from '@/store';
import { colors, radius, space } from '@/theme';

const methodName = { pix: 'Pix', cartao: 'Cartão', local: 'Na barbearia' } as const;

function Row({ icon, label, value, onPress, danger }: { icon: IconName; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
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
  const { me, appointments, logout } = useStore();
  const all = mine(appointments);
  const paid = all.filter((a) => a.paid && a.status !== 'cancelado').sort((a, b) => +new Date(b.start) - +new Date(a.start));
  const visits = all.filter((a) => a.status === 'concluido').length;
  const spent = all.filter((a) => a.status === 'concluido').reduce((t, a) => t + a.totalCents, 0);

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
          { v: String(visits), l: 'Visitas' },
          { v: brl(spent).replace(',00', ''), l: 'Investido' },
          { v: 'Luiz F.', l: 'Favorito' },
        ].map((x, i) => (
          <View key={x.l} style={[s.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
            <T v="serif" size={20} color={colors.goldLight}>
              {x.v}
            </T>
            <T size={11} color={colors.muted} style={{ marginTop: 2 }}>
              {x.l}
            </T>
          </View>
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
        <Row icon="calendar" label="Data de aniversário" value="Cadastrar" onPress={() => {}} />
        <Row icon="credit-card" label="Cartões salvos" value="•••• 4242" onPress={() => {}} />
        <Row icon="bell" label="Notificações" value="Ativadas" onPress={() => {}} />
      </View>

      <SectionHeader title="A barbearia" />
      <View style={s.group}>
        <Row icon="clock" label="Horário" value={shop.hours} />
        <Row icon="map-pin" label="Endereço" value={shop.address} onPress={() => Linking.openURL('https://maps.google.com/?q=Mayk+Barbearia+Brasilia')} />
        <Row icon="instagram" label="Instagram" value={shop.instagram} onPress={() => Linking.openURL('https://instagram.com/')} />
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
  sep: { borderTopWidth: 1, borderTopColor: colors.line },
});
