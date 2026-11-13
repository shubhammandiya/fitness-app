import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { backupSummary, buildBackup, parseBackup, type BackupDoc } from '@/domain/backup';
import { exportBackupFile, pickBackupText } from '@/lib/backup-io';
import { useStore, type Settings, type ThemePref } from '@/state/store';
import { Body, Display, Micro } from '@/ui/text';
import { ACCENT_ORDER, accents, fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

const THEMES: { key: ThemePref; label: string }[] = [
  { key: 'night', label: 'Night' },
  { key: 'day', label: 'Day' },
  { key: 'system', label: 'Auto' },
];

function ActionRow({
  label,
  value,
  onPress,
  tone = 'default',
  last = false,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  last?: boolean;
}) {
  const t = useTheme();
  const color = tone === 'danger' ? t.danger : t.tx;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
      ]}>
      <Body style={{ color }}>{label}</Body>
      {value ? <Micro style={{ letterSpacing: 1.1 }}>{value}</Micro> : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const theme = useStore((s) => s.settings.theme);
  const setTheme = useStore((s) => s.setTheme);
  const accent = useStore((s) => s.settings.accent);
  const setAccent = useStore((s) => s.setAccent);
  const replaceAll = useStore((s) => s.replaceAll);
  const resetAll = useStore((s) => s.resetAll);

  const programs = useStore((s) => s.programs);
  const sessions = useStore((s) => s.sessions);
  const cardio = useStore((s) => s.cardio);
  const bodyWeight = useStore((s) => s.bodyWeight);
  const exercises = useStore((s) => s.exercises);

  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<{ doc: BackupDoc; summary: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const counts = backupSummary({ programs, sessions, cardio, bodyWeight });

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    setStatus('preparing backup…');
    const result = await exportBackupFile(buildBackup(useStore.getState()));
    setStatus(result.message);
    setBusy(false);
  };

  const handleImport = async () => {
    if (busy) return;
    setBusy(true);
    setStatus('choose a Ledger .json file…');
    const picked = await pickBackupText();
    if (!picked) {
      setStatus(null);
      setBusy(false);
      return;
    }
    if ('error' in picked) {
      setStatus(picked.error);
      setBusy(false);
      return;
    }
    const parsed = parseBackup(picked.text);
    if (!parsed.ok) {
      setStatus(parsed.error);
      setBusy(false);
      return;
    }
    setPending({ doc: parsed.doc, summary: parsed.summary });
    setStatus(null);
    setBusy(false);
  };

  const applyImport = () => {
    if (!pending) return;
    replaceAll({
      settings: pending.doc.settings as unknown as Partial<Settings>,
      exercises: pending.doc.exercises,
      programs: pending.doc.programs,
      sessions: pending.doc.sessions,
      cardio: pending.doc.cardio,
      bodyWeight: pending.doc.bodyWeight,
    });
    setStatus(`imported · ${pending.summary}`);
    setPending(null);
    setConfirmClear(false);
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setStatus('tap again to erase everything');
      return;
    }
    resetAll();
    setConfirmClear(false);
    setStatus('all data cleared — back to the starter program');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}>
      <Display>Settings</Display>
      <View style={{ height: 24 }} />

      <Micro style={{ marginBottom: 12 }}>appearance</Micro>
      <View style={[styles.seg, { borderColor: t.line }]}>
        {THEMES.map((opt) => {
          const on = theme === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setTheme(opt.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Theme ${opt.label}`}
              style={[styles.segItem, { backgroundColor: on ? t.surf2 : 'transparent' }]}>
              <Body
                style={{
                  fontFamily: on ? fonts.sansSemi : fonts.sansMed,
                  color: on ? t.accInk : t.mut,
                  fontSize: 12,
                }}>
                {opt.label}
              </Body>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 20 }} />
      <Micro style={{ marginBottom: 10 }}>accent</Micro>
      <View style={styles.swatches}>
        {ACCENT_ORDER.map((id) => {
          const a = accents[id];
          const on = accent === id;
          return (
            <Pressable
              key={id}
              onPress={() => setAccent(id)}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityState={{ selected: on }}
              style={styles.swatchWrap}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: a.fill,
                    borderColor: on ? t.tx : 'transparent',
                    borderWidth: on ? 2 : 1,
                  },
                ]}>
                {on ? <Body style={{ color: t.onAcc, fontSize: 13 }}>✓</Body> : null}
              </View>
              <Micro style={{ letterSpacing: 1, color: on ? t.accInk : t.mut }}>{a.label}</Micro>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 28 }} />
      <Micro style={{ marginBottom: 4 }}>training</Micro>
      <View style={[styles.list, { borderColor: t.line }]}>
        <ActionRow label="Units" value="kg · km" />
        <ActionRow label="Default rest" value="90 s" />
        <ActionRow label="Weight step" value="2.5 kg" last />
      </View>

      <View style={{ height: 28 }} />
      <Micro style={{ marginBottom: 4 }}>data · {counts}</Micro>
      <View style={[styles.list, { borderColor: t.line }]}>
        <ActionRow
          label="Export backup"
          value={busy ? '…' : 'json'}
          onPress={handleExport}
        />
        <ActionRow label="Import backup" value="json" onPress={handleImport} />
        <ActionRow
          label={confirmClear ? 'Tap again to erase everything' : 'Clear all data'}
          onPress={handleClear}
          tone="danger"
          last
        />
      </View>

      {pending ? (
        <View style={[styles.confirm, { borderColor: t.acc, backgroundColor: t.surf }]}>
          <Body style={{ color: t.tx }}>Replace everything with {pending.summary}?</Body>
          <Micro style={{ marginTop: 6 }}>this overwrites the current programs, sessions and logs</Micro>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={applyImport}
              accessibilityRole="button"
              accessibilityLabel="Confirm import"
              style={[styles.smallBtn, { backgroundColor: t.acc }]}>
              <Micro style={{ color: t.onAcc, letterSpacing: 1.2 }}>replace</Micro>
            </Pressable>
            <Pressable
              onPress={() => {
                setPending(null);
                setStatus('import cancelled');
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel import"
              style={[styles.smallBtn, { borderWidth: 1, borderColor: t.line }]}>
              <Micro style={{ letterSpacing: 1.2 }}>cancel</Micro>
            </Pressable>
          </View>
        </View>
      ) : null}

      {status ? (
        <Micro style={{ marginTop: 14, color: t.accInk, letterSpacing: 1.1 }}>{status}</Micro>
      ) : null}

      <View style={{ height: 24 }} />
      <Micro style={{ letterSpacing: 1.1 }}>
        {exercises.length} exercises in the library · ledger v1.0
      </Micro>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 3,
    gap: 3,
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radius.md },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  swatchWrap: { alignItems: 'center', gap: 6 },
  swatch: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  confirm: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
  },
  smallBtn: { borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 },
});
