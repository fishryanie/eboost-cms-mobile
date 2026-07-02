import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { CheckCircle2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import type { NotificationTopicOption } from './types';

type TopicSelectSheetProps = {
  loading?: boolean;
  onClose: () => void;
  onSelect: (topic: NotificationTopicOption) => void;
  selectedTopic: string;
  topics: NotificationTopicOption[];
  visible: boolean;
};

const snapPoints = ['58%', '82%'];

export function TopicSelectSheet({ loading, onClose, onSelect, selectedTopic, topics, visible }: TopicSelectSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const [query, setQuery] = useState('');
  const filteredTopics = useMemo(
    () => topics.filter(topic => `${topic.name} ${topic.topic} ${topic.type || ''}`.toLowerCase().includes(query.trim().toLowerCase())),
    [query, topics],
  );

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      const frame = requestAnimationFrame(() => ref.current?.present());
      return () => cancelAnimationFrame(frame);
    }

    ref.current?.dismiss();
    return undefined;
  }, [visible]);

  function handleDismiss() {
    if (!isPresentedRef.current) return;
    isPresentedRef.current = false;
    setQuery('');
    onClose();
  }

  function selectTopic(topic: NotificationTopicOption) {
    onSelect(topic);
    ref.current?.dismiss();
  }

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      onDismiss={handleDismiss}
      ref={ref}
      snapPoints={snapPoints}>
      <BottomSheetFlatList
        contentContainerStyle={styles.content}
        data={filteredTopics}
        ItemSeparatorComponent={() => <ThemedView backgroundColor={Palette.borderSubtle} height={StyleSheet.hairlineWidth} marginLeft={'four'} />}
        keyExtractor={item => item.topic}
        keyboardShouldPersistTaps='handled'
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          loading ? (
            <ThemedView gap={'three'} padding={'four'}>
              <ThemedView borderRadius={16} height={64} loading />
              <ThemedView borderRadius={16} height={64} loading />
              <ThemedView borderRadius={16} height={64} loading />
            </ThemedView>
          ) : (
            <EmptyState message='No notification topics match your search.' title='No topics found' />
          )
        }
        ListHeaderComponent={
          <ThemedView backgroundColor={Palette.surfaceRaised} gap={'three'} paddingBottom={'three'} paddingHorizontal={'four'} paddingTop={'two'}>
            <ThemedView gap={'one'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                Select topic
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
                Choose one topic for this push notice.
              </ThemedText>
            </ThemedView>
            <BottomSheetTextInput
              autoCapitalize='none'
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder='Search topic...'
              placeholderTextColor={Palette.textTertiary}
              returnKeyType='search'
              style={styles.searchInput}
              value={query}
            />
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = selectedTopic === item.topic;
          return (
            <Pressable onPress={() => selectTopic(item)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} numberOfLines={1}>
                  {item.name}
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontSize={12} numberOfLines={1}>
                  {item.topic}
                </ThemedText>
              </ThemedView>
              {selected ? (
                <CheckCircle2 color={Palette.accent} size={22} />
              ) : (
                <ThemedView borderColor={Palette.border} borderRadius={'pill'} borderWidth={1.5} height={22} width={22} />
              )}
            </Pressable>
          );
        }}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: mhs(28),
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mhs(12),
    paddingHorizontal: mhs(16),
    paddingVertical: mhs(12),
  },
  pressed: {
    opacity: 0.72,
  },
  searchInput: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.border,
    borderRadius: mhs(14),
    borderWidth: StyleSheet.hairlineWidth,
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    minHeight: 44,
    paddingHorizontal: mhs(12),
  },
});
