/** Paleta Dom Cabral: café, couro, dourado e creme (do logo e das lojas). */
export const colors = {
  bg: '#15100C', // café escuro
  surface: '#1F1812',
  surface2: '#2A2119',
  line: '#3A2E23',
  text: '#F4EBD8', // creme
  muted: '#A89A88',
  dim: '#5E5044',
  gold: '#BE9A29', // dourado do logo
  goldLight: '#D8B85A',
  goldDark: '#33280F',
  brown: '#47382A', // marrom do logo
  silver: '#E6DAC3',
  onGold: '#1A130C',
  success: '#6FBF8A',
  danger: '#E06A5A',
};

export const goldGradient = [colors.goldLight, colors.gold] as const;

export const fonts = {
  display: 'Rye_400Regular', // títulos em estilo placa antiga
  serif: 'PlayfairDisplay_700Bold',
  serifItalic: 'PlayfairDisplay_700Bold_Italic',
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
};

export const radius = { sm: 12, md: 20, lg: 32, pill: 999 };
export const space = { xs: 4, sm: 8, md: 16, gutter: 22, lg: 24, xl: 32 };
