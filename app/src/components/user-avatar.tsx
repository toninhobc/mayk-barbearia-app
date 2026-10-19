import { Feather } from '@expo/vector-icons';
import { Image, View } from 'react-native';
import { T } from '@/components/ui';
import { useStore } from '@/store';
import { colors } from '@/theme';

/** Foto do cliente; sem foto, mostra a inicial do nome (ou um ícone, se ainda não há nome). */
export function UserAvatar({ size, ring, name }: { size: number; ring?: boolean; name?: string }) {
  const me = useStore((s) => s.me);
  const initial = (name ?? me.name).trim()[0]?.toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: ring ? colors.surface2 : '#2A2119',
        borderWidth: 1,
        borderColor: ring ? colors.gold : colors.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {me.photo ? (
        <Image source={{ uri: me.photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : initial ? (
        <T v={ring ? 'serif' : 'semibold'} size={ring ? size * 0.41 : size * 0.36} color={ring ? colors.goldLight : colors.silver}>
          {initial}
        </T>
      ) : (
        <Feather name="user" size={size * 0.42} color={colors.dim} />
      )}
    </View>
  );
}
