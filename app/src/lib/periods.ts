/** Períodos do resumo do painel: dia, semana (seg–dom), mês civil e 6 meses. */
export type Mode = 'dia' | 'semana' | 'mes' | '6m';
/** Intervalo [from, to): `to` não entra. */
export type Range = { from: Date; to: Date };

export const modes: { id: Mode; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
  { id: '6m', label: '6 meses' },
];

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const startOfMonth = (d: Date) => {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
};
export const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  return x;
};
/** Segunda-feira da semana. */
export const startOfWeek = (d: Date) => {
  const x = startOfDay(d);
  return addDays(x, -((x.getDay() + 6) % 7));
};

export const rangeOf = (mode: Mode, anchor: Date): Range => {
  switch (mode) {
    case 'dia': {
      const from = startOfDay(anchor);
      return { from, to: addDays(from, 1) };
    }
    case 'semana': {
      const from = startOfWeek(anchor);
      return { from, to: addDays(from, 7) };
    }
    case 'mes': {
      const from = startOfMonth(anchor);
      return { from, to: addMonths(from, 1) };
    }
    case '6m': {
      const end = addMonths(startOfMonth(anchor), 1);
      return { from: addMonths(end, -6), to: end };
    }
  }
};

/** Âncora do período anterior (-1) ou seguinte (+1). */
export const shift = (mode: Mode, anchor: Date, dir: 1 | -1) =>
  mode === 'dia' ? addDays(anchor, dir) : mode === 'semana' ? addDays(anchor, 7 * dir) : addMonths(anchor, mode === 'mes' ? dir : 6 * dir);

export const contains = (r: Range, d: Date) => +d >= +r.from && +d < +r.to;

const dm = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;

export const labelOf = (mode: Mode, r: Range, now: Date) => {
  const last = addDays(r.to, -1);
  switch (mode) {
    case 'dia': {
      const s = r.from.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
      const today = startOfDay(now);
      if (+r.from === +today) return `Hoje · ${s}`;
      if (+r.from === +addDays(today, -1)) return `Ontem · ${s}`;
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    case 'semana':
      return r.from.getMonth() === last.getMonth()
        ? `${r.from.getDate()} – ${last.getDate()} de ${MONTHS_SHORT[last.getMonth()]}`
        : `${dm(r.from)} – ${dm(last)}`;
    case 'mes': {
      const s = r.from.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    case '6m':
      return r.from.getFullYear() === last.getFullYear()
        ? `${MONTHS_SHORT[r.from.getMonth()]} – ${MONTHS_SHORT[last.getMonth()]} de ${last.getFullYear()}`
        : `${MONTHS_SHORT[r.from.getMonth()]}/${r.from.getFullYear()} – ${MONTHS_SHORT[last.getMonth()]}/${last.getFullYear()}`;
  }
};

/**
 * Janela para comparar com o período anterior. Se o período atual ainda não terminou,
 * compara só o mesmo trecho (ex.: 1–18 de outubro com 1–18 de setembro).
 */
export const comparison = (mode: Mode, anchor: Date, now: Date) => {
  const cur = rangeOf(mode, anchor);
  const prev = rangeOf(mode, shift(mode, anchor, -1));
  const partial = contains(cur, now);
  const curWin: Range = partial ? { from: cur.from, to: now } : cur;
  const elapsed = +curWin.to - +curWin.from;
  const prevWin: Range = partial ? { from: prev.from, to: new Date(Math.min(+prev.from + elapsed, +prev.to)) } : prev;

  let label: string;
  if (mode === 'dia') label = partial ? 'ontem até esta hora' : prev.from.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  else if (mode === 'semana') label = partial ? 'mesmo trecho da semana anterior' : 'semana anterior';
  else if (mode === 'mes')
    label = partial
      ? `1–${new Date(+prevWin.to - 1).getDate()} ${MONTHS_SHORT[prev.from.getMonth()]}`
      : prev.from.toLocaleDateString('pt-BR', { month: 'long' });
  else label = '6 meses anteriores';
  return { curWin, prevWin, partial, label };
};

export type Bucket = { key: string; label: string; full: string; from: Date; to: Date };

/** Fatias do gráfico: horas (dia), dias (semana e mês) ou meses (6 meses). */
export const bucketsOf = (mode: Mode, r: Range, openHour: number, closeHour: number): Bucket[] => {
  const out: Bucket[] = [];
  if (mode === 'dia') {
    for (let h = openHour; h < closeHour; h++) {
      const from = new Date(r.from);
      from.setHours(h);
      const to = new Date(r.from);
      to.setHours(h + 1);
      out.push({ key: `h${h}`, label: `${h}h`, full: `${h}h às ${h + 1}h`, from, to });
    }
  } else if (mode === '6m') {
    for (let m = new Date(r.from); +m < +r.to; m = addMonths(m, 1)) {
      const s = m.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      out.push({ key: m.toISOString(), label: MONTHS_SHORT[m.getMonth()], full: s.charAt(0).toUpperCase() + s.slice(1), from: m, to: addMonths(m, 1) });
    }
  } else {
    for (let d = new Date(r.from); +d < +r.to; d = addDays(d, 1)) {
      out.push({
        key: d.toDateString(),
        label: mode === 'semana' ? d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3) : String(d.getDate()),
        full: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', ''),
        from: d,
        to: addDays(d, 1),
      });
    }
  }
  return out;
};

/** Grade do calendário (semanas começando na segunda; null = espaço vazio). */
export const monthGrid = (month: Date): (Date | null)[] => {
  const first = startOfMonth(month);
  const lead = (first.getDay() + 6) % 7;
  const days: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = first; d.getMonth() === first.getMonth(); d = addDays(d, 1)) days.push(d);
  while (days.length % 7) days.push(null);
  return days;
};
