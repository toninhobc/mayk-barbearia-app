import { barbers, hoursOn, type DayHours } from '@/data/mock';
import type { Appointment } from '@/store';

export const STEP = 30;

/** Horário da unidade do barbeiro naquele dia (null = fechada). */
export const barberHours = (barberId: string, day: Date): DayHours => {
  const unitId = barbers.find((b) => b.id === barberId)?.unitId;
  return unitId ? hoursOn(unitId, day) : null;
};

/** Inícios possíveis (minutos desde 00:00) dentro do horário, de 30 em 30 min. */
export const slotsWithin = (hours: DayHours, durationMin: number): number[] => {
  if (!hours) return [];
  const out: number[] = [];
  for (let start = hours[0]; start + durationMin <= hours[1]; start += STEP) out.push(start);
  return out;
};

/** Horários livres (minutos desde 00:00) para um barbeiro (ou qualquer um da lista) em um dia. */
export function freeSlots(
  day: Date,
  barberId: string | null,
  durationMin: number,
  appointments: Appointment[],
  barberIds: string[],
  now = new Date(),
): number[] {
  const candidates = barberId ? [barberId] : barberIds;
  const slots = new Set<number>();
  for (const b of candidates) {
    for (const start of slotsWithin(barberHours(b, day), durationMin)) {
      if (slots.has(start)) continue;
      const t = new Date(day);
      t.setHours(0, start, 0, 0);
      if (t.getTime() <= now.getTime()) continue;
      if (!hasConflict(b, t, durationMin, appointments)) slots.add(start);
    }
  }
  return [...slots].sort((x, y) => x - y);
}

export function hasConflict(barberId: string, start: Date, durationMin: number, appts: Appointment[]) {
  const s = start.getTime();
  const e = s + durationMin * 60000;
  return appts.some((a) => {
    if (a.barberId !== barberId || a.status === 'cancelado') return false;
    const as = new Date(a.start).getTime();
    const ae = as + a.minutes * 60000;
    return s < ae && as < e;
  });
}

/** Escolhe um barbeiro livre (e com a unidade aberta) quando o cliente marca "Sem preferência". */
export function pickBarber(start: Date, durationMin: number, appts: Appointment[], barberIds: string[]) {
  const m = start.getHours() * 60 + start.getMinutes();
  const open = (b: string) => {
    const hrs = barberHours(b, start);
    return !!hrs && m >= hrs[0] && m + durationMin <= hrs[1];
  };
  return barberIds.find((b) => open(b) && !hasConflict(b, start, durationMin, appts)) ?? barberIds[0];
}
