export const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const dateBR = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const weekdayShort = (d: Date) =>
  d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();

export const dateLong = (d: Date) => {
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const monthName = (month: number) => MONTHS[month - 1];

/** "15 de março" ou "15/03/1995" quando o ano é informado. */
export const birthdayLabel = (b: { day: number; month: number; year?: number }) =>
  b.year
    ? `${String(b.day).padStart(2, '0')}/${String(b.month).padStart(2, '0')}/${b.year}`
    : `${b.day} de ${monthName(b.month)}`;

/** "agora", "há 5 min", "há 3 h", "ontem", "há 4 dias" ou a data. */
export const timeAgo = (iso: string, now = new Date()) => {
  const min = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  if (d < 7) return `há ${d} dias`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
