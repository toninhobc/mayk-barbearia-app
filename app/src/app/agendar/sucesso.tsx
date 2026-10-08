import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apptTitle, barberOf, timeOf } from '@/components/cards';
import { GoldButton, Kicker, OutlineButton, T } from '@/components/ui';
import { brl, dateLong } from '@/lib/format';
import { useStore } from '@/store';
import { colors, goldGradient, space } from '@/theme';

const methodName = { pix: 'Pago via Pix', cartao: 'Pago no cartão', local: 'Pagar na barbearia' } as const;

export default function Sucesso() {
  const { id, remarcado } = useLocalSearchParams<{ id: string; remarcado?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const a = useStore((s) => s.appointments.find((x) => x.id === id));
  const notifications = useStore((s) => s.notifications);
  if (!a) return null;
  const b = barberOf(a.barberId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: top + 60, paddingBottom: bottom + 24, paddingHorizontal: space.gutter }}>
      <View style={{ alignItems: 'center' }}>
        <LinearGradient colors={goldGradient} style={s.check}>
          <Feather name="check" size={44} color={colors.onGold} />
        </LinearGradient>
        <T v="serif" size={34} style={{ marginTop: 24, textAlign: 'center' }}>
          {remarcado ? 'Horário remarcado' : 'Horário confirmado'}
        </T>
        <T size={14} color={colors.muted} style={{ marginTop: 8, textAlign: 'center', lineHeight: 21 }}>
          {notifications
            ? "Te esperamos! Você receberá lembretes\n24h e 2h antes do atendimento."
            : 'Te esperamos! Seus lembretes estão\ndesativados. Ative em Perfil › Notificações.'}
        </T>
      </View>

      <View style={s.ticket}>
        <Kicker>Seu atendimento</Kicker>
        <T v="serif" size={24} style={{ marginTop: 10 }}>
          {apptTitle(a)}
        </T>
        <View style={s.grid}>
          {[
            { l: 'Data', v: dateLong(new Date(a.start)) },
            { l: 'Horário', v: timeOf(a.start) },
            { l: 'Barbeiro', v: b.short },
            { l: 'Pagamento', v: `${brl(a.totalCents)} · ${methodName[a.method]}` },
          ].map((x) => (
            <View key={x.l} style={{ width: x.l === 'Data' || x.l === 'Pagamento' ? '100%' : '50%', marginTop: 14 }}>
              <T size={11} color={colors.muted}>
                {x.l}
              </T>
              <T v="medium" size={14} style={{ marginTop: 2 }}>
                {x.v}
              </T>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ gap: 12 }}>
        <GoldButton label="Ver meus horários" onPress={() => router.replace('/agenda')} />
        <OutlineButton label="Voltar ao início" onPress={() => router.replace('/inicio')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  check: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  ticket: { marginTop: 32, padding: 20, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(200,161,90,0.28)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
