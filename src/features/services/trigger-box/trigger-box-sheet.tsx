import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';

import { AppButton, EmptyState } from 'shared/ui';
import { FontFamily, Palette, Radius, Spacing } from 'themes';

import { useUtilityChargers } from './trigger-box-hooks';
import { getUtilityChargerTriggerId, requestTriggerBox, stringifyTriggerBoxResponse, type UtilityCharger } from './trigger-box-service';

type TriggerBoxSheetProps = {
  onClose: () => void;
  visible: boolean;
};

const emptyChargers: UtilityCharger[] = [];

function getChargerSearchText(charger: UtilityCharger) {
  return `${charger.uniqueId} ${charger.vendorId} ${charger.stationName || ''}`.toLowerCase();
}

export function TriggerBoxSheet({ onClose, visible }: TriggerBoxSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const { bottom } = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedChargerId, setSelectedChargerId] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState<unknown>();
  const [toastMessage, setToastMessage] = useState('');
  const chargersQuery = useUtilityChargers(visible);
  const chargers = chargersQuery.data || emptyChargers;
  const snapPoints = useMemo(() => ['72%', '92%'], []);
  const selectedCharger = chargers.find(charger => charger.id === selectedChargerId);
  const selectedBoxId = getUtilityChargerTriggerId(selectedCharger);
  const canConfirm = Boolean(selectedBoxId) && !isSubmitting;
  const responseText = useMemo(() => stringifyTriggerBoxResponse(lastResponse), [lastResponse]);
  const filteredChargers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return chargers;

    return chargers.filter(charger => getChargerSearchText(charger).includes(normalizedQuery));
  }, [chargers, query]);

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

  function handleDismiss() {
    if (!isPresentedRef.current) return;

    isPresentedRef.current = false;
    setQuery('');
    setSelectedChargerId(undefined);
    setLastResponse(undefined);
    setToastMessage('');
    onClose();
  }

  function close() {
    if (isSubmitting) return;
    ref.current?.dismiss();
  }

  async function submitTrigger() {
    if (!selectedBoxId) return;

    setIsSubmitting(true);
    setToastMessage('');

    try {
      const response = await requestTriggerBox({ boxId: selectedBoxId });
      setLastResponse(response);
      setToastMessage(`Sent MeterValues trigger to ${selectedBoxId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Trigger failed. Please try again.';
      setToastMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFooter(props: BottomSheetFooterProps) {
    const footerPadding = { paddingBottom: bottom + Spacing.three };

    return (
      <BottomSheetFooter {...props} bottomInset={0}>
        <ThemedView style={[styles.footer, footerPadding]}>
          <ThemedView flex={1}>
            <AppButton block disabled={isSubmitting} label='Cancel' onPress={close} variant='ghost' />
          </ThemedView>
          <ThemedView flex={1}>
            <AppButton block disabled={!canConfirm} label='Confirm' loading={isSubmitting} onPress={() => void submitTrigger()} />
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
      snapPoints={snapPoints}>
      <BottomSheetFlatList
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottom + 112, 132) }]}
        data={filteredChargers}
        ItemSeparatorComponent={() => <ThemedView style={styles.chargerSeparator} />}
        keyExtractor={charger => String(charger.id)}
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
          <ThemedView style={styles.stickyHeader}>
            {toastMessage ? (
              <ThemedView style={[styles.notice, lastResponse !== undefined && styles.noticeSuccess]}>
                <ThemedText color={lastResponse !== undefined ? Palette.accent : Palette.danger} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
                  {toastMessage}
                </ThemedText>
              </ThemedView>
            ) : null}

            <ThemedView gap={Spacing.two}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={22} lineHeight={28}>
                Trigger Box
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} lineHeight={20}>
                Select a charger, then confirm to send a MeterValues trigger through the hub service.
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
              style={styles.searchInput}
              value={query}
            />

            {selectedCharger ? (
              <ThemedView style={styles.selectedPanel}>
                <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
                  Selected charger
                </ThemedText>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                  {selectedBoxId}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
                  {selectedCharger.stationName || 'No station assigned'}
                </ThemedText>
              </ThemedView>
            ) : null}

            {lastResponse !== undefined ? (
              <ThemedView style={styles.resultPanel}>
                <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
                  Trigger response
                </ThemedText>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} selectable>
                  {responseText}
                </ThemedText>
              </ThemedView>
            ) : null}
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = item.id === selectedChargerId;
          const triggerId = getUtilityChargerTriggerId(item);

          return (
            <Pressable
              accessibilityRole='radio'
              accessibilityState={{ checked: selected }}
              onPress={() => {
                setSelectedChargerId(item.id);
                setLastResponse(undefined);
              }}
              style={({ pressed }) => [styles.chargerItem, selected && styles.chargerItemSelected, pressed && styles.pressed]}>
              <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
                <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
                  {triggerId}
                </ThemedText>
                <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
                  {item.vendorId} / {item.uniqueId}
                </ThemedText>
                <ThemedText numberOfLines={1} color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
                  {item.stationName || 'No station assigned'}
                </ThemedText>
              </ThemedView>
              <ThemedView style={[styles.radio, selected && styles.radioSelected]}>{selected ? <ThemedView style={styles.radioDot} /> : null}</ThemedView>
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  chargerItemSelected: {
    opacity: 1,
  },
  chargerSeparator: {
    backgroundColor: Palette.borderSubtle,
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.four,
  },
  content: {
    paddingTop: Spacing.one,
  },
  footer: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  notice: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FDA29B',
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noticeSuccess: {
    backgroundColor: '#F0FAF4',
    borderColor: '#CDEEDB',
  },
  pressed: {
    opacity: 0.72,
  },
  radio: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: Radius.pill,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  radioDot: {
    backgroundColor: Palette.accent,
    borderRadius: Radius.pill,
    height: 10,
    width: 10,
  },
  radioSelected: {
    borderColor: Palette.accent,
  },
  resultPanel: {
    backgroundColor: '#F0FAF4',
    borderColor: '#CDEEDB',
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.two,
    maxHeight: 180,
    padding: Spacing.three,
  },
  searchInput: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.large,
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  selectedPanel: {
    backgroundColor: '#F0FAF4',
    borderColor: '#CDEEDB',
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  stickyHeader: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderBottomWidth: 1,
    gap: Spacing.four,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
});
