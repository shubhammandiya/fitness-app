import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatDuration,
  formatPace,
  round1,
  sessionMinutes,
  sessionSetCount,
  sessionTime,
  sessionVolume,
  setsByMuscle,
  shortDate,
  trainedExercises,
} from '@/domain/stats';
import { useStore } from '@/state/store';
import CardioSheet from '@/ui/cardio-sheet';
import LineChart from '@/ui/chart';
import { Body, Display, Micro, Num, Title } from '@/ui/text';
import { fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 26 }}>
      <Micro style={{ marginBottom: 10 }}>{label}</Micro>
      {children}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { borderColor: t.line, backgroundColor: t.surf }]}>{children}</View>
  );
}

export default function ProgressScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const sessions = useStore((s) => s.sessions);
  const exercises = useStore((s) => s.exercises);
  const bodyWeight = useStore((s) => s.bodyWeight);
  const addBodyWeight = useStore((s) => s.addBodyWeight);
  const cardio = useStore((s) => s.cardio);
  const addCardio = useStore((s) => s.addCardio);
  const removeCardio = useStore((s) => s.removeCardio);

  const [weightInput, setWeightInput] = useState('');
  const [cardioOpen, setCardioOpen] = useState(false);

  const week = setsByMuscle(sessions, exercises, 7);
  const maxSets = Math.max(1, ...week.map((w) => w.sets));
  const trained = trainedExercises(sessions, 6);
  const recent = [...sessions].sort((a, b) => sessionTime(b) - sessionTime(a)).slice(0, 6);
  const recentCardio = [...cardio].sort((a, b) => b.at - a.at).slice(0, 4);

  const bwSeries = bodyWeight.map((e) => e.kg);
  const latestBw = bwSeries.length ? bwSeries[bwSeries.length - 1] : null;
  const bwDelta = bwSeries.length > 1 ? round1(latestBw! - bwSeries[0]) : null;
  const chartWidth = Math.max(120, width - 40 - 32);

  const saveWeight = () => {
    const parsed = parseFloat(weightInput.replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed > 0 && parsed < 400) {
      addBodyWeight(round1(parsed));
      setWeightInput('');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Display>Progress</Display>

        <View style={{ height: 22 }} />

        <Section label="this week · hard sets">
          {week.length === 0 ? (
            <Card>
              <Body style={{ color: t.mut }}>
                No sets logged in the last 7 days. Finish a workout and this fills in.
              </Body>
            </Card>
          ) : (
            <Card>
              {week.map((row, i) => (
                <View key={row.muscle} style={[styles.barRow, i > 0 && { marginTop: 12 }]}>
                  <Body style={{ width: 82 }}>{row.label}</Body>
                  <View style={[styles.track, { backgroundColor: t.line }]}>
                    <View
                      style={{
                        width: `${Math.max(6, (row.sets / maxSets) * 100)}%`,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: t.acc,
                      }}
                    />
                  </View>
                  <Num style={{ fontSize: 15, width: 26, textAlign: 'right' }}>{row.sets}</Num>
                </View>
              ))}
            </Card>
          )}
        </Section>

        <Section label="body weight">
          <Card>
            {latestBw !== null ? (
              <View style={styles.bwHead}>
                <View style={styles.pair}>
                  <Num style={{ fontSize: 28 }}>{round1(latestBw)}</Num>
                  <Micro style={{ fontSize: 9, letterSpacing: 1 }}>kg</Micro>
                </View>
                {bwDelta !== null ? (
                  <Micro style={{ color: bwDelta === 0 ? t.mut : t.accInk }}>
                    {bwDelta > 0 ? '+' : ''}
                    {bwDelta} kg all time
                  </Micro>
                ) : null}
              </View>
            ) : (
              <Body style={{ color: t.mut }}>Log your weight to see the trend.</Body>
            )}

            {bwSeries.length > 1 ? (
              <View style={{ marginTop: 12 }}>
                <LineChart values={bwSeries.slice(-14)} width={chartWidth} height={90} />
                <View style={styles.axis}>
                  <Micro>{shortDate(new Date(bodyWeight[0].date).getTime())}</Micro>
                  <Micro>today</Micro>
                </View>
              </View>
            ) : null}

            <View style={[styles.inputRow, { borderColor: t.line }]}>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="today's weight"
                placeholderTextColor={t.mut}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={saveWeight}
                accessibilityLabel="Body weight in kg"
                style={{ flex: 1, color: t.tx, fontFamily: fonts.sans, fontSize: 13, paddingVertical: 8 }}
              />
              <Pressable onPress={saveWeight} hitSlop={8} accessibilityRole="button" accessibilityLabel="Save weight">
                <Micro style={{ color: t.accInk, letterSpacing: 1.2 }}>save</Micro>
              </Pressable>
            </View>
          </Card>
        </Section>

        <Section label="cardio">
          {recentCardio.length === 0 ? (
            <Card>
              <Body style={{ color: t.mut }}>Runs, rides, rows — one line each.</Body>
            </Card>
          ) : (
            <View style={[styles.list, { borderColor: t.line }]}>
              {recentCardio.map((entry, i) => (
                <View
                  key={entry.id}
                  style={[
                    styles.row,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                  ]}>
                  <View style={{ flex: 1 }}>
                    <Title style={{ fontSize: 16 }}>{entry.activity}</Title>
                    <Micro style={{ marginTop: 3 }}>
                      {[
                        entry.distanceKm ? `${round1(entry.distanceKm)} km` : null,
                        formatDuration(entry.durationSec),
                        formatPace(entry.paceSecPerKm),
                        entry.surface,
                        entry.elevationM ? `${entry.elevationM} m` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Micro>
                    <Micro style={{ marginTop: 2 }}>{shortDate(entry.at)}</Micro>
                  </View>
                  <Pressable
                    onPress={() => removeCardio(entry.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${entry.activity}`}>
                    <Micro>remove</Micro>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={() => setCardioOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Log cardio"
            style={[styles.addRow, { borderColor: t.line }]}>
            <Micro style={{ color: t.accInk, letterSpacing: 1.3 }}>+ log cardio</Micro>
          </Pressable>
        </Section>

        <Section label="exercises">
          {trained.length === 0 ? (
            <Card>
              <Body style={{ color: t.mut }}>Anything you log shows up here with its trend.</Body>
            </Card>
          ) : (
            <View style={[styles.list, { borderColor: t.line }]}>
              {trained.map((row, i) => (
                <Pressable
                  key={row.exerciseId}
                  onPress={() =>
                    router.push({ pathname: '/exercise/[id]', params: { id: row.exerciseId } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${row.name} trend`}
                  style={[
                    styles.row,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                  ]}>
                  <View style={{ flex: 1 }}>
                    <Title style={{ fontSize: 17 }}>{row.name}</Title>
                    <Micro style={{ marginTop: 3 }}>
                      {row.sets} sets · last {shortDate(row.lastAt)}
                    </Micro>
                  </View>
                  <Micro style={{ color: t.accInk }}>trend</Micro>
                </Pressable>
              ))}
            </View>
          )}
        </Section>

        <Section label="recent sessions">
          {recent.length === 0 ? (
            <Card>
              <Body style={{ color: t.mut }}>Finished workouts land here, newest first.</Body>
            </Card>
          ) : (
            <View style={[styles.list, { borderColor: t.line }]}>
              {recent.map((session, i) => (
                <Pressable
                  key={session.id}
                  onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${session.dayName} session`}
                  style={[
                    styles.row,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                  ]}>
                  <View style={{ flex: 1 }}>
                    <Title style={{ fontSize: 17 }}>{session.dayName}</Title>
                    <Micro style={{ marginTop: 3 }}>
                      {shortDate(sessionTime(session))} · {sessionSetCount(session)} sets ·{' '}
                      {sessionMinutes(session)} min
                    </Micro>
                  </View>
                  <Num style={{ fontSize: 15 }}>
                    {Math.round(sessionVolume(session)).toLocaleString()}
                  </Num>
                  <Micro style={{ marginLeft: 4 }}>kg</Micro>
                </Pressable>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>

      <CardioSheet
        visible={cardioOpen}
        onClose={() => setCardioOpen(false)}
        onSave={(input) => addCardio(input)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  bwHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  pair: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingTop: 8,
  },
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  addRow: {
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 11,
    alignItems: 'center',
  },
});
