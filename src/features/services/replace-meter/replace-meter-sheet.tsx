import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';

import { EmptyState, AppButton } from 'shared/ui';
import { FontFamily, Palette, Radius, Spacing } from 'themes';

import { getServiceSheetMetrics } from '../service-sheet-metrics';
import { useUtilityChargers } from '../trigger-box/trigger-box-hooks';
import { getUtilityChargerTriggerId, type UtilityCharger } from '../trigger-box/trigger-box-service';
import { replaceMeter } from './replace-meter-service';

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

function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

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

function getPositiveNumber(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
}

function getMetricNumber(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : undefined;
}

export function ReplaceMeterSheet({ onClose, visible }: ReplaceMeterSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const { height, width } = useWindowDimensions();
  const metrics = getServiceSheetMetrics(width, height);
  const { bottom, top } = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedChargerKey, setSelectedChargerKey] = useState<string>();
  const [replacementDate, setReplacementDate] = useState(getTodayText);
  const [closingIndex, setClosingIndex] = useState('');
  const [newMeterIndex, setNewMeterIndex] = useState('');
  const [connectorId, setConnectorId] = useState('');
  const [partnerBoxId, setPartnerBoxId] = useState('');
  const [partnershipLocationId, setPartnershipLocationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [succeeded, setSucceeded] = useState(false);
  const chargersQuery = useUtilityChargers(visible);
  const chargers = (chargersQuery.data || emptyChargers) as ReplaceMeterCharger[];
  const selectedCharger = chargers.find(charger => getChargerSelectionKey(charger) === selectedChargerKey);
  const chargerType = getChargerType(selectedCharger);
  const boxIdentifier = getUtilityChargerTriggerId(selectedCharger);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredChargers = normalizedQuery ? chargers.filter(charger => getChargerSearchText(charger).includes(normalizedQuery)) : chargers;
  const resolvedPartnerBoxId = getPositiveNumber(partnerBoxId || String(selectedCharger?.partnerBoxId || ''));
  const resolvedPartnershipLocationId = getPositiveNumber(partnershipLocationId || String(selectedCharger?.partnerLocationId || ''));
  const resolvedClosingIndex = getMetricNumber(closingIndex);
  const resolvedNewMeterIndex = getMetricNumber(newMeterIndex);
  const resolvedConnectorId = chargerType === 'car' ? getPositiveNumber(connectorId) : undefined;
  const canConfirm =
    Boolean(boxIdentifier) &&
    Boolean(resolvedPartnerBoxId) &&
    Boolean(resolvedPartnershipLocationId) &&
    Boolean(replacementDate.trim()) &&
    resolvedClosingIndex !== undefined &&
    resolvedNewMeterIndex !== undefined &&
    !isSubmitting;

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      const frame = requestAnimationFrame(() => ref.current?.present());
      return () => cancelAnimationFrame(frame);
    }

    ref.current?.dismiss();
    return undefined;
  }, [visible]);

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timeout = setTimeout(() => setToastMessage(''), 3500);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  function resetState() {
    setQuery('');
    setSelectedChargerKey(undefined);
    setReplacementDate(getTodayText());
    setClosingIndex('');
    setNewMeterIndex('');
    setConnectorId('');
    setPartnerBoxId('');
    setPartnershipLocationId('');
    setToastMessage('');
    setSucceeded(false);
  }

  function handleDismiss() {
    if (!isPresentedRef.current) return;

    isPresentedRef.current = false;
    resetState();
    onClose();
  }

  function close() {
    if (isSubmitting) return;
    ref.current?.dismiss();
  }

  async function submitReplaceMeter() {
    if (
      !boxIdentifier ||
      !resolvedPartnerBoxId ||
      !resolvedPartnershipLocationId ||
      resolvedClosingIndex === undefined ||
      resolvedNewMeterIndex === undefined
    ) {
      setSucceeded(false);
      setToastMessage('Select charger and fill all required meter fields.');
      return;
    }

    setIsSubmitting(true);
    setToastMessage('');

    try {
      const response = await replaceMeter({
        boxIdentifier,
        chargerType,
        closingIndex: resolvedClosingIndex,
        connectorId: resolvedConnectorId,
        newMeterIndex: resolvedNewMeterIndex,
        partnerBoxId: resolvedPartnerBoxId,
        partnershipLocationId: resolvedPartnershipLocationId,
        replacementDate: replacementDate.trim(),
      });
      setSucceeded(true);
      setToastMessage(`Created reports #${response.removeMeterReportId} and #${response.installMeterReportId}.`);
      setIsSubmitting(false);
    } catch (error) {
      setSucceeded(false);
      setToastMessage(error instanceof Error ? error.message : 'Replace meter failed. Please try again.');
      setIsSubmitting(false);
    }
  }

  function renderFooter(props: BottomSheetFooterProps) {
    return (
      <BottomSheetFooter {...props} bottomInset={0}>
        <ThemedView
          style={[
            styles.footer,
            {
              gap: metrics.footerGap,
              paddingBottom: bottom + Spacing.three,
              paddingHorizontal: metrics.footerPaddingHorizontal,
              paddingTop: metrics.footerPaddingTop,
            },
          ]}>
          <ThemedView flex={1}>
            <AppButton block disabled={isSubmitting} label='Cancel' onPress={close} variant='ghost' />
          </ThemedView>
          <ThemedView flex={1}>
            <AppButton block disabled={!canConfirm} label='Create Reports' loading={isSubmitting} onPress={() => void submitReplaceMeter()} />
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
            <ThemedView alignItems='center' gap={Spacing.three} paddingVertical={Spacing.six}>
              <ActivityIndicator color={Palette.accent} />
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                Loading chargers
              </ThemedText>
            </ThemedView>
          ) : chargersQuery.isError ? (
            <ThemedView gap={Spacing.three} paddingVertical={Spacing.three}>
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
                paddingTop: metrics.headerPaddingTop,
              },
            ]}>
            {toastMessage ? (
              <ThemedView style={[styles.notice, succeeded && styles.noticeSuccess]}>
                <ThemedText
                  color={succeeded ? Palette.accent : Palette.danger}
                  fontFamily={FontFamily.semibold}
                  fontSize={metrics.noticeFontSize}
                  lineHeight={metrics.noticeLineHeight}>
                  {toastMessage}
                </ThemedText>
              </ThemedView>
            ) : null}

            <ThemedView gap={metrics.sectionGap}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={metrics.titleFontSize} lineHeight={metrics.titleLineHeight}>
                Replace Meter
              </ThemedText>
              <ThemedText
                color={Palette.textSecondary}
                fontFamily={FontFamily.regular}
                fontSize={metrics.descriptionFontSize}
                lineHeight={metrics.descriptionLineHeight}>
                Select a charger, then create the closing and new meter reports.
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
                  paddingHorizontal: metrics.inputPaddingHorizontal,
                },
              ]}
              value={query}
            />

            <ThemedView gap={metrics.formGap}>
              <BottomSheetTextInput
                onChangeText={setReplacementDate}
                placeholder='YYYY-MM-DD'
                style={[
                  styles.input,
                  {
                    fontSize: metrics.inputFontSize,
                    minHeight: metrics.inputMinHeight,
                    paddingHorizontal: metrics.inputPaddingHorizontal,
                  },
                ]}
                value={replacementDate}
              />
              <ThemedView flexDirection='row' gap={metrics.formGap}>
                <BottomSheetTextInput
                  keyboardType='decimal-pad'
                  onChangeText={setClosingIndex}
                  placeholder='Closing meter index'
                  style={[
                    styles.input,
                    styles.flexInput,
                    {
                      fontSize: metrics.inputFontSize,
                      minHeight: metrics.inputMinHeight,
                      paddingHorizontal: metrics.inputPaddingHorizontal,
                    },
                  ]}
                  value={closingIndex}
                />
                <BottomSheetTextInput
                  keyboardType='decimal-pad'
                  onChangeText={setNewMeterIndex}
                  placeholder='New meter index'
                  style={[
                    styles.input,
                    styles.flexInput,
                    {
                      fontSize: metrics.inputFontSize,
                      minHeight: metrics.inputMinHeight,
                      paddingHorizontal: metrics.inputPaddingHorizontal,
                    },
                  ]}
                  value={newMeterIndex}
                />
              </ThemedView>
              <ThemedView flexDirection='row' gap={metrics.formGap}>
                <BottomSheetTextInput
                  keyboardType='number-pad'
                  onChangeText={setPartnershipLocationId}
                  placeholder='Partner location ID'
                  style={[
                    styles.input,
                    styles.flexInput,
                    {
                      fontSize: metrics.inputFontSize,
                      minHeight: metrics.inputMinHeight,
                      paddingHorizontal: metrics.inputPaddingHorizontal,
                    },
                  ]}
                  value={partnershipLocationId}
                />
                <BottomSheetTextInput
                  keyboardType='number-pad'
                  onChangeText={setPartnerBoxId}
                  placeholder='Partner box ID'
                  style={[
                    styles.input,
                    styles.flexInput,
                    {
                      fontSize: metrics.inputFontSize,
                      minHeight: metrics.inputMinHeight,
                      paddingHorizontal: metrics.inputPaddingHorizontal,
                    },
                  ]}
                  value={partnerBoxId}
                />
              </ThemedView>
              {chargerType === 'car' ? (
                <BottomSheetTextInput
                  keyboardType='number-pad'
                  onChangeText={setConnectorId}
                  placeholder='Connector ID (optional)'
                  style={[
                    styles.input,
                    {
                      fontSize: metrics.inputFontSize,
                      minHeight: metrics.inputMinHeight,
                      paddingHorizontal: metrics.inputPaddingHorizontal,
                    },
                  ]}
                  value={connectorId}
                />
              ) : null}
            </ThemedView>
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = getChargerSelectionKey(item) === selectedChargerKey;

          return (
            <Pressable
              accessibilityRole='radio'
              accessibilityState={{ checked: selected }}
              onPress={() => {
                setSelectedChargerKey(getChargerSelectionKey(item));
                setPartnerBoxId(item.partnerBoxId ? String(item.partnerBoxId) : partnerBoxId);
                setPartnershipLocationId(item.partnerLocationId ? String(item.partnerLocationId) : partnershipLocationId);
                setSucceeded(false);
                setToastMessage('');
              }}
              style={({ pressed }) => [
                styles.chargerItem,
                {
                  gap: metrics.itemGap,
                  paddingHorizontal: metrics.itemPaddingHorizontal,
                  paddingVertical: metrics.itemPaddingVertical,
                },
                selected && styles.chargerItemSelected,
                pressed && styles.pressed,
              ]}>
              <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  chargerItemSelected: {
    opacity: 1,
  },
  content: {
    paddingTop: Spacing.one,
  },
  flexInput: {
    flex: 1,
    minWidth: 0,
  },
  footer: {
    backgroundColor: Palette.surfaceRaised,
    borderTopColor: Palette.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  header: {
    backgroundColor: Palette.surfaceRaised,
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  input: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.border,
    borderRadius: Radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: Spacing.three,
  },
  notice: {
    backgroundColor: Palette.dangerSurface,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noticeSuccess: {
    backgroundColor: '#E8F4EF',
  },
  pressed: {
    opacity: 0.72,
  },
  radio: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
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
    marginLeft: Spacing.four,
  },
});
