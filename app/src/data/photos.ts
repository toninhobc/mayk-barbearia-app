import type { ImageSourcePropType } from 'react-native';

/**
 * Fotos reais do app.
 *
 * Para usar uma foto: coloque o arquivo em `assets/photos/` e troque o `null`
 * correspondente por `require('../../assets/photos/NOME.jpg')`.
 * Enquanto for `null`, o app mostra um espaço reservado listrado com "FOTO".
 */
export const photos: Record<string, ImageSourcePropType | null> = {
  // Tela de boas-vindas (vertical, ideal 1080x1920)
  shop: require('../../assets/photos/shop.jpg'),

  // Barbeiros (vertical, ideal 800x1000)
  b1: null,
  b2: null,
  b3: null,
  b4: null,
  b5: null,
  b6: null,
  b7: null,
  b8: null,
  b9: null,
  b10: null,
  b11: null,
  b12: null,
  b13: null,
  b14: null,
  b15: null,
  b16: null,
  b17: null,
  b18: null,

  // Portfólio (quadradas)
  portfolio1: null,
  portfolio2: null,
  portfolio3: null,
  portfolio4: null,
  portfolio5: null,
  portfolio6: null,
};
