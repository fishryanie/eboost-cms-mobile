import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useInfiniteQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react-native';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { fetchPromotionCodesPage, type PaginatedCollection } from './service';
import type { PromotionCodeOption } from './types';

type PromoCodeSelectSheetProps = {
  onSelect: (item: PromotionCodeOption) => void;
  selectedPromoCodeId: string;
};

function getPromoCodeIri(item: PromotionCodeOption) {
  return item.iriId || `/api/promotion_codes/${item.id}`;
}

function getPromoCodeTitle(item: PromotionCodeOption) {
  return item.code || item.name || item.nameVn || `Promo code #${item.id}`;
}

export const PromoCodeSelectSheet = forwardRef<BottomSheetModal, PromoCodeSelectSheetProps>(function PromoCodeSelectSheet(
  { onSelect, selectedPromoCodeId },
  ref,
) {
  const insets = useSafeAreaInsets();
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const promoCodesQuery = useInfiniteQuery({
    getNextPageParam: (lastPage: PaginatedCollection<PromotionCodeOption>) => lastPage.nextPage,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPromotionCodesPage({ page: Number(pageParam), search: query }),
    queryKey: ['marketing', 'promotion-codes', query],
  });
  const promoCodes = useMemo(() => promoCodesQuery.data?.pages.flatMap(page => page.items) || [], [promoCodesQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(queryInput.trim()), 350);
    return () => clearTimeout(timeout);
  }, [queryInput]);

  const loadMore = useCallback(() => {
    if (promoCodesQuery.hasNextPage && !promoCodesQuery.isFetchingNextPage) {
      void promoCodesQuery.fetchNextPage();
    }
  }, [promoCodesQuery]);

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      ref={ref}
      snapPoints={['72%', '88%']}
      topInset={insets.top}>
      <ThemedView backgroundColor={Palette.surfaceRaised} gap={'three'} paddingBottom={'three'} paddingHorizontal={'four'} paddingTop={'two'}>
        <ThemedView gap={'one'}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
            Select promo code
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
            Search and choose the promo code to apply.
          </ThemedText>
        </ThemedView>
        <BottomSheetTextInput
          autoCapitalize='none'
          autoCorrect={false}
          onChangeText={setQueryInput}
          placeholder='Search promo code...'
          placeholderTextColor={Palette.textTertiary}
          returnKeyType='search'
          style={styles.searchInput}
          value={queryInput}
        />
      </ThemedView>
      <BottomSheetFlatList
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + mhs(56) }]}
        data={promoCodes}
        ItemSeparatorComponent={() => <ThemedView backgroundColor={Palette.borderSubtle} height={StyleSheet.hairlineWidth} marginLeft={'four'} />}
        keyExtractor={item => String(item.id)}
        keyboardShouldPersistTaps='handled'
        ListEmptyComponent={
          promoCodesQuery.isLoading ? (
            <ThemedView gap={'three'} padding={'four'}>
              <ThemedView borderRadius={16} height={72} loading />
              <ThemedView borderRadius={16} height={72} loading />
              <ThemedView borderRadius={16} height={72} loading />
            </ThemedView>
          ) : (
            <EmptyState message={query ? 'Try another promo code.' : 'No promo codes were returned.'} title='No promo codes found' />
          )
        }
        ListFooterComponent={
          promoCodesQuery.isFetchingNextPage ? (
            <ThemedView alignSelf='center' borderRadius={'pill'} height={18} loading marginVertical={24} width={132} />
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => {
          const selected = selectedPromoCodeId === getPromoCodeIri(item);
          return (
            <Pressable onPress={() => onSelect(item)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} numberOfLines={1}>
                  #{item.id} - {getPromoCodeTitle(item)}
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontSize={12} numberOfLines={1}>
                  {[item.name || item.nameVn, item.expiredAt ? `Expires ${item.expiredAt}` : undefined].filter(Boolean).join(' · ') || 'Promo code'}
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
