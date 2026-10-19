import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { barberOf } from '@/components/cards';
import { Sheet } from '@/components/sheet';
import { Chip, SectionHeader, Stars, T } from '@/components/ui';
import { barbers, OWNER_ID, services, SPAN, unitOf, units } from '@/data/mock';
import { barberHours } from '@/lib/availability';
import { brl, timeAgo } from '@/lib/format';
import {
  addDays,
  addMonths,
  bucketsOf,
  comparison,
  contains,
  labelOf,
  modes,
  monthGrid,
  rangeOf,
  shift,
  startOfDay,
  startOfMonth,
  type Mode,
  type Range,
} from '@/lib/periods';
import { clientLabel, HISTORY_START, ratedAppointments, shortClient, useStore, type Appointment } from '@/store';
import { colors, radius, space } from '@/theme';

const methodName = { pix: 'Pix', cartao: 'Cartão', local: 'Na barbearia' } as const;
const CHART_H = 130;
const FUTURE_DAYS = 7; // a agenda de exemplo vai até 7 dias à frente
const chartTitle: Record<Mode, string> = { dia: 'Faturamento por hora', semana: 'Faturamento por dia', mes: 'Faturamento por dia', '6m': 'Faturamento por mês' };
const periodWord: Record<Mode, string> = { dia: 'do dia', semana: 'da semana', mes: 'do mês', '6m': 'dos 6 meses' };

const short = (cents: number) => brl(cents).replace(',00', '');
const pct = (n: number) => `${Math.round(n * 100)}%`;
const sum = (list: Appointment[]) => list.reduce((t, a) => t + a.totalCents, 0);
const within = (a: Appointment, r: Range) => {
  const t = +new Date(a.start);
  return t >= +r.from && t < +r.to;
};

export default function Resumo() {
  const { staff, appointments, accounts } = useStore();
  const owner = staff?.barberId === OWNER_ID;
  // "agora" fixo enquanto a tela está aberta (os números não mudam sozinhos)
  const [now] = useState(() => new Date());
  const [mode, setMode] = useState<Mode>('mes');
  const [anchor, setAnchor] = useState(() => startOfDay(now));
  const [sel, setSel] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const [unitF, setUnitF] = useState<string | null>(null); // só o dono: null = rede toda
  const scopeIds = useMemo(
    () => (owner ? barbers.filter((b) => !unitF || b.unitId === unitF).map((b) => b.id) : staff ? [staff.barberId] : []),
    [owner, unitF, staff],
  );
  const closedOn = (d: Date) => scopeIds.every((id) => !barberHours(id, d));

  const range = rangeOf(mode, anchor);
  const limit = mode === 'dia' ? addDays(startOfDay(now), FUTURE_DAYS + 1) : now;
  const canPrev = +rangeOf(mode, shift(mode, anchor, -1)).to > +HISTORY_START;
  const canNext = +rangeOf(mode, shift(mode, anchor, 1)).from < +limit;
  const isCurrent = contains(range, now);

  const go = (m: Mode, a: Date) => {
    let next = startOfDay(a);
    // 6 meses nunca começa antes do histórico nem termina depois do mês atual
    if (m === '6m') {
      const minEnd = addMonths(startOfMonth(HISTORY_START), 5);
      if (+rangeOf(m, next).from < +startOfMonth(HISTORY_START)) next = minEnd;
      if (+startOfMonth(next) > +startOfMonth(now)) next = startOfDay(now);
    }
    setMode(m);
    setAnchor(next);
    setSel(null);
  };

  const data = useMemo(() => {
    const scope = appointments.filter((a) => scopeIds.includes(a.barberId));
    const inRange = scope.filter((a) => within(a, range));
    const done = inRange.filter((a) => a.status === 'concluido');
    const missed = inRange.filter((a) => a.status === 'falta');
    const revenue = sum(done);
    const cmp = comparison(mode, anchor, now);
    const prevRevenue = sum(scope.filter((a) => a.status === 'concluido' && within(a, cmp.prevWin)));
    const pending = inRange.filter((a) => a.status === 'agendado' && +new Date(a.start) >= +now);

    const buckets = bucketsOf(mode, range, Math.floor(SPAN[0] / 60), Math.ceil(SPAN[1] / 60)).map((b) => {
      const list = inRange.filter((a) => within(a, b));
      const ok = list.filter((a) => a.status === 'concluido');
      const future = list.filter((a) => a.status === 'agendado' && +new Date(a.start) >= +now);
      return { ...b, cents: sum(ok), count: ok.length, forecast: sum(future), forecastCount: future.length, isFuture: +b.from > +now };
    });

    // rede toda: ranking por unidade; uma unidade: ranking dos barbeiros dela
    const rank = (id: string, label: string, ids: string[], base: number) => {
      const list = done.filter((a) => ids.includes(a.barberId));
      const rated = inRange.filter((a) => ids.includes(a.barberId) && a.rating);
      const avg = rated.length ? rated.reduce((t, a) => t + a.rating!.stars, 0) / rated.length : base;
      return { id, label, cents: sum(list), count: list.length, avg };
    };
    const ranking = (
      unitF
        ? barbers.filter((b) => b.unitId === unitF).map((b) => rank(b.id, b.short, [b.id], b.rating))
        : units.map((u) => {
            const team = barbers.filter((b) => b.unitId === u.id);
            return rank(u.id, u.name, team.map((b) => b.id), team.reduce((t, b) => t + b.rating, 0) / team.length);
          })
    ).sort((x, y) => y.cents - x.cents);

    const counts = new Map<string, number>();
    done.forEach((a) => a.serviceIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
    const top = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5);

    const pay = (['pix', 'cartao', 'local'] as const).map((m) => ({ m, cents: sum(done.filter((a) => a.method === m)) }));

    return {
      done,
      revenue,
      ticket: done.length ? Math.round(revenue / done.length) : 0,
      noShow: done.length + missed.length ? missed.length / (done.length + missed.length) : 0,
      // sem comparação em período futuro ou ainda sem atendimentos (ex.: hoje cedo, domingo)
      delta: prevRevenue > 0 && +range.from <= +now && !(contains(range, now) && done.length === 0) ? (revenue - prevRevenue) / prevRevenue : null,
      cmpLabel: cmp.label,
      pending,
      buckets,
      ranking,
      top,
      pay,
      reviews: ratedAppointments(inRange).slice(0, 4),
    };
    // range é derivado de mode + anchor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, scopeIds, unitF, mode, anchor, now]);

  const { buckets } = data;
  const max = Math.max(1, ...buckets.map((b) => b.cents + b.forecast));
  // sem seleção: último com atendimento realizado; se não houver, o primeiro com previsto
  const lastDone = [...buckets].reverse().findIndex((b) => b.count > 0);
  const firstForecast = buckets.findIndex((b) => b.forecast > 0);
  const active = sel != null && sel < buckets.length ? sel : lastDone >= 0 ? buckets.length - 1 - lastDone : firstForecast >= 0 ? firstForecast : null;
  const selected = active != null ? buckets[active] : null;
  const rankMax = Math.max(1, ...data.ranking.map((r) => r.cents));
  const topMax = Math.max(1, ...data.top.map((t) => t[1]));
  const label = labelOf(mode, range, now);
  const tickEvery = mode === 'mes' ? 5 : 1;

  return (
    <ScrollView contentContainerStyle={{ padding: space.gutter, paddingBottom: 130 }}>
      <T v="display" size={24}>
        {owner ? (unitF ? `Dom Cabral ${unitOf(unitF).name}` : 'Resumo da rede') : 'Meu desempenho'}
      </T>
      {owner && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginHorizontal: -space.gutter, marginTop: 12 }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.gutter }}>
          <Chip label="Todas as unidades" icon="map-pin" active={!unitF} onPress={() => { setUnitF(null); setSel(null); }} />
          {units.map((u) => (
            <Chip key={u.id} label={u.name} active={unitF === u.id} onPress={() => { setUnitF(u.id); setSel(null); }} />
          ))}
        </ScrollView>
      )}

      {/* Tipo de período */}
      <View style={s.modes}>
        {modes.map((m) => (
          <Pressable key={m.id} onPress={() => go(m.id, anchor)} style={[s.mode, mode === m.id && s.modeOn]}>
            <T v={mode === m.id ? 'semibold' : 'medium'} size={13} color={mode === m.id ? colors.text : colors.muted}>
              {m.label}
            </T>
          </Pressable>
        ))}
      </View>

      {/* Navegador ‹ período › */}
      <View style={s.nav}>
        <Pressable disabled={!canPrev} onPress={() => go(mode, shift(mode, anchor, -1))} hitSlop={10} style={[s.arrow, !canPrev && { opacity: 0.25 }]} accessibilityLabel="Período anterior">
          <Feather name="chevron-left" size={20} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => setPicking(true)} style={({ pressed }) => [s.period, pressed && { opacity: 0.7 }]} accessibilityLabel="Escolher período">
          <Feather name="calendar" size={15} color={colors.gold} />
          <T v="semibold" size={15} numberOfLines={1}>
            {label}
          </T>
        </Pressable>
        <Pressable disabled={!canNext} onPress={() => go(mode, shift(mode, anchor, 1))} hitSlop={10} style={[s.arrow, !canNext && { opacity: 0.25 }]} accessibilityLabel="Próximo período">
          <Feather name="chevron-right" size={20} color={colors.text} />
        </Pressable>
      </View>
      {mode === 'dia' && closedOn(anchor) && (
        <T size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 8 }}>
          {owner && !unitF ? 'Todas as unidades fechadas neste dia.' : 'Unidade fechada neste dia.'}
        </T>
      )}
      {!isCurrent && (
        <Pressable onPress={() => go(mode, now)} hitSlop={8} style={{ alignSelf: 'center', marginTop: 8 }}>
          <T v="semibold" size={12} color={colors.gold}>
            Voltar para {mode === 'dia' ? 'hoje' : mode === 'semana' ? 'esta semana' : 'o período atual'}
          </T>
        </Pressable>
      )}

      {/* Números principais */}
      <View style={s.hero}>
        <T size={12} color={colors.muted}>
          Faturamento {periodWord[mode]}
          {isCurrent ? ' até agora' : ''}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
          <T v="serif" size={36} color={colors.goldLight}>
            {brl(data.revenue)}
          </T>
          {data.delta != null && (
            <View style={[s.delta, { backgroundColor: data.delta >= 0 ? 'rgba(95,191,138,0.12)' : 'rgba(224,106,90,0.12)' }]}>
              <Feather name={data.delta >= 0 ? 'trending-up' : 'trending-down'} size={13} color={data.delta >= 0 ? colors.success : colors.danger} />
              <T v="semibold" size={12} color={data.delta >= 0 ? colors.success : colors.danger}>
                {data.delta >= 0 ? '+' : '−'}
                {pct(Math.abs(data.delta))}
              </T>
            </View>
          )}
        </View>
        {data.delta != null && (
          <T size={11} color={colors.muted} style={{ marginTop: 2 }}>
            em relação a {data.cmpLabel}
          </T>
        )}
        <View style={s.kpis}>
          {[
            { v: String(data.done.length), l: 'Atendimentos' },
            { v: short(data.ticket), l: 'Ticket médio' },
            { v: pct(data.noShow), l: 'Faltas' },
          ].map((k, i) => (
            <View key={k.l} style={[s.kpi, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
              <T v="semibold" size={17}>
                {k.v}
              </T>
              <T size={11} color={colors.muted} style={{ marginTop: 2 }}>
                {k.l}
              </T>
            </View>
          ))}
        </View>
      </View>

      {data.pending.length > 0 && (
        <View style={s.next}>
          <Feather name="clock" size={16} color={colors.gold} />
          <T size={13} style={{ flex: 1 }}>
            Previsto até o fim {periodWord[mode]}:{' '}
            <T v="semibold" size={13}>
              {short(sum(data.pending))}
            </T>{' '}
            · {data.pending.length} agendado{data.pending.length === 1 ? '' : 's'}
          </T>
        </View>
      )}

      {/* Gráfico */}
      <SectionHeader title={chartTitle[mode]} />
      <View style={s.chartBox}>
        <View style={s.info}>
          {selected ? (
            <View style={{ flex: 1 }}>
              <T size={12} color={colors.muted}>
                {selected.full}
              </T>
              <T v="semibold" size={15} style={{ marginTop: 2 }}>
                {selected.count > 0 || !selected.forecast
                  ? `${brl(selected.cents)} · ${selected.count} atendimento${selected.count === 1 ? '' : 's'}`
                  : `Previsto ${brl(selected.forecast)} · ${selected.forecastCount} agendado${selected.forecastCount === 1 ? '' : 's'}`}
              </T>
              {selected.count > 0 && selected.forecast > 0 && (
                <T size={11} color={colors.muted} style={{ marginTop: 2 }}>
                  + previsto {brl(selected.forecast)} ({selected.forecastCount} agendado{selected.forecastCount === 1 ? '' : 's'})
                </T>
              )}
            </View>
          ) : (
            <T size={12} color={colors.muted} style={{ flex: 1 }}>
              Nenhum atendimento concluído neste período.
            </T>
          )}
          {selected && mode !== 'dia' && (selected.count > 0 || selected.forecastCount > 0) && (
            <Pressable onPress={() => go(mode === '6m' ? 'mes' : 'dia', selected.from)} hitSlop={8} style={({ pressed }) => [s.drill, pressed && { opacity: 0.7 }]}>
              <T v="semibold" size={12} color={colors.gold}>
                {mode === '6m' ? 'Ver este mês' : 'Ver este dia'}
              </T>
              <Feather name="chevron-right" size={14} color={colors.gold} />
            </Pressable>
          )}
        </View>
        <View style={[s.chart, { height: CHART_H }]}>
          {buckets.map((b, i) => {
            const h = b.cents ? Math.max(4, (b.cents / max) * CHART_H) : 0;
            const g = b.forecast ? Math.max(4, (b.forecast / max) * CHART_H) : 0;
            const on = i === active;
            const dim = active != null && !on ? 0.5 : 1;
            return (
              <Pressable
                key={b.key}
                onPress={() => setSel(i)}
                accessibilityLabel={`${b.full}: ${brl(b.cents)}${b.forecast ? `, previsto ${brl(b.forecast)}` : ''}`}
                style={[s.col, { paddingHorizontal: buckets.length > 20 ? 1 : buckets.length > 8 ? 3 : 10 }]}>
                {/* previsto (agendados) por cima do realizado */}
                {g > 0 && <View style={[s.ghost, { height: g, opacity: dim }]} />}
                {h > 0 && <View style={[s.bar, { height: h, backgroundColor: on ? colors.goldLight : colors.gold, opacity: dim }, g > 0 && s.barStacked]} />}
              </Pressable>
            );
          })}
        </View>
        <View style={s.axis}>
          {buckets.map((b, i) => (
            <T key={b.key} size={9} color={i === active ? colors.text : colors.muted} style={s.tick} numberOfLines={1}>
              {i % tickEvery === 0 || i === buckets.length - 1 ? b.label : ''}
            </T>
          ))}
        </View>
        {buckets.some((b) => b.forecast > 0) && (
          <View style={s.legend}>
            <View style={[s.swatch, { backgroundColor: colors.gold }]} />
            <T size={11} color={colors.muted}>
              Realizado
            </T>
            <View style={[s.swatch, s.ghost, { marginLeft: 12 }]} />
            <T size={11} color={colors.muted}>
              Previsto (agendados)
            </T>
          </View>
        )}
      </View>

      {/* Ranking */}
      {owner && (
        <>
          <SectionHeader title={unitF ? 'Barbeiros' : 'Unidades'} />
          <View style={s.box}>
            {data.ranking.map((r, i) => (
              <View key={r.id} style={[s.rankRow, i > 0 && s.sep]}>
                <T v="semibold" size={13} color={colors.muted} style={{ width: 18 }}>
                  {i + 1}
                </T>
                <View style={{ flex: 1 }}>
                  <View style={s.rankTop}>
                    <T v="semibold" size={14}>
                      {r.label}
                    </T>
                    <T v="semibold" size={14}>
                      {short(r.cents)}
                    </T>
                  </View>
                  <View style={s.track}>
                    <View style={[s.fill, { width: `${(r.cents / rankMax) * 100}%` }]} />
                  </View>
                  <T size={11} color={colors.muted} style={{ marginTop: 4 }}>
                    {r.count} atendimentos · ★ {r.avg.toFixed(1)}
                  </T>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Serviços */}
      <SectionHeader title="Mais vendidos" />
      <View style={s.box}>
        {data.top.length === 0 && (
          <T size={13} color={colors.muted}>
            Sem atendimentos no período.
          </T>
        )}
        {data.top.map(([id, n], i) => (
          <View key={id} style={[{ paddingVertical: 8 }, i > 0 && s.sep]}>
            <View style={s.rankTop}>
              <T size={13}>{services.find((x) => x.id === id)?.name}</T>
              <T v="semibold" size={13}>
                {n}
              </T>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${(n / topMax) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Pagamentos */}
      <SectionHeader title="Formas de pagamento" />
      <View style={s.box}>
        {data.pay.map((p, i) => (
          <View key={p.m} style={[{ paddingVertical: 8 }, i > 0 && s.sep]}>
            <View style={s.rankTop}>
              <T size={13}>{methodName[p.m]}</T>
              <T size={13} color={colors.muted}>
                <T v="semibold" size={13}>
                  {data.revenue ? pct(p.cents / data.revenue) : '0%'}
                </T>{' '}
                · {short(p.cents)}
              </T>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${data.revenue ? (p.cents / data.revenue) * 100 : 0}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Avaliações */}
      <SectionHeader title="Avaliações do período" />
      {data.reviews.length === 0 && (
        <T size={13} color={colors.muted}>
          Nenhuma avaliação neste período.
        </T>
      )}
      {data.reviews.map((a) => (
        <View key={a.id} style={[s.box, { marginBottom: 10 }]}>
          <View style={s.rankTop}>
            <T v="semibold" size={14}>
              {shortClient(clientLabel(a.clientName, accounts))}
            </T>
            <T size={11} color={colors.muted}>
              {timeAgo(a.rating!.at)}
            </T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Stars value={a.rating!.stars} />
            {owner && (
              <T size={11} color={colors.muted}>
                com {barberOf(a.barberId).short}
                {unitF ? '' : ` · ${unitOf(barberOf(a.barberId).unitId).name}`}
              </T>
            )}
          </View>
          {!!a.rating!.text && (
            <T size={13} color="#CDBFA8" style={{ marginTop: 6, lineHeight: 19 }}>
              {a.rating!.text}
            </T>
          )}
          {a.rating!.tags.length > 0 && (
            <T size={11} color={colors.goldLight} style={{ marginTop: 6 }}>
              {a.rating!.tags.join(' · ')}
            </T>
          )}
        </View>
      ))}

      <PeriodPicker visible={picking} onClose={() => setPicking(false)} mode={mode} anchor={anchor} now={now} closedOn={closedOn} onPick={(d) => go(mode, d)} />
    </ScrollView>
  );
}

/** Calendário: dia (Dia/Semana) ou mês (Mês/6 meses). */
function PeriodPicker({
  visible,
  onClose,
  mode,
  anchor,
  now,
  closedOn,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
  anchor: Date;
  now: Date;
  closedOn: (d: Date) => boolean;
  onPick: (d: Date) => void;
}) {
  const byMonth = mode === 'mes' || mode === '6m';
  return (
    <Sheet visible={visible} onClose={onClose} title={byMonth ? 'Escolher mês' : mode === 'semana' ? 'Escolher semana' : 'Escolher dia'}>
      {visible &&
        (byMonth ? (
          <MonthList
            now={now}
            anchor={anchor}
            onPick={(d) => {
              onPick(d);
              onClose();
            }}
          />
        ) : (
          <DayGrid
            mode={mode}
            closedOn={closedOn}
            now={now}
            anchor={anchor}
            onPick={(d) => {
              onPick(d);
              onClose();
            }}
          />
        ))}
    </Sheet>
  );
}

function MonthList({ now, anchor, onPick }: { now: Date; anchor: Date; onPick: (d: Date) => void }) {
  const months: Date[] = [];
  for (let m = startOfMonth(HISTORY_START); +m <= +startOfMonth(now); m = addMonths(m, 1)) months.push(m);
  return (
    <View style={s.months}>
      {months.reverse().map((m) => {
        const on = +m === +startOfMonth(anchor);
        const name = m.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return (
          <Pressable key={m.toISOString()} onPress={() => onPick(m)} style={[s.monthCell, on && s.cellOn]}>
            <T v={on ? 'semibold' : 'medium'} size={14} color={on ? colors.onGold : colors.text}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

function DayGrid({ mode, now, anchor, closedOn, onPick }: { mode: Mode; now: Date; anchor: Date; closedOn: (d: Date) => boolean; onPick: (d: Date) => void }) {
  const [month, setMonth] = useState(() => startOfMonth(anchor));
  const first = startOfMonth(HISTORY_START);
  const today = startOfDay(now);
  const last = mode === 'dia' ? addDays(today, FUTURE_DAYS) : today;
  const sel = rangeOf(mode, anchor);
  const title = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const canPrev = +month > +first;
  const canNext = +addMonths(month, 1) <= +last;

  return (
    <View>
      <View style={s.calHead}>
        <Pressable disabled={!canPrev} onPress={() => setMonth(addMonths(month, -1))} hitSlop={10} style={!canPrev && { opacity: 0.25 }} accessibilityLabel="Mês anterior">
          <Feather name="chevron-left" size={20} color={colors.text} />
        </Pressable>
        <T v="semibold" size={15}>
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </T>
        <Pressable disabled={!canNext} onPress={() => setMonth(addMonths(month, 1))} hitSlop={10} style={!canNext && { opacity: 0.25 }} accessibilityLabel="Próximo mês">
          <Feather name="chevron-right" size={20} color={colors.text} />
        </Pressable>
      </View>
      <View style={s.grid}>
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
          <T key={i} size={11} color={colors.muted} style={s.wd}>
            {d}
          </T>
        ))}
        {monthGrid(month).map((d, i) => {
          if (!d) return <View key={`e${i}`} style={s.cell} />;
          const off = +d < +HISTORY_START || +d > +last || (mode === 'dia' && closedOn(d));
          const on = contains(sel, d);
          const isToday = +d === +today;
          return (
            <Pressable key={d.toISOString()} disabled={off} onPress={() => onPick(d)} style={[s.cell, on && s.cellOn, mode === 'semana' && on && s.weekOn]}>
              <T v={on || isToday ? 'semibold' : 'regular'} size={14} color={on ? colors.onGold : off ? colors.dim : isToday ? colors.goldLight : colors.text}>
                {d.getDate()}
              </T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  modes: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, marginTop: 14, borderWidth: 1, borderColor: colors.line },
  mode: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.pill },
  modeOn: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.gold },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  arrow: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  period: { flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 },
  hero: { marginTop: 16, padding: 18, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(190,154,41,0.28)' },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  kpis: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.line },
  kpi: { flex: 1, alignItems: 'center' },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  chartBox: { padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 40 },
  drill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold },
  chart: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barStacked: { borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 2 },
  ghost: { backgroundColor: 'rgba(216,184,90,0.12)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(216,184,90,0.7)', borderBottomWidth: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', marginTop: 6 },
  tick: { flex: 1, textAlign: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  box: { padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rankTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, marginTop: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.gold },
  sep: { borderTopWidth: 1, borderTopColor: colors.line },
  months: { gap: 8 },
  monthCell: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  wd: { width: `${100 / 7}%`, textAlign: 'center', paddingVertical: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  weekOn: { borderRadius: 8 },
});
