import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldButton, Kicker, Photo, T, Wordmark } from '@/components/ui';
import { shop, units } from '@/data/mock';
import { photos } from '@/data/photos';
import { colors, space } from '@/theme';

export default function Welcome() {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Photo source={photos.shop} label="Foto da barbearia" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(21,16,12,0.2)', 'rgba(21,16,12,0.1)', 'rgba(21,16,12,0.92)', colors.bg]}
        locations={[0, 0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ alignItems: 'center', paddingTop: top + 36 }}>
        <Wordmark width={250} />
      </View>

      <View style={[s.content, { paddingBottom: bottom + 32 }]}>
        <Kicker>
          Desde {shop.since} · {units.length} unidades em Brasília
        </Kicker>
        <T v="display" size={36} style={{ lineHeight: 46, marginTop: 14 }}>
          Porque você
        </T>
        <T v="display" size={36} color={colors.goldLight} style={{ lineHeight: 46 }}>
          merece o melhor.
        </T>
        <T size={14} color="#C9BBA5" style={{ lineHeight: 22, marginTop: 16, marginBottom: 30 }}>
          Agende na sua unidade, pague por Pix e acumule pontos a cada visita. E a primeira bebida é por nossa conta.
        </T>
        <GoldButton label="Criar conta" icon="arrow-right" onPress={() => router.push('/cadastro')} />
        <Pressable onPress={() => router.push('/login')} style={({ pressed }) => [s.secondary, pressed && { opacity: 0.7 }]}>
          <T size={14} color={colors.muted}>
            Já tenho conta ·{' '}
            <T v="semibold" size={14}>
              Entrar
            </T>
          </T>
        </Pressable>
        <Pressable onPress={() => router.push('/equipe')} hitSlop={8} style={({ pressed }) => [s.staff, pressed && { opacity: 0.7 }]}>
          <T size={12} color={colors.muted}>
            Sou da equipe Dom Cabral · <T v="semibold" size={12} color={colors.gold}>Acessar painel</T>
          </T>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  secondary: { marginTop: 12, height: 54, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  staff: { alignSelf: 'center', marginTop: 18, paddingVertical: 4 },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: space.xl - 2 },
});
