import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldButton, Kicker, Logo, Photo, T } from '@/components/ui';
import { photos } from '@/data/photos';
import { colors, space } from '@/theme';

export default function Welcome() {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Photo source={photos.shop} label="Foto da barbearia" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(10,10,10,0.2)', 'rgba(10,10,10,0.1)', 'rgba(10,10,10,0.92)', colors.bg]}
        locations={[0, 0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ alignItems: 'center', paddingTop: top + 48 }}>
        <Logo size={84} />
      </View>

      <View style={[s.content, { paddingBottom: bottom + 32 }]}>
        <Kicker>Mayk Barbearia · Brasília</Kicker>
        <T v="serif" size={44} style={{ lineHeight: 48, marginTop: 14 }}>
          Seu estilo,
        </T>
        <T v="serifItalic" size={44} color={colors.goldLight} style={{ lineHeight: 50 }}>
          no seu tempo.
        </T>
        <T size={14} color="#A9A9A9" style={{ lineHeight: 22, marginTop: 16, marginBottom: 30 }}>
          Agende com seu barbeiro favorito, pague por Pix e acumule pontos a cada visita.
        </T>
        <GoldButton label="Agendar agora" icon="arrow-right" onPress={() => router.push('/login')} />
        <Pressable onPress={() => router.push('/login')} style={{ marginTop: 16, alignItems: 'center' }} hitSlop={8}>
          <T size={13} color={colors.muted}>
            Já tem conta?{' '}
            <T v="semibold" size={13}>
              Entrar
            </T>
          </T>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: space.xl - 2 },
});
