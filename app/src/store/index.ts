import { create } from 'zustand';
import { barbers, coupons, REFERRAL_CODE, services } from '@/data/mock';
import { pickBarber } from '@/lib/availability';

export type Status = 'agendado' | 'concluido' | 'cancelado';
export type PayMethod = 'pix' | 'cartao' | 'local';

export type Appointment = {
  id: string;
  serviceIds: string[];
  barberId: string;
  start: string; // ISO
  minutes: number;
  totalCents: number;
  status: Status;
  paid: boolean;
  method: PayMethod;
  clientName: string;
};

/** Cartão salvo: só bandeira e últimos 4 dígitos (o número completo fica no Mercado Pago). */
export type SavedCard = { brand: string; last4: string };

/** Ano é opcional: o benefício vale para o mês. */
export type Birthday = { day: number; month: number; year?: number };

export type NoticeKind = 'lembrete' | 'agendamento' | 'pagamento' | 'fidelidade' | 'promo' | 'avaliacao';

/** Notificação da caixa de entrada (simulada nesta demonstração). */
export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  at: string; // ISO
  read: boolean;
  href?: string; // tela aberta ao tocar
};

type Draft = {
  serviceIds: string[];
  barberId: string | null; // null = sem preferência
  day: string | null; // ISO (meia-noite)
  slot: number | null; // minutos desde 00:00
  rescheduleId: string | null; // agendamento sendo remarcado
  coupon: string | null; // código já validado
};

type State = {
  loggedIn: boolean;
  me: { name: string; phone: string; email: string };
  appointments: Appointment[];
  draft: Draft;
  points: number;
  favorites: string[];
  birthday: Birthday | null;
  notifications: boolean;
  savedCard: SavedCard | null;
  inbox: Notice[];
  login: () => void;
  logout: () => void;
  toggleService: (id: string) => void;
  /** Aplica o cupom se for válido; retorna se deu certo. */
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  setBarber: (id: string | null) => void;
  setDay: (iso: string) => void;
  setSlot: (m: number) => void;
  resetDraft: () => void;
  startRebook: (a: Appointment, reschedule?: boolean) => void;
  confirm: (method: PayMethod) => Appointment;
  cancel: (id: string) => void;
  toggleFavorite: (barberId: string) => void;
  setBirthday: (b: Birthday | null) => void;
  toggleNotifications: () => void;
  saveCard: (card: SavedCard) => void;
  removeCard: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotice: (id: string) => void;
  restoreNotice: (n: Notice) => void;
};

/** Atendimentos necessários para ganhar um corte grátis. */
export const LOYALTY_GOAL = 10;

const ME = 'Antonio Barros Coelho';
const emptyDraft: Draft = { serviceIds: [], barberId: null, day: null, slot: null, rescheduleId: null, coupon: null };

const at = (daysFromNow: number, hour: number, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

const seed: Appointment[] = [
  // do cliente
  { id: 'a0', serviceIds: ['s3'], barberId: 'b5', start: at(2, 15, 30), minutes: 70, totalCents: 14500, status: 'agendado', paid: true, method: 'pix', clientName: ME },
  { id: 'a1', serviceIds: ['s1'], barberId: 'b5', start: at(-14, 15), minutes: 40, totalCents: 9000, status: 'concluido', paid: true, method: 'pix', clientName: ME },
  { id: 'a2', serviceIds: ['s3'], barberId: 'b5', start: at(-45, 10), minutes: 70, totalCents: 14500, status: 'concluido', paid: true, method: 'cartao', clientName: ME },
  { id: 'a5', serviceIds: ['s2'], barberId: 'b3', start: at(-80, 18), minutes: 30, totalCents: 7000, status: 'concluido', paid: true, method: 'local', clientName: ME },
  // de outros clientes (ocupam horários)
  { id: 'o1', serviceIds: ['s1'], barberId: 'b5', start: at(1, 10), minutes: 40, totalCents: 9000, status: 'agendado', paid: false, method: 'local', clientName: 'Outro' },
  { id: 'o2', serviceIds: ['s3'], barberId: 'b5', start: at(1, 14), minutes: 70, totalCents: 14500, status: 'agendado', paid: true, method: 'pix', clientName: 'Outro' },
  { id: 'o3', serviceIds: ['s1'], barberId: 'b5', start: at(2, 9, 30), minutes: 40, totalCents: 9000, status: 'agendado', paid: true, method: 'pix', clientName: 'Outro' },
  { id: 'o4', serviceIds: ['s1'], barberId: 'b5', start: at(2, 11), minutes: 40, totalCents: 9000, status: 'agendado', paid: true, method: 'pix', clientName: 'Outro' },
  { id: 'o5', serviceIds: ['s2'], barberId: 'b1', start: at(1, 10), minutes: 30, totalCents: 7000, status: 'agendado', paid: true, method: 'pix', clientName: 'Outro' },
];

const names = (ids: string[]) => services.filter((s) => ids.includes(s.id)).map((s) => s.name).join(' + ');
const shortName = (id: string) => barbers.find((b) => b.id === id)?.short ?? '';
const when = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${day} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};
const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

/** Notificações de exemplo, montadas a partir dos agendamentos de exemplo. */
const seedInbox = (): Notice[] => {
  const next = seed[0];
  const last = seed[1];
  return [
    { id: 'n1', kind: 'lembrete', title: 'Seu horário está chegando', body: `${names(next.serviceIds)} com ${shortName(next.barberId)}, ${when(next.start)}.`, at: ago(1), read: false, href: '/agenda' },
    { id: 'n2', kind: 'pagamento', title: 'Pagamento confirmado', body: `Recebemos seu Pix de ${(next.totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, at: ago(5), read: false, href: '/perfil' },
    { id: 'n3', kind: 'fidelidade', title: 'Você está perto do corte grátis', body: `Faltam ${LOYALTY_GOAL - 7} atendimentos para completar seu cartão do Clube Mayk.`, at: ago(26), read: false, href: '/fidelidade' },
    { id: 'n4', kind: 'promo', title: '10% de desconto para você', body: `Use o cupom ${REFERRAL_CODE} no pagamento do seu próximo horário.`, at: ago(50), read: true, href: '/servicos' },
    { id: 'n5', kind: 'avaliacao', title: 'Como foi seu último atendimento?', body: `Conte para a gente como foi com ${shortName(last.barberId)}.`, at: ago(24 * 13), read: true, href: `/barbeiro/${last.barberId}` },
  ];
};

export const draftTotals = (serviceIds: string[]) => {
  const list = services.filter((s) => serviceIds.includes(s.id));
  return {
    list,
    cents: list.reduce((a, s) => a + s.priceCents, 0),
    minutes: list.reduce((a, s) => a + s.minutes, 0),
  };
};

/** Desconto do cupom (arredondado para centavos) e valor final. */
export const withCoupon = (cents: number, coupon: string | null) => {
  const pct = coupon ? (coupons[coupon] ?? 0) : 0;
  const discount = Math.round((cents * pct) / 100);
  return { pct, discount, total: cents - discount };
};

/** O que um serviço cobre: um combo cobre seus itens; um serviço avulso, ele mesmo. */
const parts = (id: string) => services.find((s) => s.id === id)?.includes ?? [id];
const overlaps = (a: string, b: string) => parts(a).some((p) => parts(b).includes(p));

/** Agendamentos do próprio cliente. */
export const mine = (appts: Appointment[]) => appts.filter((a) => a.clientName === ME);

export const useStore = create<State>((set, get) => ({
  loggedIn: false,
  me: { name: ME, phone: '(61) 98225-0725', email: 'antoniobc2507@gmail.com' },
  appointments: seed,
  draft: emptyDraft,
  points: 7,
  favorites: ['b5'],
  birthday: null,
  notifications: true,
  savedCard: { brand: 'Mastercard', last4: '4242' },
  inbox: seedInbox(),
  login: () => set({ loggedIn: true }),
  logout: () => set({ loggedIn: false, draft: emptyDraft }),
  toggleService: (id) =>
    set(({ draft }) => ({
      draft: {
        ...draft,
        slot: null,
        // marcar um serviço desmarca os que se sobrepõem a ele (ex.: Corte + Barba substitui Corte e Barba)
        serviceIds: draft.serviceIds.includes(id)
          ? draft.serviceIds.filter((x) => x !== id)
          : [...draft.serviceIds.filter((x) => !overlaps(x, id)), id],
      },
    })),
  applyCoupon: (code) => {
    const c = code.trim().toUpperCase();
    if (!(c in coupons)) return false;
    set(({ draft }) => ({ draft: { ...draft, coupon: c } }));
    return true;
  },
  removeCoupon: () => set(({ draft }) => ({ draft: { ...draft, coupon: null } })),
  setBarber: (barberId) => set(({ draft }) => ({ draft: { ...draft, barberId, slot: null } })),
  setDay: (day) => set(({ draft }) => ({ draft: { ...draft, day, slot: null } })),
  setSlot: (slot) => set(({ draft }) => ({ draft: { ...draft, slot } })),
  resetDraft: () => set({ draft: emptyDraft }),
  startRebook: (a, reschedule = false) =>
    set({
      draft: { ...emptyDraft, serviceIds: [...a.serviceIds], barberId: a.barberId, rescheduleId: reschedule ? a.id : null },
    }),
  confirm: (method) => {
    const { draft, appointments } = get();
    const { cents, minutes } = draftTotals(draft.serviceIds);
    const start = new Date(draft.day!);
    start.setHours(0, draft.slot!, 0, 0);
    // ao remarcar, o horário antigo não deve bloquear o novo
    const others = appointments.filter((a) => a.id !== draft.rescheduleId);
    const barberId = draft.barberId ?? pickBarber(start, minutes, others, barbers.map((b) => b.id));
    const old = appointments.find((a) => a.id === draft.rescheduleId);
    const appt: Appointment = {
      id: 'a' + Date.now(),
      serviceIds: draft.serviceIds,
      barberId,
      start: start.toISOString(),
      minutes,
      totalCents: withCoupon(cents, draft.coupon).total,
      status: 'agendado',
      paid: old ? old.paid : method !== 'local',
      method: old ? old.method : method,
      clientName: ME,
    };
    const notice: Notice = {
      id: 'n' + Date.now(),
      kind: 'agendamento',
      title: old ? 'Horário remarcado' : 'Agendamento confirmado',
      body: `${names(appt.serviceIds)} com ${shortName(barberId)}, ${when(appt.start)}.`,
      at: new Date().toISOString(),
      read: false,
      href: '/agenda',
    };
    set(({ inbox }) => ({
      appointments: [...others, ...(old ? [{ ...old, status: 'cancelado' as const }] : []), appt],
      draft: emptyDraft,
      inbox: [notice, ...inbox],
    }));
    return appt;
  },
  cancel: (id) =>
    set(({ appointments }) => ({
      appointments: appointments.map((a) => (a.id === id ? { ...a, status: 'cancelado' } : a)),
    })),
  toggleFavorite: (id) =>
    set(({ favorites }) => ({
      favorites: favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id],
    })),
  setBirthday: (birthday) => set({ birthday }),
  toggleNotifications: () => set(({ notifications }) => ({ notifications: !notifications })),
  saveCard: (savedCard) => set({ savedCard }),
  removeCard: () => set({ savedCard: null }),
  markRead: (id) => set(({ inbox }) => ({ inbox: inbox.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllRead: () => set(({ inbox }) => ({ inbox: inbox.map((n) => ({ ...n, read: true })) })),
  removeNotice: (id) => set(({ inbox }) => ({ inbox: inbox.filter((n) => n.id !== id) })),
  restoreNotice: (n) => set(({ inbox }) => ({ inbox: inbox.some((x) => x.id === n.id) ? inbox : [...inbox, n] })),
}));
