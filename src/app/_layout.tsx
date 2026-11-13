import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from '@/ui/theme-provider';
import { useStore } from '@/state/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Never let a font or storage problem leave the user staring at the splash. */
const BOOT_FALLBACK_MS = 2500;

/**
 * The persisted document lands asynchronously and, when it does, it replaces the
 * in-memory state. A tap before that point is silently discarded — so the UI waits
 * for hydration, but only up to BOOT_FALLBACK_MS so a broken storage layer can
 * never trap the app on the splash.
 */
function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());
  useEffect(() => useStore.persist.onFinishHydration(() => setHydrated(true)), []);
  return hydrated;
}

function Shell() {
  const t = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [bootTimedOut, setBootTimedOut] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);
  const hydrated = useHydrated();

  useEffect(() => {
    const id = setTimeout(() => setBootTimedOut(true), BOOT_FALLBACK_MS);
    return () => clearTimeout(id);
  }, []);

  const ready = (fontsLoaded || !!fontError || bootTimedOut) && (hydrated || bootTimedOut);

  useEffect(() => {
    if (!ready || splashHidden) return;
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setSplashHidden(true));
    console.log('[ledger] boot', {
      fontsLoaded,
      fontError: fontError ? String(fontError) : null,
      bootTimedOut,
      hydrated,
    });
  }, [ready, splashHidden, fontsLoaded, fontError, bootTimedOut]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  return (
    <>
      <StatusBar style={t.name === 'night' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
