export const colors = {
  bg: '#0A0A0A',
  surface: '#141414',
  surface2: '#1C1C1C',
  line: '#2A2A2A',
  text: '#F2F2F2',
  muted: '#8C8C8C',
  dim: '#4A4A4A',
  gold: '#C8A15A',
  goldLight: '#E3C485',
  goldDark: '#2A2318',
  silver: '#C9CCD1',
  onGold: '#141414',
  success: '#5FBF8A',
  danger: '#E06A5A',
};

export const goldGradient = [colors.goldLight, colors.gold] as const;

export const fonts = {
  serif: 'PlayfairDisplay_500Medium',
  serifItalic: 'PlayfairDisplay_500Medium_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const radius = { sm: 12, md: 20, lg: 32, pill: 999 };
export const space = { xs: 4, sm: 8, md: 16, gutter: 22, lg: 24, xl: 32 };
