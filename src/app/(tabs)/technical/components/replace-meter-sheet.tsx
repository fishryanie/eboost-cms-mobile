import { mhs } from 'themes/scaling';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText, ThemedView } from 'components/base';
import { EmptyState, AppButton } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import { getServiceSheetMetrics } from 'app/(tabs)/technical/features/service-sheet-metrics';
import { useUtilityChargers } from 'app/(tabs)/technical/features/trigger-box/trigger-box-hooks';
import { getUtilityChargerTriggerId, type UtilityCharger } from 'app/(tabs)/technical/features/trigger-box/trigger-box-service';

type ReplaceMeterSheetProps = {
  onClose: () => void;
  visible: boolean;
};

type ReplaceMeterCharger = UtilityCharger & {
  boxType?: 'bike' | 'car';
  partnerBoxId?: number;
  partnerLocationId?: number;
};

const emptyChargers: ReplaceMeterCharger[] = [];
const snapPoints = ['68%', '84%'];

function getChargerSelectionKey(charger: ReplaceMeterCharger) {
  return `${charger.id}-${charger.vendorId}-${charger.uniqueId}`;
}

function getChargerListKey(charger: ReplaceMeterCharger, index: number) {
  return `${getChargerSelectionKey(charger)}-${index}`;
}

function getChargerSearchText(charger: ReplaceMeterCharger) {
  return `${charger.uniqueId} ${charger.vendorId} ${charger.stationName || ''}`.toLowerCase();
}

function getChargerType(charger?: ReplaceMeterCharger) {
  return charger?.boxType === 'car' || charger?.uniqueId?.startsWith('Ecar') ? 'car' : 'bike';
}

export function ReplaceMeterSheet({ onClose, visible }: ReplaceMeterSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const { height, width } = useWindowDimensions();
  const metrics = getServiceSheetMetrics(width, height);
  const { bottom, top } = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [selectedChargerKey, setSelectedChargerKey] = useState<string>();

  const chargersQuery = useUtilityChargers(visible);
  const chargers = (chargersQuery.data || emptyChargers) as ReplaceMeterCharger[];
  const selectedCharger = chargers.find(charger => getChargerSelectionKey(charger) === selectedChargerKey);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredChargers = normalizedQuery ? chargers.filter(charger => getChargerSearchText(charger).includes(normalizedQuery)) : chargers;

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      const frame = requestAnimationFrame(() => ref.current?.present());
      return () => cancelAnimationFrame(frame);
    }

    ref.current?.dismiss();
    return undefined;
  }, [visible]);

  function resetState() {
    setQuery('');
    setSelectedChargerKey(undefined);
  }

  function handleDismiss() {
    if (!isPresentedRef.current) return;

    isPresentedRef.current = false;
    resetState();
    onClose();
  }

  function close() {
    ref.current?.dismiss();
  }

  function handleNext() {
    if (!selectedCharger) return;
    
    close();
    
    const chargerType = getChargerType(selectedCharger);
    const boxIdentifier = getUtilityChargerTriggerId(selectedCharger);
    
    router.push({
      pathname: '/technical/replace-meter',
      params: {
        boxIdentifier: boxIdentifier || '',
        chargerType,
        partnerBoxId: String(selectedCharger.partnerBoxId || ''),
        partnerLocationId: String(selectedCharger.partnerLocationId || ''),
        uniqueId: selectedCharger.uniqueId || '',
        vendorId: selectedCharger.vendorId || '' }
    });
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
              paddingTop: metrics.footerPaddingTop },
          ]}>
          <ThemedView flex={1}>
            <AppButton block label='Cancel' onPress={close} variant='ghost' />
          </ThemedView>
          <ThemedView flex={1}>
            <AppButton block disabled={!selectedChargerKey} label='Next' onPress={handleNext} />
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
        data={filteredChargers}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        keyExtractor={(charger, index) => getChargerListKey(charger, index)}
        keyboardShouldPersistTaps='handled'
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          chargersQuery.isLoading ? (
            <ThemedView alignItems='center' gap={'three'} paddingVertical={'six'}>
              <ActivityIndicator color={Palette.accent} />
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                Loading chargers
              </ThemedText>
            </ThemedView>
          ) : chargersQuery.isError ? (
            <ThemedView gap={'three'} paddingVertical={'three'}>
              <EmptyState message='Please retry loading utility chargers.' title='Chargers unavailable' />
              <AppButton label='Retry' onPress={() => chargersQuery.refetch()} />
            </ThemedView>
          ) : (
            <EmptyState message={query.trim() ? 'Try another charger ID, vendor ID, or station.' : 'No chargers were returned.'} title='No chargers found' />
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
                paddingTop: metrics.headerPaddingTop },
            ]}>
            <ThemedView gap={metrics.sectionGap}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={metrics.titleFontSize} lineHeight={metrics.titleLineHeight}>
                Replace Meter
              </ThemedText>
              <ThemedText
                color={Palette.textSecondary}
                fontFamily={FontFamily.regular}
                fontSize={metrics.descriptionFontSize}
                lineHeight={metrics.descriptionLineHeight}>
                Select a charger for meter replacement.
              </ThemedText>
            </ThemedView>

            <BottomSheetTextInput
              autoCapitalize='none'
              autoCorrect={false}
              clearButtonMode='while-editing'
              onChangeText={setQuery}
              placeholder='Search charger, vendor, or station'
              placeholderTextColor={Palette.textTertiary}
              returnKeyType='search'
              style={[
                styles.input,
                {
                  fontSize: metrics.inputFontSize,
                  minHeight: metrics.inputMinHeight,
                  paddingHorizontal: metrics.inputPaddingHorizontal },
              ]}
              value={query}
            />
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = getChargerSelectionKey(item) === selectedChargerKey;

          return (
            <Pressable
              accessibilityRole='radio'
              accessibilityState={{ checked: selected }}
              onPress={() => setSelectedChargerKey(getChargerSelectionKey(item))}
              style={({ pressed }) => [
                styles.chargerItem,
                {
                  gap: metrics.itemGap,
                  paddingHorizontal: metrics.itemPaddingHorizontal,
                  paddingVertical: metrics.itemPaddingVertical },
                selected && styles.chargerItemSelected,
                pressed && styles.pressed,
              ]}>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText
                  numberOfLines={1}
                  color={Palette.textPrimary}
                  fontFamily={FontFamily.regular}
                  fontSize={metrics.itemTitleFontSize}
                  lineHeight={metrics.itemTitleLineHeight}>
                  <ThemedText fontFamily={FontFamily.bold}>{item.uniqueId}</ThemedText> / {item.vendorId}
                </ThemedText>
                <ThemedText
                  numberOfLines={1}
                  color={Palette.textTertiary}
                  fontFamily={FontFamily.regular}
                  fontSize={metrics.itemSubtitleFontSize}
                  lineHeight={metrics.itemSubtitleLineHeight}>
                  {item.stationName || 'No station assigned'}
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
  chargerItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mhs(12),
    paddingHorizontal: mhs(12),
    paddingVertical: 10 },
  chargerItemSelected: {
    opacity: 1 },
  content: {
    paddingTop: mhs(4) },
  flexInput: {
    flex: 1,
    minWidth: 0 },
  footer: {
    backgroundColor: Palette.surfaceRaised,
    borderTopColor: Palette.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mhs(8),
    paddingHorizontal: mhs(12),
    paddingTop: mhs(8) },
  header: {
    backgroundColor: Palette.surfaceRaised,
    gap: mhs(8),
    paddingBottom: mhs(12),
    paddingHorizontal: mhs(12),
    paddingTop: mhs(8) },
  input: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.border,
    borderRadius: mhs(12),
    borderWidth: StyleSheet.hairlineWidth,
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: mhs(12) },
  notice: {
    backgroundColor: Palette.dangerSurface,
    borderRadius: mhs(12),
    paddingHorizontal: mhs(12),
    paddingVertical: mhs(8) },
  noticeSuccess: {
    backgroundColor: '#E8F4EF' },
  pressed: {
    opacity: 0.72 },
  radio: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22 },
  radioDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 8,
    width: 8 },
  radioSelected: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent },
  separator: {
    backgroundColor: Palette.borderSubtle,
    height: StyleSheet.hairlineWidth,
    marginLeft: mhs(16) } });
