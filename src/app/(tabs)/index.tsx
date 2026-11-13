import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  completedSetCount,
  formatWeight,
  lastTimeFor,
  prefillSets,
  relativeDay,
  topSetLabel,
} from '@/domain/history';
import {
  EQUIPMENT_LABEL,
  type DayExercise,
  type Exercise,
  type LoggedSet,
  type Session,
} from '@/domain/types';
import {
  cancelAllRestNotifications,
  cancelRestDone,
  configureRestNotifications,
  restDoneFeedback,
  scheduleRestDone,
  tickFeedback,
} from '@/lib/rest';
import { useStore } from '@/state/store';
import ExercisePicker from '@/ui/exercise-picker';
import RestBar, { type RestState } from '@/ui/rest-bar';
import { Body, Display, Micro, Num, Title } from '@/ui/text';
import { figures, fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

function Stepper({
  value,
  onStep,
  step,
  unit,
  onPressValue,
}: {
  value: number;
  onStep: (delta: number) => void;
  step: number;
  unit?: string;
  onPressValue?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onStep(-step)}
        hitSlop={6}
        style={[styles.stepBtn, { backgroundColor: t.surf2, borderColor: t.line }]}>
        <Body style={{ color: t.tx, fontSize: 15, lineHeight: 18 }}>−</Body>
      </Pressable>
      <Pressable onPress={onPressValue} hitSlop={6} disabled={!onPressValue}>
        {unit ? (
          <View style={styles.weightValue}>
            <Num style={{ fontSize: 21, color: t.tx }}>{formatWeight(value)}</Num>
            <Micro style={{ fontSize: 9, letterSpacing: 0.9 }}>{unit}</Micro>
          </View>
        ) : (
          <Num style={{ fontSize: 21, color: t.tx }}>{value}</Num>
        )}
      </Pressable>
      <Pressable
        onPress={() => onStep(step)}
        hitSlop={6}
        style={[styles.stepBtn, { backgroundColor: t.surf2, borderColor: t.line }]}>
        <Body style={{ color: t.tx, fontSize: 15, lineHeight: 18 }}>+</Body>
      </Pressable>
    </View>
  );
}

function SetRow({
  index,
  weight,
  reps,
  done,
  hot,
  interactive,
  weightStep,
  unit,
  onFocus,
  onChange,
  onTick,
}: {
  index: number;
  weight: number;
  reps: number;
  done: boolean;
  hot: boolean;
  interactive: boolean;
  weightStep: number;
  unit: string;
  onFocus: () => void;
  onChange: (delta: { weight?: number; reps?: number }) => void;
  onTick: () => void;
}) {
  const t = useTheme();
  const [typing, setTyping] = useState<'w' | 'r' | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  // autoFocus alone is unreliable inside a scrolling pager — focus explicitly once mounted.
  useEffect(() => {
    if (!typing) return;
    const id = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [typing]);

  const startTyping = (field: 'w' | 'r', current: string) => {
    if (!interactive || done) return;
    setDraft(current);
    setTyping(field);
  };

  // 90 kg is 36 taps at 2.5 kg — typing is the fast path, steppers are for small nudges.
  const commit = () => {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      if (typing === 'w') onChange({ weight: parsed - weight });
      else onChange({ reps: Math.round(parsed) - reps });
    }
    setTyping(null);
  };

  return (
    <View
      style={[
        styles.set,
        {
          backgroundColor: hot && !done ? t.surf2 : t.surf,
          borderColor: hot && !done ? t.acc : 'transparent',
          opacity: done ? 0.45 : interactive ? 1 : 0.6,
        },
      ]}>
      <Micro style={{ width: 18, letterSpacing: 0, color: hot ? t.accInk : t.mut }}>{index + 1}</Micro>

      {typing === 'w' ? (
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          autoFocus
          selectTextOnFocus
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={commit}
          onBlur={commit}
          style={[styles.typeInput, { color: t.tx, fontFamily: fonts.serif }]}
          placeholder="0"
          placeholderTextColor={t.mut}
        />
      ) : hot && !done ? (
        <Stepper
          value={weight}
          step={weightStep}
          unit={unit}
          onPressValue={() => startTyping('w', formatWeight(weight))}
          onStep={(d) => onChange({ weight: d })}
        />
      ) : (
        <Pressable style={{ flex: 1 }} onPress={onFocus} disabled={!interactive || done}>
          <View style={[styles.weightValue, { justifyContent: 'center' }]}>
            <Num>{formatWeight(weight)}</Num>
            <Micro style={{ fontSize: 9, letterSpacing: 0.9 }}>{unit}</Micro>
          </View>
        </Pressable>
      )}

      <Body style={{ color: t.mut, fontSize: 11, marginHorizontal: 18 }}>×</Body>

      {typing === 'r' ? (
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          autoFocus
          selectTextOnFocus
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={commit}
          onBlur={commit}
          style={[styles.typeInput, { color: t.tx, fontFamily: fonts.serif }]}
          placeholder="0"
          placeholderTextColor={t.mut}
        />
      ) : hot && !done ? (
        <Stepper
          value={reps}
          step={1}
          onPressValue={() => startTyping('r', String(reps))}
          onStep={(d) => onChange({ reps: d })}
        />
      ) : (
        <Pressable style={{ flex: 1 }} onPress={onFocus} disabled={!interactive || done}>
          <Num style={{ textAlign: 'center' }}>{reps}</Num>
        </Pressable>
      )}

      <Pressable
        onPress={onTick}
        disabled={!interactive}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Set ${index + 1} ${done ? 'done' : 'not done'}`}
        style={[
          styles.tick,
          {
            borderColor: done ? t.acc : hot ? t.acc : t.line,
            backgroundColor: done ? t.acc : 'transparent',
          },
        ]}>
        <Body style={{ color: done ? t.onAcc : hot ? t.accInk : t.mut, fontSize: 10 }}>✓</Body>
      </Pressable>
    </View>
  );
}

export default function WorkoutScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const programs = useStore((s) => s.programs);
  const allExercises = useStore((s) => s.exercises);
  const sessions = useStore((s) => s.sessions);
  const activeSession = useStore((s) => s.activeSession);
  const weightStep = useStore((s) => s.settings.incrementKg);
  const units = useStore((s) => s.settings.units);
  const addExerciseToDay = useStore((s) => s.addExerciseToDay);
  const removeDayExercise = useStore((s) => s.removeDayExercise);
  const addSet = useStore((s) => s.addSet);
  const removeSet = useStore((s) => s.removeSet);
  const tickSet = useStore((s) => s.tickSet);
  const setSetValue = useStore((s) => s.setSetValue);
  const finishSession = useStore((s) => s.finishSession);
  const discardSession = useStore((s) => s.discardSession);

  const program = programs.find((p) => p.isActive) ?? programs[0];
  const days = program?.days ?? [];

  const [rawIndex, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [focus, setFocus] = useState<Record<string, number>>({});
  const [rest, setRest] = useState<RestState | null>(null);
  const [justFinished, setJustFinished] = useState<{ sets: number; minutes: number } | null>(null);

  const index = Math.min(rawIndex, Math.max(days.length - 1, 0));
  const day = days[index];

  const byId = useMemo(
    () => Object.fromEntries(allExercises.map((e) => [e.id, e])) as Record<string, Exercise>,
    [allExercises]
  );

  const session: Session | null = activeSession && activeSession.dayId === day?.id ? activeSession : null;
  const sessionElsewhere = !!activeSession && activeSession.dayId !== day?.id;
  const doneCount = completedSetCount(activeSession);

  useEffect(() => {
    configureRestNotifications();
  }, []);

  // A pending rest should not outlive this screen's state.
  useEffect(() => {
    if (!rest) cancelAllRestNotifications();
  }, [rest]);

  const startRest = (seconds: number, label: string) => {
    cancelRestDone(rest?.notifId);
    const endsAt = Date.now() + seconds * 1000;
    setRest({ endsAt, total: seconds, label, notifId: null });
    scheduleRestDone(seconds, label).then((id) => {
      setRest((r) => (r && r.endsAt === endsAt ? { ...r, notifId: id } : r));
    });
  };

  const endRest = (feedback: boolean) => {
    if (feedback) restDoneFeedback();
    cancelRestDone(rest?.notifId);
    setRest(null);
  };

  const extendRest = (delta: number) => {
    if (!rest) return;
    cancelRestDone(rest.notifId);
    const endsAt = Math.max(Date.now() + 1000, rest.endsAt + delta * 1000);
    const total = Math.max(1, rest.total + delta);
    setRest({ endsAt, total, label: rest.label, notifId: null });
    scheduleRestDone(Math.max(1, Math.round((endsAt - Date.now()) / 1000)), rest.label).then((id) => {
      setRest((r) => (r && r.endsAt === endsAt ? { ...r, notifId: id } : r));
    });
  };

  const handleTick = (exerciseId: string, setIndex: number, name: string) => {
    if (!day) return;
    const secs = tickSet(day.id, exerciseId, setIndex);
    tickFeedback();
    setFocus((f) => {
      const next = { ...f };
      delete next[exerciseId];
      return next;
    });
    if (secs) startRest(secs, `${name} · next set`);
  };

  const handleFinish = () => {
    if (!activeSession) return;
    const sets = completedSetCount(activeSession);
    const minutes = Math.max(1, Math.round((Date.now() - activeSession.startedAt) / 60000));
    finishSession();
    cancelAllRestNotifications();
    setRest(null);
    if (sets > 0) {
      setJustFinished({ sets, minutes });
      setTimeout(() => setJustFinished(null), 4500);
    }
  };

  const handleDiscard = () => {
    discardSession();
    cancelAllRestNotifications();
    setRest(null);
  };

  const pickerDay = days.find((d) => d.id === pickerDayId);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 10 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.headRow}>
          <Display>{day?.name ?? 'No program'}</Display>
          <Pressable onPress={() => setEditing((e) => !e)} hitSlop={10} disabled={!day} accessibilityRole="button">
            <Micro style={{ color: editing ? t.accInk : t.mut, letterSpacing: 1.4 }}>
              {editing ? 'done' : 'edit'}
            </Micro>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Micro>
            day {index + 1} of {Math.max(days.length, 1)}
            {program ? ` · ${program.name}` : ''}
          </Micro>
          {activeSession ? (
            <Micro style={{ color: t.accInk }}>
              session · {doneCount} {doneCount === 1 ? 'set' : 'sets'}
            </Micro>
          ) : null}
        </View>

        <View style={styles.dots}>
          {days.map((d, i) => (
            <View
              key={d.id}
              style={[
                styles.dot,
                {
                  backgroundColor: activeSession?.dayId === d.id ? t.accInk : i === index ? t.acc : t.line,
                  width: i === index ? 30 : 22,
                },
              ]}
            />
          ))}
        </View>

        {rest ? (
          <RestBar
            rest={rest}
            onExtend={extendRest}
            onSkip={() => endRest(false)}
            onDone={() => endRest(true)}
          />
        ) : null}

        {justFinished ? (
          <View style={[styles.saved, { borderColor: t.acc }]}>
            <Micro style={{ color: t.accInk }}>
              saved · {justFinished.sets} sets · {justFinished.minutes} min
            </Micro>
          </View>
        ) : null}

        {sessionElsewhere ? (
          <View style={{ marginBottom: 10 }}>
            <Micro style={{ color: t.accInk }}>
              session in progress on {activeSession?.dayName} · finish it first
            </Micro>
          </View>
        ) : null}
      </View>

      {days.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Body style={{ color: t.mut }}>This program has no days yet.</Body>
        </View>
      ) : (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
          {days.map((d) => {
            const pageSession = activeSession?.dayId === d.id ? activeSession : null;
            const pageLocked = !!activeSession && !pageSession;
            const pageSetsDone = pageSession
              ? pageSession.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
              : 0;

            return (
              <ScrollView
                key={d.id}
                style={{ width }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}>
                {d.exercises.length === 0 ? (
                  <Body style={{ color: t.mut, paddingVertical: 18 }}>
                    Nothing here yet. Add your first movement below.
                  </Body>
                ) : null}

                {d.exercises.map((entry) => {
                  const exercise = byId[entry.exerciseId];
                  const name = exercise?.name ?? 'Unknown exercise';
                  const last = lastTimeFor(entry.exerciseId, sessions);
                  const logged = pageSession?.exercises.find((e) => e.exerciseId === entry.exerciseId);

                  const sets: LoggedSet[] =
                    logged?.sets ??
                    prefillSets(last, entry.targetSets, entry.repMax).map((fill, i) => ({
                      index: i,
                      weight: fill.weight,
                      reps: fill.reps,
                      done: false,
                    }));

                  const firstOpen = sets.findIndex((s) => !s.done);
                  const hotIndex = focus[entry.exerciseId] ?? (firstOpen === -1 ? sets.length - 1 : firstOpen);
                  const expanded = openId === entry.id;

                  return (
                    <View key={entry.id} style={[styles.ex, { borderBottomColor: t.line }]}>
                      <Pressable
                        onPress={() => setOpenId((cur) => (cur === entry.id ? null : entry.id))}
                        accessibilityRole="button"
                        accessibilityState={{ expanded }}
                        accessibilityLabel={`${name} sets`}
                        style={styles.exHead}
                        disabled={editing}>
                        <View style={{ flex: 1 }}>
                          <Title>{name}</Title>
                          <Micro style={{ marginTop: 5, letterSpacing: 1.3 }}>
                            {entry.targetSets} × {entry.repMin}–{entry.repMax}
                            {exercise ? ` · ${EQUIPMENT_LABEL[exercise.equipment]}` : ''}
                          </Micro>
                          {last ? (
                            <Micro style={{ marginTop: 3, letterSpacing: 1.2 }}>
                              last · {topSetLabel(last.sets) ?? '—'} · {relativeDay(last.at)}
                            </Micro>
                          ) : null}
                        </View>

                        {editing ? (
                          <Pressable
                            onPress={() => removeDayExercise(entry.id)}
                            hitSlop={12}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${name}`}
                            style={[styles.remove, { borderColor: t.danger }]}>
                            <Body style={{ color: t.danger, fontSize: 15, lineHeight: 18 }}>−</Body>
                          </Pressable>
                        ) : (
                          <Micro style={{ color: expanded ? t.accInk : t.mut, letterSpacing: 1 }}>
                            {logged && logged.sets.some((s) => s.done)
                              ? `${logged.sets.filter((s) => s.done).length}/${sets.length}`
                              : expanded
                                ? 'less'
                                : 'sets'}
                          </Micro>
                        )}
                      </Pressable>

                      {expanded && !editing ? (
                        <View style={{ marginTop: 12 }}>
                          {sets.map((s, i) => (
                            <SetRow
                              key={s.index}
                              index={i}
                              weight={s.weight}
                              reps={s.reps}
                              done={s.done}
                              hot={hotIndex === i}
                              interactive={!pageLocked}
                              weightStep={weightStep}
                              unit={units}
                              onFocus={() => setFocus((f) => ({ ...f, [entry.exerciseId]: i }))}
                              onChange={(delta) => setSetValue(d.id, entry.exerciseId, i, delta)}
                              onTick={() => handleTick(entry.exerciseId, i, name)}
                            />
                          ))}
                          <View style={[styles.setTools, { borderTopColor: t.line }]}>
                            <Pressable
                              onPress={() => removeSet(d.id, entry.exerciseId)}
                              disabled={entry.targetSets <= 1}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel="Remove a set">
                              <Micro
                                style={{
                                  color: entry.targetSets <= 1 ? t.mut : t.accInk,
                                  letterSpacing: 1.3,
                                }}>
                                − set
                              </Micro>
                            </Pressable>
                            <Pressable
                              onPress={() => addSet(d.id, entry.exerciseId)}
                              disabled={entry.targetSets >= 10}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel="Add a set">
                              <Micro
                                style={{
                                  color: entry.targetSets >= 10 ? t.mut : t.accInk,
                                  letterSpacing: 1.3,
                                }}>
                                + set
                              </Micro>
                            </Pressable>
                            <View style={{ flex: 1 }} />
                            <Micro style={{ letterSpacing: 1.2 }}>
                              {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                            </Micro>
                          </View>
                          <Micro style={{ marginTop: 8, letterSpacing: 1.2 }}>
                            tap a number to edit · tap ✓ to log the set
                          </Micro>
                        </View>
                      ) : null}
                    </View>
                  );
                })}

                <Pressable
                  onPress={() => setPickerDayId(d.id)}
                  accessibilityRole="button"
                  style={[styles.addBtn, { borderColor: t.line }]}>
                    <Body
                      style={{
                        color: t.accInk,
                        fontFamily: fonts.sansSemi,
                        fontSize: 12,
                        letterSpacing: 0.6,
                      }}>
                      + Add exercise
                    </Body>
                </Pressable>

                <Pressable
                  onPress={handleFinish}
                  disabled={!pageSession}
                  accessibilityRole="button"
                  style={[
                    styles.finish,
                    {
                      borderColor: pageSession ? t.acc : t.line,
                      backgroundColor: pageSession ? t.acc : 'transparent',
                      opacity: pageSession ? 1 : 0.4,
                    },
                  ]}>
                  <Micro
                    style={{
                      color: pageSession ? t.onAcc : t.mut,
                      letterSpacing: 1.7,
                      fontSize: 10,
                    }}>
                    finish workout
                    {pageSession
                      ? ` · ${pageSetsDone} ${pageSetsDone === 1 ? 'set' : 'sets'}`
                      : ''}
                  </Micro>
                </Pressable>

                {pageSession ? (
                  <Pressable onPress={handleDiscard} style={{ marginTop: 10 }} hitSlop={8}>
                    <Micro style={{ textAlign: 'center', letterSpacing: 1.2 }}>discard session</Micro>
                  </Pressable>
                ) : null}
              </ScrollView>
            );
          })}
        </ScrollView>
      )}

      <ExercisePicker
        visible={pickerDayId !== null}
        exercises={allExercises}
        addedIds={pickerDay?.exercises.map((e) => e.exerciseId) ?? []}
        onPick={(exerciseId) => {
          if (pickerDayId) addExerciseToDay(pickerDayId, exerciseId);
        }}
        onClose={() => setPickerDayId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6, gap: 10 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 12 },
  dot: { height: 3, borderRadius: 2 },
  saved: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 12,
  },
  ex: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 14 },
  exHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  remove: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  set: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  stepper: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weightValue: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  typeInput: {
    flex: 1,
    fontSize: 21,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    fontVariant: ['tabular-nums'],
  },
  setTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addBtn: {
    marginTop: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finish: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
});
