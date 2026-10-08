import { Image, View } from 'react-native';
import { T } from '@/components/ui';
import { useStore } from '@/store';
import { colors } from '@/theme';

/** Foto do cliente; sem foto, mostra a inicial do nome. */
export function UserAvatar({ size, ring }: { size: number; ring?: boolean }) {
  const me = useStore((s) => s.me);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: ring ? colors.surface2 : '#2B2B2B',
        borderWidth: 1,
        borderColor: ring ? colors.gold : colors.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {me.photo ? (
        <Image source={{ uri: me.photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <T v={ring ? 'serif' : 'semibold'} size={ring ? size * 0.41 : size * 0.36} color={ring ? colors.goldLight : colors.silver}>
          {me.name[0]}
        </T>
      )}
    </View>
  );
}
