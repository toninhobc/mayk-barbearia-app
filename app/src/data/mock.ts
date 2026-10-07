export type Service = {
  id: string;
  name: string;
  category: 'Cabelo' | 'Barba' | 'Combos' | 'Estética';
  priceCents: number;
  minutes: number;
  description: string;
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

export const services: Service[] = [
  { id: 's1', name: 'Corte', category: 'Cabelo', priceCents: 4500, minutes: 40, description: 'Corte na tesoura ou máquina, finalização inclusa.' },
  { id: 's2', name: 'Barba', category: 'Barba', priceCents: 3500, minutes: 30, description: 'Toalha quente, navalha e hidratação.' },
  { id: 's3', name: 'Corte + Barba', category: 'Combos', priceCents: 7500, minutes: 70, description: 'O combo completo com desconto.' },
  { id: 's4', name: 'Barba + Barba Terapia', category: 'Combos', priceCents: 6000, minutes: 50, description: 'Barba com tratamento relaxante.' },
  { id: 's5', name: 'Pigmentação de barba', category: 'Estética', priceCents: 4000, minutes: 30, description: 'Preenche falhas e realça o contorno.' },
  { id: 's6', name: 'Barba + Pigmentação', category: 'Combos', priceCents: 7000, minutes: 60, description: 'Barba feita e pigmentada.' },
  { id: 's7', name: 'Sobrancelha', category: 'Estética', priceCents: 1500, minutes: 15, description: 'Design na navalha.' },
];

export const barbers: Barber[] = [
  { id: 'b1', name: 'André Mendonça Lima', short: 'André', rating: 4.9, reviews: 212, specialties: ['Degradê', 'Social'], bio: 'Especialista em cortes modernos.', color: '#8B5E3C' },
  { id: 'b2', name: 'David Sousa De Jesus Lopes', short: 'David', rating: 4.8, reviews: 168, specialties: ['Barba', 'Navalhado'], bio: 'Mestre da navalha.', color: '#5B6B4E' },
  { id: 'b3', name: 'Gabriel Oliveira Do Vale', short: 'Gabriel', rating: 4.9, reviews: 190, specialties: ['Degradê', 'Barba'], bio: 'Precisão e atendimento caprichado.', color: '#3E5A6B' },
  { id: 'b4', name: 'Kaio Rodrigues', short: 'Kaio', rating: 4.7, reviews: 131, specialties: ['Pigmentação', 'Freestyle'], bio: 'Desenhos e pigmentação.', color: '#6B3E5A' },
  { id: 'b5', name: 'Luiz Felipe Oliveira Silva', short: 'Luiz Felipe', rating: 5.0, reviews: 245, specialties: ['Corte clássico', 'Tesoura'], bio: 'O queridinho da casa.', color: '#7A4A2B' },
  { id: 'b6', name: 'Mayckson Vilar Azevedo', short: 'Mayckson', rating: 4.9, reviews: 300, specialties: ['Todos os estilos'], bio: 'Fundador da Mayk Barbearia.', color: '#2B1F18' },
];

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
