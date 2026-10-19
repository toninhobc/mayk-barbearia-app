import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Sheet } from '@/components/sheet';
import { T } from '@/components/ui';
import { units } from '@/data/mock';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';

/** Escolha da unidade da Dom Cabral (define barbeiros e horários do agendamento). */
export function UnitSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const unitId = useStore((s) => s.unitId);
  const setUnit = useStore((s) => s.setUnit);
  return (
    <Sheet visible={visible} onClose={onClose} title="Escolha a unidade">
      <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
        {units.map((u) => {
          const on = u.id === unitId;
          return (
            <Pressable
              key={u.id}
              accessibilityLabel={`Unidade ${u.name}`}
              onPress={() => {
                setUnit(u.id);
                onClose();
              }}
              style={({ pressed }) => [s.row, on && s.on, pressed && { opacity: 0.7 }]}>
              <Feather name="map-pin" size={16} color={on ? colors.gold : colors.muted} />
              <View style={{ flex: 1 }}>
                <T v="semibold" size={14}>
                  {u.name}
                </T>
                <T size={12} color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                  {u.area} · {u.hoursLabel[0]}
                </T>
              </View>
              {on && <Feather name="check" size={18} color={colors.gold} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  on: { borderColor: colors.gold, backgroundColor: '#2A2112' },
});
