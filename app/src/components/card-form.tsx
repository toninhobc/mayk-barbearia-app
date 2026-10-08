import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { T } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

export type CardInput = { number: string; expiry: string; cvv: string; save: boolean };
export const emptyCard: CardInput = { number: '', expiry: '', cvv: '', save: true };

const digits = (t: string, max: number) => t.replace(/\D/g, '').slice(0, max);

export const cardBrand = (number: string) => {
  const n = number.replace(/\D/g, '');
  if (n.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'Elo';
  return 'Cartão';
};

/** null = ok; texto = o que falta corrigir (vazio enquanto incompleto). */
export function cardError(c: CardInput): string | null {
  const n = c.number.replace(/\D/g, '');
  const [mm, yy] = c.expiry.split('/');
  if (n.length < 16 || !mm || (yy ?? '').length < 2 || c.cvv.length < 3) return '';
  const month = +mm;
  if (month < 1 || month > 12) return 'Validade inválida.';
  const now = new Date();
  const year = 2000 + +yy;
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return 'Cartão vencido.';
  return null;
}

/** Formulário de cartão novo (demonstração: nada é enviado). */
export function CardForm({ value, onChange }: { value: CardInput; onChange: (c: CardInput) => void }) {
  const set = (patch: Partial<CardInput>) => onChange({ ...value, ...patch });
  const err = cardError(value);

  return (
    <View style={s.box}>
      <Field
        label="Número do cartão"
        value={value.number}
        placeholder="0000 0000 0000 0000"
        onChange={(t) => set({ number: digits(t, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })}
        right={value.number ? cardBrand(value.number) : undefined}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Validade"
            value={value.expiry}
            placeholder="MM/AA"
            onChange={(t) => {
              const d = digits(t, 4);
              set({ expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="CVV" value={value.cvv} placeholder="123" secure onChange={(t) => set({ cvv: digits(t, 4) })} />
        </View>
      </View>
      {err ? (
        <T size={12} color={colors.danger}>
          {err}
        </T>
      ) : null}
      <Pressable style={s.save} onPress={() => set({ save: !value.save })} hitSlop={6}>
        <View style={[s.check, value.save && s.checkOn]}>{value.save && <Feather name="check" size={13} color={colors.onGold} />}</View>
        <T size={13} color={colors.text}>
          Salvar cartão para os próximos pagamentos
        </T>
      </Pressable>
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  right,
  secure,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (t: string) => void;
  right?: string;
  secure?: boolean;
}) {
  return (
    <View>
      <T size={11} color={colors.muted} style={{ marginBottom: 6 }}>
        {label}
      </T>
      <View style={s.field}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.dim}
          keyboardType="number-pad"
          secureTextEntry={secure}
          style={s.input}
        />
        {right ? (
          <T v="semibold" size={12} color={colors.gold}>
            {right}
          </T>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: { gap: 12, marginTop: 2, marginBottom: 10, padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  field: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: radius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
  save: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.dim, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.gold, borderColor: colors.gold },
});
