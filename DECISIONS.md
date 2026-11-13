# Ledger — training log

Native Android app (Expo / React Native + TypeScript, SDK 58). Local-only, no accounts.

## Product decisions (locked)

- **Stack:** Expo + TypeScript, expo-router, zustand + AsyncStorage (one versioned JSON
  document, `ledger-store-v1`). Export JSON == backup == import format.
- **Tabs:** Progress · Workout · Programs · Settings. App opens on Workout.
- **Workout tab:** horizontal pager, one page per program day; each page is a vertical
  exercise list; tapping an exercise expands its set rows. Sets are edited by tapping a
  number (numeric keyboard, the only sane way to enter 90 kg) or nudging ± with the
  steppers (weight step = `settings.incrementKg`, reps = 1). Editing a value follows down
  to the sets below it. `− set` / `+ set` changes the day template's `targetSets`, so the
  count you trained is the count next week.
- **Strength only** + a one-line cardio log (activity, duration, distance, computed pace,
  surface, elevation).
- **Day template:** exercises + target sets + rep range (`3 × 8–12`) + rest override.
  Weight/reps prefill from the same set index of the last session of that exercise.
- **Programs:** multiple programs, one `isActive`; day count and split are editable
  (PPL, Upper–Lower, Chest/Back/Arms/Legs/Shoulders). Day selection is manual.
- **Session lifecycle:** starts on the first ticked set, closes on Finish; abandoned if
  nothing was ticked. Mid-session add/swap/reorder never touches the template.
  Sessions snapshot exercise names, so edits never rewrite history.
- **Progress:** weekly hard sets per muscle group, per-exercise top set + est. 1RM,
  body weight, recent sessions.
- **Library:** ~60 seeded exercises tagged `muscleGroup × equipment`
  (barbell / dumbbell / machine / cable / bodyweight / kettlebell), most-used pinned.
- **Onboarding:** 60–120 s builder — pick a split, get a working program.

## Design system

- Fonts: **Instrument Serif** (titles, exercise names, every weight numeral — tabular
  figures) + **Inter** (micro-labels, buttons, rows). Bundled via expo-font.
- Night `#0A0A0B` / bone `#EDEDED` / accent lime `#D6FF3F`.
- Day `#F7F6F3` / ink `#111111` / accent `#C9EA22`, accent **text** uses `accInk #4E6A00`
  for contrast. Hairlines `#232326` / `#DEDBD2`, 8 pt grid, no shadows, no cards with
  elevation, one accent at a time.
- Accents (Settings → accent): **lime, rose, sky, amber, violet, mint**. Each defines a
  `fill` (ticks, dots, swatches) plus `nightInk` / `dayInk` for accent text, so a colour is
  readable on both canvases. `withAccent(base, id)` composes the theme; screens never branch
  on the accent.
- Tab bar: 78 px min height, 11 px letter-spaced labels — measured at 1.8× the original.
- Tokens live in `src/ui/theme.ts`; every screen reads them through `useTheme()`.

## Layout

```
src/app/(tabs)/_layout.tsx   Tabs + custom TabBar
src/app/(tabs)/index.tsx     Workout (built first so "/" resolves)
src/app/(tabs)/progress.tsx  programs.tsx  settings.tsx
src/state/store.ts           persisted settings (grows into the full doc in M1)
src/ui/                      theme.ts, theme-provider.tsx, text.tsx, tab-bar.tsx
```

**Gotcha:** SDK 58's bottom-tabs fork passes a custom `tabBar` only
`{ state, descriptors, emitter, navigateToTab, insets }` — there is no `navigation` prop.
Press handling is `emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })`
then `navigateToTab(route.key)`.

## Milestones

- **M0 done:** scaffold, tokens, fonts, 4-tab shell, theme switch (persisted).
- **M1 done:** real store (programs / days / exercises / sessions / cardio / bodyWeight behind
  `ledger-store-v1`, v2 with migrate + merge), 70 seeded movements tagged by muscle group and
  equipment, starter PPL program driving the day pager, add/remove exercises on the Workout tab
  with a searchable picker, 6 accent palettes, tab bar height ~1.8× the M0 bar.
- **M2 done:** set logging (deltas, not absolute values, so fast taps accumulate), prefill
  from the last session of that exercise (stale after 56 days), `last · 60 kg × 8 · 3 days
  ago` hint, rest timer that auto-starts on a ticked set (per-exercise override, ±15 s, skip)
  with a scheduled local notification so it fires with the phone in a pocket, Finish writing
  a session into `sessions`, and the active session persisted so a killed app resumes it.
- **M3 done:** Progress tab with weekly hard sets per muscle group, body-weight log + trend line,
  trained-exercise list → per-exercise screen (best set, est. 1RM via Epley, 1RM-over-time chart,
  session history) and recent sessions → full session detail. Two new stack routes
  `app/exercise/[id].tsx` and `app/session/[id].tsx`, charts hand-drawn with `react-native-svg`
  (no chart library).
- **M4 done:** Programs tab lists every program (active badge) and creates new ones from four
  split templates (PPL, Upper·Lower, Chest/Back/Arms/Legs/Shoulders, Full body ×3) in one
  sheet. Program screen: rename, duplicate, two-step delete, set active, add/remove days.
  Day screen: rename, per-exercise sets / rep range / rest override, add and remove exercises.
  Also fixed: `router.back()` on deep-linked screens and the hydration race that discarded
  mutations made before the persisted document landed.
- **M5 done:** JSON export via the share sheet (writes to cache, share to Drive/Telegram; web
  downloads), import with validation + confirm-before-overwrite, two-tap clear-all, cardio
  one-liner (activity · minutes · km · computed pace · surface · elevation · notes) shown in
  Progress, and a real app icon / adaptive icon / splash (serif L on near-black, generated
  from the app's own Instrument Serif).
- **Next:** an installable APK via `eas build -p android --profile preview` (needs an Expo
  account — `eas login` — and this app.json now has the icon/splash it needs).

Out of scope: cloud/accounts, social, Health Connect, GPS cardio, supersets/RPE,
plate calculator, Play Store submission.

## Run

```
cd ~/projects/workout-app
npx expo start --lan      # then scan the QR in Expo Go
npx tsc --noEmit          # typecheck
```
