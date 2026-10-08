import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, Footer, GoldButton, IconButton, Logo, Photo, Stars, T } from '@/components/ui';
import { barbers, categories, reviews, services, shop, type Category } from '@/data/mock';
import { photos } from '@/data/photos';
import { freeSlots } from '@/lib/availability';
import { brl, hhmm, sameDay, weekdayShort } from '@/lib/format';
import { draftTotals, useStore } from '@/store';
import { colors, radius, space } from '@/theme';

const DAYS = 21;
const STEP = 30;
const HERO = 330;
const tabs = ['Agendar', 'Portfólio', 'Avaliações'] as const;

export default function BarberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const barberId = id === 'qualquer' ? null : id;
  const barber = barbers.find((b) => b.id === barberId);
  const { top } = useSafeAreaInsets();
  const { draft, appointments, favorites, setBarber, setDay, setSlot, toggleService, toggleFavorite, confirm } = useStore();
  // abre na categoria do primeiro serviço já escolhido (ex.: vindo da tela Serviços)
  const [cat, setCat] = useState<Category>(() => services.find((x) => x.id === draft.serviceIds[0])?.category ?? 'Cabelo');
  const [tab, setTab] = useState<(typeof tabs)[number]>('Agendar');

  useEffect(() => {
    if (draft.barberId !== barberId) setBarber(barberId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId]);

  const totals = draftTotals(draft.serviceIds);
  const duration = totals.minutes || 30;
  // ao remarcar, o horário antigo do cliente não bloqueia a agenda
  const busy = appointments.filter((a) => a.id !== draft.rescheduleId);
  const ids = barbers.map((b) => b.id);

  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  const free = (d: Date) => freeSlots(d, barberId, duration, busy, ids);

  useEffect(() => {
    if (!draft.day) setDay((days.find((d) => free(d).length > 0) ?? days[0]).toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const day = draft.day ? new Date(draft.day) : days[0];
  const freeToday = new Set(free(day));
  const now = new Date();
  const allSlots: number[] = [];
  for (let m = shop.openMinutes; m + duration <= shop.closeMinutes; m += STEP) {
    const t = new Date(day);
    t.setHours(0, m, 0, 0);
    if (t > now) allSlots.push(m);
  }
  const month = day.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const rescheduling = !!draft.rescheduleId;
  const ready = totals.list.length > 0 && draft.slot != null;

  const goNext = () => {
    if (rescheduling) {
      const appt = confirm('pix');
      router.replace({ pathname: '/agendar/sucesso', params: { id: appt.id, remarcado: '1' } });
    } else {
      router.push('/agendar/pagamento');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Foto de capa */}
      <View style={[StyleSheet.absoluteFill, { height: HERO }]}>
        {barber ? (
          <Photo source={photos[barber.id]} label="Foto do barbeiro" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
            <Logo size={150} ring={false} />
          </View>
        )}
        <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(10,10,10,0.85)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[s.heroBar, { top: top + 8 }]}>
        <IconButton glass icon="chevron-left" onPress={() => router.back()} />
        {barber && (
          <IconButton glass icon="heart" color={favorites.includes(barber.id) ? colors.gold : '#fff'} onPress={() => toggleFavorite(barber.id)} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: HERO - 40 }} showsVerticalScrollIndicator={false}>
        <View style={s.sheet}>
          <T v="serif" size={28}>
            {barber ? barber.name.split(' ').slice(0, 2).join(' ') : 'Sem preferência'}
          </T>
          <View style={s.meta}>
            <T size={13} color={colors.muted}>
              <T size={13} color={colors.gold}>
                ★
              </T>{' '}
              {barber ? `${barber.rating.toFixed(1)} (${barber.reviews})` : '4.9 média da casa'}
            </T>
            <T size={13} color={colors.muted}>
              {barber ? barber.specialties.join(' · ') : 'Primeiro barbeiro livre'}
            </T>
          </View>

          <View style={s.tabs}>
            {tabs.map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}>
                <T v={tab === t ? 'semibold' : 'regular'} size={13} color={tab === t ? colors.text : colors.muted}>
                  {t}
                </T>
              </Pressable>
            ))}
          </View>

          {tab === 'Agendar' && (
            <>
              {rescheduling && (
                <View style={s.notice}>
                  <T size={12} color={colors.goldLight}>
                    Remarcando seu horário. Escolha a nova data.
                  </T>
                </View>
              )}

              <T v="semibold" size={14} style={s.label}>
                Serviços
              </T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginHorizontal: -space.gutter, marginBottom: 12 }} contentContainerStyle={{ gap: 20, paddingHorizontal: space.gutter, alignItems: 'flex-start' }}>
                {categories.map((c) => {
                  const n = draft.serviceIds.filter((id) => services.find((x) => x.id === id)?.category === c).length;
                  return (
                    <Pressable key={c} onPress={() => setCat(c)} hitSlop={6} style={[s.cat, cat === c && s.catOn]}>
                      <T v={cat === c ? 'semibold' : 'medium'} size={13} color={cat === c ? colors.goldLight : colors.muted}>
                        {c}
                        {n ? ` · ${n}` : ''}
                      </T>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginHorizontal: -space.gutter }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.gutter }}>
                {services.filter((sv) => sv.category === cat).map((sv) => (
                  <Chip key={sv.id} label={sv.name} active={draft.serviceIds.includes(sv.id)} onPress={() => toggleService(sv.id)} />
                ))}
              </ScrollView>

              <View style={s.monthRow}>
                <T v="semibold" size={14} numberOfLines={1} style={{ flexShrink: 0 }}>
                  {month.charAt(0).toUpperCase() + month.slice(1)}
                </T>
                <T size={13} color={colors.muted} numberOfLines={1} style={{ flexShrink: 1, marginLeft: 12 }}>
                  {totals.list.length ? `${totals.list.map((x) => x.name).join(' + ')} · ${totals.minutes} min` : 'Escolha um serviço'}
                </T>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginHorizontal: -space.gutter }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.gutter }}>
                {days.map((d) => {
                  const on = sameDay(d, day);
                  const closed = free(d).length === 0;
                  const inner = (
                    <>
                      <T v="medium" size={10} color={on ? colors.onGold : colors.muted} style={{ letterSpacing: 1 }}>
                        {weekdayShort(d)}
                      </T>
                      <T v="semibold" size={18} color={on ? colors.onGold : colors.text}>
                        {d.getDate()}
                      </T>
                    </>
                  );
                  return (
                    <Pressable key={d.toISOString()} disabled={closed} onPress={() => setDay(d.toISOString())} style={closed && { opacity: 0.3 }}>
                      {on ? (
                        <LinearGradient colors={[colors.goldLight, colors.gold]} style={[s.day, { borderWidth: 0 }]}>
                          {inner}
                        </LinearGradient>
                      ) : (
                        <View style={s.day}>{inner}</View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <T v="semibold" size={14} style={[s.label, { marginTop: 22 }]}>
                Horários livres
              </T>
              {allSlots.length === 0 ? (
                <T size={13} color={colors.muted}>
                  Sem horários neste dia. Escolha outra data.
                </T>
              ) : (
                <View style={s.times}>
                  {allSlots.map((m) => {
                    const ok = freeToday.has(m);
                    const on = draft.slot === m;
                    return (
                      <Pressable key={m} disabled={!ok} onPress={() => setSlot(m)} style={[s.time, on && s.timeOn]}>
                        <T
                          v={on ? 'semibold' : 'regular'}
                          size={13}
                          color={on ? colors.goldLight : ok ? '#D2D2D2' : colors.dim}
                          style={!ok && { textDecorationLine: 'line-through' }}>
                          {hhmm(m)}
                        </T>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {tab === 'Portfólio' && (
            <View style={s.portfolio}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Photo key={n} source={photos[`portfolio${n}`]} label="Corte" radius={14} style={s.pf} />
              ))}
            </View>
          )}

          {tab === 'Avaliações' && (
            <View>
              <View style={s.ratingBox}>
                <T v="serif" size={44} color={colors.goldLight}>
                  {(barber?.rating ?? 4.9).toFixed(1)}
                </T>
                <View>
                  <Stars value={barber?.rating ?? 4.9} size={16} />
                  <T size={12} color={colors.muted} style={{ marginTop: 4 }}>
                    {barber?.reviews ?? 1246} avaliações
                  </T>
                </View>
              </View>
              {reviews.map((r) => (
                <View key={r.who} style={s.review}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T v="semibold" size={14}>
                      {r.who}
                    </T>
                    <T size={11} color={colors.muted}>
                      {r.when}
                    </T>
                  </View>
                  <Stars value={r.stars} />
                  <T size={13} color="#BDBDBD" style={{ marginTop: 6, lineHeight: 19 }}>
                    {r.text}
                  </T>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Footer>
        <View>
          <T size={12} color={colors.muted}>
            Total
          </T>
          <T v="semibold" size={20}>
            {brl(totals.cents)}
          </T>
        </View>
        <GoldButton style={{ flex: 1 }} disabled={!ready} label={rescheduling ? 'Remarcar' : 'Continuar'} icon="arrow-right" onPress={goNext} />
      </Footer>
    </View>
  );
}

const s = StyleSheet.create({
  heroBar: { position: 'absolute', left: space.gutter, right: space.gutter, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingHorizontal: space.gutter, paddingTop: 24, paddingBottom: 30, minHeight: 600 },
  meta: { flexDirection: 'row', gap: 14, marginTop: 6, flexWrap: 'wrap' },
  tabs: { flexDirection: 'row', marginTop: 18, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11 },
  tabOn: { borderBottomWidth: 2, borderBottomColor: colors.gold, marginBottom: -1 },
  notice: { marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: 'rgba(200,161,90,0.1)', borderWidth: 1, borderColor: 'rgba(200,161,90,0.35)' },
  label: { marginTop: 18, marginBottom: 12 },
  cat: { paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  catOn: { borderBottomColor: colors.gold },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  day: { width: 52, height: 70, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 4 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { width: '23.3%', height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  timeOn: { borderColor: colors.gold, backgroundColor: 'rgba(200,161,90,0.1)' },
  portfolio: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  pf: { width: '31.9%', aspectRatio: 1 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18, marginBottom: 8 },
  review: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 4 },
});
