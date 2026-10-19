/**
 * Dados da Dom Cabral Barbearia (domcabralbarbearia.com.br): serviços, unidades,
 * endereços, telefones e horários vêm do site. Preços, durações e barbeiros não
 * aparecem no site: são EXEMPLOS para a demonstração, a confirmar com a barbearia.
 */

export const categories = ['Cabelo', 'Barba', 'Tratamentos', 'Pacotes'] as const;
export type Category = (typeof categories)[number];

export type Service = {
  id: string;
  name: string;
  category: Category;
  priceCents: number;
  minutes: number;
  description: string;
  /** Combos: serviços que já estão incluídos (não podem ser marcados junto). */
  includes?: string[];
};

export type Barber = {
  id: string;
  name: string;
  short: string;
  unitId: string;
  rating: number;
  reviews: number;
  specialties: string[];
  bio: string;
  color: string;
};

/** Horário de um dia: [abre, fecha] em minutos desde 00:00, ou null = fechado. */
export type DayHours = [number, number] | null;

export type Unit = {
  id: string;
  name: string;
  address: string;
  area: string;
  phone: string;
  /** Número com DDI para o WhatsApp. */
  whatsapp: string;
  /** Horário por dia da semana (0 = domingo). */
  hours: DayHours[];
  /** Horário como aparece no site. */
  hoursLabel: string[];
};

// Descrições do site. Preços e durações: exemplos.
export const services: Service[] = [
  // Cabelo
  { id: 's1', name: 'Corte', category: 'Cabelo', priceCents: 8500, minutes: 40, description: 'Precisão e técnicas nos cortes clássicos e contemporâneos.' },
  { id: 's8', name: 'Tonalizante', category: 'Cabelo', priceCents: 8000, minutes: 40, description: 'Realce natural da cor e disfarce sutil dos fios brancos.' },
  // Barba
  { id: 's2', name: 'Barba', category: 'Barba', priceCents: 6500, minutes: 30, description: 'O ritual à moda antiga: toalha quente, técnica e tradição.' },
  { id: 's4', name: 'Barbaterapia', category: 'Barba', priceCents: 9500, minutes: 50, description: 'Barba + esfoliação de pele e vapor de ozônio.', includes: ['s2'] },
  // Tratamentos
  { id: 's5', name: 'Hidratação', category: 'Tratamentos', priceCents: 7000, minutes: 30, description: 'Tratamento que devolve vitalidade e aparência saudável aos fios.' },
  { id: 's6', name: 'Realinhamento capilar', category: 'Tratamentos', priceCents: 15000, minutes: 60, description: 'Fios alinhados, macios e com brilho natural em cada detalhe.' },
  { id: 's10', name: 'Limpeza de pele', category: 'Tratamentos', priceCents: 11000, minutes: 45, description: 'Limpeza de pele e vapor de ozônio.' },
  { id: 's7', name: 'Sobrancelha', category: 'Tratamentos', priceCents: 3000, minutes: 15, description: 'Aparação para remover o excesso de pelos das sobrancelhas.' },
  { id: 's9', name: 'Depilação de orelha e nariz', category: 'Tratamentos', priceCents: 3500, minutes: 15, description: 'Remoção com cera do excesso de pelos do nariz e da orelha.' },
  // Pacotes
  { id: 's3', name: 'Corte + Barba', category: 'Pacotes', priceCents: 14000, minutes: 70, description: 'O clássico completo, com desconto.', includes: ['s1', 's2'] },
  { id: 's11', name: 'Dia do Noivo', category: 'Pacotes', priceCents: 39000, minutes: 150, description: 'Cuidado completo para viver o seu grande dia com estilo e confiança.', includes: ['s1', 's2', 's10'] },
];

/** Destaques da tela Início. */
export const popular = ['s1', 's3', 's2', 's4'];

const weekdays = (open: number, close: number, sat: DayHours, sun: DayHours = null): DayHours[] => [sun, [open, close], [open, close], [open, close], [open, close], [open, close], sat];
const h = (hh: number, mm = 0) => hh * 60 + mm;
/** Usado para agendar quando o site não informa o horário daquele dia (exemplo). */
const DEFAULT_WEEK = weekdays(h(9), h(20), [h(9), h(18)]);
const CONSULTE = 'Demais horários: consulte a unidade';

export const units: Unit[] = [
  { id: 'brasil21', name: 'Brasil 21', area: 'Setor Hoteleiro Sul', address: 'SHS Qd 06, Cj A, Bl D, Lj 70-76 · Ed. Meliá Brasil 21', phone: '(61) 99193-7000', whatsapp: '5561991937000', hours: weekdays(h(8, 30), h(20), [h(9), h(16)]), hoursLabel: ['Seg a Sex · 08:30 às 20:00', 'Sáb · 09:00 às 16:00'] },
  { id: 'liberty', name: 'Liberty Mall', area: 'Asa Norte', address: 'SCN Qd 2 Bl D Loja 362 · Shopping Liberty Mall', phone: '(61) 99252-8081', whatsapp: '5561992528081', hours: weekdays(h(9), h(20), [h(9), h(18)]), hoursLabel: ['Seg a Sex · 09:00 às 20:00', 'Sáb · 09:00 às 18:00'] },
  { id: 'plaza', name: 'Plaza Norte', area: 'Asa Norte', address: 'EQN 110/111 Norte Bl. A Lj. 11 · Ed. Plaza Norte (Eixinho)', phone: '(61) 99251-1014', whatsapp: '5561992511014', hours: weekdays(h(9), h(21), [h(9), h(18)], [h(10), h(16)]), hoursLabel: ['Seg a Sex · 09:00 às 21:00', 'Sáb · 09:00 às 18:00', 'Dom · 10:00 às 16:00'] },
  { id: 'sul110', name: '110/111 Sul', area: 'Asa Sul', address: 'EQS 110/111, Bl A, Lj 06-08 · Galeria Karim (Eixinho W)', phone: '(61) 3242-0043', whatsapp: '556132420043', hours: DEFAULT_WEEK, hoursLabel: ['Horário: consulte a unidade'] },
  { id: 'decknorte', name: 'Deck Norte', area: 'Lago Norte', address: 'SHIN CA 01 Bl. A Lj. 11 · Shopping Deck Norte', phone: '(61) 3576-0042', whatsapp: '556135760042', hours: weekdays(h(9), h(20), [h(8, 30), h(18)]), hoursLabel: ['Sáb · 08:30 às 18:00', CONSULTE] },
  { id: 'casapark', name: 'Casa Park', area: 'Park Sul', address: 'SGCV Sul Lt 22 Lj. 252-B · Shopping CasaPark, piso superior', phone: '(61) 3553-9702', whatsapp: '556135539702', hours: weekdays(h(10), h(20), [h(10), h(18)]), hoursLabel: ['Seg a Sex · 10:00 às 20:00', 'Sáb · 10:00 às 18:00'] },
  { id: 'norte413', name: '413 Norte', area: 'Asa Norte', address: 'SCLN 413, Bl A, Lj 10', phone: '(61) 3273-9629', whatsapp: '556132739629', hours: weekdays(h(9), h(20), [h(9), h(18)]), hoursLabel: ['Seg a Sex · 09:00 às 20:00', CONSULTE] },
  { id: 'lagosul', name: 'Lago Sul', area: 'Lago Sul', address: 'SHIS QI 09/11 Bl A Lj 5', phone: '(61) 99255-9068', whatsapp: '5561992559068', hours: DEFAULT_WEEK, hoursLabel: ['Horário: consulte a unidade'] },
  { id: 'lakeside', name: 'Lake Side', area: 'Setor Hoteleiro Norte', address: 'SHTN Tr. 01 Cj. 2 Bl. G Lj. 03 · Lake Side Hotel Residence', phone: '(61) 3035-5602', whatsapp: '556130355602', hours: weekdays(h(9), h(19), [h(9), h(18)]), hoursLabel: ['Seg a Sex · 09:00 às 19:00', CONSULTE] },
];

export const unitOf = (id: string) => units.find((u) => u.id === id)!;

/** Horário da unidade no dia (null = fechada). */
export const hoursOn = (unitId: string, day: Date): DayHours => unitOf(unitId).hours[day.getDay()];

/** Horário mais amplo entre todas as unidades (para eixos de gráfico e grade do painel). */
export const SPAN: [number, number] = [h(8, 30), h(21)];

// Barbeiros fictícios (o site não lista a equipe): 2 por unidade.
const b = (id: string, name: string, unitId: string, rating: number, reviews: number, specialties: string[], bio: string, color: string): Barber => ({
  id, name, short: name.split(' ')[0], unitId, rating, reviews, specialties, bio, color,
});
export const barbers: Barber[] = [
  b('b1', 'Rafael Monteiro', 'brasil21', 4.9, 214, ['Clássico', 'Navalha'], 'Cortes clássicos com acabamento na navalha.', '#6B4A2B'),
  b('b2', 'Thiago Andrade', 'brasil21', 4.8, 167, ['Degradê', 'Barba'], 'Degradê preciso e barba desenhada.', '#4A3A28'),
  b('b3', 'Diego Ramos', 'liberty', 4.9, 198, ['Social', 'Tesoura'], 'Especialista em cortes na tesoura.', '#5A4030'),
  b('b4', 'Lucas Prado', 'liberty', 4.7, 121, ['Degradê', 'Freestyle'], 'Desenhos e degradês modernos.', '#3E3022'),
  b('b5', 'Bruno Teles', 'plaza', 5.0, 251, ['Clássico', 'Barbaterapia'], 'O ritual completo da barba à moda antiga.', '#7A5532'),
  b('b6', 'Felipe Duarte', 'plaza', 4.8, 143, ['Degradê', 'Tonalizante'], 'Cor e corte na medida.', '#4E3A26'),
  b('b7', 'Gustavo Lemos', 'sul110', 4.9, 176, ['Clássico', 'Barba'], 'Tradição e capricho em cada detalhe.', '#5C432C'),
  b('b8', 'Marcos Vieira', 'sul110', 4.8, 132, ['Social', 'Navalha'], 'Acabamento impecável na navalha.', '#45352A'),
  b('b9', 'André Campos', 'decknorte', 4.9, 188, ['Degradê', 'Barba'], 'Degradê e barba desenhada.', '#6A4B30'),
  b('b10', 'Caio Nogueira', 'decknorte', 4.7, 98, ['Tesoura', 'Realinhamento'], 'Tratamentos e cortes na tesoura.', '#3F3124'),
  b('b11', 'Renato Faria', 'casapark', 4.9, 205, ['Clássico', 'Dia do Noivo'], 'Referência em Dia do Noivo.', '#704E2E'),
  b('b12', 'Igor Pacheco', 'casapark', 4.8, 117, ['Degradê', 'Barba'], 'Cortes modernos e barba alinhada.', '#4B3826'),
  b('b13', 'Paulo Siqueira', 'norte413', 4.9, 162, ['Social', 'Navalha'], 'Cortes sociais para o dia a dia.', '#5E4430'),
  b('b14', 'Vitor Lins', 'norte413', 4.7, 104, ['Degradê', 'Freestyle'], 'Estilo e precisão.', '#423226'),
  b('b15', 'Leandro Matos', 'lagosul', 4.9, 183, ['Clássico', 'Barbaterapia'], 'Experiência e atendimento caprichado.', '#674A2F'),
  b('b16', 'Samuel Rocha', 'lagosul', 4.8, 126, ['Tesoura', 'Hidratação'], 'Cabelo bem cuidado, do corte ao tratamento.', '#473629'),
  b('b17', 'Hugo Bastos', 'lakeside', 4.8, 149, ['Clássico', 'Barba'], 'Barba e corte com toalha quente.', '#5B4130'),
  b('b18', 'Daniel Arruda', 'lakeside', 4.7, 111, ['Degradê', 'Social'], 'Versátil nos cortes clássicos e atuais.', '#403025'),
];

/** Perfil do dono no painel (não atende): vê todas as unidades e o resumo da rede. */
export const OWNER_ID = 'owner';
export const ownerProfile = { id: OWNER_ID, name: 'Gerência Dom Cabral', short: 'Dom Cabral' };

/** Clientes fictícios que ocupam a agenda de exemplo (chave → nome). */
export const guests: Record<string, string> = {
  g1: 'Rafael Martins', g2: 'Lucas Pereira', g3: 'Thiago Souza', g4: 'Bruno Almeida', g5: 'Gustavo Lima',
  g6: 'Felipe Rocha', g7: 'Mateus Carvalho', g8: 'Pedro Henrique', g9: 'João Vitor', g10: 'Caio Ribeiro',
  g11: 'Diego Fernandes', g12: 'Marcelo Costa', g13: 'Vinícius Barros', g14: 'Henrique Dias', g15: 'Leonardo Melo',
  g16: 'Eduardo Nunes', g17: 'Rodrigo Teixeira', g18: 'André Luiz', g19: 'Samuel Freitas', g20: 'Daniel Moura',
};

/** Destaques que o cliente pode marcar ao avaliar. */
export const reviewTags = ['Pontualidade', 'Capricho', 'Atendimento', 'Ambiente', 'Preço justo'];

/** Código de indicação do cliente; também vale como cupom de desconto. */
export const REFERRAL_CODE = 'ANTONIO10';

/** Cupons aceitos no pagamento: código → % de desconto. */
export const coupons: Record<string, number> = { [REFERRAL_CODE]: 10 };

export const shop = {
  name: 'Dom Cabral Barbearia',
  slogan: 'Porque você merece o melhor',
  since: 2011,
  instagram: '@domcabralbarbearia',
  whatsapp: '5561991937000', // central: ajuda a escolher a unidade
};

export const reviews = [
  { who: 'Rafael M.', when: 'há 3 dias', stars: 5, text: 'Atendimento impecável, saí exatamente do jeito que pedi.' },
  { who: 'Lucas P.', when: 'há 1 semana', stars: 5, text: 'Ambiente top e a cerveja de cortesia fecha com chave de ouro.' },
  { who: 'Thiago S.', when: 'há 2 semanas', stars: 4, text: 'Ótimo corte, só atrasou uns minutinhos.' },
];
