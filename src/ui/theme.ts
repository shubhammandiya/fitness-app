import type { TextStyle } from 'react-native';

export type ThemeName = 'night' | 'day';

export type Theme = {
  name: ThemeName;
  bg: string;
  surf: string;
  surf2: string;
  line: string;
  tx: string;
  mut: string;
  acc: string;
  /** Accent for text/glyphs — darker in the day theme so it stays readable. */
  accInk: string;
  onAcc: string;
  danger: string;
};

export const night: Theme = {
  name: 'night',
  bg: '#0A0A0B',
  surf: '#131315',
  surf2: '#1A1A1D',
  line: '#232326',
  tx: '#EDEDED',
  mut: '#7C7C82',
  acc: '#D6FF3F',
  accInk: '#D6FF3F',
  onAcc: '#0A0A0B',
  danger: '#FF5C5C',
};

export const day: Theme = {
  name: 'day',
  bg: '#F7F6F3',
  surf: '#FFFFFF',
  surf2: '#F1EFE9',
  line: '#DEDBD2',
  tx: '#111111',
  mut: '#6E6C66',
  acc: '#C9EA22',
  accInk: '#4E6A00',
  onAcc: '#111111',
  danger: '#C4381F',
};

export const themes: Record<ThemeName, Theme> = { night, day };

export type AccentId = 'lime' | 'rose' | 'sky' | 'amber' | 'violet' | 'mint';

export type AccentDef = {
  label: string;
  /** Fill colour — ticks, swatches, active dots. */
  fill: string;
  /** Accent used for text on the night theme. */
  nightInk: string;
  /** Accent used for text on the day theme — darker so it stays readable. */
  dayInk: string;
};

export const accents: Record<AccentId, AccentDef> = {
  lime: { label: 'Lime', fill: '#D6FF3F', nightInk: '#D6FF3F', dayInk: '#4E6A00' },
  rose: { label: 'Rose', fill: '#FF6B8A', nightInk: '#FF8FA5', dayInk: '#B01E45' },
  sky: { label: 'Sky', fill: '#5AC8FA', nightInk: '#6EE7FF', dayInk: '#00628C' },
  amber: { label: 'Amber', fill: '#FFB84D', nightInk: '#FFC46B', dayInk: '#8A5500' },
  violet: { label: 'Violet', fill: '#A78BFA', nightInk: '#B79BFF', dayInk: '#5B3FB8' },
  mint: { label: 'Mint', fill: '#5EE0A0', nightInk: '#6EE7A8', dayInk: '#1B6B45' },
};

export const ACCENT_ORDER: AccentId[] = ['lime', 'rose', 'sky', 'amber', 'violet', 'mint'];

/** Base night/day palette + the chosen accent. */
export function withAccent(base: Theme, accentId: AccentId): Theme {
  const a = accents[accentId] ?? accents.lime;
  return {
    ...base,
    acc: a.fill,
    accInk: base.name === 'night' ? a.nightInk : a.dayInk,
  };
}

/** Bundled font families — see app/_layout.tsx for loading. */
export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMed: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Tabular, lining figures so weight columns never jitter. */
export const figures: TextStyle = { fontVariant: ['tabular-nums'] };

export const radius = { sm: 7, md: 10, lg: 12, pill: 999 };
