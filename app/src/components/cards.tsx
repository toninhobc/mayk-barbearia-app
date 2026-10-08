import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { barbers, services, type Barber, type Service } from '@/data/mock';
import { photos } from '@/data/photos';
import { brl, hhmm } from '@/lib/format';
import type { Appointment } from '@/store';
import { colors, radius } from '@/theme';
import { Kicker, Photo, T } from './ui';

export const apptTitle = (a: Appointment) =>
  services.filter((x) => a.serviceIds.includes(x.id)).map((x) => x.name).join(' + ');

export const barberOf = (id: string) => barbers.find((b) => b.id === id)!;

export const timeOf = (iso: string) => {
  const d = new Date(iso);
  return hhmm(d.getHours() * 60 + d.getMinutes());
};

export const shortDate = (iso: string) => {
  const s = new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/* ---------- Próximo horário (cartão de destaque) ---------- */

export function NextAppointmentCard({ a, actions }: { a: Appointment; actions?: ReactNode }) {
  const b = barberOf(a.barberId);
  return (
    <LinearGradient colors={['#1D1A15', '#121212']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.next}>
      <Kicker>Próximo horário</Kicker>
      <View style={s.nextRow}>
        <Photo source={photos[b.id]} label="" radius={14} style={{ width: 48, height: 48 }} />
        <View style={{ flex: 1 }}>
          <T v="semibold" size={16}>
            {apptTitle(a)}
          </T>
          <T size={13} color={colors.muted} style={{ marginTop: 3 }}>
            com {b.short}
          </T>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T v="serif" size={28} color={colors.goldLight}>
            {timeOf(a.start)}
          </T>
          <T size={12} color={colors.muted}>
            {shortDate(a.start)}
          </T>
        </View>
      </View>
      {actions && <View style={s.nextActions}>{actions}</View>}
    </LinearGradient>
  );
}

/* ---------- Barbeiro (card vertical com foto) ---------- */

export function BarberCard({ b, selected, onPress, width = 104 }: { b: Barber; selected?: boolean; onPress: () => void; width?: number }) {
  return (
    <Pressable onPress={onPress} style={{ width }}>
      <View style={[s.barberPhoto, selected && { borderColor: colors.gold }]}>
        <Photo source={photos[b.id]} radius={18} style={{ flex: 1 }} />
      </View>
      <T v="semibold" size={13} style={{ marginTop: 8 }} numberOfLines={1}>
        {b.short}
      </T>
      <T size={11} color={colors.muted} numberOfLines={1}>
        <T size={11} color={colors.gold}>
          ★
        </T>{' '}
        {b.rating.toFixed(1)} · {b.specialties[0]}
      </T>
    </Pressable>
  );
}

/* ---------- Serviço (linha) ---------- */

const icons: Record<Service['category'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  Barba: 'razor-double-edge',
  Cabelo: 'content-cut',
  Estética: 'face-man-shimmer-outline',
  'Tratamento capilar': 'hair-dryer-outline',
};

export function ServiceRow({ sv, on, onPress }: { sv: Service; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.svc, on && { borderColor: colors.gold, backgroundColor: '#17140F' }]}>
      <View style={s.svcIcon}>
        <MaterialCommunityIcons name={icons[sv.category]} size={22} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="semibold" size={15}>
          {sv.name}
        </T>
        <T size={12} color={colors.muted} style={{ marginTop: 2 }}>
          {sv.minutes} min{sv.includes ? ' · combo' : ''}
        </T>
      </View>
      <T v="semibold" size={15}>
        {brl(sv.priceCents).replace(',00', '')}
      </T>
      <View style={[s.plus, on && { backgroundColor: colors.gold }]}>
        <Feather name={on ? 'check' : 'plus'} size={16} color={on ? colors.onGold : colors.gold} />
      </View>
    </Pressable>
  );
}

/* ---------- Agendamento (linha da agenda/histórico) ---------- */

export function AppointmentRow({ a, footer }: { a: Appointment; footer?: ReactNode }) {
  const b = barberOf(a.barberId);
  const status =
    a.status === 'cancelado'
      ? { t: 'Cancelado', c: colors.danger }
      : a.status === 'concluido'
        ? { t: 'Concluído', c: colors.muted }
        : a.paid
          ? { t: 'Pago', c: colors.success }
          : { t: 'Pagar no local', c: colors.gold };
  return (
    <View style={s.row}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Photo source={photos[b.id]} label="" radius={14} style={{ width: 52, height: 52 }} />
        <View style={{ flex: 1 }}>
          <T v="semibold" size={15}>
            {apptTitle(a)}
          </T>
          <T size={12} color={colors.muted} style={{ marginTop: 3 }}>
            {shortDate(a.start)} · {timeOf(a.start)} · {b.short}
          </T>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T v="semibold" size={14}>
            {brl(a.totalCents)}
          </T>
          <T v="medium" size={11} color={status.c} style={{ marginTop: 3 }}>
            {status.t}
          </T>
        </View>
      </View>
      {footer}
    </View>
  );
}

const s = StyleSheet.create({
  next: { borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(200,161,90,0.28)' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  nextActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  barberPhoto: { height: 126, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', padding: 0, overflow: 'hidden' },
  svc: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginBottom: 10 },
  svcIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.goldDark, alignItems: 'center', justifyContent: 'center' },
  plus: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  row: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 10 },
});
