import { create } from 'zustand';
import { barbers, coupons, guests, REFERRAL_CODE, services, units } from '@/data/mock';
import { barberHours, hasConflict, pickBarber } from '@/lib/availability';

/** `falta` = o cliente não compareceu (marcado pela equipe). */
export type Status = 'agendado' | 'concluido' | 'cancelado' | 'falta';
export type PayMethod = 'pix' | 'cartao' | 'local';

/** Avaliação que o cliente deixa depois do atendimento. */
export type Rating = { stars: number; tags: string[]; text: string; at: string };

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
  /** Chave da conta do cliente (celular) ou de um cliente fictício (g1, g2...). */
  clientName: string;
  /** Usou o corte grátis do Clube Dom Cabral. */
  reward?: boolean;
  rating?: Rating;
};

/** Horário bloqueado na agenda de um barbeiro (almoço, folga...). */
export type Block = { id: string; barberId: string; start: string; minutes: number; reason: string };

/** Pedido para ser avisado se abrir um horário. `barberId` null = qualquer barbeiro. */
export type WaitEntry = { id: string; account: string; barberId: string | null; day: string; serviceIds: string[] };

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
  useReward: boolean; // usar o corte grátis do Clube Dom Cabral
};

export type Me = { name: string; phone: string; email: string; photo: string | null }; // photo = endereço local da imagem
export type Provider = 'apple' | 'google';

/** Dados de cada conta. Os da conta logada ficam "soltos" no store (me, points...) para as telas lerem direto. */
type Profile = {
  me: Me;
  /** Unidade escolhida para agendar (a Dom Cabral tem 9). */
  unitId: string;
  points: number;
  /** Cortes grátis liberados e ainda não usados. */
  rewards: number;
  favorites: string[];
  birthday: Birthday | null;
  notifications: boolean;
  savedCard: SavedCard | null;
  inbox: Notice[];
};

type State = Profile & {
  loggedIn: boolean;
  /** Chave da conta logada: dígitos do celular (ou "apple:email" no cadastro social sem celular). */
  account: string | null;
  /** Contas criadas nesta sessão (só em memória: somem ao fechar o app). */
  accounts: Record<string, Profile>;
  /** Conta ligada a cada login social. */
  socialLinks: Partial<Record<Provider, string>>;
  /** Agenda da barbearia: horários de todos os clientes. */
  appointments: Appointment[];
  blocks: Block[];
  waitlist: WaitEntry[];
  /** Membro da equipe logado no painel (null = ninguém). */
  staff: { barberId: string } | null;
  draft: Draft;
  hasAccount: (phone: string) => boolean;
  login: (key: string) => void;
  register: (data: { name: string; phone: string; email: string; key?: string; provider?: Provider }) => void;
  logout: () => void;
  toggleService: (id: string) => void;
  /** Aplica o cupom se for válido; retorna se deu certo. */
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  setUseReward: (on: boolean) => void;
  setBarber: (id: string | null) => void;
  setDay: (iso: string) => void;
  setSlot: (m: number) => void;
  resetDraft: () => void;
  startRebook: (a: Appointment, reschedule?: boolean) => void;
  confirm: (method: PayMethod) => Appointment;
  /** `byShop` = cancelado pela barbearia (o cliente é avisado). */
  cancel: (id: string, byShop?: boolean) => void;
  toggleFavorite: (barberId: string) => void;
  setBirthday: (b: Birthday | null) => void;
  toggleNotifications: () => void;
  saveCard: (card: SavedCard) => void;
  removeCard: () => void;
  setPhoto: (uri: string | null) => void;
  setUnit: (unitId: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotice: (id: string) => void;
  restoreNotice: (n: Notice) => void;
  rate: (id: string, rating: Omit<Rating, 'at'>) => void;
  joinWaitlist: (barberId: string | null, day: string) => void;
  leaveWaitlist: (id: string) => void;
  // painel da equipe
  staffLogin: (barberId: string) => void;
  staffLogout: () => void;
  complete: (id: string) => void;
  markNoShow: (id: string) => void;
  /** Retorna uma mensagem de erro se o bloqueio bater com algum horário. */
  addBlock: (b: Omit<Block, 'id'>) => string | null;
  removeBlock: (id: string) => void;
};

/** Atendimentos necessários para ganhar um corte grátis. */
export const LOYALTY_GOAL = 10;
/** Serviço coberto pelo corte grátis. */
export const REWARD_SERVICE = 's1';

/** Conta de demonstração (Antonio), já existente ao abrir o app. */
export const DEMO_KEY = '61982250725';
const ME = DEMO_KEY;

export const accountKey = (phone: string) => phone.replace(/\D/g, '');

const emptyDraft: Draft = { serviceIds: [], barberId: null, day: null, slot: null, rescheduleId: null, coupon: null, useReward: false };

const at = (daysFromNow: number, hour: number, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

const svc = (id: string) => services.find((s) => s.id === id)!;

/* ---------- Agenda de exemplo ---------- */

const mine0: Appointment[] = [
  // do cliente de demonstração
  { id: 'a0', serviceIds: ['s3'], barberId: 'b5', start: at(2, 14), minutes: 70, totalCents: 14000, status: 'agendado', paid: true, method: 'pix', clientName: ME },
  { id: 'a1', serviceIds: ['s1'], barberId: 'b5', start: at(-14, 15), minutes: 40, totalCents: 8500, status: 'concluido', paid: true, method: 'pix', clientName: ME },
  { id: 'a2', serviceIds: ['s3'], barberId: 'b5', start: at(-45, 10), minutes: 70, totalCents: 14000, status: 'concluido', paid: true, method: 'cartao', clientName: ME, rating: { stars: 5, tags: ['Capricho'], text: 'Corte impecável, como sempre.', at: at(-45, 12) } },
  { id: 'a5', serviceIds: ['s2'], barberId: 'b6', start: at(-80, 11), minutes: 30, totalCents: 6500, status: 'concluido', paid: true, method: 'local', clientName: ME },
];

/** Gerador pseudoaleatório com semente fixa: a agenda de exemplo é sempre a mesma. */
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const reviewTexts: Record<number, string[]> = {
  5: ['Atendimento impecável, saí exatamente do jeito que pedi.', 'Muito caprichoso, ambiente top.', 'Melhor degradê de Brasília.', 'Pontual e atencioso. Recomendo!', ''],
  4: ['Ótimo corte, só atrasou uns minutinhos.', 'Gostei bastante, volto com certeza.', ''],
  3: ['Corte bom, mas esperei um pouco.'],
};
const tagPool = ['Pontualidade', 'Capricho', 'Atendimento', 'Ambiente', 'Preço justo'];

/** Início do histórico de exemplo: dia 1 do mês de 5 meses atrás (6 meses com o atual). */
export const HISTORY_START = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() - 5);
  return d;
})();

/**
 * Agenda da barbearia desde HISTORY_START até os próximos 7 dias, para o painel ter números reais.
 * Cada barbeiro segue o horário da sua unidade. Amanhã fica lotado com o Bruno (Plaza Norte) para
 * demonstrar a lista de espera.
 */
const buildSeed = (): Appointment[] => {
  const r = rng(42);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const now = Date.now();
  const list: Appointment[] = [...mine0];
  const menu = ['s1', 's1', 's1', 's3', 's3', 's3', 's2', 's2', 's4', 's7', 's5', 's10', 's9', 's6', 's8'];
  const guestKeys = Object.keys(guests);
  let fullDay = 1;
  while (!barberHours('b5', new Date(at(fullDay, 12)))) fullDay++;
  let n = 0;
  // índice barbeiro|dia: com milhares de horários, procurar conflito na lista inteira fica lento
  const byDay = new Map<string, Appointment[]>();
  const keyOf = (barberId: string, d: Date) => `${barberId}|${d.toDateString()}`;
  const dayList = (barberId: string, d: Date) => byDay.get(keyOf(barberId, d)) ?? [];
  for (const a of list) {
    const k = keyOf(a.barberId, new Date(a.start));
    byDay.set(k, [...(byDay.get(k) ?? []), a]);
  }

  const add = (barberId: string, start: Date, serviceId: string, booked = false) => {
    const s = svc(serviceId);
    const hrs = barberHours(barberId, start);
    const m = start.getHours() * 60 + start.getMinutes();
    if (!hrs || m < hrs[0] || m + s.minutes > hrs[1]) return false;
    if (hasConflict(barberId, start, s.minutes, dayList(barberId, start))) return false;
    const past = start.getTime() + s.minutes * 60000 < now;
    const status: Status = past ? (r() < 0.06 ? 'falta' : 'concluido') : !booked && r() < 0.04 ? 'cancelado' : 'agendado';
    const roll = r();
    const method: PayMethod = roll < 0.55 ? 'pix' : roll < 0.8 ? 'cartao' : 'local';
    const a: Appointment = {
      id: `s${n++}`,
      serviceIds: [serviceId],
      barberId,
      start: start.toISOString(),
      minutes: s.minutes,
      totalCents: s.priceCents,
      status,
      paid: status === 'concluido' || method !== 'local',
      method,
      clientName: pick(guestKeys),
    };
    if (status === 'concluido' && r() < 0.35) {
      const stars = r() < 0.7 ? 5 : r() < 0.85 ? 4 : 3;
      a.rating = { stars, tags: r() < 0.6 ? [pick(tagPool)] : [], text: pick(reviewTexts[stars]), at: new Date(start.getTime() + 3 * 3600000).toISOString() };
    }
    list.push(a);
    byDay.set(keyOf(barberId, start), [...dayList(barberId, start), a]);
    return true;
  };

  const firstDay = Math.round((HISTORY_START.getTime() - new Date(at(0, 0)).getTime()) / 86400000);
  for (let d = firstDay; d <= 7; d++) {
    const day = new Date(at(d, 0));
    for (const b of barbers) {
      const hrs = barberHours(b.id, day);
      if (!hrs) continue;
      // os horários do cliente de demonstração também contam
      let placed = dayList(b.id, day).length;
      if (d === fullDay && b.id === 'b5') {
        // dia lotado: encaixa cortes um atrás do outro
        for (let m = hrs[0]; m < hrs[1]; m += 10) {
          const t = new Date(day);
          t.setHours(0, m, 0, 0);
          // se o serviço sorteado não couber, tenta os curtos para não sobrar brecha
          for (const id of [pick(['s1', 's3', 's1', 's2']), 's2', 's9', 's7']) if (add(b.id, t, id, true)) break;
        }
        continue;
      }
      const count = 3 + Math.floor(r() * 3);
      for (let i = 0; i < count * 3 && placed < count; i++) {
        const slot = hrs[0] + Math.floor(r() * ((hrs[1] - hrs[0]) / 30)) * 30;
        const t = new Date(day);
        t.setHours(0, slot, 0, 0);
        if (add(b.id, t, pick(menu))) placed++;
      }
    }
  }
  return list;
};

const seed = buildSeed();

/* ---------- Textos ---------- */

const names = (ids: string[]) => services.filter((s) => ids.includes(s.id)).map((s) => s.name).join(' + ');
const shortName = (id: string) => barbers.find((b) => b.id === id)?.short ?? '';
const when = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${day} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};
const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
let uid = 0;
const newId = (prefix: string) => `${prefix}${Date.now()}_${uid++}`;

/** Selos do cliente de demonstração: falta 1 para o corte grátis (bom para a apresentação). */
const DEMO_POINTS = 9;

/** Notificações de exemplo, montadas a partir dos agendamentos de exemplo. */
const seedInbox = (): Notice[] => {
  const next = mine0[0];
  const last = mine0[1];
  return [
    { id: 'n1', kind: 'lembrete', title: 'Seu horário está chegando', body: `${names(next.serviceIds)} com ${shortName(next.barberId)}, ${when(next.start)}.`, at: ago(1), read: false, href: '/agenda' },
    { id: 'n2', kind: 'pagamento', title: 'Pagamento confirmado', body: `Recebemos seu Pix de ${brl(next.totalCents)}.`, at: ago(5), read: false, href: '/perfil' },
    { id: 'n3', kind: 'fidelidade', title: 'Você está perto do corte grátis', body: `Falta ${LOYALTY_GOAL - DEMO_POINTS} atendimento para completar seu cartão do Clube Dom Cabral.`, at: ago(26), read: false, href: '/fidelidade' },
    { id: 'n4', kind: 'promo', title: '10% de desconto para você', body: `Use o cupom ${REFERRAL_CODE} no pagamento do seu próximo horário.`, at: ago(50), read: true, href: '/servicos' },
    { id: 'n5', kind: 'avaliacao', title: 'Como foi seu último atendimento?', body: `Conte para a gente como foi com ${shortName(last.barberId)}.`, at: ago(24 * 13), read: true, href: `/avaliar/${last.id}` },
  ];
};

/* ---------- Preços ---------- */

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
const parts = (id: string) => svc(id)?.includes ?? [id];
const overlaps = (a: string, b: string) => parts(a).some((p) => parts(b).includes(p));

/** O corte grátis vale quando há um Corte entre os serviços (avulso ou dentro de um combo). */
export const rewardEligible = (serviceIds: string[]) => serviceIds.some((id) => parts(id).includes(REWARD_SERVICE));

/** Valor do agendamento: corte grátis primeiro, depois o cupom sobre o restante. */
export const priceOf = (draft: Draft, rewards: number) => {
  const { cents } = draftTotals(draft.serviceIds);
  const reward = draft.useReward && rewards > 0 && rewardEligible(draft.serviceIds) ? Math.min(cents, svc(REWARD_SERVICE).priceCents) : 0;
  const c = withCoupon(cents - reward, draft.coupon);
  return { subtotal: cents, reward, pct: c.pct, discount: c.discount, total: c.total };
};

/* ---------- Consultas ---------- */

/** Agendamentos de uma conta. */
export const mine = (appts: Appointment[], account: string | null) => appts.filter((a) => a.clientName === account);

/** Horários ocupados para a disponibilidade: agendamentos + bloqueios da equipe. */
export const busyList = (appointments: Appointment[], blocks: Block[]): Appointment[] => [
  ...appointments,
  ...blocks.map((b) => ({ id: b.id, serviceIds: [], barberId: b.barberId, start: b.start, minutes: b.minutes, totalCents: 0, status: 'agendado' as const, paid: false, method: 'local' as const, clientName: '' })),
];

/** Nome do cliente para a equipe (conta real ou cliente fictício). */
export const clientLabel = (key: string, accounts: Record<string, Profile>) => accounts[key]?.me.name ?? guests[key] ?? 'Cliente';

/** "Rafael M." */
export const shortClient = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]}.` : first;
};

/** Avaliações feitas no app (mais recentes primeiro), opcionalmente de um barbeiro. */
export const ratedAppointments = (appointments: Appointment[], barberId?: string | null) =>
  appointments
    .filter((a) => a.rating && (!barberId || a.barberId === barberId))
    .sort((a, b) => +new Date(b.rating!.at) - +new Date(a.rating!.at));

/* ---------- Contas ---------- */

const demoProfile: Profile = {
  me: { name: 'Antonio Barros Coelho', phone: '(61) 98225-0725', email: 'antoniobc2507@gmail.com', photo: null },
  points: DEMO_POINTS,
  rewards: 0,
  unitId: 'plaza',
  favorites: ['b5'],
  birthday: null,
  notifications: true,
  savedCard: { brand: 'Mastercard', last4: '4242' },
  inbox: seedInbox(),
};

/** Caixa de entrada de uma conta recém-criada. */
const welcomeInbox = (name: string): Notice[] => [
  { id: 'w1', kind: 'promo', title: `Bem-vindo, ${name.split(' ')[0]}!`, body: 'Sua conta na Dom Cabral Barbearia está pronta. Agende seu primeiro horário.', at: new Date().toISOString(), read: false, href: '/servicos' },
  { id: 'w2', kind: 'promo', title: '10% de desconto no primeiro corte', body: `Use o cupom ${REFERRAL_CODE} no pagamento.`, at: new Date().toISOString(), read: false, href: '/servicos' },
];

const profileOf = (s: State): Profile => ({
  me: s.me,
  unitId: s.unitId,
  points: s.points,
  rewards: s.rewards,
  favorites: s.favorites,
  birthday: s.birthday,
  notifications: s.notifications,
  savedCard: s.savedCard,
  inbox: s.inbox,
});

/** Guarda as alterações da conta logada antes de trocar de conta. */
const saved = (s: State) => (s.account ? { ...s.accounts, [s.account]: profileOf(s) } : s.accounts);

/**
 * Altera o perfil de qualquer conta (a logada ou outra), por exemplo quando a equipe
 * conclui um atendimento. Clientes fictícios não têm perfil: nada acontece.
 */
const updateProfile = (s: State, key: string, fn: (p: Profile) => Profile): Partial<State> => {
  if (key === s.account) {
    const p = fn(profileOf(s));
    return { ...p, accounts: { ...s.accounts, [key]: p } };
  }
  const p = s.accounts[key];
  return p ? { accounts: { ...s.accounts, [key]: fn(p) } } : {};
};

/** Junta várias alterações de perfil (cada uma parte do resultado da anterior). */
const chain = (s: State, ...steps: ((s: State) => Partial<State>)[]) =>
  steps.reduce<Partial<State>>((acc, step) => ({ ...acc, ...step({ ...s, ...acc } as State) }), {});

const notify = (key: string, notice: Omit<Notice, 'id' | 'at' | 'read'>) => (s: State) =>
  updateProfile(s, key, (p) => (p.notifications || notice.kind !== 'lembrete' ? { ...p, inbox: [{ ...notice, id: newId('n'), at: new Date().toISOString(), read: false }, ...p.inbox] } : p));

/** Um horário foi liberado: avisa quem está na lista de espera daquele dia. */
const freeUp = (barberId: string, startIso: string, except: string) => (s: State) => {
  if (+new Date(startIso) < Date.now()) return {};
  const hits = s.waitlist.filter(
    (w) => w.account !== except && (w.barberId === null || w.barberId === barberId) && new Date(w.day).toDateString() === new Date(startIso).toDateString(),
  );
  if (!hits.length) return {};
  const steps = hits.map((w) =>
    notify(w.account, {
      kind: 'lembrete',
      title: 'Abriu um horário!',
      body: `${shortName(barberId)} ficou livre ${when(startIso)}. Garanta antes que alguém pegue.`,
      href: `/barbeiro/${barberId}`,
    }),
  );
  return { ...chain(s, ...steps), waitlist: s.waitlist.filter((w) => !hits.includes(w)) };
};

export const useStore = create<State>((set, get) => ({
  ...demoProfile,
  loggedIn: false,
  account: null,
  accounts: { [DEMO_KEY]: demoProfile },
  socialLinks: {},
  appointments: seed,
  blocks: [],
  waitlist: [],
  staff: null,
  draft: emptyDraft,
  hasAccount: (phone) => accountKey(phone) in get().accounts,
  login: (key) =>
    set((s) => {
      const accounts = saved(s);
      return { ...accounts[key], accounts, account: key, loggedIn: true, draft: emptyDraft };
    }),
  // conta nova começa limpa: sem histórico, pontos ou cartão (mantém foto e aniversário escolhidos no cadastro)
  register: ({ name, phone, email, key, provider }) =>
    set((s) => {
      const k = key ?? accountKey(phone);
      const profile: Profile = {
        me: { name, phone, email, photo: s.me.photo },
        unitId: s.unitId ?? units[0].id,
        points: 0,
        rewards: 0,
        favorites: [],
        birthday: s.birthday,
        notifications: true,
        savedCard: null,
        inbox: welcomeInbox(name),
      };
      return {
        ...profile,
        accounts: { ...saved(s), [k]: profile },
        socialLinks: provider ? { ...s.socialLinks, [provider]: k } : s.socialLinks,
        account: k,
        loggedIn: true,
        draft: emptyDraft,
      };
    }),
  logout: () => set((s) => ({ accounts: saved(s), account: null, loggedIn: false, draft: emptyDraft })),
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
  setUseReward: (useReward) => set(({ draft }) => ({ draft: { ...draft, useReward } })),
  setBarber: (barberId) => set(({ draft }) => ({ draft: { ...draft, barberId, slot: null } })),
  setDay: (day) => set(({ draft }) => ({ draft: { ...draft, day, slot: null } })),
  setSlot: (slot) => set(({ draft }) => ({ draft: { ...draft, slot } })),
  resetDraft: () => set({ draft: emptyDraft }),
  startRebook: (a, reschedule = false) =>
    set({
      draft: { ...emptyDraft, serviceIds: [...a.serviceIds], barberId: a.barberId, rescheduleId: reschedule ? a.id : null },
    }),
  confirm: (method) => {
    const s = get();
    const { draft, appointments, blocks, account, rewards } = s;
    const { minutes } = draftTotals(draft.serviceIds);
    const start = new Date(draft.day!);
    start.setHours(0, draft.slot!, 0, 0);
    // ao remarcar, o horário antigo não deve bloquear o novo
    const others = appointments.filter((a) => a.id !== draft.rescheduleId);
    const unitBarbers = barbers.filter((b) => b.unitId === s.unitId).map((b) => b.id);
    const barberId = draft.barberId ?? pickBarber(start, minutes, busyList(others, blocks), unitBarbers);
    const old = appointments.find((a) => a.id === draft.rescheduleId);
    const price = priceOf(draft, rewards);
    const usedReward = !old && price.reward > 0;
    const appt: Appointment = {
      id: newId('a'),
      serviceIds: draft.serviceIds,
      barberId,
      start: start.toISOString(),
      minutes,
      totalCents: old ? old.totalCents : price.total,
      status: 'agendado',
      paid: old ? old.paid : method !== 'local' || price.total === 0,
      method: old ? old.method : method,
      clientName: account ?? DEMO_KEY,
      ...(usedReward || old?.reward ? { reward: true } : {}),
    };
    const notice: Notice = {
      id: newId('n'),
      kind: 'agendamento',
      title: old ? 'Horário remarcado' : 'Agendamento confirmado',
      body: `${names(appt.serviceIds)} com ${shortName(barberId)}, ${when(appt.start)}.`,
      at: new Date().toISOString(),
      read: false,
      href: '/agenda',
    };
    set((st) =>
      chain(
        st,
        (x) => ({
          appointments: [...others, ...(old ? [{ ...old, status: 'cancelado' as const }] : []), appt],
          draft: emptyDraft,
          inbox: [notice, ...x.inbox],
          rewards: usedReward ? x.rewards - 1 : x.rewards,
          // quem marcou não precisa mais esperar vaga naquele dia
          waitlist: x.waitlist.filter((w) => !(w.account === appt.clientName && new Date(w.day).toDateString() === start.toDateString())),
        }),
        // remarcar libera o horário antigo
        (x) => (old ? freeUp(old.barberId, old.start, appt.clientName)(x) : {}),
      ),
    );
    return appt;
  },
  cancel: (id, byShop = false) =>
    set((s) => {
      const a = s.appointments.find((x) => x.id === id);
      if (!a || a.status !== 'agendado') return {};
      const steps: ((s: State) => Partial<State>)[] = [
        (st) => ({ appointments: st.appointments.map((x) => (x.id === id ? { ...x, status: 'cancelado' as const } : x)) }),
        // corte grátis usado volta para o cliente
        (st) => (a.reward ? updateProfile(st, a.clientName, (p) => ({ ...p, rewards: p.rewards + 1 })) : {}),
        (st) =>
          byShop
            ? notify(a.clientName, { kind: 'agendamento', title: 'Horário cancelado pela barbearia', body: `${names(a.serviceIds)} de ${when(a.start)}. Escolha outro horário quando quiser.`, href: '/servicos' })(st)
            : {},
        freeUp(a.barberId, a.start, a.clientName),
      ];
      return chain(s, ...steps);
    }),
  toggleFavorite: (id) =>
    set(({ favorites }) => ({
      favorites: favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id],
    })),
  setBirthday: (birthday) => set({ birthday }),
  toggleNotifications: () => set(({ notifications }) => ({ notifications: !notifications })),
  saveCard: (savedCard) => set({ savedCard }),
  removeCard: () => set({ savedCard: null }),
  setPhoto: (photo) => set(({ me }) => ({ me: { ...me, photo } })),
  // trocar de unidade limpa o barbeiro e o horário escolhidos (eram da outra unidade)
  setUnit: (unitId) => set(({ draft }) => ({ unitId, draft: { ...draft, barberId: null, slot: null } })),
  markRead: (id) => set(({ inbox }) => ({ inbox: inbox.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllRead: () => set(({ inbox }) => ({ inbox: inbox.map((n) => ({ ...n, read: true })) })),
  removeNotice: (id) => set(({ inbox }) => ({ inbox: inbox.filter((n) => n.id !== id) })),
  restoreNotice: (n) => set(({ inbox }) => ({ inbox: inbox.some((x) => x.id === n.id) ? inbox : [...inbox, n] })),
  rate: (id, rating) =>
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, rating: { ...rating, at: new Date().toISOString() } } : a)),
      // o pedido de avaliação daquele atendimento fica como lido
      inbox: s.inbox.map((n) => (n.href === `/avaliar/${id}` ? { ...n, read: true } : n)),
    })),
  joinWaitlist: (barberId, day) =>
    set((s) => {
      const account = s.account ?? DEMO_KEY;
      const exists = s.waitlist.some((w) => w.account === account && w.barberId === barberId && w.day === day);
      return exists ? {} : { waitlist: [...s.waitlist, { id: newId('w'), account, barberId, day, serviceIds: s.draft.serviceIds }] };
    }),
  leaveWaitlist: (id) => set((s) => ({ waitlist: s.waitlist.filter((w) => w.id !== id) })),

  /* ---------- Painel da equipe ---------- */

  staffLogin: (barberId) => set({ staff: { barberId } }),
  staffLogout: () => set({ staff: null }),
  complete: (id) =>
    set((s) => {
      const a = s.appointments.find((x) => x.id === id);
      if (!a || a.status !== 'agendado') return {};
      const b = shortName(a.barberId);
      return chain(
        s,
        (st) => ({ appointments: st.appointments.map((x) => (x.id === id ? { ...x, status: 'concluido' as const, paid: true } : x)) }),
        // +1 selo; ao completar o cartão, vira um corte grátis
        (st) =>
          updateProfile(st, a.clientName, (p) => {
            const total = p.points + 1;
            const won = total >= LOYALTY_GOAL;
            const points = won ? total - LOYALTY_GOAL : total;
            const notices: Notice[] = [
              { id: newId('n'), kind: 'avaliacao', title: `Como foi com ${b}?`, body: 'Avalie seu atendimento em poucos segundos.', at: new Date().toISOString(), read: false, href: `/avaliar/${id}` },
              won
                ? { id: newId('n'), kind: 'fidelidade', title: 'Corte grátis liberado! 🎉', body: 'Você completou o cartão do Clube Dom Cabral. Use no próximo agendamento.', at: new Date().toISOString(), read: false, href: '/fidelidade' }
                : { id: newId('n'), kind: 'fidelidade', title: '+1 selo no Clube Dom Cabral', body: `Atendimento com ${b} concluído. Você tem ${points} de ${LOYALTY_GOAL} selos.`, at: new Date().toISOString(), read: false, href: '/fidelidade' },
            ];
            return { ...p, points, rewards: p.rewards + (won ? 1 : 0), inbox: [...notices, ...p.inbox] };
          }),
      );
    }),
  markNoShow: (id) =>
    set((s) => ({ appointments: s.appointments.map((a) => (a.id === id && a.status === 'agendado' ? { ...a, status: 'falta' as const } : a)) })),
  addBlock: (b) => {
    const s = get();
    const start = new Date(b.start);
    const taken = s.appointments.filter((a) => a.status === 'agendado');
    if (hasConflict(b.barberId, start, b.minutes, busyList(taken, s.blocks))) {
      return 'Esse período já tem atendimento ou bloqueio. Cancele ou remarque antes de bloquear.';
    }
    set({ blocks: [...s.blocks, { ...b, id: newId('b') }] });
    return null;
  },
  removeBlock: (id) =>
    set((s) => {
      const b = s.blocks.find((x) => x.id === id);
      if (!b) return {};
      return chain(s, (st) => ({ blocks: st.blocks.filter((x) => x.id !== id) }), freeUp(b.barberId, b.start, ''));
    }),
}));
