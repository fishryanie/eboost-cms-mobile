import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { CheckCircle2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import type { PromoChargerOption, PromoChargerTarget } from './types';

type ChargerSelectSheetProps = {
  chargers: PromoChargerOption[];
  loading?: boolean;
  onClose: () => void;
  onToggle: (uniqueId: string, vehicleType: 'bike' | 'car') => void;
  selectedTargets: PromoChargerTarget[];
  visible: boolean;
};

const snapPoints = ['66%', '88%'];

export function ChargerSelectSheet({ chargers, loading, onClose, onToggle, selectedTargets, visible }: ChargerSelectSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const [query, setQuery] = useState('');
  const filteredChargers = useMemo(
    () =>
      chargers.filter(charger =>
        `${charger.uniqueId} ${charger.stationName || ''} ${charger.vehicleType || ''}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [chargers, query],
  );
  const selectedIds = useMemo(() => new Set(selectedTargets.map(item => item.boxUniqueId)), [selectedTargets]);

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

  function renderFooter(props: BottomSheetFooterProps) {
    return (
      <BottomSheetFooter {...props} bottomInset={0}>
        <ThemedView backgroundColor={Palette.surfaceRaised} borderTopColor={Palette.borderSubtle} borderTopWidth={StyleSheet.hairlineWidth} padding={'three'}>
          <AppButton block label={`Done${selectedTargets.length ? ` (${selectedTargets.length})` : ''}`} onPress={() => ref.current?.dismiss()} />
        </ThemedView>
      </BottomSheetFooter>
    );
  }

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      footerComponent={renderFooter}
      onDismiss={handleDismiss}
      ref={ref}
      snapPoints={snapPoints}>
      <BottomSheetFlatList
        contentContainerStyle={styles.content}
        data={filteredChargers}
        ItemSeparatorComponent={() => <ThemedView backgroundColor={Palette.borderSubtle} height={StyleSheet.hairlineWidth} marginLeft={'four'} />}
        keyExtractor={item => item.uniqueId}
        keyboardShouldPersistTaps='handled'
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          loading ? (
            <ThemedView gap={'three'} padding={'four'}>
              <ThemedView borderRadius={16} height={72} loading />
              <ThemedView borderRadius={16} height={72} loading />
              <ThemedView borderRadius={16} height={72} loading />
            </ThemedView>
          ) : (
            <EmptyState message='No chargers match your search.' title='No chargers found' />
          )
        }
        ListHeaderComponent={
          <ThemedView backgroundColor={Palette.surfaceRaised} gap={'three'} paddingBottom={'three'} paddingHorizontal={'four'} paddingTop={'two'}>
            <ThemedView gap={'one'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                Select chargers
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
                Pick chargers this promo code applies to.
              </ThemedText>
            </ThemedView>
            <BottomSheetTextInput
              autoCapitalize='none'
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder='Search charger...'
              placeholderTextColor={Palette.textTertiary}
              returnKeyType='search'
              style={styles.searchInput}
              value={query}
            />
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.uniqueId);
          const vehicleType = item.vehicleType || (item.uniqueId.toLowerCase().includes('car') ? 'car' : 'bike');
          return (
            <Pressable onPress={() => onToggle(item.uniqueId, vehicleType)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} numberOfLines={1}>
                  {item.uniqueId}
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontSize={12} numberOfLines={1}>
                  {[item.stationName, vehicleType].filter(Boolean).join(' · ') || 'No station'}
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
    paddingBottom: mhs(104),
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
