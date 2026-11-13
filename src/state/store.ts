import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { completedSetCount, lastTimeFor, prefillSets } from '@/domain/history';
import { SEED_EXERCISES, createStarterProgram } from '@/domain/seed';
import { programFromSplit } from '@/domain/splits';
import type {
  BodyWeightEntry,
  CardioLog,
  DayExercise,
  Exercise,
  Program,
  ProgramDay,
  Session,
  SessionExercise,
} from '@/domain/types';
import { uid } from '@/domain/types';
import type { AccentId } from '@/ui/theme';

export type ThemePref = 'night' | 'day' | 'system';

export type Settings = {
  theme: ThemePref;
  accent: AccentId;
  units: 'kg' | 'lb';
  defaultRestSec: number;
  incrementKg: number;
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'night',
  accent: 'lime',
  units: 'kg',
  defaultRestSec: 90,
  incrementKg: 2.5,
};

type Data = {
  exercises: Exercise[];
  programs: Program[];
  sessions: Session[];
  /** The workout in progress, if any. Persisted so a killed app doesn't lose it. */
  activeSession: Session | null;
  cardio: CardioLog[];
  bodyWeight: BodyWeightEntry[];
};

type Actions = {
  setTheme: (theme: ThemePref) => void;
  setAccent: (accent: AccentId) => void;
  patchSettings: (next: Partial<Settings>) => void;

  setActiveProgram: (programId: string) => void;
  createProgram: (splitId: string, name: string) => string;
  duplicateProgram: (programId: string) => string | null;
  deleteProgram: (programId: string) => void;
  renameProgram: (programId: string, name: string) => void;
  addDay: (programId: string) => string | null;
  removeDay: (programId: string, dayId: string) => void;
  renameDay: (dayId: string, name: string) => void;
  addExerciseToDay: (dayId: string, exerciseId: string) => void;
  removeDayExercise: (dayExerciseId: string) => void;
  addSet: (dayId: string, exerciseId: string) => void;
  removeSet: (dayId: string, exerciseId: string) => void;
  updateDayExercise: (
    dayExerciseId: string,
    patch: Partial<Pick<DayExercise, 'targetSets' | 'repMin' | 'repMax' | 'restSec'>>
  ) => void;
  addCustomExercise: (
    name: string,
    muscle: Exercise['muscle'],
    equipment: Exercise['equipment']
  ) => Exercise;

  /** Starts (or joins) the session for this day and flips the set. Returns the rest seconds to run. */
  tickSet: (dayId: string, exerciseId: string, setIndex: number) => number | null;
  setSetValue: (
    dayId: string,
    exerciseId: string,
    setIndex: number,
    delta: { weight?: number; reps?: number }
  ) => void;
  finishSession: () => void;
  discardSession: () => void;
  /** Records today's body weight (one entry per calendar day). */
  addBodyWeight: (kg: number) => void;
  addCardio: (input: {
    activity: string;
    durationSec: number;
    distanceKm?: number;
    surface?: CardioLog['surface'];
    elevationM?: number;
    notes?: string;
  }) => void;
  removeCardio: (id: string) => void;
  /** Applies an imported backup over the current document. */
  replaceAll: (payload: {
    settings?: Partial<Settings>;
    exercises: Exercise[];
    programs: Program[];
    sessions: Session[];
    cardio: CardioLog[];
    bodyWeight: BodyWeightEntry[];
  }) => void;
  resetAll: () => void;
};

export type State = Data & Actions & { settings: Settings };

const initialData = (): Data => ({
  exercises: SEED_EXERCISES,
  programs: [createStarterProgram()],
  sessions: [],
  activeSession: null,
  cardio: [],
  bodyWeight: [],
});

/** Map every day in every program, leaving the rest untouched. */
const mapDays = (
  programs: Program[],
  fn: (day: ProgramDay) => ProgramDay
) => programs.map((p) => ({ ...p, days: p.days.map(fn) }));

const findDay = (programs: Program[], dayId: string): { program: Program; day: ProgramDay } | null => {
  for (const program of programs) {
    const day = program.days.find((d) => d.id === dayId);
    if (day) return { program, day };
  }
  return null;
};

/** Snapshot the day template into a loggable session, prefilled from history. */
function buildSession(state: State, dayId: string): Session | null {
  const found = findDay(state.programs, dayId);
  if (!found) return null;
  const { program, day } = found;

  const exercises: SessionExercise[] = day.exercises.map((entry) => {
    const last = lastTimeFor(entry.exerciseId, state.sessions);
    const fills = prefillSets(last, entry.targetSets, entry.repMax);
    const name = state.exercises.find((e) => e.id === entry.exerciseId)?.name ?? 'Exercise';
    return {
      exerciseId: entry.exerciseId,
      name,
      sets: fills.map((fill, i) => ({ index: i, weight: fill.weight, reps: fill.reps, done: false })),
    };
  });

  return {
    id: uid('sess'),
    programId: program.id,
    dayId,
    dayName: day.name,
    startedAt: Date.now(),
    exercises,
  };
}

const ensureSession = (state: State, dayId: string): Session | null =>
  state.activeSession?.dayId === dayId ? state.activeSession : buildSession(state, dayId);

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialData(),
      settings: DEFAULT_SETTINGS,

      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setAccent: (accent) => set((s) => ({ settings: { ...s.settings, accent } })),
      patchSettings: (next) => set((s) => ({ settings: { ...s.settings, ...next } })),

      setActiveProgram: (programId) =>
        set((s) => ({
          programs: s.programs.map((p) => ({ ...p, isActive: p.id === programId })),
        })),

      createProgram: (splitId, name) => {
        const program = programFromSplit(splitId, name, new Set(get().exercises.map((e) => e.id)));
        program.isActive = true;
        set((s) => ({
          programs: [...s.programs.map((p) => ({ ...p, isActive: false })), program],
        }));
        return program.id;
      },

      duplicateProgram: (programId) => {
        const source = get().programs.find((p) => p.id === programId);
        if (!source) return null;
        const copy: Program = {
          ...source,
          id: uid('prog'),
          name: `${source.name} copy`,
          isActive: false,
          createdAt: Date.now(),
          days: source.days.map((day) => ({
            ...day,
            id: uid('day'),
            exercises: day.exercises.map((e) => ({ ...e, id: uid('de') })),
          })),
        };
        set((s) => ({ programs: [...s.programs, copy] }));
        return copy.id;
      },

      deleteProgram: (programId) =>
        set((s) => {
          if (s.programs.length <= 1) return {};
          const remaining = s.programs.filter((p) => p.id !== programId);
          const hadActive = s.programs.find((p) => p.id === programId)?.isActive;
          return {
            programs: hadActive ? remaining.map((p, i) => ({ ...p, isActive: i === 0 })) : remaining,
          };
        }),

      renameProgram: (programId, name) =>
        set((s) => ({
          programs: s.programs.map((p) => (p.id === programId ? { ...p, name: name.trim() || p.name } : p)),
        })),

      addDay: (programId) => {
        const program = get().programs.find((p) => p.id === programId);
        if (!program) return null;
        const day: ProgramDay = {
          id: uid('day'),
          name: `Day ${program.days.length + 1}`,
          order: program.days.length,
          exercises: [],
        };
        set((s) => ({
          programs: s.programs.map((p) => (p.id === programId ? { ...p, days: [...p.days, day] } : p)),
        }));
        return day.id;
      },

      removeDay: (programId, dayId) =>
        set((s) => ({
          programs: s.programs.map((p) =>
            p.id !== programId
              ? p
              : {
                  ...p,
                  days: p.days
                    .filter((d) => d.id !== dayId)
                    .map((d, i) => ({ ...d, order: i })),
                }
          ),
        })),

      renameDay: (dayId, name) =>
        set((s) => ({
          programs: mapDays(s.programs, (day) =>
            day.id === dayId ? { ...day, name: name.trim() || day.name } : day
          ),
        })),

      addExerciseToDay: (dayId, exerciseId) =>
        set((s) => ({
          programs: mapDays(s.programs, (day) => {
            if (day.id !== dayId) return day;
            // Adding the same movement twice in one day is almost always a mistake.
            if (day.exercises.some((e) => e.exerciseId === exerciseId)) return day;
            const next: DayExercise = {
              id: uid('de'),
              exerciseId,
              order: day.exercises.length,
              targetSets: 3,
              repMin: 8,
              repMax: 12,
            };
            return { ...day, exercises: [...day.exercises, next] };
          }),
        })),

      removeDayExercise: (dayExerciseId) =>
        set((s) => ({
          programs: mapDays(s.programs, (day) => ({
            ...day,
            exercises: day.exercises
              .filter((e) => e.id !== dayExerciseId)
              .map((e, i) => ({ ...e, order: i })),
          })),
        })),

      updateDayExercise: (dayExerciseId, patch) =>
        set((s) => ({
          programs: mapDays(s.programs, (day) => ({
            ...day,
            exercises: day.exercises.map((e) => (e.id === dayExerciseId ? { ...e, ...patch } : e)),
          })),
        })),

      addSet: (dayId, exerciseId) =>
        set((s) => {
          const day = findDay(s.programs, dayId)?.day;
          const entry = day?.exercises.find((e) => e.exerciseId === exerciseId);
          if (!day || !entry || entry.targetSets >= 10) return {};

          // The set count lives on the day template, so next week matches what you did today.
          const programs = mapDays(s.programs, (d) =>
            d.id !== dayId
              ? d
              : {
                  ...d,
                  exercises: d.exercises.map((e) =>
                    e.exerciseId === exerciseId ? { ...e, targetSets: e.targetSets + 1 } : e
                  ),
                }
          );

          const session = s.activeSession?.dayId === dayId ? s.activeSession : null;
          if (!session) return { programs };

          const exercises = session.exercises.map((e) => {
            if (e.exerciseId !== exerciseId) return e;
            const last = e.sets[e.sets.length - 1];
            return {
              ...e,
              sets: [
                ...e.sets,
                {
                  index: e.sets.length,
                  weight: last?.weight ?? 0,
                  reps: last?.reps ?? entry.repMax,
                  done: false,
                },
              ],
            };
          });

          return { programs, activeSession: { ...session, exercises } };
        }),

      removeSet: (dayId, exerciseId) =>
        set((s) => {
          const day = findDay(s.programs, dayId)?.day;
          const entry = day?.exercises.find((e) => e.exerciseId === exerciseId);
          if (!day || !entry || entry.targetSets <= 1) return {};

          const programs = mapDays(s.programs, (d) =>
            d.id !== dayId
              ? d
              : {
                  ...d,
                  exercises: d.exercises.map((e) =>
                    e.exerciseId === exerciseId
                      ? { ...e, targetSets: Math.max(1, e.targetSets - 1) }
                      : e
                  ),
                }
          );

          const session = s.activeSession?.dayId === dayId ? s.activeSession : null;
          if (!session) return { programs };

          const exercises = session.exercises.map((e) =>
            e.exerciseId !== exerciseId || e.sets.length <= 1
              ? e
              : { ...e, sets: e.sets.slice(0, -1).map((st, i) => ({ ...st, index: i })) }
          );

          return { programs, activeSession: { ...session, exercises } };
        }),

      addCustomExercise: (name, muscle, equipment) => {
        const exercise: Exercise = {
          id: uid('ex'),
          name: name.trim(),
          muscle,
          equipment,
          isCustom: true,
        };
        set((s) => ({ exercises: [...s.exercises, exercise] }));
        return exercise;
      },

      tickSet: (dayId, exerciseId, setIndex) => {
        let restSec: number | null = null;

        set((s) => {
          const session = ensureSession(s, dayId);
          if (!session) return {};

          const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
          const target = entry?.sets[setIndex];
          if (!entry || !target) return {};

          const nowDone = !target.done;
          const exercises = session.exercises.map((e) =>
            e.exerciseId !== exerciseId
              ? e
              : {
                  ...e,
                  sets: e.sets.map((st, i) =>
                    i === setIndex
                      ? { ...st, done: nowDone, completedAt: nowDone ? Date.now() : undefined }
                      : st
                  ),
                }
          );

          if (nowDone) {
            const dayExercise = findDay(s.programs, dayId)?.day.exercises.find(
              (d) => d.exerciseId === exerciseId
            );
            restSec = dayExercise?.restSec ?? s.settings.defaultRestSec;
          }

          return { activeSession: { ...session, exercises } };
        });

        return restSec;
      },

      setSetValue: (dayId, exerciseId, setIndex, delta) =>
        set((s) => {
          const session = ensureSession(s, dayId);
          if (!session) return {};
          const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
          const target = entry?.sets[setIndex];
          if (!entry || !target) return {};

          // Values arrive as deltas so two fast taps both count.
          const oldWeight = target.weight;
          const oldReps = target.reps;
          const newWeight = Math.max(0, Math.round((oldWeight + (delta.weight ?? 0)) * 10) / 10);
          const newReps = Math.max(0, Math.round(oldReps + (delta.reps ?? 0)));

          const exercises = session.exercises.map((e) =>
            e.exerciseId !== exerciseId
              ? e
              : {
                  ...e,
                  sets: e.sets.map((st, i) => {
                    if (i === setIndex) {
                      return { ...st, weight: newWeight, reps: newReps };
                    }
                    // Follow the change down the list while later sets still hold the old value —
                    // bumping set 1 to 60 kg should make set 2 start at 60, not 0.
                    if (i > setIndex && !st.done) {
                      const next = { ...st };
                      if (delta.weight !== undefined && st.weight === oldWeight) next.weight = newWeight;
                      if (delta.reps !== undefined && st.reps === oldReps) next.reps = newReps;
                      return next;
                    }
                    return st;
                  }),
                }
          );

          return { activeSession: { ...session, exercises } };
        }),

      finishSession: () =>
        set((s) => {
          const session = s.activeSession;
          if (!session) return {};
          // Nothing logged → nothing to keep.
          if (completedSetCount(session) === 0) return { activeSession: null };
          const finished: Session = { ...session, finishedAt: Date.now() };
          return { activeSession: null, sessions: [...s.sessions, finished] };
        }),

      discardSession: () => set({ activeSession: null }),

      addBodyWeight: (kg) =>
        set((s) => {
          const date = new Date().toISOString().slice(0, 10);
          const others = s.bodyWeight.filter((e) => e.date !== date);
          return { bodyWeight: [...others, { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) };
        }),

      addCardio: (input) =>
        set((s) => {
          const distance = input.distanceKm && input.distanceKm > 0 ? input.distanceKm : undefined;
          const entry: CardioLog = {
            id: uid('cardio'),
            activity: input.activity.trim() || 'Cardio',
            durationSec: Math.max(60, Math.round(input.durationSec)),
            distanceKm: distance,
            surface: input.surface,
            elevationM: input.elevationM && input.elevationM > 0 ? Math.round(input.elevationM) : undefined,
            notes: input.notes?.trim() || undefined,
            at: Date.now(),
            paceSecPerKm: distance ? Math.round(input.durationSec / distance) : undefined,
          };
          return { cardio: [...s.cardio, entry] };
        }),

      removeCardio: (id) => set((s) => ({ cardio: s.cardio.filter((c) => c.id !== id) })),

      replaceAll: (payload) =>
        set((s) => ({
          settings: { ...s.settings, ...(payload.settings ?? {}) },
          exercises: payload.exercises.length ? payload.exercises : SEED_EXERCISES,
          programs: payload.programs.length ? payload.programs : [createStarterProgram()],
          sessions: payload.sessions,
          cardio: payload.cardio,
          bodyWeight: payload.bodyWeight,
          activeSession: null,
        })),

      resetAll: () =>
        set(() => ({
          ...initialData(),
          settings: DEFAULT_SETTINGS,
        })),
    }),
    {
      name: 'ledger-store-v1',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        settings: s.settings,
        exercises: s.exercises,
        programs: s.programs,
        sessions: s.sessions,
        activeSession: s.activeSession,
        cardio: s.cardio,
        bodyWeight: s.bodyWeight,
      }),
      // Older documents carried settings (v1) or no active session (v2) — fill in, never wipe.
      migrate: (persisted: any) => ({
        ...initialData(),
        ...(persisted ?? {}),
        settings: { ...DEFAULT_SETTINGS, ...(persisted?.settings ?? {}) },
      }),
      merge: (persisted: any, current) => {
        const merged = { ...current, ...(persisted ?? {}) } as State;
        merged.settings = { ...DEFAULT_SETTINGS, ...(persisted?.settings ?? {}) };
        if (!merged.exercises?.length) merged.exercises = SEED_EXERCISES;
        if (!merged.programs?.length) merged.programs = [createStarterProgram()];
        if (merged.activeSession === undefined) merged.activeSession = null;
        return merged;
      },
    }
  )
);

/** The program shown in the Workout tab. */
export const useActiveProgram = () =>
  useStore((s) => s.programs.find((p) => p.isActive) ?? s.programs[0]);

export const useActiveSession = () => useStore((s) => s.activeSession);

// Dev-only handle so the store can be inspected from a debugger / browser console.
if (__DEV__) {
  (globalThis as any).__ledgerStore = useStore;
}
