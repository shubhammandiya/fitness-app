import type { LoggedSet, Session } from '@/domain/types';

/** A set older than this stops being a useful starting point. */
export const STALE_AFTER_DAYS = 56;

export type LastTime = {
  /** Only the completed sets, in order. */
  sets: LoggedSet[];
  at: number;
  daysAgo: number;
};

const DAY_MS = 86_400_000;

export function daysAgo(ts: number, now = Date.now()): number {
  return Math.max(0, Math.floor((now - ts) / DAY_MS));
}

/**
 * The most recent finished session that contains this exercise, or null when
 * there is none or it is too old to prefill from.
 */
export function lastTimeFor(exerciseId: string, sessions: Session[]): LastTime | null {
  // Sessions are stored in order, but never rely on it — pick the newest by timestamp.
  let best: { sets: LoggedSet[]; at: number } | null = null;

  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;

    const done = entry.sets.filter((s) => s.done);
    if (done.length === 0) continue;

    const at = session.finishedAt ?? session.startedAt;
    if (!best || at > best.at) best = { sets: done, at };
  }

  if (!best) return null;
  const ago = daysAgo(best.at);
  if (ago > STALE_AFTER_DAYS) return null;
  return { sets: best.sets, at: best.at, daysAgo: ago };
}

/**
 * Prefill for a fresh session: set n mirrors set n of last time, and any extra
 * sets repeat the last one. No history → weight 0 (bodyweight is legitimately 0),
 * reps default to the top of the programmed range.
 */
export function prefillSets(
  last: LastTime | null,
  count: number,
  fallbackReps: number
): { weight: number; reps: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const src = last ? (last.sets[i] ?? last.sets[last.sets.length - 1]) : null;
    return { weight: src?.weight ?? 0, reps: src?.reps ?? fallbackReps };
  });
}

/** "62.5 kg × 8" for the heaviest completed set. */
export function topSetLabel(sets: LoggedSet[]): string | null {
  const done = sets.filter((s) => s.done);
  if (done.length === 0) return null;
  const top = done.reduce((best, s) => (s.weight > best.weight ? s : best), done[0]);
  return `${formatWeight(top.weight)} kg × ${top.reps}`;
}

export function formatWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1);
}

export function relativeDay(ts: number): string {
  const ago = daysAgo(ts);
  if (ago === 0) return 'today';
  if (ago === 1) return 'yesterday';
  if (ago < 7) return `${ago} days ago`;
  if (ago < 14) return 'last week';
  return `${Math.floor(ago / 7)} weeks ago`;
}

/** Number of completed sets in a session — 0 means "discard, don't save". */
export function completedSetCount(session: Session | null): number {
  if (!session) return 0;
  return session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
}
