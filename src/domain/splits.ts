import type { Program } from '@/domain/types';
import { uid } from '@/domain/types';

export type TemplateExercise = {
  exerciseId: string;
  targetSets: number;
  repMin: number;
  repMax: number;
};

export type SplitTemplate = {
  id: string;
  name: string;
  blurb: string;
  days: { name: string; exercises: TemplateExercise[] }[];
};

const te = (exerciseId: string, targetSets: number, repMin: number, repMax: number): TemplateExercise => ({
  exerciseId,
  targetSets,
  repMin,
  repMax,
});

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    id: 'ppl',
    name: 'Push · Pull · Legs',
    blurb: '3 days · the default',
    days: [
      {
        name: 'Push',
        exercises: [
          te('barbell_bench_press', 4, 6, 8),
          te('seated_dumbbell_press', 3, 10, 12),
          te('cable_fly', 3, 12, 15),
          te('triceps_pushdown', 3, 12, 15),
          te('dumbbell_lateral_raise', 3, 12, 15),
        ],
      },
      {
        name: 'Pull',
        exercises: [
          te('barbell_row', 4, 6, 8),
          te('lat_pulldown', 3, 8, 12),
          te('face_pull', 3, 12, 15),
          te('hammer_curl', 3, 10, 12),
          te('hanging_leg_raise', 3, 10, 15),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          te('back_squat', 4, 5, 8),
          te('romanian_deadlift', 3, 8, 10),
          te('leg_press', 3, 10, 12),
          te('lying_leg_curl', 3, 10, 12),
          te('standing_calf_raise', 4, 12, 15),
        ],
      },
    ],
  },
  {
    id: 'upper_lower',
    name: 'Upper · Lower',
    blurb: '4 days · twice-weekly frequency',
    days: [
      {
        name: 'Upper A',
        exercises: [
          te('barbell_bench_press', 4, 6, 8),
          te('barbell_row', 4, 6, 8),
          te('seated_dumbbell_press', 3, 8, 12),
          te('lat_pulldown', 3, 10, 12),
          te('cable_curl', 3, 12, 15),
          te('triceps_pushdown', 3, 12, 15),
        ],
      },
      {
        name: 'Lower A',
        exercises: [
          te('back_squat', 4, 5, 8),
          te('romanian_deadlift', 3, 8, 10),
          te('leg_press', 3, 10, 12),
          te('seated_leg_curl', 3, 10, 12),
          te('standing_calf_raise', 4, 12, 15),
        ],
      },
      {
        name: 'Upper B',
        exercises: [
          te('incline_dumbbell_press', 4, 8, 10),
          te('seated_cable_row', 4, 8, 12),
          te('dumbbell_lateral_raise', 3, 12, 15),
          te('chin_up', 3, 6, 10),
          te('hammer_curl', 3, 10, 12),
          te('overhead_cable_extension', 3, 12, 15),
        ],
      },
      {
        name: 'Lower B',
        exercises: [
          te('deadlift', 3, 5, 6),
          te('front_squat', 3, 6, 8),
          te('bulgarian_split_squat', 3, 8, 12),
          te('lying_leg_curl', 3, 10, 12),
          te('seated_calf_raise', 4, 12, 15),
        ],
      },
    ],
  },
  {
    id: 'bro5',
    name: 'Chest · Back · Arms · Legs · Shoulders',
    blurb: '5 days · one body part each',
    days: [
      {
        name: 'Chest',
        exercises: [
          te('barbell_bench_press', 4, 6, 8),
          te('incline_dumbbell_press', 4, 8, 10),
          te('cable_fly', 3, 12, 15),
          te('dips', 3, 8, 12),
          te('pec_deck', 3, 12, 15),
        ],
      },
      {
        name: 'Back',
        exercises: [
          te('deadlift', 3, 5, 6),
          te('lat_pulldown', 4, 8, 12),
          te('barbell_row', 4, 6, 8),
          te('seated_cable_row', 3, 10, 12),
          te('straight_arm_pulldown', 3, 12, 15),
        ],
      },
      {
        name: 'Arms',
        exercises: [
          te('barbell_curl', 4, 8, 12),
          te('skull_crusher', 4, 8, 12),
          te('hammer_curl', 3, 10, 12),
          te('triceps_pushdown', 3, 12, 15),
          te('cable_curl', 3, 12, 15),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          te('back_squat', 4, 5, 8),
          te('romanian_deadlift', 3, 8, 10),
          te('leg_press', 3, 10, 12),
          te('leg_extension', 3, 12, 15),
          te('standing_calf_raise', 4, 12, 15),
        ],
      },
      {
        name: 'Shoulders',
        exercises: [
          te('overhead_press', 4, 6, 8),
          te('dumbbell_lateral_raise', 4, 12, 15),
          te('reverse_pec_deck', 3, 12, 15),
          te('face_pull', 3, 12, 15),
          te('dumbbell_front_raise', 3, 12, 15),
        ],
      },
    ],
  },
  {
    id: 'fullbody3',
    name: 'Full body ×3',
    blurb: '3 days · minimal time, everything hit',
    days: [
      {
        name: 'Full body A',
        exercises: [
          te('back_squat', 4, 5, 8),
          te('barbell_bench_press', 4, 6, 8),
          te('barbell_row', 4, 6, 8),
          te('dumbbell_lateral_raise', 3, 12, 15),
          te('hammer_curl', 3, 10, 12),
        ],
      },
      {
        name: 'Full body B',
        exercises: [
          te('deadlift', 3, 5, 6),
          te('overhead_press', 4, 6, 8),
          te('lat_pulldown', 3, 8, 12),
          te('leg_press', 3, 10, 12),
          te('cable_crunch', 3, 12, 15),
        ],
      },
      {
        name: 'Full body C',
        exercises: [
          te('front_squat', 4, 6, 8),
          te('incline_dumbbell_press', 4, 8, 10),
          te('seated_cable_row', 4, 8, 12),
          te('lying_leg_curl', 3, 10, 12),
          te('triceps_pushdown', 3, 12, 15),
        ],
      },
    ],
  },
];

export const findSplit = (id: string) => SPLIT_TEMPLATES.find((s) => s.id === id) ?? SPLIT_TEMPLATES[0];

/** Build a fresh program (new ids everywhere) from a split template. */
export function programFromSplit(splitId: string, name: string, knownExerciseIds: Set<string>): Program {
  const split = findSplit(splitId);
  return {
    id: uid('prog'),
    name: name.trim() || split.name,
    isActive: false,
    createdAt: Date.now(),
    days: split.days.map((day, i) => ({
      id: uid('day'),
      name: day.name,
      order: i,
      exercises: day.exercises
        .filter((e) => knownExerciseIds.has(e.exerciseId))
        .map((e, j) => ({
          id: uid('de'),
          exerciseId: e.exerciseId,
          order: j,
          targetSets: e.targetSets,
          repMin: e.repMin,
          repMax: e.repMax,
        })),
    })),
  };
}
