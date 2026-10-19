import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { apptTitle, barberOf, timeOf } from '@/components/cards';
import { Sheet } from '@/components/sheet';
import { Chip, GoldButton, T } from '@/components/ui';
import { barbers, OWNER_ID, SPAN, unitOf, units } from '@/data/mock';
import { barberHours } from '@/lib/availability';
import { brl, hhmm, sameDay, weekdayShort } from '@/lib/format';
import { clientLabel, useStore, type Appointment, type Block } from '@/store';
import { colors, radius, space } from '@/theme';

const DAYS_BACK = 3;
const DAYS_AHEAD = 7;
const reasons = ['Almoço', 'Folga', 'Compromisso'];
const durations: { label: string; minutes: number | 'dia' }[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 h', minutes: 60 },
  { label: '2 h', minutes: 120 },
  { label: 'Dia todo', minutes: 'dia' },
];

const endOf = (iso: string, minutes: number) => {
  const d = new Date(iso);
  return hhmm(d.getHours() * 60 + d.getMinutes() + minutes);
};

const statusOf = (a: Appointment) =>
  a.status === 'cancelado'
    ? { t: 'Cancelado', c: colors.danger }
    : a.status === 'falta'
      ? { t: 'Faltou', c: colors.danger }
      : a.status === 'concluido'
        ? { t: 'Concluído', c: colors.success }
        : a.paid
          ? { t: 'Pago', c: colors.success }
          : { t: 'Pagar no local', c: colors.gold };

export default function PainelAgenda() {
  const { staff, appointments, blocks, accounts, complete, markNoShow, cancel, removeBlock } = useStore();
  const owner = staff?.barberId === OWNER_ID;
  const [filter, setFilter] = useState<string | null>(owner ? null : (staff?.barberId ?? null));
  const [unitF, setUnitF] = useState<string | null>(null); // só o dono: null = todas as unidades
  const [dayIdx, setDayIdx] = useState(DAYS_BACK); // hoje
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_BACK + DAYS_AHEAD + 1 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i - DAYS_BACK);
      return d;
    });
  }, []);
  const day = days[dayIdx];
  // barbeiros em vista: o escolhido, os da unidade escolhida ou todos
  const scope = filter ? [filter] : barbers.filter((b) => !unitF || b.unitId === unitF).map((b) => b.id);
  const closedOn = (d: Date) => scope.every((id) => !barberHours(id, d));
  const closed = closedOn(day);

  const mineFilter = (barberId: string) => scope.includes(barberId);
  const dayAppts = appointments.filter((a) => sameDay(new Date(a.start), day) && mineFilter(a.barberId));
  const dayBlocks = blocks.filter((b) => sameDay(new Date(b.start), day) && mineFilter(b.barberId));
  const items: ({ kind: 'appt'; a: Appointment } | { kind: 'block'; b: Block })[] = [
    ...dayAppts.map((a) => ({ kind: 'appt' as const, a })),
    ...dayBlocks.map((b) => ({ kind: 'block' as const, b })),
  ].sort((x, y) => {
    const sx = x.kind === 'appt' ? x.a.start : x.b.start;
    const sy = y.kind === 'appt' ? y.a.start : y.b.start;
    // cancelados vão para o fim
    const cx = x.kind === 'appt' && x.a.status === 'cancelado' ? 1 : 0;
    const cy = y.kind === 'appt' && y.a.status === 'cancelado' ? 1 : 0;
    return cx - cy || +new Date(sx) - +new Date(sy);
  });

  const active = dayAppts.filter((a) => a.status !== 'cancelado');
  const expected = active.filter((a) => a.status !== 'falta').reduce((t, a) => t + a.totalCents, 0);
  const received = active.filter((a) => a.status === 'concluido').reduce((t, a) => t + a.totalCents, 0);

  // sem unidade escolhida, o dono vê também em qual unidade está cada atendimento
  const who = (barberId: string) => {
    const b = barberOf(barberId);
    return owner && !unitF ? `${b.short} · ${unitOf(b.unitId).name}` : b.short;
  };

  const doComplete = (a: Appointment) => {
    complete(a.id);
    const real = accounts[a.clientName] || a.clientName === useStore.getState().account;
    setToast(real ? `Concluído · ${clientLabel(a.clientName, accounts).split(' ')[0]} ganhou +1 selo` : 'Atendimento concluído');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Dias */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, padding: space.gutter, paddingBottom: 6 }}>
          {days.map((d, i) => {
            const on = i === dayIdx;
            const today = i === DAYS_BACK;
            return (
              <Pressable key={d.toISOString()} onPress={() => setDayIdx(i)} style={[s.day, on && s.dayOn]}>
                <T size={10} v="medium" color={on ? colors.onGold : colors.muted}>
                  {today ? 'HOJE' : weekdayShort(d)}
                </T>
                <T v="semibold" size={18} color={on ? colors.onGold : closedOn(d) ? colors.dim : colors.text}>
                  {d.getDate()}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Unidade e barbeiro (só o dono escolhe) */}
        {owner && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.gutter, paddingTop: 8 }}>
            <Chip label="Todas as unidades" icon="map-pin" active={!unitF} onPress={() => { setUnitF(null); setFilter(null); }} />
            {units.map((u) => (
              <Chip key={u.id} label={u.name} active={unitF === u.id} onPress={() => { setUnitF(u.id); setFilter(null); }} />
            ))}
          </ScrollView>
        )}
        {owner && unitF && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.gutter, paddingTop: 8 }}>
            <Chip label="Todos" active={!filter} onPress={() => setFilter(null)} />
            {barbers.filter((b) => b.unitId === unitF).map((b) => (
              <Chip key={b.id} label={b.short} active={filter === b.id} onPress={() => setFilter(b.id)} />
            ))}
          </ScrollView>
        )}

        <View style={{ paddingHorizontal: space.gutter }}>
          {/* Resumo do dia */}
          <View style={s.stats}>
            {[
              { v: String(active.length), l: 'Atendimentos' },
              { v: brl(expected).replace(',00', ''), l: 'Previsto' },
              { v: brl(received).replace(',00', ''), l: 'Recebido' },
            ].map((x, i) => (
              <View key={x.l} style={[s.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
                <T v="serif" size={20} color={colors.goldLight} numberOfLines={1} adjustsFontSizeToFit>
                  {x.v}
                </T>
                <T size={11} color={colors.muted} style={{ marginTop: 2 }}>
                  {x.l}
                </T>
              </View>
            ))}
          </View>

          <View style={s.listHead}>
            <T v="serif" size={22}>
              {day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}
            </T>
            {!closed && (
              <Pressable onPress={() => setBlocking(true)} hitSlop={8} style={({ pressed }) => [s.blockBtn, pressed && { opacity: 0.7 }]}>
                <Feather name="slash" size={14} color={colors.gold} />
                <T v="semibold" size={12} color={colors.gold}>
                  Bloquear
                </T>
              </Pressable>
            )}
          </View>

          {closed && (
            <T color={colors.muted} style={{ marginTop: 6 }}>
              {owner && !unitF && !filter ? 'Todas as unidades fechadas neste dia.' : 'Unidade fechada neste dia.'}
            </T>
          )}
          {!closed && items.length === 0 && (
            <T color={colors.muted} style={{ marginTop: 6 }}>
              Nenhum atendimento neste dia.
            </T>
          )}

          {items.map((it) => {
            if (it.kind === 'block') {
              const b = it.b;
              return (
                <View key={b.id} style={[s.card, s.blockCard]}>
                  <View style={s.time}>
                    <T v="semibold" size={14} color={colors.muted}>
                      {timeOf(b.start)}
                    </T>
                    <T size={11} color={colors.dim}>
                      {endOf(b.start, b.minutes)}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="semibold" size={14} color={colors.muted}>
                      Bloqueado · {b.reason}
                    </T>
                    {!filter && (
                      <T size={12} color={colors.dim} style={{ marginTop: 2 }}>
                        {who(b.barberId)}
                      </T>
                    )}
                  </View>
                  <Chip label="Liberar" icon="unlock" onPress={() => removeBlock(b.id)} />
                </View>
              );
            }
            const a = it.a;
            const st = statusOf(a);
            const open = a.status === 'agendado';
            const name = clientLabel(a.clientName, accounts);
            return (
              <View key={a.id} style={[s.card, !open && a.status !== 'concluido' && { opacity: 0.55 }]}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={s.time}>
                    <T v="semibold" size={14}>
                      {timeOf(a.start)}
                    </T>
                    <T size={11} color={colors.muted}>
                      {endOf(a.start, a.minutes)}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="semibold" size={15} numberOfLines={1}>
                      {name}
                    </T>
                    <T size={12} color={colors.muted} style={{ marginTop: 2 }} numberOfLines={2}>
                      {apptTitle(a)}
                      {!filter ? ` · ${who(a.barberId)}` : ''}
                    </T>
                    {a.reward && (
                      <T size={11} color={colors.goldLight} style={{ marginTop: 3 }}>
                        Corte grátis do Clube Dom Cabral
                      </T>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="semibold" size={14}>
                      {brl(a.totalCents)}
                    </T>
                    <T v="medium" size={11} color={st.c} style={{ marginTop: 3 }}>
                      {st.t}
                    </T>
                  </View>
                </View>

                {open &&
                  (confirmId === a.id ? (
                    <View style={s.actions}>
                      <T size={12} style={{ flex: 1 }}>
                        Cancelar e avisar o cliente?
                      </T>
                      <Chip label="Voltar" onPress={() => setConfirmId(null)} />
                      <Pressable
                        onPress={() => {
                          cancel(a.id, true);
                          setConfirmId(null);
                          setToast('Horário cancelado · cliente avisado');
                        }}
                        style={s.danger}>
                        <T v="semibold" size={12} color="#fff">
                          Sim, cancelar
                        </T>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={s.actions}>
                      <Pressable onPress={() => doComplete(a)} style={({ pressed }) => [s.done, pressed && { opacity: 0.8 }]}>
                        <Feather name="check" size={14} color={colors.onGold} />
                        <T v="semibold" size={12} color={colors.onGold}>
                          {a.paid ? 'Concluir' : 'Concluir e receber'}
                        </T>
                      </Pressable>
                      <Chip label="Faltou" icon="user-x" onPress={() => markNoShow(a.id)} />
                      <Chip label="Cancelar" icon="x" onPress={() => setConfirmId(a.id)} />
                    </View>
                  ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <BlockSheet
        visible={blocking}
        onClose={() => setBlocking(false)}
        day={day}
        barberId={filter ?? scope.find((id) => barberHours(id, day)) ?? scope[0]}
        choices={owner ? scope : []}
      />

      {toast && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={s.toast}>
          <Feather name="check-circle" size={16} color={colors.success} />
          <T size={13} style={{ flex: 1 }}>
            {toast}
          </T>
        </Animated.View>
      )}
    </View>
  );
}

/** Janela para bloquear um período na agenda (almoço, folga...). */
function BlockSheet({ visible, onClose, day, barberId, choices }: { visible: boolean; onClose: () => void; day: Date; barberId: string; choices: string[] }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Bloquear horário">
      {/* montado só com a janela aberta: cada abertura começa do zero */}
      {visible && <BlockForm onDone={onClose} day={day} initialBarber={barberId} choices={choices} />}
    </Sheet>
  );
}

function BlockForm({ onDone, day, initialBarber, choices }: { onDone: () => void; day: Date; initialBarber: string; choices: string[] }) {
  const addBlock = useStore((s) => s.addBlock);
  const [barberId, setBarberId] = useState(initialBarber);
  const [start, setStart] = useState(12 * 60);
  const [duration, setDuration] = useState<number | 'dia'>(60);
  const [reason, setReason] = useState(reasons[0]);
  const [error, setError] = useState<string | null>(null);

  const [open, close] = barberHours(barberId, day) ?? SPAN;
  const slots: number[] = [];
  for (let m = open; m < close; m += 30) slots.push(m);
  const allDay = duration === 'dia';

  const save = () => {
    const from = allDay ? open : Math.max(start, open);
    const minutes = allDay ? close - open : Math.min(duration, close - from);
    const t = new Date(day);
    t.setHours(0, from, 0, 0);
    const err = addBlock({ barberId, start: t.toISOString(), minutes, reason });
    if (err) setError(err);
    else onDone();
  };

  const pick = (fn: () => void) => () => {
    fn();
    setError(null);
  };

  return (
    <>
      {choices.length > 1 && (
        <>
          <T size={12} color={colors.muted} style={s.label}>
            Barbeiro
          </T>
          <View style={s.wrap}>
            {choices.map((id) => (
              <Chip key={id} label={choices.length > 2 ? `${barberOf(id).short} · ${unitOf(barberOf(id).unitId).name}` : barberOf(id).short} active={barberId === id} onPress={pick(() => setBarberId(id))} />
            ))}
          </View>
        </>
      )}

      <T size={12} color={colors.muted} style={s.label}>
        Duração
      </T>
      <View style={s.wrap}>
        {durations.map((d) => (
          <Chip key={d.label} label={d.label} active={duration === d.minutes} onPress={pick(() => setDuration(d.minutes))} />
        ))}
      </View>

      {!allDay && (
        <>
          <T size={12} color={colors.muted} style={s.label}>
            A partir de
          </T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
            {slots.map((m) => (
              <Chip key={m} label={hhmm(m)} active={start === m} onPress={pick(() => setStart(m))} />
            ))}
          </ScrollView>
        </>
      )}

      <T size={12} color={colors.muted} style={s.label}>
        Motivo
      </T>
      <View style={s.wrap}>
        {reasons.map((r) => (
          <Chip key={r} label={r} active={reason === r} onPress={pick(() => setReason(r))} />
        ))}
      </View>

      {error && (
        <T size={12} color={colors.danger} style={{ marginTop: 14, lineHeight: 18 }}>
          {error}
        </T>
      )}
      <GoldButton label="Bloquear" style={{ marginTop: 18 }} onPress={save} />
    </>
  );
}

const s = StyleSheet.create({
  day: { width: 52, height: 62, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  stats: { flexDirection: 'row', marginTop: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12, gap: 12 },
  blockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold },
  card: { padding: 14, marginBottom: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  blockCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderStyle: 'dashed', backgroundColor: 'transparent' },
  time: { width: 46 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  done: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  danger: { backgroundColor: colors.danger, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  label: { marginTop: 16, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toast: { position: 'absolute', left: space.gutter, right: space.gutter, bottom: 104, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
});
