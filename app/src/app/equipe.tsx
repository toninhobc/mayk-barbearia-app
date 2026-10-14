import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Header, Photo, T } from '@/components/ui';
import { barbers, OWNER_ID } from '@/data/mock';
import { photos } from '@/data/photos';
import { useStore } from '@/store';
import { colors, radius, space } from '@/theme';

/** Entrada da equipe: cada barbeiro (e o dono) escolhe seu perfil para abrir o painel. */
export default function Equipe() {
  const staffLogin = useStore((s) => s.staffLogin);
  // dono primeiro
  const team = [...barbers].sort((a, b) => Number(b.id === OWNER_ID) - Number(a.id === OWNER_ID));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Acesso da equipe" subtitle="Quem está entrando?" />
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingTop: 8, paddingBottom: 40 }}>
        {team.map((b) => {
          const owner = b.id === OWNER_ID;
          return (
            <Pressable
              key={b.id}
              onPress={() => {
                staffLogin(b.id);
                router.replace('/painel');
              }}
              style={({ pressed }) => [s.row, owner && s.owner, pressed && { opacity: 0.7 }]}>
              <Photo source={photos[b.id]} label="" radius={16} style={{ width: 52, height: 52 }} />
              <View style={{ flex: 1 }}>
                <T v="semibold" size={15}>
                  {b.name}
                </T>
                <T size={12} color={owner ? colors.goldLight : colors.muted} style={{ marginTop: 3 }}>
                  {owner ? 'Dono · agenda de todos e resumo da casa' : 'Barbeiro · sua agenda e seus números'}
                </T>
              </View>
              <Feather name="chevron-right" size={18} color={colors.dim} />
            </Pressable>
          );
        })}
        <View style={s.note}>
          <Feather name="lock" size={14} color={colors.muted} />
          <T size={12} color={colors.muted} style={{ flex: 1, lineHeight: 18 }}>
            Demonstração: na versão final, cada pessoa da equipe entra com o próprio login e senha.
          </T>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  owner: { borderColor: 'rgba(200,161,90,0.45)', backgroundColor: '#17140F' },
  note: { flexDirection: 'row', gap: 8, marginTop: 12, paddingHorizontal: 4 },
});
