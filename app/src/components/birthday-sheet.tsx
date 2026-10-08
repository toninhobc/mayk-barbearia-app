import { useRef, useState, type Ref } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Sheet } from '@/components/sheet';
import { GoldButton, OutlineButton, T } from '@/components/ui';
import { useStore, type Birthday } from '@/store';
import { colors, fonts, radius } from '@/theme';

const digits = (t: string, max: number) => t.replace(/\D/g, '').slice(0, max);

/** Retorna a data ou uma mensagem de erro (null = ainda incompleta). */
function parse(d: string, m: string, y: string): Birthday | string | null {
  // "0" sozinho é o começo de "05": ainda incompleto, não um erro
  if (!d || !m || d === '0' || m === '0') return null;
  const day = +d;
  const month = +m;
  if (month < 1 || month > 12) return 'Mês inválido.';
  if (y && y.length < 4) return null;
  const year = y ? +y : undefined;
  if (year !== undefined && (year < 1900 || year > new Date().getFullYear())) return 'Ano inválido.';
  // sem ano, 29/02 é aceito (usa um ano bissexto como referência)
  const maxDay = new Date(year ?? 2000, month, 0).getDate();
  if (day < 1 || day > maxDay) return 'Dia inválido para esse mês.';
  return { day, month, year };
}

export function BirthdaySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Data de aniversário">
      {/* montado só com a janela aberta: cada abertura começa da data salva */}
      {visible && <BirthdayForm onDone={onClose} />}
    </Sheet>
  );
}

function BirthdayForm({ onDone }: { onDone: () => void }) {
  const { birthday, setBirthday } = useStore();
  const [d, setD] = useState(birthday ? String(birthday.day).padStart(2, '0') : '');
  const [m, setM] = useState(birthday ? String(birthday.month).padStart(2, '0') : '');
  const [y, setY] = useState(birthday?.year ? String(birthday.year) : '');
  const mRef = useRef<TextInput>(null);
  const yRef = useRef<TextInput>(null);

  const result = parse(d, m, y);
  const valid = result !== null && typeof result !== 'string';

  return (
    <>
      <T size={13} color={colors.muted} style={{ lineHeight: 19 }}>
        Você ganha 20% off no mês do seu aniversário.
      </T>
      <View style={s.row}>
        <Field label="Dia" value={d} placeholder="DD" maxLength={2} onChange={(t) => {
          const v = digits(t, 2);
          setD(v);
          if (v.length === 2) mRef.current?.focus();
        }} />
        <Field ref={mRef} label="Mês" value={m} placeholder="MM" maxLength={2} onChange={(t) => {
          const v = digits(t, 2);
          setM(v);
          if (v.length === 2) yRef.current?.focus();
        }} />
        <Field ref={yRef} label="Ano (opcional)" value={y} placeholder="AAAA" maxLength={4} flex={1.6} onChange={(t) => setY(digits(t, 4))} />
      </View>
      <T size={12} color={colors.danger} style={{ marginTop: 10, minHeight: 16 }}>
        {typeof result === 'string' ? result : ''}
      </T>
      <View style={{ gap: 10, marginTop: 8 }}>
        <GoldButton
          label="Salvar"
          disabled={!valid}
          onPress={() => {
            if (!valid) return;
            setBirthday(result);
            onDone();
          }}
        />
        {birthday && (
          <OutlineButton
            label="Remover data"
            danger
            onPress={() => {
              setBirthday(null);
              onDone();
            }}
          />
        )}
      </View>
    </>
  );
}

function Field({
  ref,
  label,
  value,
  placeholder,
  maxLength,
  flex = 1,
  onChange,
}: {
  ref?: Ref<TextInput>;
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  flex?: number;
  onChange: (t: string) => void;
}) {
  return (
    <View style={{ flex }}>
      <T size={11} color={colors.muted} style={{ marginBottom: 6 }}>
        {label}
      </T>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.dim}
        keyboardType="number-pad"
        maxLength={maxLength}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 18 },
  input: { height: 56, borderRadius: radius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, color: colors.text, fontFamily: fonts.semibold, fontSize: 18, textAlign: 'center' },
});
