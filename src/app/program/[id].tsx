import { router, useLocalSearchParams } from 'expo-router';
import { goBack } from '@/ui/nav';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import { Body, Display, Micro, Title } from '@/ui/text';
import { fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

export default function ProgramDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const programs = useStore((s) => s.programs);
  const setActiveProgram = useStore((s) => s.setActiveProgram);
  const duplicateProgram = useStore((s) => s.duplicateProgram);
  const deleteProgram = useStore((s) => s.deleteProgram);
  const renameProgram = useStore((s) => s.renameProgram);
  const addDay = useStore((s) => s.addDay);
  const removeDay = useStore((s) => s.removeDay);
  const renameDay = useStore((s) => s.renameDay);

  const program = programs.find((p) => p.id === id);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(program?.name ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!program) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 20, paddingTop: insets.top + 20 }}>
        <Pressable onPress={() => goBack('/programs')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Micro style={{ color: t.accInk }}>← back</Micro>
        </Pressable>
        <Body style={{ marginTop: 20, color: t.mut }}>That program no longer exists.</Body>
      </View>
    );
  }

  const exerciseCount = program.days.reduce((n, d) => n + d.exercises.length, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <Pressable onPress={() => goBack('/programs')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Micro style={{ color: t.accInk }}>← back</Micro>
        </Pressable>
        <Pressable onPress={() => setEditing((e) => !e)} hitSlop={10} accessibilityRole="button">
          <Micro style={{ color: editing ? t.accInk : t.mut }}>{editing ? 'done' : 'edit'}</Micro>
        </Pressable>
      </View>

      {editing ? (
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          onBlur={() => renameProgram(program.id, nameDraft)}
          autoFocus
          selectTextOnFocus
          style={[styles.nameInput, { color: t.tx, fontFamily: fonts.serif, borderColor: t.acc }]}
        />
      ) : (
        <Display>{program.name}</Display>
      )}

      <Micro style={{ marginTop: 6 }}>
        {program.days.length} {program.days.length === 1 ? 'day' : 'days'} · {exerciseCount} exercises
        {program.isActive ? ' · active' : ''}
      </Micro>

      <View style={styles.actions}>
        {program.isActive ? null : (
          <Pressable
            onPress={() => setActiveProgram(program.id)}
            accessibilityRole="button"
            style={[styles.action, { borderColor: t.acc }]}>
            <Micro style={{ color: t.accInk }}>set active</Micro>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            const copyId = duplicateProgram(program.id);
            if (copyId) router.push({ pathname: '/program/[id]', params: { id: copyId } });
          }}
          accessibilityRole="button"
          style={[styles.action, { borderColor: t.line }]}>
          <Micro>duplicate</Micro>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            deleteProgram(program.id);
            goBack('/programs');
          }}
          accessibilityRole="button"
          style={[styles.action, { borderColor: confirmDelete ? t.danger : t.line }]}>
          <Micro style={{ color: confirmDelete ? t.danger : t.mut }}>
            {confirmDelete ? 'tap again' : 'delete'}
          </Micro>
        </Pressable>
      </View>
      {programs.length <= 1 ? (
        <Micro style={{ marginTop: 8 }}>this is your only program — create another before deleting.</Micro>
      ) : null}

      <Micro style={{ marginTop: 26, marginBottom: 10 }}>days</Micro>
      <View style={[styles.list, { borderColor: t.line }]}>
        {program.days.map((day, i) => (
          <View
            key={day.id}
            style={[
              styles.dayRow,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
            ]}>
            {editing ? (
              <TextInput
                defaultValue={day.name}
                onChangeText={(text) => renameDay(day.id, text)}
                style={[styles.dayInput, { color: t.tx, fontFamily: fonts.serif, borderColor: t.line }]}
              />
            ) : (
              <Pressable
                onPress={() => router.push({ pathname: '/day/[id]', params: { id: day.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${day.name}`}
                style={{ flex: 1 }}>
                <Title>{day.name}</Title>
                <Micro style={{ marginTop: 4 }}>
                  {day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'}
                </Micro>
              </Pressable>
            )}

            {editing ? (
              <Pressable
                onPress={() => removeDay(program.id, day.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${day.name}`}
                style={[styles.remove, { borderColor: t.danger }]}>
                <Body style={{ color: t.danger, fontSize: 15, lineHeight: 18 }}>−</Body>
              </Pressable>
            ) : (
              <Micro style={{ letterSpacing: 1 }}>open</Micro>
            )}
          </View>
        ))}

        {program.days.length === 0 ? (
          <View style={styles.dayRow}>
            <Body style={{ color: t.mut }}>No days yet — add one below.</Body>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => {
          const dayId = addDay(program.id);
          if (dayId) router.push({ pathname: '/day/[id]', params: { id: dayId } });
        }}
        accessibilityRole="button"
        style={[styles.addRow, { borderColor: t.line }]}>
        <Micro style={{ color: t.accInk, letterSpacing: 1.3 }}>+ add day</Micro>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  nameInput: {
    fontSize: 30,
    borderBottomWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 18, flexWrap: 'wrap' },
  action: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  dayInput: { flex: 1, fontSize: 17, borderBottomWidth: 1, paddingVertical: 4 },
  remove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
  },
});
