import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { barberOf } from '@/components/cards';
import { Chip, SectionHeader, Stars, T } from '@/components/ui';
import { barbers, OWNER_ID, services, shop } from '@/data/mock';
import { brl, timeAgo } from '@/lib/format';
import { clientLabel, ratedAppointments, shortClient, useStore, type Appointment } from '@/store';
import { colors, radius, space } from '@/theme';

type Period = 1 | 7 | 30;
const periods: { label: string; days: Period }[] = [
  { label: 'Hoje', days: 1 },
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
];
const methodName = { pix: 'Pix', cartao: 'Cartão', local: 'Na barbearia' } as const;
const CHART_H = 120;

const short = (cents: number) => brl(cents).replace(',00', '');
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function Resumo() {
  const { staff, appointments, accounts } = useStore();
  const owner = staff?.barberId === OWNER_ID;
  const [days, setDays] = useState<Period>(7);
  const [sel, setSel] = useState<number | null>(null);

  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const scope = appointments.filter((a) => owner || a.barberId === staff?.barberId);
  const inRange = scope.filter((a) => {
    const t = +new Date(a.start);
    return t >= +from && t <= +to;
  });
  const done = inRange.filter((a) => a.status === 'concluido');
  const missed = inRange.filter((a) => a.status === 'falta');
  const revenue = done.reduce((t, a) => t + a.totalCents, 0);
  const ticket = done.length ? Math.round(revenue / done.length) : 0;
  const noShow = done.length + missed.length ? missed.length / (done.length + missed.length) : 0;
  const week = +now + 7 * 86400000;
  const upcoming = scope.filter((a) => a.status === 'agendado' && +new Date(a.start) > +now && +new Date(a.start) <= week);

  // Barras: por hora (hoje) ou por dia
  const buckets: { key: string; label: string; full: string; cents: number; count: number }[] = [];
  if (days === 1) {
    for (let h = shop.openMinutes / 60; h < shop.closeMinutes / 60; h++) {
      const list = done.filter((a) => new Date(a.start).getHours() === h);
      buckets.push({ key: `h${h}`, label: `${h}h`, full: `${h}h às ${h + 1}h`, cents: list.reduce((t, a) => t + a.totalCents, 0), count: list.length });
    }
  } else {
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const list = done.filter((a) => new Date(a.start).toDateString() === d.toDateString());
      buckets.push({
        key: d.toDateString(),
        label: days === 7 ? d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3) : String(d.getDate()),
        full: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', ''),
        cents: list.reduce((t, a) => t + a.totalCents, 0),
        count: list.length,
      });
    }
  }
  const max = Math.max(1, ...buckets.map((b) => b.cents));
  const lastWithData = [...buckets].reverse().findIndex((b) => b.count > 0);
  const active = sel != null && sel < buckets.length ? sel : lastWithData >= 0 ? buckets.length - 1 - lastWithData : null;
  const selected = active != null ? buckets[active] : null;

  // Ranking de barbeiros (dono)
  const ranking = barbers
    .map((b) => {
      const list = done.filter((a) => a.barberId === b.id);
      const rated = ratedAppointments(inRange, b.id);
      const avg = rated.length ? rated.reduce((t, a) => t + a.rating!.stars, 0) / rated.length : b.rating;
      return { b, cents: list.reduce((t, a) => t + a.totalCents, 0), count: list.length, avg };
    })
    .sort((x, y) => y.cents - x.cents);
  const rankMax = Math.max(1, ...ranking.map((r) => r.cents));

  // Serviços mais vendidos
  const counts = new Map<string, number>();
  done.forEach((a) => a.serviceIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
  const top = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5);
  const topMax = Math.max(1, ...top.map((t) => t[1]));

  // Pagamentos
  const pay = (['pix', 'cartao', 'local'] as const).map((m) => {
    const list = done.filter((a) => a.method === m);
    return { m, cents: list.reduce((t, a) => t + a.totalCents, 0) };
  });

  const reviews = ratedAppointments(scope).slice(0, 4);

  return (
    <ScrollView contentContainerStyle={{ padding: space.gutter, paddingBottom: 130 }}>
      <T v="serif" size={28}>
        {owner ? 'Resumo da casa' : 'Meu desempenho'}
      </T>
      <View style={s.periods}>
        {periods.map((p) => (
          <Chip
            key={p.days}
            label={p.label}
            active={days === p.days}
            onPress={() => {
              setDays(p.days);
              setSel(null);
            }}
          />
        ))}
      </View>

      {/* Números principais */}
      <View style={s.hero}>
        <T size={12} color={colors.muted}>
          Faturamento {days === 1 ? 'de hoje' : `dos últimos ${days} dias`}
        </T>
        <T v="serif" size={38} color={colors.goldLight} style={{ marginTop: 4 }}>
          {brl(revenue)}
        </T>
        <View style={s.kpis}>
          {[
            { v: String(done.length), l: 'Atendimentos' },
            { v: short(ticket), l: 'Ticket médio' },
            { v: pct(noShow), l: 'Faltas' },
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

      <View style={s.next}>
        <Feather name="calendar" size={16} color={colors.gold} />
        <T size={13} style={{ flex: 1 }}>
          Próximos 7 dias:{' '}
          <T v="semibold" size={13}>
            {upcoming.length} agendados
          </T>{' '}
          · {short(upcoming.reduce((t, a) => t + a.totalCents, 0))} previstos
        </T>
      </View>

      {/* Gráfico */}
      <SectionHeader title={days === 1 ? 'Faturamento por hora' : 'Faturamento por dia'} />
      <View style={s.chartBox}>
        <View style={{ minHeight: 36 }}>
          {selected ? (
            <>
              <T size={12} color={colors.muted}>
                {selected.full}
              </T>
              <T v="semibold" size={15} style={{ marginTop: 2 }}>
                {brl(selected.cents)} · {selected.count} atendimento{selected.count === 1 ? '' : 's'}
              </T>
            </>
          ) : (
            <T size={12} color={colors.muted}>
              Nenhum atendimento concluído no período.
            </T>
          )}
        </View>
        <View style={[s.chart, { height: CHART_H }]}>
          {buckets.map((b, i) => {
            const h = b.cents ? Math.max(4, (b.cents / max) * CHART_H) : 0;
            const on = i === active;
            return (
              <Pressable
                key={b.key}
                onPress={() => setSel(i)}
                accessibilityLabel={`${b.full}: ${brl(b.cents)}`}
                style={[s.col, { paddingHorizontal: days === 30 ? 1 : days === 7 ? 10 : 4 }]}>
                <View style={[s.bar, { height: h, backgroundColor: on ? colors.goldLight : colors.gold, opacity: active == null || on ? 1 : 0.55 }]} />
              </Pressable>
            );
          })}
        </View>
        <View style={s.axis}>
          {buckets.map((b, i) => (
            <T key={b.key} size={9} color={i === active ? colors.text : colors.muted} style={s.tick} numberOfLines={1}>
              {/* com 30 dias, só alguns rótulos para não amontoar */}
              {days !== 30 || i % 5 === 0 || i === buckets.length - 1 ? b.label : ''}
            </T>
          ))}
        </View>
      </View>

      {/* Ranking */}
      {owner && (
        <>
          <SectionHeader title="Barbeiros" />
          <View style={s.box}>
            {ranking.map((r, i) => (
              <View key={r.b.id} style={[s.rankRow, i > 0 && s.sep]}>
                <T v="semibold" size={13} color={colors.muted} style={{ width: 18 }}>
                  {i + 1}
                </T>
                <View style={{ flex: 1 }}>
                  <View style={s.rankTop}>
                    <T v="semibold" size={14}>
                      {r.b.short}
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
        {top.length === 0 && (
          <T size={13} color={colors.muted}>
            Sem atendimentos no período.
          </T>
        )}
        {top.map(([id, n], i) => (
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
        {pay.map((p, i) => (
          <View key={p.m} style={[{ paddingVertical: 8 }, i > 0 && s.sep]}>
            <View style={s.rankTop}>
              <T size={13}>{methodName[p.m]}</T>
              <T size={13} color={colors.muted}>
                <T v="semibold" size={13}>
                  {revenue ? pct(p.cents / revenue) : '0%'}
                </T>{' '}
                · {short(p.cents)}
              </T>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${revenue ? (p.cents / revenue) * 100 : 0}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Avaliações */}
      <SectionHeader title="Avaliações recentes" />
      {reviews.length === 0 && (
        <T size={13} color={colors.muted}>
          Nenhuma avaliação ainda.
        </T>
      )}
      {reviews.map((a: Appointment) => (
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
              </T>
            )}
          </View>
          {!!a.rating!.text && (
            <T size={13} color="#BDBDBD" style={{ marginTop: 6, lineHeight: 19 }}>
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
    </ScrollView>
  );
}

const s = StyleSheet.create({
  periods: { flexDirection: 'row', gap: 8, marginTop: 14 },
  hero: { marginTop: 18, padding: 18, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(200,161,90,0.28)' },
  kpis: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.line },
  kpi: { flex: 1, alignItems: 'center' },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  chartBox: { padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  chart: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', marginTop: 6 },
  tick: { flex: 1, textAlign: 'center' },
  box: { padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rankTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, marginTop: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.gold },
  sep: { borderTopWidth: 1, borderTopColor: colors.line },
});
