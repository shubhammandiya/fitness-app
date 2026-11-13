import { router, useLocalSearchParams } from 'expo-router';
import { goBack } from '@/ui/nav';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatWeight } from '@/domain/history';
import { longDate, sessionMinutes, sessionSetCount, sessionVolume } from '@/domain/stats';
import { useStore } from '@/state/store';
import { Body, Display, Micro, Num, Title } from '@/ui/text';
import { radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

export default function SessionDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessions = useStore((s) => s.sessions);
  const units = useStore((s) => s.settings.units);

  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 20, paddingTop: insets.top + 20 }}>
        <Pressable onPress={() => goBack('/progress')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Micro style={{ color: t.accInk }}>← back</Micro>
        </Pressable>
        <Body style={{ marginTop: 20, color: t.mut }}>That session no longer exists.</Body>
      </View>
    );
  }

  const at = session.finishedAt ?? session.startedAt;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => goBack('/progress')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={{ marginBottom: 14 }}>
        <Micro style={{ color: t.accInk }}>← back</Micro>
      </Pressable>

      <Display>{session.dayName}</Display>
      <Micro style={{ marginTop: 6 }}>{longDate(at)}</Micro>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Num style={{ fontSize: 22 }}>{sessionSetCount(session)}</Num>
          <Micro>sets</Micro>
        </View>
        <View style={styles.summaryItem}>
          <Num style={{ fontSize: 22 }}>{sessionMinutes(session)}</Num>
          <Micro>minutes</Micro>
        </View>
        <View style={styles.summaryItem}>
          <Num style={{ fontSize: 22 }}>{Math.round(sessionVolume(session)).toLocaleString()}</Num>
          <Micro>{units} volume</Micro>
        </View>
      </View>

      {session.exercises.map((entry) => {
        const done = entry.sets.filter((s) => s.done);
        if (done.length === 0) return null;
        return (
          <View key={entry.exerciseId} style={[styles.ex, { borderBottomColor: t.line }]}>
            <Title>{entry.name}</Title>
            <Micro style={{ marginTop: 4 }}>
              {done.length} {done.length === 1 ? 'set' : 'sets'}
            </Micro>
            <View style={{ marginTop: 10 }}>
              {done.map((set, i) => (
                <View key={i} style={styles.setRow}>
                  <Micro style={{ width: 18, letterSpacing: 0 }}>{i + 1}</Micro>
                  <View style={styles.pair}>
                    <Num style={{ fontSize: 17 }}>{formatWeight(set.weight)}</Num>
                    <Micro style={{ fontSize: 9 }}>{units}</Micro>
                  </View>
                  <Body style={{ color: t.mut, fontSize: 11, marginHorizontal: 10 }}>×</Body>
                  <Num style={{ fontSize: 17 }}>{set.reps}</Num>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {sessionSetCount(session) === 0 ? (
        <Body style={{ marginTop: 20, color: t.mut }}>Nothing was logged in this session.</Body>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 6,
  },
  summaryItem: { alignItems: 'flex-start', gap: 4 },
  ex: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 16 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  pair: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
});
