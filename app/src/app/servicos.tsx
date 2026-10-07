import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ServiceRow } from '@/components/cards';
import { Chip, Footer, GoldButton, Header, T } from '@/components/ui';
import { services } from '@/data/mock';
import { brl } from '@/lib/format';
import { draftTotals, useStore } from '@/store';
import { colors, fonts, radius, space } from '@/theme';

const categories = ['Todos', 'Cabelo', 'Barba', 'Combos', 'Estética'] as const;

export default function Servicos() {
  const { draft, toggleService } = useStore();
  const [cat, setCat] = useState<(typeof categories)[number]>('Todos');
  const [q, setQ] = useState('');
  const totals = draftTotals(draft.serviceIds);

  const list = useMemo(
    () => services.filter((sv) => (cat === 'Todos' || sv.category === cat) && sv.name.toLowerCase().includes(q.trim().toLowerCase())),
    [cat, q],
  );

  const next = () => {
    if (draft.barberId) router.push({ pathname: '/barbeiro/[id]', params: { id: draft.barberId } });
    else router.push('/barbeiros');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Serviços" subtitle="Escolha um ou mais" />
      <View style={{ paddingHorizontal: space.gutter, gap: 14 }}>
        <View style={s.search}>
          <Feather name="search" size={17} color={colors.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Buscar serviço..." placeholderTextColor={colors.dim} style={s.input} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.gutter }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.gutter }}>
          {categories.map((c) => (
            <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: space.gutter }}>
        {list.map((sv) => (
          <ServiceRow key={sv.id} sv={sv} on={draft.serviceIds.includes(sv.id)} onPress={() => toggleService(sv.id)} />
        ))}
        {list.length === 0 && (
          <T color={colors.muted} style={{ textAlign: 'center', marginTop: 30 }}>
            Nenhum serviço encontrado.
          </T>
        )}
      </ScrollView>
      <Footer>
        <View>
          <T size={12} color={colors.muted}>
            {totals.list.length ? `${totals.list.length} serviço(s) · ${totals.minutes} min` : 'Total'}
          </T>
          <T v="semibold" size={20}>
            {brl(totals.cents)}
          </T>
        </View>
        <GoldButton style={{ flex: 1 }} label={draft.barberId ? 'Ver horários' : 'Escolher barbeiro'} disabled={!totals.list.length} onPress={next} />
      </Footer>
    </View>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
});
