import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CardioLog } from '@/domain/types';
import { Body, Display, Micro, Num } from '@/ui/text';
import { fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

const ACTIVITIES = ['Run', 'Walk', 'Cycle', 'Row', 'Swim', 'Other'];
const SURFACES: { key: NonNullable<CardioLog['surface']>; label: string }[] = [
  { key: 'gym', label: 'gym' },
  { key: 'track', label: 'track' },
  { key: 'road', label: 'road' },
  { key: 'trail', label: 'trail' },
];

const paceLabel = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (input: {
    activity: string;
    durationSec: number;
    distanceKm?: number;
    surface?: CardioLog['surface'];
    elevationM?: number;
    notes?: string;
  }) => void;
};

export default function CardioSheet({ visible, onClose, onSave }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const [activity, setActivity] = useState('Run');
  const [custom, setCustom] = useState('');
  const [minutes, setMinutes] = useState('');
  const [distance, setDistance] = useState('');
  const [surface, setSurface] = useState<CardioLog['surface'] | undefined>('road');
  const [elevation, setElevation] = useState('');
  const [notes, setNotes] = useState('');

  const mins = parseFloat(minutes.replace(',', '.'));
  const km = parseFloat(distance.replace(',', '.'));
  const pace = mins > 0 && km > 0 ? (mins * 60) / km : undefined;
  const canSave = mins > 0 && (activity !== 'Other' || custom.trim().length > 0);

  const reset = () => {
    setActivity('Run');
    setCustom('');
    setMinutes('');
    setDistance('');
    setSurface('road');
    setElevation('');
    setNotes('');
  };

  const save = () => {
    if (!canSave) return;
    onSave({
      activity: activity === 'Other' ? custom : activity,
      durationSec: Math.round(mins * 60),
      distanceKm: km > 0 ? km : undefined,
      surface,
      elevationM: parseFloat(elevation.replace(',', '.')) || undefined,
      notes: notes || undefined,
    });
    reset();
    onClose();
  };

  const inputStyle = [
    styles.input,
    { borderColor: t.line, backgroundColor: t.surf, color: t.tx, fontFamily: fonts.sans },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.bg,
              borderColor: t.line,
              maxHeight: height * 0.9,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.grabber}>
            <View style={[styles.grab, { backgroundColor: t.line }]} />
          </View>

          <View style={styles.head}>
            <Display style={{ fontSize: 26, lineHeight: 30 }}>Log cardio</Display>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Micro>close</Micro>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Micro style={{ marginBottom: 8 }}>activity</Micro>
            <View style={styles.chips}>
              {ACTIVITIES.map((a) => {
                const on = activity === a;
                return (
                  <Pressable
                    key={a}
                    onPress={() => setActivity(a)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`Activity ${a}`}
                    style={[
                      styles.chip,
                      { borderColor: on ? t.acc : t.line, backgroundColor: on ? t.surf2 : 'transparent' },
                    ]}>
                    <Body style={{ fontSize: 12, color: on ? t.accInk : t.tx }}>{a}</Body>
                  </Pressable>
                );
              })}
            </View>

            {activity === 'Other' ? (
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder="activity name"
                placeholderTextColor={t.mut}
                style={[inputStyle, { marginTop: 10 }]}
                accessibilityLabel="Custom activity"
              />
            ) : null}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Micro style={{ marginTop: 18, marginBottom: 6 }}>minutes</Micro>
                <TextInput
                  value={minutes}
                  onChangeText={setMinutes}
                  placeholder="45"
                  placeholderTextColor={t.mut}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                  accessibilityLabel="Minutes"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Micro style={{ marginTop: 18, marginBottom: 6 }}>distance km</Micro>
                <TextInput
                  value={distance}
                  onChangeText={setDistance}
                  placeholder="optional"
                  placeholderTextColor={t.mut}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                  accessibilityLabel="Distance in km"
                />
              </View>
            </View>

            {pace ? (
              <View style={styles.paceRow}>
                <Micro>pace</Micro>
                <Num style={{ fontSize: 16 }}>{paceLabel(pace)}</Num>
              </View>
            ) : null}

            <Micro style={{ marginTop: 18, marginBottom: 8 }}>surface</Micro>
            <View style={styles.chips}>
              {SURFACES.map((s) => {
                const on = surface === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSurface(on ? undefined : s.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`Surface ${s.label}`}
                    style={[
                      styles.chip,
                      { borderColor: on ? t.acc : t.line, backgroundColor: on ? t.surf2 : 'transparent' },
                    ]}>
                    <Body style={{ fontSize: 12, color: on ? t.accInk : t.tx }}>{s.label}</Body>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Micro style={{ marginTop: 18, marginBottom: 6 }}>elevation m</Micro>
                <TextInput
                  value={elevation}
                  onChangeText={setElevation}
                  placeholder="optional"
                  placeholderTextColor={t.mut}
                  keyboardType="number-pad"
                  style={inputStyle}
                  accessibilityLabel="Elevation metres"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Micro style={{ marginTop: 18, marginBottom: 6 }}>notes</Micro>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="optional"
                  placeholderTextColor={t.mut}
                  style={inputStyle}
                  accessibilityLabel="Notes"
                />
              </View>
            </View>

            <Pressable
              onPress={save}
              disabled={!canSave}
              accessibilityRole="button"
              accessibilityLabel="Save cardio"
              style={[styles.save, { backgroundColor: canSave ? t.acc : t.surf2 }]}>
              <Micro
                style={{
                  color: canSave ? t.onAcc : t.mut,
                  letterSpacing: 1.7,
                  fontSize: 10,
                }}>
                save cardio
              </Micro>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  grabber: { alignItems: 'center', paddingVertical: 8 },
  grab: { width: 36, height: 3, borderRadius: 2 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  save: { marginTop: 24, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
});
