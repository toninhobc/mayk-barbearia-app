import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppointmentRow } from '@/components/cards';
import { Chip, GoldButton, T } from '@/components/ui';
import { mine, useStore, type Appointment } from '@/store';
import { colors, radius, space } from '@/theme';

const CANCEL_LIMIT_H = 2;

export default function Agenda() {
  const { top } = useSafeAreaInsets();
  const { appointments, cancel, startRebook, resetDraft, notifications, toggleNotifications } = useStore();
  const [tab, setTab] = useState<'proximos' | 'historico'>('proximos');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = mine(appointments);
  const upcoming = list
    .filter((a) => a.status === 'agendado' && new Date(a.start) > new Date())
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const history = list
    .filter((a) => !(a.status === 'agendado' && new Date(a.start) > new Date()))
    .sort((a, b) => +new Date(b.start) - +new Date(a.start));

  const rebook = (a: Appointment, reschedule: boolean) => {
    startRebook(a, reschedule);
    router.push({ pathname: '/barbeiro/[id]', params: { id: a.barberId } });
  };

  const canCancel = (a: Appointment) => +new Date(a.start) - Date.now() > CANCEL_LIMIT_H * 3600_000;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: top + 14, paddingHorizontal: space.gutter, paddingBottom: 130 }}>
      <T v="serif" size={32}>
        Meus horários
      </T>

      <View style={s.seg}>
        {(['proximos', 'historico'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.segItem, tab === t && s.segOn]}>
            <T v={tab === t ? 'semibold' : 'medium'} size={13} color={tab === t ? colors.text : colors.muted}>
              {t === 'proximos' ? `Próximos (${upcoming.length})` : 'Histórico'}
            </T>
          </Pressable>
        ))}
      </View>

      {tab === 'proximos' && (
        <>
          {upcoming.length === 0 && (
            <View style={s.empty}>
              <T v="serif" size={20}>
                Nenhum horário marcado
              </T>
              <T size={13} color={colors.muted} style={{ marginTop: 6, marginBottom: 16 }}>
                Escolha um serviço e garanta seu horário.
              </T>
              <GoldButton
                label="Agendar agora"
                onPress={() => {
                  resetDraft();
                  router.push('/servicos');
                }}
              />
            </View>
          )}
          {upcoming.map((a) => (
            <AppointmentRow
              key={a.id}
              a={a}
              footer={
                confirmId === a.id ? (
                  <View style={s.confirm}>
                    <T size={13} color={colors.text} style={{ flex: 1 }}>
                      Cancelar este horário?
                    </T>
                    <Chip label="Voltar" onPress={() => setConfirmId(null)} />
                    <Pressable
                      onPress={() => {
                        cancel(a.id);
                        setConfirmId(null);
                      }}
                      style={s.danger}>
                      <T v="semibold" size={12} color="#fff">
                        Sim, cancelar
                      </T>
                    </Pressable>
                  </View>
                ) : (
                  <View style={s.actions}>
                    <Chip label="Reagendar" icon="refresh-cw" onPress={() => rebook(a, true)} />
                    {canCancel(a) ? (
                      <Chip label="Cancelar" icon="x" onPress={() => setConfirmId(a.id)} />
                    ) : (
                      <T size={11} color={colors.muted}>
                        Cancelamento só até {CANCEL_LIMIT_H}h antes
                      </T>
                    )}
                  </View>
                )
              }
            />
          ))}
          {notifications ? (
            <T size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 8 }}>
              Você recebe lembretes 24h e 2h antes do horário.
            </T>
          ) : (
            <Pressable onPress={toggleNotifications} hitSlop={8} style={{ alignSelf: 'center', marginTop: 8 }}>
              <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
                Lembretes desativados.{' '}
                <T v="semibold" size={12} color={colors.gold}>
                  Ativar
                </T>
              </T>
            </Pressable>
          )}
        </>
      )}

      {tab === 'historico' &&
        history.map((a) => (
          <AppointmentRow
            key={a.id}
            a={a}
            footer={
              a.status === 'concluido' ? (
                <View style={s.actions}>
                  <Chip label="Repetir" icon="repeat" onPress={() => rebook(a, false)} />
                </View>
              ) : null
            }
          />
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  seg: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, marginTop: 18, marginBottom: 18, borderWidth: 1, borderColor: colors.line },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.pill },
  segOn: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.gold },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  danger: { backgroundColor: colors.danger, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  empty: { padding: 20, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginBottom: 12 },
});
