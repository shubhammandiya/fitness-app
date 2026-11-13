import type { DayExercise, Equipment, Exercise, MuscleGroup, Program } from '@/domain/types';
import { uid } from '@/domain/types';

const ex = (id: string, name: string, muscle: MuscleGroup, equipment: Equipment): Exercise => ({
  id,
  name,
  muscle,
  equipment,
});

/** 70 seeded movements, tagged by muscle group and equipment. */
export const SEED_EXERCISES: Exercise[] = [
  // chest
  ex('barbell_bench_press', 'Barbell Bench Press', 'chest', 'barbell'),
  ex('incline_barbell_bench_press', 'Incline Barbell Bench Press', 'chest', 'barbell'),
  ex('dumbbell_bench_press', 'Dumbbell Bench Press', 'chest', 'dumbbell'),
  ex('incline_dumbbell_press', 'Incline Dumbbell Press', 'chest', 'dumbbell'),
  ex('machine_chest_press', 'Machine Chest Press', 'chest', 'machine'),
  ex('pec_deck', 'Pec Deck', 'chest', 'machine'),
  ex('cable_fly', 'Cable Fly', 'chest', 'cable'),
  ex('dips', 'Dips', 'chest', 'bodyweight'),
  ex('push_up', 'Push-Up', 'chest', 'bodyweight'),
  // back
  ex('deadlift', 'Deadlift', 'back', 'barbell'),
  ex('barbell_row', 'Barbell Row', 'back', 'barbell'),
  ex('t_bar_row', 'T-Bar Row', 'back', 'machine'),
  ex('lat_pulldown', 'Lat Pulldown', 'back', 'cable'),
  ex('seated_cable_row', 'Seated Cable Row', 'back', 'cable'),
  ex('single_arm_dumbbell_row', 'Single-Arm Dumbbell Row', 'back', 'dumbbell'),
  ex('chest_supported_row', 'Chest-Supported Row', 'back', 'machine'),
  ex('straight_arm_pulldown', 'Straight-Arm Pulldown', 'back', 'cable'),
  ex('pull_up', 'Pull-Up', 'back', 'bodyweight'),
  ex('chin_up', 'Chin-Up', 'back', 'bodyweight'),
  // shoulders
  ex('overhead_press', 'Overhead Press', 'shoulders', 'barbell'),
  ex('seated_dumbbell_press', 'Seated Dumbbell Press', 'shoulders', 'dumbbell'),
  ex('arnold_press', 'Arnold Press', 'shoulders', 'dumbbell'),
  ex('dumbbell_lateral_raise', 'Dumbbell Lateral Raise', 'shoulders', 'dumbbell'),
  ex('cable_lateral_raise', 'Cable Lateral Raise', 'shoulders', 'cable'),
  ex('reverse_pec_deck', 'Reverse Pec Deck', 'shoulders', 'machine'),
  ex('face_pull', 'Face Pull', 'shoulders', 'cable'),
  ex('dumbbell_front_raise', 'Dumbbell Front Raise', 'shoulders', 'dumbbell'),
  // biceps
  ex('barbell_curl', 'Barbell Curl', 'biceps', 'barbell'),
  ex('ez_bar_curl', 'EZ-Bar Curl', 'biceps', 'barbell'),
  ex('dumbbell_curl', 'Dumbbell Curl', 'biceps', 'dumbbell'),
  ex('hammer_curl', 'Hammer Curl', 'biceps', 'dumbbell'),
  ex('incline_dumbbell_curl', 'Incline Dumbbell Curl', 'biceps', 'dumbbell'),
  ex('preacher_curl', 'Preacher Curl', 'biceps', 'machine'),
  ex('cable_curl', 'Cable Curl', 'biceps', 'cable'),
  ex('concentration_curl', 'Concentration Curl', 'biceps', 'dumbbell'),
  // triceps
  ex('close_grip_bench_press', 'Close-Grip Bench Press', 'triceps', 'barbell'),
  ex('skull_crusher', 'Skull Crusher', 'triceps', 'barbell'),
  ex('triceps_pushdown', 'Triceps Pushdown', 'triceps', 'cable'),
  ex('overhead_cable_extension', 'Overhead Cable Extension', 'triceps', 'cable'),
  ex('dumbbell_overhead_extension', 'Dumbbell Overhead Extension', 'triceps', 'dumbbell'),
  ex('bench_dip', 'Bench Dip', 'triceps', 'bodyweight'),
  ex('diamond_push_up', 'Diamond Push-Up', 'triceps', 'bodyweight'),
  // quads
  ex('back_squat', 'Back Squat', 'quads', 'barbell'),
  ex('front_squat', 'Front Squat', 'quads', 'barbell'),
  ex('hack_squat', 'Hack Squat', 'quads', 'machine'),
  ex('leg_press', 'Leg Press', 'quads', 'machine'),
  ex('leg_extension', 'Leg Extension', 'quads', 'machine'),
  ex('bulgarian_split_squat', 'Bulgarian Split Squat', 'quads', 'dumbbell'),
  ex('walking_lunge', 'Walking Lunge', 'quads', 'dumbbell'),
  ex('goblet_squat', 'Goblet Squat', 'quads', 'kettlebell'),
  ex('bodyweight_squat', 'Bodyweight Squat', 'quads', 'bodyweight'),
  // hamstrings
  ex('romanian_deadlift', 'Romanian Deadlift', 'hamstrings', 'barbell'),
  ex('stiff_leg_deadlift', 'Stiff-Leg Deadlift', 'hamstrings', 'barbell'),
  ex('lying_leg_curl', 'Lying Leg Curl', 'hamstrings', 'machine'),
  ex('seated_leg_curl', 'Seated Leg Curl', 'hamstrings', 'machine'),
  ex('barbell_hip_thrust', 'Barbell Hip Thrust', 'hamstrings', 'barbell'),
  ex('glute_bridge', 'Glute Bridge', 'hamstrings', 'bodyweight'),
  ex('cable_pull_through', 'Cable Pull-Through', 'hamstrings', 'cable'),
  ex('good_morning', 'Good Morning', 'hamstrings', 'barbell'),
  // calves
  ex('standing_calf_raise', 'Standing Calf Raise', 'calves', 'machine'),
  ex('seated_calf_raise', 'Seated Calf Raise', 'calves', 'machine'),
  ex('single_leg_calf_raise', 'Single-Leg Calf Raise', 'calves', 'bodyweight'),
  // core
  ex('plank', 'Plank', 'core', 'bodyweight'),
  ex('hanging_leg_raise', 'Hanging Leg Raise', 'core', 'bodyweight'),
  ex('cable_crunch', 'Cable Crunch', 'core', 'cable'),
  ex('ab_wheel_rollout', 'Ab Wheel Rollout', 'core', 'other'),
  ex('russian_twist', 'Russian Twist', 'core', 'bodyweight'),
  // forearms
  ex('wrist_curl', 'Wrist Curl', 'forearms', 'dumbbell'),
  ex('farmers_carry', "Farmer's Carry", 'forearms', 'dumbbell'),
  ex('reverse_curl', 'Reverse Curl', 'forearms', 'barbell'),
];

export const findExercise = (id: string, all: Exercise[] = SEED_EXERCISES) =>
  all.find((e) => e.id === id);

function dayExercise(
  exerciseId: string,
  order: number,
  targetSets: number,
  repMin: number,
  repMax: number
): DayExercise {
  return { id: uid('de'), exerciseId, order, targetSets, repMin, repMax };
}

/** The starter program: a plain 3-day push / pull / legs. */
export function createStarterProgram(): Program {
  return {
    id: uid('prog'),
    name: 'Push · Pull · Legs',
    isActive: true,
    createdAt: Date.now(),
    days: [
      {
        id: uid('day'),
        name: 'Push',
        order: 0,
        exercises: [
          dayExercise('barbell_bench_press', 0, 4, 6, 8),
          dayExercise('seated_dumbbell_press', 1, 3, 10, 12),
          dayExercise('cable_fly', 2, 3, 12, 15),
          dayExercise('triceps_pushdown', 3, 3, 12, 15),
          dayExercise('dumbbell_lateral_raise', 4, 3, 12, 15),
        ],
      },
      {
        id: uid('day'),
        name: 'Pull',
        order: 1,
        exercises: [
          dayExercise('barbell_row', 0, 4, 6, 8),
          dayExercise('lat_pulldown', 1, 3, 8, 12),
          dayExercise('face_pull', 2, 3, 12, 15),
          dayExercise('hammer_curl', 3, 3, 10, 12),
          dayExercise('hanging_leg_raise', 4, 3, 10, 15),
        ],
      },
      {
        id: uid('day'),
        name: 'Legs',
        order: 2,
        exercises: [
          dayExercise('back_squat', 0, 4, 5, 8),
          dayExercise('romanian_deadlift', 1, 3, 8, 10),
          dayExercise('leg_press', 2, 3, 10, 12),
          dayExercise('lying_leg_curl', 3, 3, 10, 12),
          dayExercise('standing_calf_raise', 4, 4, 12, 15),
        ],
      },
    ],
  };
}
