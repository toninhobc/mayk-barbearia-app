import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarberCard, NextAppointmentCard, ServiceRow } from '@/components/cards';
import { Chip, GoldButton, IconButton, SectionHeader, T } from '@/components/ui';
import { UserAvatar } from '@/components/user-avatar';
import { barbers, popular, services } from '@/data/mock';
import { mine, useStore } from '@/store';
import { colors, radius, space } from '@/theme';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia,' : h < 18 ? 'Boa tarde,' : 'Boa noite,';
};

export default function Inicio() {
  const { top } = useSafeAreaInsets();
  const { me, appointments, points, favorites, draft, notifications, inbox, resetDraft, setBarber, toggleService, startRebook } = useStore();

  const next = mine(appointments)
    .filter((a) => a.status === 'agendado' && new Date(a.start) > new Date())
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0];

  const sortedBarbers = [...barbers].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));

  const openBarber = (id: string) => {
    resetDraft();
    setBarber(id);
    router.push({ pathname: '/barbeiro/[id]', params: { id } });
  };

  const addService = (id: string) => {
    if (!draft.serviceIds.length) resetDraft();
    toggleService(id);
    router.push('/servicos');
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: top + 10, paddingHorizontal: space.gutter, paddingBottom: 130 }}>
      {/* Topo */}
      <View style={s.top}>
        <Pressable onPress={() => router.navigate('/perfil')} accessibilityLabel="Abrir perfil">
          <UserAvatar size={44} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <T size={12} color={colors.muted}>
            {greeting()}
          </T>
          <T v="semibold" size={16}>
            {me.name.split(' ')[0]}
          </T>
        </View>
        <IconButton icon={notifications ? 'bell' : 'bell-off'} badge={inbox.some((n) => !n.read)} onPress={() => router.push('/notificacoes')} />
      </View>

      {/* Próximo horário ou chamada para agendar */}
      <View style={{ marginTop: 20 }}>
        {next ? (
          <NextAppointmentCard
            a={next}
            actions={
              <>
                <Chip
                  label="Reagendar"
                  icon="refresh-cw"
                  onPress={() => {
                    startRebook(next, true);
                    router.push({ pathname: '/barbeiro/[id]', params: { id: next.barberId } });
                  }}
                />
                <Chip label="Como chegar" icon="map-pin" onPress={() => Linking.openURL('https://maps.google.com/?q=Mayk+Barbearia+Brasilia')} />
                {next.paid && <Chip label="Pago via Pix" icon="check" />}
              </>
            }
          />
        ) : (
          <View style={s.empty}>
            <T v="serif" size={22}>
              Hora de dar um trato?
            </T>
            <T size={13} color={colors.muted} style={{ marginVertical: 10 }}>
              Você não tem horários marcados.
            </T>
            <GoldButton
              label="Agendar horário"
              onPress={() => {
                resetDraft();
                router.push('/servicos');
              }}
            />
          </View>
        )}
      </View>

      {/* Barbeiros */}
      <SectionHeader title="Barbeiros" action="Ver todos" onAction={() => router.push('/barbeiros')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.gutter }} contentContainerStyle={{ gap: 12, paddingHorizontal: space.gutter }}>
        {sortedBarbers.map((b) => (
          <BarberCard key={b.id} b={b} selected={favorites.includes(b.id)} onPress={() => openBarber(b.id)} />
        ))}
      </ScrollView>

      {/* Serviços */}
      <SectionHeader
        title="Serviços"
        action="Ver todos"
        onAction={() => {
          resetDraft();
          router.push('/servicos');
        }}
      />
      {services.filter((sv) => popular.includes(sv.id)).map((sv) => (
        <ServiceRow key={sv.id} sv={sv} on={draft.serviceIds.includes(sv.id)} onPress={() => addService(sv.id)} />
      ))}

      {/* Fidelidade */}
      <Pressable style={s.loyal} onPress={() => router.navigate('/fidelidade')}>
        <View style={s.loyalIcon}>
          <Feather name="gift" size={20} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="semibold" size={14}>
            Faltam {10 - points} cortes para um grátis
          </T>
          <View style={s.track}>
            <View style={[s.fill, { width: `${points * 10}%` }]} />
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.muted} />
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  empty: { borderRadius: 24, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(200,161,90,0.28)' },
  loyal: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  loyalIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: colors.gold, borderRadius: 3 },
});
