import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { CheckCircle2 } from 'lucide-react-native';
import { forwardRef, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import type { SubscriptionPackageOption } from './types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PackageSelectSheetProps = {
  loading?: boolean;
  onSelect: (item: SubscriptionPackageOption) => void;
  packages: SubscriptionPackageOption[];
  selectedPackageId: string;
};

export const PackageSelectSheet = forwardRef<BottomSheetModal, PackageSelectSheetProps>(function PackageSelectSheet(
  { loading, onSelect, packages, selectedPackageId },
  ref,
) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const filteredPackages = useMemo(
    () => packages.filter(item => `${item.name || ''} ${item.nameVn || ''} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase())),
    [packages, query],
  );

  function handleDismiss() {
    setQuery('');
  }

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      onDismiss={handleDismiss}
      ref={ref}
      snapPoints={['62%', '86%']}
      topInset={insets.top}>
      <BottomSheetFlatList
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + mhs(56) }]}
        data={filteredPackages}
        ItemSeparatorComponent={() => <ThemedView backgroundColor={Palette.borderSubtle} height={StyleSheet.hairlineWidth} marginLeft={'four'} />}
        keyExtractor={item => String(item.id)}
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
            <EmptyState message='No subscription packages match your search.' title='No packages found' />
          )
        }
        ListHeaderComponent={
          <ThemedView backgroundColor={Palette.surfaceRaised} gap={'three'} paddingBottom={'three'} paddingHorizontal={'four'} paddingTop={'two'}>
            <ThemedView gap={'one'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                Select package
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
                Choose the subscription package to extend.
              </ThemedText>
            </ThemedView>
            <BottomSheetTextInput
              autoCapitalize='none'
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder='Search package...'
              placeholderTextColor={Palette.textTertiary}
              returnKeyType='search'
              style={styles.searchInput}
              value={query}
            />
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = selectedPackageId === String(item.id);
          return (
            <Pressable onPress={() => onSelect(item)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} numberOfLines={1}>
                  #{item.id} - {item.name || item.nameVn || 'Subscription package'}
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontSize={12} numberOfLines={1}>
                  {item.days || 0} days · {item.vehicleType || 'all'}
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
});

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
