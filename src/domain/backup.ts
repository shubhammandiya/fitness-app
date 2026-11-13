import type {
  BodyWeightEntry,
  CardioLog,
  Exercise,
  Program,
  Session,
} from '@/domain/types';

export const BACKUP_APP = 'ledger';
export const BACKUP_SCHEMA = 4;

/** Settings are owned by the store; this is the shape the backup carries. */
export type BackupSettings = {
  theme: string;
  accent: string;
  units: string;
  defaultRestSec: number;
  incrementKg: number;
};

export type BackupDoc = {
  app: typeof BACKUP_APP;
  schema: number;
  exportedAt: string;
  settings: BackupSettings;
  exercises: Exercise[];
  programs: Program[];
  sessions: Session[];
  cardio: CardioLog[];
  bodyWeight: BodyWeightEntry[];
};

export function buildBackup(state: {
  settings: BackupSettings;
  exercises: Exercise[];
  programs: Program[];
  sessions: Session[];
  cardio: CardioLog[];
  bodyWeight: BodyWeightEntry[];
}): BackupDoc {
  return {
    app: BACKUP_APP,
    schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    exercises: state.exercises,
    programs: state.programs,
    sessions: state.sessions,
    cardio: state.cardio,
    bodyWeight: state.bodyWeight,
  };
}

export type ParseResult =
  | { ok: true; doc: BackupDoc; summary: string }
  | { ok: false; error: string };

/**
 * Accepts both a plain export and a persisted zustand document (`{ state: … }`),
 * because a user may have copied the app's own storage by hand.
 */
export function parseBackup(text: string): ParseResult {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }

  const doc = raw?.state ?? raw;

  if (!doc || typeof doc !== 'object') return { ok: false, error: 'Empty backup file.' };
  if (!Array.isArray(doc.programs) || !Array.isArray(doc.exercises)) {
    return { ok: false, error: 'Not a Ledger backup — no programs/exercises found.' };
  }

  const settings: BackupSettings = {
    theme: typeof doc.settings?.theme === 'string' ? doc.settings.theme : 'night',
    accent: typeof doc.settings?.accent === 'string' ? doc.settings.accent : 'lime',
    units: typeof doc.settings?.units === 'string' ? doc.settings.units : 'kg',
    defaultRestSec: Number(doc.settings?.defaultRestSec) || 90,
    incrementKg: Number(doc.settings?.incrementKg) || 2.5,
  };

  const normalized: BackupDoc = {
    app: BACKUP_APP,
    schema: Number(doc.schema) || 1,
    exportedAt: typeof doc.exportedAt === 'string' ? doc.exportedAt : new Date().toISOString(),
    settings,
    exercises: doc.exercises,
    programs: doc.programs,
    sessions: Array.isArray(doc.sessions) ? doc.sessions : [],
    cardio: Array.isArray(doc.cardio) ? doc.cardio : [],
    bodyWeight: Array.isArray(doc.bodyWeight) ? doc.bodyWeight : [],
  };

  return { ok: true, doc: normalized, summary: backupSummary(normalized) };
}

export function backupSummary(doc: {
  programs: unknown[];
  sessions: unknown[];
  cardio: unknown[];
  bodyWeight: unknown[];
}): string {
  const parts = [
    `${doc.programs.length} program${doc.programs.length === 1 ? '' : 's'}`,
    `${doc.sessions.length} session${doc.sessions.length === 1 ? '' : 's'}`,
  ];
  if (doc.cardio.length) parts.push(`${doc.cardio.length} cardio`);
  if (doc.bodyWeight.length) parts.push(`${doc.bodyWeight.length} weigh-ins`);
  return parts.join(' · ');
}

export function backupFileName(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `ledger-${stamp}.json`;
}

// Dev-only handle so the export/import round trip can be exercised from a console.
if (__DEV__) {
  (globalThis as any).__ledgerBackup = { buildBackup, parseBackup, backupSummary };
}
