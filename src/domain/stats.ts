import { MUSCLE_LABEL, MUSCLE_ORDER, type Exercise, type MuscleGroup, type Session } from '@/domain/types';

const DAY_MS = 86_400_000;

/** Epley — good enough to compare effort across rep ranges. */
export const estimate1RM = (weight: number, reps: number): number =>
  reps <= 1 ? weight : weight * (1 + reps / 30);

export const round1 = (n: number) => Math.round(n * 10) / 10;

export const sessionTime = (s: Session) => s.finishedAt ?? s.startedAt;

export const doneSets = (s: Session) =>
  s.exercises.flatMap((e) => e.sets.filter((set) => set.done));

export const sessionSetCount = (s: Session) => doneSets(s).length;

export const sessionVolume = (s: Session) =>
  doneSets(s).reduce((sum, set) => sum + set.weight * set.reps, 0);

export const sessionMinutes = (s: Session) =>
  Math.max(1, Math.round(((s.finishedAt ?? Date.now()) - s.startedAt) / 60000));

export type MuscleSets = { muscle: MuscleGroup; label: string; sets: number; volume: number };

/** Hard sets per muscle group inside a rolling window. */
export function setsByMuscle(
  sessions: Session[],
  exercises: Exercise[],
  windowDays = 7,
  now = Date.now()
): MuscleSets[] {
  const cutoff = now - windowDays * DAY_MS;
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const acc = new Map<MuscleGroup, MuscleSets>(
    MUSCLE_ORDER.map((m) => [m, { muscle: m, label: MUSCLE_LABEL[m], sets: 0, volume: 0 }])
  );

  for (const session of sessions) {
    if (sessionTime(session) < cutoff) continue;
    for (const entry of session.exercises) {
      const meta = byId.get(entry.exerciseId);
      if (!meta) continue;
      const bucket = acc.get(meta.muscle);
      if (!bucket) continue;
      for (const set of entry.sets) {
        if (!set.done) continue;
        bucket.sets += 1;
        bucket.volume += set.weight * set.reps;
      }
    }
  }

  return MUSCLE_ORDER.map((m) => acc.get(m)!)
    .filter((row) => row.sets > 0)
    .sort((a, b) => b.sets - a.sets);
}

export type ExercisePoint = { at: number; top: number; est1rm: number; reps: number };

/** One point per session that trained this exercise, oldest first. */
export function exerciseSeries(exerciseId: string, sessions: Session[]): ExercisePoint[] {
  const points: ExercisePoint[] = [];
  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
    const done = entry?.sets.filter((s) => s.done) ?? [];
    if (done.length === 0) continue;
    const top = done.reduce((best, s) => (s.weight > best.weight ? s : best), done[0]);
    points.push({
      at: sessionTime(session),
      top: top.weight,
      reps: top.reps,
      est1rm: round1(estimate1RM(top.weight, top.reps)),
    });
  }
  return points.sort((a, b) => a.at - b.at);
}

/** Exercises you have actually logged, most recently trained first. */
export function trainedExercises(sessions: Session[], limit = 20) {
  const seen = new Map<string, { exerciseId: string; name: string; lastAt: number; sets: number }>();
  for (const session of sessions) {
    const at = sessionTime(session);
    for (const entry of session.exercises) {
      const done = entry.sets.filter((s) => s.done).length;
      if (done === 0) continue;
      const existing = seen.get(entry.exerciseId);
      if (existing) {
        existing.sets += done;
        existing.lastAt = Math.max(existing.lastAt, at);
      } else {
        seen.set(entry.exerciseId, {
          exerciseId: entry.exerciseId,
          name: entry.name,
          lastAt: at,
          sets: done,
        });
      }
    }
  }
  return [...seen.values()].sort((a, b) => b.lastAt - a.lastAt).slice(0, limit);
}

export const shortDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const formatPace = (secPerKm?: number): string | null => {
  if (!secPerKm || !Number.isFinite(secPerKm)) return null;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
};

export const formatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  return h > 0 ? `${h} h ${m} m` : `${Math.max(1, m)} min`;
};

export const longDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
