import { shop } from '@/data/mock';
import type { Appointment } from '@/store';

const STEP = 30;

/** Horários livres (minutos desde 00:00) para um barbeiro em um dia. */
export function freeSlots(
  day: Date,
  barberId: string | null,
  durationMin: number,
  appointments: Appointment[],
  barberIds: string[],
  now = new Date(),
): number[] {
  if (day.getDay() === shop.closedWeekday) return [];
  const candidates = barberId ? [barberId] : barberIds;
  const slots = new Set<number>();
  for (let start = shop.openMinutes; start + durationMin <= shop.closeMinutes; start += STEP) {
    const t = new Date(day);
    t.setHours(0, start, 0, 0);
    if (t.getTime() <= now.getTime()) continue;
    const ok = candidates.some((b) => !hasConflict(b, t, durationMin, appointments));
    if (ok) slots.add(start);
  }
  return [...slots];
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

/** Escolhe um barbeiro livre quando o cliente marca "Sem preferência". */
export function pickBarber(start: Date, durationMin: number, appts: Appointment[], barberIds: string[]) {
  return barberIds.find((b) => !hasConflict(b, start, durationMin, appts)) ?? barberIds[0];
}
