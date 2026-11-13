import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPLIT_TEMPLATES } from '@/domain/splits';
import { Body, Display, Micro, Title } from '@/ui/text';
import { fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

type Props = {
  visible: boolean;
  onCreate: (splitId: string, name: string) => void;
  onClose: () => void;
};

export default function NewProgramSheet({ visible, onCreate, onClose }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [splitId, setSplitId] = useState(SPLIT_TEMPLATES[0].id);
  const [name, setName] = useState('');

  const split = SPLIT_TEMPLATES.find((s) => s.id === splitId) ?? SPLIT_TEMPLATES[0];

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
              maxHeight: height * 0.88,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.grabber}>
            <View style={[styles.grab, { backgroundColor: t.line }]} />
          </View>

          <View style={styles.head}>
            <Display style={{ fontSize: 26, lineHeight: 30 }}>New program</Display>
            <Pressable onPress={onClose} hitSlop={10}>
              <Micro>close</Micro>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <Micro style={{ marginBottom: 10 }}>pick a split</Micro>
            <View style={styles.grid}>
              {SPLIT_TEMPLATES.map((template) => {
                const on = template.id === splitId;
                return (
                  <Pressable
                    key={template.id}
                    onPress={() => setSplitId(template.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[
                      styles.option,
                      {
                        borderColor: on ? t.acc : t.line,
                        backgroundColor: on ? t.surf2 : t.surf,
                      },
                    ]}>
                    <Title style={{ fontSize: 16, lineHeight: 20 }}>{template.name}</Title>
                    <Micro style={{ marginTop: 5, letterSpacing: 1 }}>{template.blurb}</Micro>
                    <Micro style={{ marginTop: 8, letterSpacing: 1, color: on ? t.accInk : t.mut }}>
                      {template.days.length} days ·{' '}
                      {template.days.reduce((n, d) => n + d.exercises.length, 0)} exercises
                    </Micro>
                  </Pressable>
                );
              })}
            </View>

            <Micro style={{ marginTop: 22, marginBottom: 8 }}>name</Micro>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={split.name}
              placeholderTextColor={t.mut}
              style={[
                styles.input,
                { borderColor: t.line, backgroundColor: t.surf, color: t.tx, fontFamily: fonts.sans },
              ]}
              selectionColor={t.acc}
            />

            <Pressable
              onPress={() => onCreate(splitId, name)}
              accessibilityRole="button"
              style={[styles.create, { backgroundColor: t.acc }]}>
              <Micro style={{ color: t.onAcc, letterSpacing: 1.7, fontSize: 10 }}>
                create and make active
              </Micro>
            </Pressable>
            <Micro style={{ marginTop: 10, textAlign: 'center' }}>
              you can rename days, swap exercises and change targets after
            </Micro>
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', borderWidth: 1, borderRadius: radius.lg, padding: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  create: {
    marginTop: 22,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
});
