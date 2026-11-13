import { router, useLocalSearchParams } from 'expo-router';
import { goBack } from '@/ui/nav';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EQUIPMENT_LABEL, MUSCLE_LABEL } from '@/domain/types';
import { exerciseSeries, longDate, round1, sessionSetCount, sessionTime } from '@/domain/stats';
import { useStore } from '@/state/store';
import LineChart from '@/ui/chart';
import { Body, Display, Micro, Num, Title } from '@/ui/text';
import { radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

export default function ExerciseDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const exercises = useStore((s) => s.exercises);
  const sessions = useStore((s) => s.sessions);
  const units = useStore((s) => s.settings.units);

  const exercise = exercises.find((e) => e.id === id);
  const series = exerciseSeries(id, sessions).slice(-16);
  const chartWidth = Math.max(140, width - 40 - 32);

  const bestTop = series.reduce((best, p) => Math.max(best, p.top), 0);
  const best1rm = series.reduce((best, p) => Math.max(best, p.est1rm), 0);
  const last = series[series.length - 1];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => goBack('/progress')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={{ marginBottom: 14 }}>
        <Micro style={{ color: t.accInk }}>← back</Micro>
      </Pressable>

      <Display>{exercise?.name ?? 'Exercise'}</Display>
      <Micro style={{ marginTop: 6 }}>
        {exercise ? `${MUSCLE_LABEL[exercise.muscle]} · ${EQUIPMENT_LABEL[exercise.equipment]}` : 'unknown'}
      </Micro>

      {series.length === 0 ? (
        <View style={[styles.card, { borderColor: t.line, backgroundColor: t.surf, marginTop: 22 }]}>
          <Body style={{ color: t.mut }}>
            No completed sets yet. Log this exercise once and the trend starts here.
          </Body>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={[styles.stat, { borderColor: t.line, backgroundColor: t.surf }]}>
              <Micro>best set</Micro>
              <View style={styles.pair}>
                <Num style={{ fontSize: 24 }}>{round1(bestTop)}</Num>
                <Micro style={{ fontSize: 9 }}>{units}</Micro>
              </View>
            </View>
            <View style={[styles.stat, { borderColor: t.line, backgroundColor: t.surf }]}>
              <Micro>est. 1rm</Micro>
              <View style={styles.pair}>
                <Num style={{ fontSize: 24 }}>{round1(best1rm)}</Num>
                <Micro style={{ fontSize: 9 }}>{units}</Micro>
              </View>
            </View>
            <View style={[styles.stat, { borderColor: t.line, backgroundColor: t.surf }]}>
              <Micro>sessions</Micro>
              <Num style={{ fontSize: 24 }}>{series.length}</Num>
            </View>
          </View>

          <Micro style={{ marginTop: 24, marginBottom: 10 }}>est. 1rm over time</Micro>
          <View style={[styles.card, { borderColor: t.line, backgroundColor: t.surf }]}>
            <LineChart values={series.map((p) => p.est1rm)} width={chartWidth} height={130} />
            <View style={styles.axis}>
              <Micro>{longDate(series[0].at)}</Micro>
              <Micro>{round1(last.est1rm)} {units}</Micro>
            </View>
          </View>

          <Micro style={{ marginTop: 24, marginBottom: 10 }}>sessions</Micro>
          <View style={[styles.list, { borderColor: t.line }]}>
            {[...series].reverse().map((point, i) => (
              <View
                key={`${point.at}-${i}`}
                style={[
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                ]}>
                <View style={{ flex: 1 }}>
                  <Title style={{ fontSize: 16 }}>{longDate(point.at)}</Title>
                  <Micro style={{ marginTop: 3 }}>
                    top set {round1(point.top)} {units} × {point.reps}
                  </Micro>
                </View>
                <View style={styles.pair}>
                  <Num style={{ fontSize: 16 }}>{round1(point.est1rm)}</Num>
                  <Micro style={{ fontSize: 9 }}>{units}</Micro>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 22 },
  stat: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 12,
    gap: 6,
  },
  pair: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
});
