import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useStore } from '@/state/store';
import { day, night, withAccent, type Theme } from '@/ui/theme';

const ThemeCtx = createContext<Theme>(night);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useStore((s) => s.settings.theme);
  const accent = useStore((s) => s.settings.accent);
  const system = useColorScheme();
  const base = pref === 'system' ? (system === 'light' ? day : night) : pref === 'day' ? day : night;
  const theme = useMemo(() => withAccent(base, accent), [base, accent]);
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
