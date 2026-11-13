import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

const LABELS: Record<string, string> = {
  progress: 'PROGRESS',
  index: 'WORKOUT',
  workout: 'WORKOUT',
  programs: 'PROGRAMS',
  settings: 'SETTINGS',
};

/** Tab bar order — the workout screen is the file `index` but sits second. */
const ORDER = ['progress', 'index', 'workout', 'programs', 'settings'];

/**
 * SDK 58's bottom-tabs fork hands a custom tabBar { state, descriptors, emitter,
 * navigateToTab, insets } — there is no `navigation` prop here.
 */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  emitter: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
  };
  navigateToTab: (key: string) => void;
  insets?: { bottom?: number };
};

export default function TabBar({ state, emitter, navigateToTab, insets: propInsets }: TabBarProps) {
  const t = useTheme();
  const safe = useSafeAreaInsets();
  const bottom = Math.max(propInsets?.bottom ?? safe.bottom, 26);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: t.bg, borderTopColor: t.line, paddingBottom: bottom },
      ]}>
      {state.routes
        .map((route, i) => ({ route, i }))
        .sort((a, b) => ORDER.indexOf(a.route.name) - ORDER.indexOf(b.route.name))
        .map(({ route, i }) => {
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            hitSlop={10}
            style={styles.tab}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}>
            <Text
              style={[
                styles.label,
                {
                  color: focused ? t.accInk : t.mut,
                  fontFamily: focused ? fonts.sansSemi : fonts.sansMed,
                },
              ]}>
              {LABELS[route.name] ?? route.name.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 24,
    paddingHorizontal: 8,
    minHeight: 78,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, letterSpacing: 1.5 },
});
