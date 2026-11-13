export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'other';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'core'
  | 'forearms';

export type Exercise = {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  isCustom?: boolean;
};

/** One exercise inside a program day template. */
export type DayExercise = {
  id: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  repMin: number;
  repMax: number;
  /** Overrides settings.defaultRestSec when set. */
  restSec?: number;
};

export type ProgramDay = {
  id: string;
  name: string;
  order: number;
  exercises: DayExercise[];
};

export type Program = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  days: ProgramDay[];
};

export type LoggedSet = {
  index: number;
  weight: number;
  reps: number;
  done: boolean;
  completedAt?: number;
};

export type SessionExercise = {
  exerciseId: string;
  /** Snapshot — editing a program day later must not rewrite history. */
  name: string;
  sets: LoggedSet[];
};

export type Session = {
  id: string;
  programId: string;
  dayId: string;
  dayName: string;
  startedAt: number;
  /** Absent while the session is still open. */
  finishedAt?: number;
  exercises: SessionExercise[];
};

export type CardioLog = {
  id: string;
  activity: string;
  durationSec: number;
  distanceKm?: number;
  paceSecPerKm?: number;
  surface?: 'gym' | 'track' | 'road' | 'trail';
  elevationM?: number;
  at: number;
  notes?: string;
};

export type BodyWeightEntry = { date: string; kg: number };

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  core: 'Core',
  forearms: 'Forearms',
};

export const MUSCLE_ORDER: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'calves',
  'core',
  'forearms',
];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  other: 'Other',
};

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
