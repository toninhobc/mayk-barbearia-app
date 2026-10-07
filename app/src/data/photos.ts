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
  b1: null, // André
  b2: null, // David
  b3: null, // Gabriel
  b4: null, // Kaio
  b5: null, // Luiz Felipe
  b6: null, // Mayckson

  // Portfólio (quadradas)
  portfolio1: null,
  portfolio2: null,
  portfolio3: null,
  portfolio4: null,
  portfolio5: null,
  portfolio6: null,
};
