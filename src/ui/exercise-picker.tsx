import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MUSCLE_LABEL, MUSCLE_ORDER, EQUIPMENT_LABEL, type Exercise } from '@/domain/types';
import { Body, Display, Micro, Title } from '@/ui/text';
import { fonts, radius } from '@/ui/theme';
import { useTheme } from '@/ui/theme-provider';

type Props = {
  visible: boolean;
  exercises: Exercise[];
  addedIds: string[];
  onPick: (exerciseId: string) => void;
  onClose: () => void;
};

export default function ExercisePicker({ visible, exercises, addedIds, onPick, onClose }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MUSCLE_ORDER.map((muscle) => ({
      muscle,
      items: exercises.filter(
        (e) =>
          e.muscle === muscle &&
          (!q || e.name.toLowerCase().includes(q) || MUSCLE_LABEL[muscle].toLowerCase().includes(q))
      ),
    })).filter((g) => g.items.length > 0);
  }, [exercises, query]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdropWrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.bg,
              borderColor: t.line,
              maxHeight: height * 0.86,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.grabber}>
            <View style={[styles.grab, { backgroundColor: t.line }]} />
          </View>

          <View style={styles.head}>
            <Display style={{ fontSize: 26, lineHeight: 30 }}>Add exercise</Display>
            <Pressable onPress={onClose} hitSlop={10}>
              <Micro style={{ color: t.accInk }}>done</Micro>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${exercises.length} movements`}
            placeholderTextColor={t.mut}
            style={[
              styles.search,
              { backgroundColor: t.surf, borderColor: t.line, color: t.tx, fontFamily: fonts.sans },
            ]}
            selectionColor={t.acc}
            autoCorrect={false}
            returnKeyType="search"
          />

          <ScrollView
            style={{ marginTop: 12 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {groups.length === 0 ? (
              <Body style={{ color: t.mut, paddingVertical: 20 }}>Nothing matches “{query}”.</Body>
            ) : null}

            {groups.map((group) => (
              <View key={group.muscle} style={{ marginBottom: 18 }}>
                <Micro style={{ marginBottom: 8 }}>{MUSCLE_LABEL[group.muscle]}</Micro>
                <View style={[styles.group, { borderColor: t.line }]}>
                  {group.items.map((ex, i) => {
                    const added = addedIds.includes(ex.id);
                    return (
                        <Pressable
                          key={ex.id}
                          disabled={added}
                          onPress={() => onPick(ex.id)}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: added }}
                          accessibilityLabel={`${added ? 'Added' : 'Add'} ${ex.name}`}
                        style={[
                          styles.row,
                          i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                        ]}>
                        <View style={{ flex: 1 }}>
                          <Title style={{ fontSize: 17, lineHeight: 21 }} color={added ? t.mut : t.tx}>
                            {ex.name}
                          </Title>
                          <Micro style={{ marginTop: 3, letterSpacing: 1.2 }}>
                            {EQUIPMENT_LABEL[ex.equipment]}
                            {ex.isCustom ? ' · custom' : ''}
                          </Micro>
                        </View>
                        <Micro style={{ color: added ? t.mut : t.accInk, letterSpacing: 1.2 }}>
                          {added ? 'added' : 'add'}
                        </Micro>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropWrap: { flex: 1, justifyContent: 'flex-end' },
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
    marginBottom: 14,
  },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  group: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
});
