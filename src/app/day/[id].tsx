import { router, useLocalSearchParams } from 'expo-router';
import { goBack } from '@/ui/nav';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EQUIPMENT_LABEL, MUSCLE_LABEL, type DayExercise, type Exercise } from '@/domain/types';
import { useStore } from '@/state/store';
import ExercisePicker from '@/ui/exercise-picker';
import { Body, Display, Micro, Num, Title } from '@/ui/text';
import { fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

function Mini({
  label,
  value,
  suffix,
  onStep,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  onStep: (delta: number) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.mini}>
      <Micro style={{ width: 52, letterSpacing: 1 }}>{label}</Micro>
      <Pressable
        onPress={() => onStep(-1)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label} down`}
        style={[styles.miniBtn, { borderColor: t.line, backgroundColor: t.surf2 }]}>
        <Body style={{ color: t.tx, fontSize: 14, lineHeight: 16 }}>−</Body>
      </Pressable>
      <View style={styles.miniValue}>
        <Num style={{ fontSize: 17 }}>{value}</Num>
        {suffix ? <Micro style={{ fontSize: 8.5 }}>{suffix}</Micro> : null}
      </View>
      <Pressable
        onPress={() => onStep(1)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label} up`}
        style={[styles.miniBtn, { borderColor: t.line, backgroundColor: t.surf2 }]}>
        <Body style={{ color: t.tx, fontSize: 14, lineHeight: 16 }}>+</Body>
      </Pressable>
    </View>
  );
}

export default function DayDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const programs = useStore((s) => s.programs);
  const exercises = useStore((s) => s.exercises);
  const updateDayExercise = useStore((s) => s.updateDayExercise);
  const removeDayExercise = useStore((s) => s.removeDayExercise);
  const addExerciseToDay = useStore((s) => s.addExerciseToDay);
  const renameDay = useStore((s) => s.renameDay);
  const defaultRest = useStore((s) => s.settings.defaultRestSec);

  const found = useMemo(() => {
    for (const program of programs) {
      const day = program.days.find((d) => d.id === id);
      if (day) return { program, day };
    }
    return null;
  }, [programs, id]);

  const [editingName, setEditingName] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const byId = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])) as Record<string, Exercise>,
    [exercises]
  );

  if (!found) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 20, paddingTop: insets.top + 20 }}>
        <Pressable onPress={() => goBack('/programs')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Micro style={{ color: t.accInk }}>← back</Micro>
        </Pressable>
        <Body style={{ marginTop: 20, color: t.mut }}>That day no longer exists.</Body>
      </View>
    );
  }

  const { program, day } = found;

  const setTargets = (entry: DayExercise, patch: Partial<DayExercise>) =>
    updateDayExercise(entry.id, patch as any);

  const stepRepMin = (entry: DayExercise, delta: number) => {
    const next = Math.max(1, entry.repMin + delta);
    setTargets(entry, { repMin: next, repMax: Math.max(entry.repMax, next) });
  };

  const stepRepMax = (entry: DayExercise, delta: number) => {
    const next = Math.max(entry.repMin, entry.repMax + delta);
    setTargets(entry, { repMax: next });
  };

  const stepRest = (entry: DayExercise, delta: number) => {
    const current = entry.restSec ?? defaultRest;
    setTargets(entry, { restSec: Math.min(600, Math.max(15, current + delta * 15)) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable onPress={() => goBack('/programs')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Micro style={{ color: t.accInk }}>← back</Micro>
          </Pressable>
          <Pressable onPress={() => setEditingName((e) => !e)} hitSlop={10} accessibilityRole="button">
            <Micro style={{ color: editingName ? t.accInk : t.mut }}>
              {editingName ? 'done' : 'rename'}
            </Micro>
          </Pressable>
        </View>

        {editingName ? (
          <TextInput
            defaultValue={day.name}
            onChangeText={(text) => renameDay(day.id, text)}
            autoFocus
            style={[styles.nameInput, { color: t.tx, fontFamily: fonts.serif, borderColor: t.acc }]}
          />
        ) : (
          <Display>{day.name}</Display>
        )}
        <Micro style={{ marginTop: 6 }}>{program.name}</Micro>

        <Micro style={{ marginTop: 26, marginBottom: 10 }}>exercises</Micro>

        {day.exercises.length === 0 ? (
          <Body style={{ color: t.mut, paddingVertical: 12 }}>
            Empty day. Add the first movement below.
          </Body>
        ) : null}

        {day.exercises.map((entry) => {
          const exercise = byId[entry.exerciseId];
          const open = openId === entry.id;
          return (
            <View key={entry.id} style={[styles.ex, { borderBottomColor: t.line }]}>
              <Pressable
                onPress={() => setOpenId(open ? null : entry.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`${exercise?.name ?? 'Exercise'} targets`}
                style={styles.exHead}>
                <View style={{ flex: 1 }}>
                  <Title>{exercise?.name ?? 'Unknown exercise'}</Title>
                  <Micro style={{ marginTop: 4 }}>
                    {entry.targetSets} × {entry.repMin}–{entry.repMax} · {entry.restSec ?? defaultRest} s
                    rest
                    {exercise ? ` · ${MUSCLE_LABEL[exercise.muscle]}` : ''}
                  </Micro>
                </View>
                <Micro style={{ color: open ? t.accInk : t.mut }}>{open ? 'less' : 'edit'}</Micro>
              </Pressable>

              {open ? (
                <View style={{ marginTop: 10, gap: 8 }}>
                  <Mini
                    label="sets"
                    value={entry.targetSets}
                    onStep={(d) =>
                      setTargets(entry, { targetSets: Math.min(10, Math.max(1, entry.targetSets + d)) })
                    }
                  />
                  <View style={{ gap: 8 }}>
                    <Mini label="rep min" value={entry.repMin} onStep={(d) => stepRepMin(entry, d)} />
                    <Mini label="rep max" value={entry.repMax} onStep={(d) => stepRepMax(entry, d)} />
                  </View>
                  <Mini
                    label="rest"
                    value={entry.restSec ?? defaultRest}
                    suffix="s"
                    onStep={(d) => stepRest(entry, d)}
                  />

                  <View style={styles.exFooter}>
                    <Pressable
                      onPress={() => removeDayExercise(entry.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${exercise?.name ?? 'exercise'}`}>
                      <Micro style={{ color: t.danger, letterSpacing: 1.2 }}>remove exercise</Micro>
                    </Pressable>
                    <Micro style={{ letterSpacing: 1 }}>{EQUIPMENT_LABEL[exercise?.equipment ?? 'other']}</Micro>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}

        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add exercise"
          style={[styles.addRow, { borderColor: t.line }]}>
          <Micro style={{ color: t.accInk, letterSpacing: 1.3 }}>+ add exercise</Micro>
        </Pressable>
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        exercises={exercises}
        addedIds={day.exercises.map((e) => e.exerciseId)}
        onPick={(exerciseId) => addExerciseToDay(day.id, exerciseId)}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  nameInput: { fontSize: 30, borderBottomWidth: 1, paddingVertical: 4 },
  ex: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 14 },
  exHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniValue: { flexDirection: 'row', alignItems: 'baseline', gap: 3, minWidth: 44 },
  exFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  addRow: {
    marginTop: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
  },
});
