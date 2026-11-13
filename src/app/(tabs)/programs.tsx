import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import NewProgramSheet from '@/ui/new-program-sheet';
import { Body, Display, Micro, Title } from '@/ui/text';
import { fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

export default function ProgramsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const programs = useStore((s) => s.programs);
  const createProgram = useStore((s) => s.createProgram);
  const [sheet, setSheet] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        <Display>Programs</Display>

        <Pressable
          onPress={() => setSheet(true)}
          accessibilityRole="button"
          style={[styles.newBtn, { borderColor: t.line }]}>
          <Body style={{ color: t.accInk, fontFamily: fonts.sansSemi, fontSize: 12, letterSpacing: 0.6 }}>
            + New program
          </Body>
          <Micro style={{ letterSpacing: 1 }}>4 splits</Micro>
        </Pressable>

        <Micro style={{ marginTop: 26, marginBottom: 10 }}>your programs</Micro>

        <View style={[styles.list, { borderColor: t.line }]}>
          {programs.map((program, i) => {
            const exercises = program.days.reduce((n, d) => n + d.exercises.length, 0);
            return (
              <Pressable
                key={program.id}
                onPress={() => router.push({ pathname: '/program/[id]', params: { id: program.id } })}
                accessibilityRole="button"
                style={[
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                ]}>
                <View style={{ flex: 1 }}>
                  <Title>{program.name}</Title>
                  <Micro style={{ marginTop: 4 }}>
                    {program.days.length} {program.days.length === 1 ? 'day' : 'days'} · {exercises}{' '}
                    exercises
                  </Micro>
                </View>
                {program.isActive ? (
                  <Micro style={{ color: t.accInk }}>active</Micro>
                ) : (
                  <Micro style={{ letterSpacing: 1 }}>open</Micro>
                )}
              </Pressable>
            );
          })}
        </View>

        <Micro style={{ marginTop: 18, letterSpacing: 1.2, lineHeight: 16 }}>
          the active program is what the workout tab shows. switching is instant and never touches
          your logged sessions.
        </Micro>
      </ScrollView>

      <NewProgramSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onCreate={(splitId, name) => {
          const id = createProgram(splitId, name);
          setSheet(false);
          router.push({ pathname: '/program/[id]', params: { id } });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 22,
  },
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
