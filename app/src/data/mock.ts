/** Mesmas categorias do app que a barbearia usa hoje. */
export const categories = ['Barba', 'Cabelo', 'Estética', 'Tratamento capilar'] as const;
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
  rating: number;
  reviews: number;
  specialties: string[];
  bio: string;
  color: string;
};

// Catálogo do app atual da barbearia. Corte = R$ 90; os demais preços e
// durações são estimativas proporcionais, a confirmar com a barbearia.
export const services: Service[] = [
  // Barba
  { id: 's2', name: 'Barba', category: 'Barba', priceCents: 7000, minutes: 30, description: 'Toalha quente, navalha e hidratação.' },
  { id: 's4', name: 'Barba + Barba terapia', category: 'Barba', priceCents: 11000, minutes: 50, description: 'Barba com tratamento relaxante.', includes: ['s2'] },
  { id: 's6', name: 'Barba + Pigmentação', category: 'Barba', priceCents: 13000, minutes: 60, description: 'Barba feita e pigmentada.', includes: ['s2', 's5'] },
  { id: 's5', name: 'Pigmentação de barba', category: 'Barba', priceCents: 8000, minutes: 30, description: 'Preenche falhas e realça o contorno.' },
  // Cabelo
  { id: 's8', name: 'Coloração / Tonalização', category: 'Cabelo', priceCents: 12000, minutes: 45, description: 'Cor uniforme ou cobertura de fios brancos.' },
  { id: 's1', name: 'Corte', category: 'Cabelo', priceCents: 9000, minutes: 40, description: 'Corte na tesoura ou máquina, finalização inclusa.' },
  { id: 's3', name: 'Corte + Barba', category: 'Cabelo', priceCents: 14500, minutes: 70, description: 'O combo completo com desconto.', includes: ['s1', 's2'] },
  { id: 's9', name: 'Corte + Barba + Selagem', category: 'Cabelo', priceCents: 29000, minutes: 130, description: 'Combo completo com selagem dos fios.', includes: ['s1', 's2', 's11'] },
  { id: 's10', name: 'Corte + Selagem', category: 'Cabelo', priceCents: 23000, minutes: 100, description: 'Corte e selagem com desconto.', includes: ['s1', 's11'] },
  { id: 's12', name: 'Depilação com cera', category: 'Cabelo', priceCents: 5000, minutes: 15, description: 'Acabamento com cera quente.' },
  { id: 's13', name: 'Lavagem relaxante', category: 'Cabelo', priceCents: 5000, minutes: 20, description: 'Lavagem com massagem no couro cabeludo.' },
  { id: 's14', name: 'Penteado', category: 'Cabelo', priceCents: 5000, minutes: 20, description: 'Finalização com produto para a ocasião.' },
  { id: 's15', name: 'Pezinho', category: 'Cabelo', priceCents: 4000, minutes: 15, description: 'Acabamento do contorno entre cortes.' },
  { id: 's16', name: 'Relaxamento', category: 'Cabelo', priceCents: 14000, minutes: 60, description: 'Reduz o volume e solta os cachos.' },
  { id: 's11', name: 'Selagem', category: 'Cabelo', priceCents: 16000, minutes: 60, description: 'Alinha os fios e tira o frizz.' },
  // Estética
  { id: 's17', name: 'Consultoria', category: 'Estética', priceCents: 6000, minutes: 30, description: 'Indicação de corte e cuidados para o seu rosto.' },
  { id: 's18', name: 'Depilação de nariz', category: 'Estética', priceCents: 3000, minutes: 10, description: 'Remoção dos pelos com cera.' },
  { id: 's19', name: 'Depilação de orelha', category: 'Estética', priceCents: 3000, minutes: 10, description: 'Remoção dos pelos com cera.' },
  { id: 's7', name: 'Design de sobrancelha', category: 'Estética', priceCents: 3500, minutes: 15, description: 'Design na navalha.' },
  // Tratamento capilar
  { id: 's20', name: 'Hidratação', category: 'Tratamento capilar', priceCents: 8000, minutes: 30, description: 'Repõe a água dos fios.' },
  { id: 's21', name: 'Nutrição', category: 'Tratamento capilar', priceCents: 10000, minutes: 30, description: 'Repõe óleos e dá brilho.' },
  { id: 's22', name: 'Reconstrução', category: 'Tratamento capilar', priceCents: 12000, minutes: 40, description: 'Fortalece fios danificados.' },
  { id: 's23', name: 'Tratamento Derma Peeling', category: 'Tratamento capilar', priceCents: 14000, minutes: 40, description: 'Esfoliação e limpeza do couro cabeludo.' },
];

/** Destaques da tela Início. */
export const popular = ['s1', 's3', 's2', 's7'];

export const barbers: Barber[] = [
  { id: 'b1', name: 'André Mendonça Lima', short: 'André', rating: 4.9, reviews: 212, specialties: ['Degradê', 'Social'], bio: 'Especialista em cortes modernos.', color: '#8B5E3C' },
  { id: 'b2', name: 'David Sousa De Jesus Lopes', short: 'David', rating: 4.8, reviews: 168, specialties: ['Barba', 'Navalhado'], bio: 'Mestre da navalha.', color: '#5B6B4E' },
  { id: 'b3', name: 'Gabriel Oliveira Do Vale', short: 'Gabriel', rating: 4.9, reviews: 190, specialties: ['Degradê', 'Barba'], bio: 'Precisão e atendimento caprichado.', color: '#3E5A6B' },
  { id: 'b4', name: 'Kaio Rodrigues', short: 'Kaio', rating: 4.7, reviews: 131, specialties: ['Pigmentação', 'Freestyle'], bio: 'Desenhos e pigmentação.', color: '#6B3E5A' },
  { id: 'b5', name: 'Luiz Felipe Oliveira Silva', short: 'Luiz Felipe', rating: 5.0, reviews: 245, specialties: ['Corte clássico', 'Tesoura'], bio: 'O queridinho da casa.', color: '#7A4A2B' },
  { id: 'b6', name: 'Mayckson Vilar Azevedo', short: 'Mayckson', rating: 4.9, reviews: 300, specialties: ['Todos os estilos'], bio: 'Fundador da Mayk Barbearia.', color: '#2B1F18' },
];

/** Código de indicação do cliente; também vale como cupom de desconto. */
export const REFERRAL_CODE = 'ANTONIO10';

/** Cupons aceitos no pagamento: código → % de desconto. */
export const coupons: Record<string, number> = { [REFERRAL_CODE]: 10 };

export const shop = {
  name: 'Mayk Barbearia',
  address: 'Brasília - DF',
  openMinutes: 9 * 60,
  closeMinutes: 20 * 60,
  closedWeekday: 0, // domingo
  hours: 'Seg a Sáb · 09h às 20h',
  instagram: '@maykbarbearia',
};

export const reviews = [
  { who: 'Rafael M.', when: 'há 3 dias', stars: 5, text: 'Atendimento impecável, saí exatamente do jeito que pedi.' },
  { who: 'Lucas P.', when: 'há 1 semana', stars: 5, text: 'Pontual e muito caprichoso. Ambiente top.' },
  { who: 'Thiago S.', when: 'há 2 semanas', stars: 4, text: 'Ótimo corte, só atrasou uns minutinhos.' },
];
