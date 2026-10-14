import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { apptTitle, barberOf, shortDate, timeOf } from '@/components/cards';
import { Chip, Footer, GoldButton, Header, Photo, T } from '@/components/ui';
import { reviewTags } from '@/data/mock';
import { photos } from '@/data/photos';
import { useStore } from '@/store';
import { colors, fonts, radius, space } from '@/theme';

const labels = ['', 'Ruim', 'Pode melhorar', 'Bom', 'Muito bom', 'Excelente'];

export default function Avaliar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = useStore((s) => s.appointments.find((x) => x.id === id));
  const rate = useStore((s) => s.rate);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');

  if (!a) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Avaliar" />
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>
          Atendimento não encontrado.
        </T>
      </View>
    );
  }

  const b = barberOf(a.barberId);
  const done = !!a.rating;
  const shown = a.rating?.stars ?? stars;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/agenda'));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Avaliar atendimento" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.gutter, paddingTop: 8, paddingBottom: 30 }}>
        <View style={s.card}>
          <Photo source={photos[b.id]} label="" radius={14} style={{ width: 52, height: 52 }} />
          <View style={{ flex: 1 }}>
            <T v="semibold" size={15}>
              {apptTitle(a)}
            </T>
            <T size={12} color={colors.muted} style={{ marginTop: 3 }}>
              com {b.short} · {shortDate(a.start)} · {timeOf(a.start)}
            </T>
          </View>
        </View>

        <T v="serif" size={26} style={{ textAlign: 'center', marginTop: 28 }}>
          {done ? 'Obrigado pela avaliação!' : `Como foi com ${b.short}?`}
        </T>

        <View style={s.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} disabled={done} onPress={() => setStars(n)} hitSlop={6} accessibilityLabel={`${n} estrela${n > 1 ? 's' : ''}`}>
              <T size={42} color={n <= shown ? colors.gold : colors.dim}>
                ★
              </T>
            </Pressable>
          ))}
        </View>
        <T v="medium" size={14} color={colors.goldLight} style={{ textAlign: 'center', minHeight: 20 }}>
          {labels[shown]}
        </T>

        {done ? (
          <View style={{ marginTop: 18, gap: 10 }}>
            {a.rating!.tags.length > 0 && (
              <T size={13} color={colors.goldLight} style={{ textAlign: 'center' }}>
                {a.rating!.tags.join(' · ')}
              </T>
            )}
            {!!a.rating!.text && (
              <T size={14} color="#CFCFCF" style={{ textAlign: 'center', lineHeight: 21 }}>
                “{a.rating!.text}”
              </T>
            )}
            <View style={s.thanks}>
              <Feather name="heart" size={14} color={colors.gold} />
              <T size={12} color={colors.muted}>
                Sua avaliação aparece na página do {b.short}.
              </T>
            </View>
          </View>
        ) : (
          stars > 0 && (
            <>
              <T size={12} color={colors.muted} style={{ marginTop: 24, marginBottom: 10 }}>
                O que você mais gostou? (opcional)
              </T>
              <View style={s.tags}>
                {reviewTags.map((t) => (
                  <Chip key={t} label={t} active={tags.includes(t)} onPress={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
                ))}
              </View>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Conte um pouco mais (opcional)"
                placeholderTextColor={colors.dim}
                multiline
                maxLength={280}
                style={s.input}
              />
            </>
          )
        )}
      </ScrollView>
      <Footer>
        {done ? (
          <GoldButton style={{ flex: 1 }} label="Voltar" onPress={back} />
        ) : (
          <GoldButton
            style={{ flex: 1 }}
            label="Enviar avaliação"
            icon="send"
            disabled={stars === 0}
            onPress={() => rate(a.id, { stars, tags, text: text.trim() })}
          />
        )}
      </Footer>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { marginTop: 16, minHeight: 96, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, color: colors.text, fontFamily: fonts.regular, fontSize: 14, textAlignVertical: 'top' },
  thanks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 },
});
