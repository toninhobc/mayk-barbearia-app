import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { CardForm, cardBrand, cardError, emptyCard, type CardInput } from '@/components/card-form';
import { barberOf } from '@/components/cards';
import { Footer, GoldButton, Header, Kicker, T, type IconName } from '@/components/ui';
import { brl, dateLong, hhmm } from '@/lib/format';
import { draftTotals, useStore, type PayMethod } from '@/store';
import { colors, radius, space } from '@/theme';

const methods: { id: PayMethod; title: string; sub: string; icon: IconName; tag?: string }[] = [
  { id: 'pix', title: 'Pix', sub: 'Aprovação na hora', icon: 'zap', tag: 'Recomendado' },
  { id: 'cartao', title: 'Cartão de crédito', sub: '', icon: 'credit-card' }, // texto vem do cartão salvo
  { id: 'local', title: 'Pagar na barbearia', sub: 'Dinheiro, Pix ou cartão no balcão', icon: 'home' },
];

/** QR Code ilustrativo (na versão real vem do Mercado Pago). */
function FakeQR({ size = 180 }: { size?: number }) {
  const n = 25;
  const cells = useMemo(() => {
    const out: [number, number][] = [];
    let seed = 7;
    const finder = (x: number, y: number) =>
      [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        if (finder(x, y)) continue;
        seed = (seed * 9301 + 49297) % 233280;
        if (seed / 233280 > 0.52) out.push([x, y]);
      }
    return out;
  }, []);
  const c = size / n;
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <>
      <Rect x={x * c} y={y * c} width={7 * c} height={7 * c} fill="#111" />
      <Rect x={(x + 1) * c} y={(y + 1) * c} width={5 * c} height={5 * c} fill="#fff" />
      <Rect x={(x + 2) * c} y={(y + 2) * c} width={3 * c} height={3 * c} fill="#111" />
    </>
  );
  return (
    <Svg width={size} height={size}>
      <Rect width={size} height={size} fill="#fff" />
      {cells.map(([x, y]) => (
        <Rect key={`${x}-${y}`} x={x * c} y={y * c} width={c} height={c} fill="#111" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={n - 7} y={0} />
      <Finder x={0} y={n - 7} />
    </Svg>
  );
}

export default function Pagamento() {
  const { draft, confirm, savedCard, saveCard } = useStore();
  const [method, setMethod] = useState<PayMethod>('pix');
  const [card, setCard] = useState<CardInput>(emptyCard);
  const [useNewCard, setUseNewCard] = useState(false);
  const newCard = method === 'cartao' && (!savedCard || useNewCard);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState(600);
  const totals = draftTotals(draft.serviceIds);
  const barber = draft.barberId ? barberOf(draft.barberId) : null;
  const pixCode = '00020126580014BR.GOV.BCB.PIX0136mayk-barbearia-demo5204000053039865802BR';

  useEffect(() => {
    const t = setInterval(() => setSecs((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  if (!draft.day || draft.slot == null) return null;
  const day = new Date(draft.day);

  const finish = () => {
    setBusy(true);
    if (newCard && card.save) {
      const n = card.number.replace(/\D/g, '');
      saveCard({ brand: cardBrand(n), last4: n.slice(-4) });
    }
    setTimeout(() => {
      const appt = confirm(method);
      router.dismissAll();
      router.replace({ pathname: '/agendar/sucesso', params: { id: appt.id } });
    }, method === 'local' ? 300 : 1200);
  };

  const cta = method === 'pix' ? 'Já fiz o Pix' : method === 'cartao' ? `Pagar ${brl(totals.cents)}` : 'Confirmar agendamento';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Pagamento" subtitle="Último passo" />
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingTop: 8 }}>
        {/* Resumo */}
        <View style={s.summary}>
          <Kicker>Resumo</Kicker>
          <T v="serif" size={22} style={{ marginTop: 10 }}>
            {dateLong(day)}
          </T>
          <T size={13} color={colors.muted} style={{ marginTop: 4 }}>
            {hhmm(draft.slot)} – {hhmm(draft.slot + totals.minutes)} · {barber ? `com ${barber.short}` : 'Primeiro barbeiro livre'}
          </T>
          <View style={s.divider} />
          {totals.list.map((sv) => (
            <View key={sv.id} style={s.line}>
              <T size={14} color="#D2D2D2">
                {sv.name}
              </T>
              <T size={14} color="#D2D2D2">
                {brl(sv.priceCents)}
              </T>
            </View>
          ))}
          <View style={[s.line, { marginTop: 6 }]}>
            <T v="semibold" size={16}>
              Total
            </T>
            <T v="semibold" size={16} color={colors.goldLight}>
              {brl(totals.cents)}
            </T>
          </View>
        </View>

        <T v="serif" size={22} style={{ marginTop: 26, marginBottom: 14 }}>
          Como você quer pagar?
        </T>
        {methods.map((m) => {
          const on = method === m.id;
          return (
            <Pressable key={m.id} onPress={() => setMethod(m.id)} style={[s.method, on && s.methodOn]}>
              <View style={s.mIcon}>
                <Feather name={m.icon} size={19} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <T v="semibold" size={15}>
                    {m.title}
                  </T>
                  {m.tag && (
                    <View style={s.tag}>
                      <T v="semibold" size={10} color={colors.onGold}>
                        {m.tag}
                      </T>
                    </View>
                  )}
                </View>
                <T size={12} color={colors.muted} style={{ marginTop: 2 }}>
                  {m.id === 'cartao' ? (savedCard && !useNewCard ? `${savedCard.brand} •••• ${savedCard.last4}` : 'Novo cartão') : m.sub}
                </T>
              </View>
              <View style={[s.radio, on && { borderColor: colors.gold }]}>{on && <View style={s.radioDot} />}</View>
            </Pressable>
          );
        })}

        {method === 'cartao' && savedCard && (
          <Pressable onPress={() => setUseNewCard(!useNewCard)} hitSlop={8} style={s.switchCard}>
            <T v="semibold" size={13} color={colors.gold}>
              {useNewCard ? `Usar ${savedCard.brand} •••• ${savedCard.last4}` : 'Usar outro cartão'}
            </T>
          </Pressable>
        )}
        {newCard && <CardForm value={card} onChange={setCard} />}

        {method === 'pix' && (
          <View style={s.pix}>
            <View style={s.qrWrap}>
              <FakeQR />
            </View>
            <T size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 12 }}>
              Escaneie no app do seu banco ou copie o código.{'\n'}Expira em{' '}
              <T v="semibold" size={12} color={colors.goldLight}>
                {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
              </T>
            </T>
            <Pressable
              style={s.copy}
              onPress={async () => {
                await Clipboard.setStringAsync(pixCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}>
              <T size={12} color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
                {pixCode}
              </T>
              <Feather name={copied ? 'check' : 'copy'} size={16} color={colors.gold} />
              <T v="semibold" size={13} color={colors.gold}>
                {copied ? 'Copiado' : 'Copiar'}
              </T>
            </Pressable>
          </View>
        )}

        <View style={s.secure}>
          <Feather name="lock" size={13} color={colors.muted} />
          <T size={11} color={colors.muted}>
            Pagamento seguro via Mercado Pago (simulado nesta demonstração)
          </T>
        </View>
      </ScrollView>
      <Footer>
        {busy ? (
          <View style={s.busy}>
            <ActivityIndicator color={colors.gold} />
            <T v="medium" color={colors.goldLight}>
              {method === 'pix' ? 'Confirmando seu Pix...' : 'Processando...'}
            </T>
          </View>
        ) : (
          <GoldButton style={{ flex: 1 }} label={cta} disabled={newCard && cardError(card) !== null} onPress={finish} />
        )}
      </Footer>
    </View>
  );
}

const s = StyleSheet.create({
  summary: { padding: 20, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(200,161,90,0.28)' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 16 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginBottom: 10 },
  methodOn: { borderColor: colors.gold, backgroundColor: '#17140F' },
  mIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center' },
  tag: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.dim, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  pix: { marginTop: 6, padding: 20, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  qrWrap: { padding: 12, backgroundColor: '#fff', borderRadius: 16 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, alignSelf: 'stretch', padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.gold },
  switchCard: { alignSelf: 'flex-start', marginTop: -2, marginBottom: 12, marginLeft: 4 },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, marginBottom: 8 },
  busy: { flex: 1, height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
});
