import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Header, Logo, Photo, T } from '@/components/ui';
import { barbers, OWNER_ID, ownerProfile, units } from '@/data/mock';
import { photos } from '@/data/photos';
import { useStore } from '@/store';
import { colors, radius, space } from '@/theme';

/** Entrada da equipe: cada barbeiro (e o dono) escolhe seu perfil para abrir o painel. */
export default function Equipe() {
  const staffLogin = useStore((s) => s.staffLogin);
  const enter = (id: string) => {
    staffLogin(id);
    router.replace('/painel');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Acesso da equipe" subtitle="Quem está entrando?" />
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingTop: 8, paddingBottom: 40 }}>
        <StaffRow
          name={ownerProfile.name}
          detail="Dono · agenda e resumo de todas as unidades"
          owner
          onPress={() => enter(OWNER_ID)}
        />
        {units.map((u) => (
          <View key={u.id}>
            <T v="medium" size={11} color={colors.muted} style={s.unit}>
              {u.name.toUpperCase()}
            </T>
            {barbers
              .filter((b) => b.unitId === u.id)
              .map((b) => (
                <StaffRow key={b.id} id={b.id} name={b.name} detail="Barbeiro · sua agenda e seus números" onPress={() => enter(b.id)} />
              ))}
          </View>
        ))}
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

function StaffRow({ id, name, detail, owner, onPress }: { id?: string; name: string; detail: string; owner?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, owner && s.owner, pressed && { opacity: 0.7 }]}>
      {id ? <Photo source={photos[id]} label="" radius={16} style={{ width: 52, height: 52 }} /> : <Logo size={52} />}
      <View style={{ flex: 1 }}>
        <T v="semibold" size={15}>
          {name}
        </T>
        <T size={12} color={owner ? colors.goldLight : colors.muted} style={{ marginTop: 3 }}>
          {detail}
        </T>
      </View>
      <Feather name="chevron-right" size={18} color={colors.dim} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  owner: { borderColor: 'rgba(190,154,41,0.45)', backgroundColor: '#2A2112' },
  unit: { letterSpacing: 1.5, marginTop: 14, marginBottom: 8, marginLeft: 4 },
  note: { flexDirection: 'row', gap: 8, marginTop: 12, paddingHorizontal: 4 },
});
