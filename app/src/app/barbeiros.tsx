import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Header, Logo, Photo, T } from '@/components/ui';
import { barbers, unitOf } from '@/data/mock';
import { photos } from '@/data/photos';
import { UnitSheet } from '@/components/unit-sheet';
import { useStore } from '@/store';
import { colors, radius, space } from '@/theme';

export default function Barbeiros() {
  const { setBarber, favorites, unitId } = useStore();
  const unit = unitOf(unitId);
  const [picking, setPicking] = useState(false);
  const open = (id: string | null) => {
    setBarber(id);
    router.push({ pathname: '/barbeiro/[id]', params: { id: id ?? 'qualquer' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Barbeiros" subtitle="Com quem você quer cortar?" />
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingTop: 8 }}>
        <Pressable onPress={() => setPicking(true)} hitSlop={6} style={s.unit} accessibilityLabel="Trocar unidade">
          <Feather name="map-pin" size={14} color={colors.gold} />
          <T size={13} color={colors.muted} style={{ flex: 1 }}>
            Unidade{' '}
            <T v="semibold" size={13}>
              {unit.name}
            </T>
          </T>
          <T v="semibold" size={13} color={colors.gold}>
            Trocar
          </T>
        </Pressable>
        <Pressable style={s.any} onPress={() => open(null)}>
          <Logo size={52} />
          <View style={{ flex: 1 }}>
            <T v="semibold" size={16}>
              Sem preferência
            </T>
            <T size={12} color={colors.muted} style={{ marginTop: 3 }}>
              Primeiro horário disponível com qualquer barbeiro
            </T>
          </View>
          <Feather name="chevron-right" size={20} color={colors.gold} />
        </Pressable>

        <View style={s.grid}>
          {barbers.filter((b) => b.unitId === unitId).map((b) => (
            <Pressable key={b.id} style={s.cell} onPress={() => open(b.id)}>
              <View>
                <Photo source={photos[b.id]} radius={20} style={{ height: 190 }} />
                {favorites.includes(b.id) && (
                  <View style={s.fav}>
                    <Feather name="heart" size={13} color={colors.gold} />
                  </View>
                )}
              </View>
              <T v="semibold" size={15} style={{ marginTop: 10 }} numberOfLines={1}>
                {b.short}
              </T>
              <T size={12} color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                <T size={12} color={colors.gold}>
                  ★
                </T>{' '}
                {b.rating.toFixed(1)} ({b.reviews}) · {b.specialties[0]}
              </T>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <UnitSheet visible={picking} onClose={() => setPicking(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  unit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  any: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(190,154,41,0.35)', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22 },
  cell: { width: '48%' },
  fav: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});
