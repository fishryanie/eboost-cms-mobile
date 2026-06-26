import { mhs } from 'themes/scaling';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText, ThemedView } from 'components/base';

import { useLocations } from 'shared/locations/hooks';
import { getServiceSheetMetrics } from 'app/(tabs)/technical/features/service-sheet-metrics';
import { EmptyState, AppButton } from 'components/ui';
import { FontFamily, Palette } from 'themes';

type SetupLocationSheetProps = {
  onClose: () => void;
  visible: boolean;
};

const snapPoints = ['68%', '84%'];

export function SetupLocationSheet({ onClose, visible }: SetupLocationSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const { height, width } = useWindowDimensions();
  const metrics = getServiceSheetMetrics(width, height);
  const { bottom, top } = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState('Eboost');
  const [selectedLocationId, setSelectedLocationId] = useState<number>();

  const locationsQuery = useLocations(query);
  // useLocations might return data as an array directly or an object with items, depending on API. Let's safely extract.
  const locationsData = locationsQuery.data as any;
  const locations: LocationRecord[] = Array.isArray(locationsData) ? locationsData : locationsData?.items ? locationsData.items : [];

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
    setQuery('Eboost');
    setSelectedLocationId(undefined);
    onClose();
  }

  function close() {
    ref.current?.dismiss();
  }

  function renderFooter(props: BottomSheetFooterProps) {
    return (
      <BottomSheetFooter {...props} bottomInset={0}>
        <ThemedView
          style={[
            styles.footer,
            {
              gap: metrics.footerGap,
              paddingBottom: Math.max(bottom, mhs(16)),
              paddingHorizontal: metrics.footerPaddingHorizontal,
              paddingTop: metrics.footerPaddingTop,
            },
          ]}>
          <ThemedView flex={1}>
            <AppButton block label='Cancel' onPress={close} variant='ghost' />
          </ThemedView>
          <ThemedView flex={1}>
            <AppButton
              block
              disabled={!selectedLocationId}
              label='Select'
              onPress={() => {
                close();
                if (selectedLocationId) {
                  router.push({ pathname: '/technical/setup-location', params: { id: selectedLocationId } });
                }
              }}
            />
          </ThemedView>
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
      snapPoints={snapPoints}
      topInset={top}>
      <BottomSheetFlatList
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottom + 136, 168) }]}
        data={locations}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        keyExtractor={item => String(item.id)}
        keyboardShouldPersistTaps='handled'
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          locationsQuery.isLoading ? (
            <ThemedView gap={'three'} paddingVertical={'three'}>
              <ThemedView borderRadius={'large'} height={76} loading />
              <ThemedView borderRadius={'large'} height={76} loading />
              <ThemedView borderRadius={'large'} height={76} loading />
            </ThemedView>
          ) : locationsQuery.isError ? (
            <ThemedView gap={'three'} paddingVertical={'three'}>
              <EmptyState message='Please retry loading locations.' title='Locations unavailable' />
              <AppButton label='Retry' onPress={() => locationsQuery.refetch()} />
            </ThemedView>
          ) : (
            <EmptyState message='No locations match your search.' title='No locations found' />
          )
        }
        ListHeaderComponent={
          <ThemedView
            style={[
              styles.header,
              {
                gap: metrics.headerGap,
                paddingBottom: metrics.headerPaddingBottom,
                paddingHorizontal: metrics.headerPaddingHorizontal,
                paddingTop: metrics.headerPaddingTop,
              },
            ]}>
            <ThemedView gap={metrics.sectionGap}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={metrics.titleFontSize} lineHeight={metrics.titleLineHeight}>
                Setup Location
              </ThemedText>
              <ThemedText
                color={Palette.textSecondary}
                fontFamily={FontFamily.regular}
                fontSize={metrics.descriptionFontSize}
                lineHeight={metrics.descriptionLineHeight}>
                Select a location to continue.
              </ThemedText>
            </ThemedView>

            <BottomSheetTextInput
              autoCapitalize='none'
              autoCorrect={false}
              clearButtonMode='while-editing'
              onChangeText={setQuery}
              placeholder='Search locations...'
              placeholderTextColor={Palette.textTertiary}
              returnKeyType='search'
              style={[
                styles.input,
                {
                  fontSize: metrics.inputFontSize,
                  minHeight: metrics.inputMinHeight,
                  paddingHorizontal: metrics.inputPaddingHorizontal,
                },
              ]}
              value={query}
            />
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = item.id === selectedLocationId;

          return (
            <Pressable
              accessibilityRole='radio'
              accessibilityState={{ checked: selected }}
              onPress={() => setSelectedLocationId(item.id)}
              style={({ pressed }) => [
                styles.listItem,
                {
                  gap: metrics.itemGap,
                  paddingHorizontal: metrics.itemPaddingHorizontal,
                  paddingVertical: metrics.itemPaddingVertical,
                },
                selected && styles.listItemSelected,
                pressed && styles.pressed,
              ]}>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText
                  numberOfLines={1}
                  color={Palette.textPrimary}
                  fontFamily={FontFamily.bold}
                  fontSize={metrics.itemTitleFontSize}
                  lineHeight={metrics.itemTitleLineHeight}>
                  {item.name}
                </ThemedText>
                <ThemedText
                  numberOfLines={1}
                  color={Palette.textTertiary}
                  fontFamily={FontFamily.regular}
                  fontSize={metrics.itemSubtitleFontSize}
                  lineHeight={metrics.itemSubtitleLineHeight}>
                  {item.displayAddress || item.address || 'No address provided'}
                </ThemedText>
              </ThemedView>
              <ThemedView style={[styles.radio, { height: metrics.radioSize, width: metrics.radioSize }, selected && styles.radioSelected]}>
                {selected ? <ThemedView style={[styles.radioDot, { height: metrics.radioDotSize, width: metrics.radioDotSize }]} /> : null}
              </ThemedView>
            </Pressable>
          );
        }}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mhs(12),
    paddingHorizontal: mhs(12),
    paddingVertical: 10,
  },
  listItemSelected: {
    opacity: 1,
  },
  content: {
    paddingTop: mhs(4),
  },
  footer: {
    backgroundColor: Palette.surfaceRaised,
    borderTopColor: Palette.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mhs(8),
    paddingHorizontal: mhs(12),
    paddingTop: mhs(8),
  },
  header: {
    backgroundColor: Palette.surfaceRaised,
    gap: mhs(8),
    paddingBottom: mhs(12),
    paddingHorizontal: mhs(12),
    paddingTop: mhs(8),
  },
  input: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.border,
    borderRadius: mhs(12),
    borderWidth: StyleSheet.hairlineWidth,
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: mhs(12),
  },
  pressed: {
    opacity: 0.72,
  },
  radio: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  radioSelected: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  separator: {
    backgroundColor: Palette.borderSubtle,
    height: StyleSheet.hairlineWidth,
    marginLeft: mhs(16),
  },
});
