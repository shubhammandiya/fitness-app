import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Body, Micro, Num } from '@/ui/text';
import { fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

export type RestState = { endsAt: number; total: number; label: string; notifId: string | null };

const fmt = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function RestBar({
  rest,
  onExtend,
  onSkip,
  onDone,
}: {
  rest: RestState;
  onExtend: (deltaSeconds: number) => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const t = useTheme();
  const [now, setNow] = useState(Date.now());
  const remaining = rest.endsAt - now;

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [rest.endsAt]);

  useEffect(() => {
    if (remaining <= 0) onDone();
  }, [remaining <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = remaining <= 0;
  const progress = Math.min(1, Math.max(0, 1 - remaining / (rest.total * 1000)));

  return (
    <View style={[styles.wrap, { backgroundColor: t.surf, borderColor: t.line }]}>
      <View style={styles.top}>
        <Micro style={{ color: done ? t.accInk : t.mut }}>{done ? 'rest done' : 'rest'}</Micro>
        <Num style={{ fontSize: 20, color: done ? t.accInk : t.tx }}>{fmt(remaining)}</Num>
        <View style={styles.actions}>
          <Pressable onPress={() => onExtend(-15)} hitSlop={8} style={[styles.pill, { borderColor: t.line }]}>
            <Body style={{ fontSize: 11, color: t.mut, fontFamily: fonts.sansMed }}>−15</Body>
          </Pressable>
          <Pressable onPress={() => onExtend(15)} hitSlop={8} style={[styles.pill, { borderColor: t.line }]}>
            <Body style={{ fontSize: 11, color: t.mut, fontFamily: fonts.sansMed }}>+15</Body>
          </Pressable>
          <Pressable onPress={onSkip} hitSlop={8}>
            <Micro style={{ color: t.accInk }}>skip</Micro>
          </Pressable>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: t.line }]}>
        <View
          style={{
            height: 2,
            width: `${progress * 100}%`,
            backgroundColor: t.acc,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 8,
    marginBottom: 12,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  track: { height: 2, borderRadius: 1, marginTop: 8, overflow: 'hidden' },
});
