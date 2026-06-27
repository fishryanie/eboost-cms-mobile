import { mhs } from 'themes/scaling';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { Zap, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';

import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import { getServiceSheetMetrics, type ServiceSheetMetrics } from '../service-sheet-metrics';
import { useUtilityChargers } from './trigger-box-hooks';
import {
  getUtilityChargerTriggerId,
  requestResetBox,
  requestTriggerBox,
  requestUnlockBox,
  stringifyTriggerBoxResponse,
  type UtilityCharger,
} from './trigger-box-service';

type TriggerBoxSheetProps = {
  mode?: 'reset' | 'trigger' | 'unlock';
  onClose: () => void;
  visible: boolean;
};

type BoxActionMode = NonNullable<TriggerBoxSheetProps['mode']>;

const emptyChargers: UtilityCharger[] = [];
const triggerBoxSnapPoints = ['54%', '78%'];
const phaseLabels = ['L1', 'L2', 'L3'];

type TriggerSampledValue = {
  value?: unknown;
  measurand?: unknown;
  phase?: unknown;
  unit?: unknown;
};

type TriggerResponseSummary = {
  chargePointID: string;
  connectorID: string;
  energyText: string;
  phases: { currentText: string; phase: string; voltageText: string }[];
  powerText: string;
  rawTimestamp: string;
  timestampText: string;
  transactionID: string;
};

function getChargerSearchText(charger: UtilityCharger) {
  return `${charger.uniqueId} ${charger.vendorId} ${charger.stationName || ''}`.toLowerCase();
}

function getUtilityChargerSelectionKey(charger: UtilityCharger) {
  return `${charger.id}-${charger.vendorId}-${charger.uniqueId}`;
}

function getUtilityChargerListKey(charger: UtilityCharger, index: number) {
  return `${getUtilityChargerSelectionKey(charger)}-${index}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function getSampleValue(samples: TriggerSampledValue[], measurand: string, phase?: string) {
  return samples.find(sample => sample.measurand === measurand && (phase === undefined || sample.phase === phase));
}

function formatSample(sample?: TriggerSampledValue, fallback = '--') {
  if (!sample || sample.value === undefined || sample.value === null || sample.value === '') return fallback;
  const value = Number(sample.value);
  const formattedValue = Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(sample.value);
  return `${formattedValue}${sample.unit ? ` ${sample.unit}` : ''}`;
}

function formatEnergy(sample?: TriggerSampledValue) {
  if (!sample || sample.value === undefined || sample.value === null || sample.value === '') return '--';
  const value = Number(sample.value);
  if (!Number.isFinite(value)) return formatSample(sample);
  if (sample.unit === 'Wh') return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} kWh`;
  return formatSample(sample);
}

function formatTimestamp(timestamp?: unknown) {
  if (typeof timestamp !== 'string' || !timestamp.trim()) return { rawTimestamp: '--', timestampText: '--' };

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return { rawTimestamp: timestamp, timestampText: timestamp };

  return {
    rawTimestamp: timestamp,
    timestampText: date.toLocaleString(undefined, {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  };
}

function getTriggerResponseSummary(response: unknown): TriggerResponseSummary {
  const root = isRecord(response) ? response : {};
  const meterValues = Array.isArray(root.meterValue) ? root.meterValue : [];
  const firstMeterValue = isRecord(meterValues[0]) ? meterValues[0] : {};
  const samples = Array.isArray(firstMeterValue.sampledValue) ? (firstMeterValue.sampledValue.filter(isRecord) as TriggerSampledValue[]) : [];
  const timestamp = formatTimestamp(firstMeterValue.timestamp);
  const phases = phaseLabels.map(phase => ({
    currentText: formatSample(getSampleValue(samples, 'Current.Import', phase)),
    phase,
    voltageText: formatSample(getSampleValue(samples, 'Voltage', phase)),
  }));

  return {
    chargePointID: typeof root.chargePointID === 'string' ? root.chargePointID : '--',
    connectorID: root.connectorID !== undefined && root.connectorID !== null ? String(root.connectorID) : '--',
    energyText: formatEnergy(getSampleValue(samples, 'Energy.Active.Import.Register')),
    phases,
    powerText: formatSample(getSampleValue(samples, 'Power.Active.Import')),
    rawTimestamp: timestamp.rawTimestamp,
    timestampText: timestamp.timestampText,
    transactionID: root.transactionID !== undefined && root.transactionID !== null ? String(root.transactionID) : '--',
  };
}

function InfoPill({ label, metrics, value }: { label: string; metrics: ServiceSheetMetrics; value: string }) {
  return (
    <ThemedView style={[styles.infoPill, { gap: metrics.cardGap / 2, minWidth: metrics.infoPillMinWidth, padding: metrics.cardPadding }]}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={15}>
        {label}
      </ThemedText>
      <ThemedText
        numberOfLines={1}
        color={Palette.textPrimary}
        fontFamily={FontFamily.bold}
        fontSize={metrics.itemTitleFontSize}
        lineHeight={metrics.itemTitleLineHeight}
        selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function MetricCard({ label, metrics, tone = 'neutral', value }: { label: string; metrics: ServiceSheetMetrics; tone?: 'accent' | 'neutral'; value: string }) {
  return (
    <ThemedView style={[styles.metricCard, { gap: metrics.sectionGap, padding: metrics.cardPadding }, tone === 'accent' && styles.metricCardAccent]}>
      <ThemedText color={tone === 'accent' ? Palette.accent : Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
        {label}
      </ThemedText>
      <ThemedText
        color={Palette.textPrimary}
        fontFamily={FontFamily.bold}
        fontSize={metrics.metricValueFontSize}
        lineHeight={metrics.metricValueLineHeight}
        selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function TriggerResponseModal({
  mode,
  onClose,
  response,
  responseText,
  visible,
}: {
  mode: BoxActionMode;
  onClose: () => void;
  response: unknown;
  responseText: string;
  visible: boolean;
}) {
  const { height, width } = useWindowDimensions();
  const metrics = getServiceSheetMetrics(width, height);
  const summary = getTriggerResponseSummary(response);
  const isReset = mode === 'reset';
  const isUnlock = mode === 'unlock';

  return (
    <Modal
      animationIn='zoomIn'
      animationInTiming={260}
      animationOut='zoomOut'
      animationOutTiming={200}
      backdropColor='#101828'
      backdropOpacity={0.46}
      backdropTransitionInTiming={260}
      backdropTransitionOutTiming={200}
      hideModalContentWhileAnimating
      isVisible={visible}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      style={styles.responseModal}>
      <ThemedView alignItems='center' flex={1} justifyContent='center' padding={metrics.responsePadding}>
        <ThemedView backgroundColor={Palette.surfaceRaised} borderRadius={'large'} maxHeight='88%' maxWidth={520} overflow='hidden' width='100%'>
          <ScrollView
            contentContainerStyle={[styles.responseModalContent, { gap: metrics.headerGap, padding: metrics.responsePadding }]}
            showsVerticalScrollIndicator={false}>
            <ThemedView alignItems='flex-start' flexDirection='row' gap={metrics.itemGap}>
              <ThemedView style={[styles.successIcon, { height: metrics.responseIconSize, width: metrics.responseIconSize }]}>
                <Zap color={Palette.accent} size={metrics.titleFontSize + 4} />
              </ThemedView>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText
                  color={Palette.textPrimary}
                  fontFamily={FontFamily.bold}
                  fontSize={metrics.responseTitleFontSize}
                  lineHeight={metrics.responseTitleLineHeight}>
                  {isReset ? 'Reset thành công' : isUnlock ? 'Unlock thành công' : 'Trigger thành công'}
                </ThemedText>
                <ThemedText
                  color={Palette.textSecondary}
                  fontFamily={FontFamily.regular}
                  fontSize={metrics.descriptionFontSize}
                  lineHeight={metrics.descriptionLineHeight}>
                  {isReset
                    ? 'Lệnh reset đã được gửi tới box qua hub service.'
                    : isUnlock
                      ? 'Lệnh unlock connector 1 đã được gửi tới box qua hub service.'
                      : 'MeterValues đã trả về các chỉ số hiện tại của cổng sạc.'}
                </ThemedText>
              </ThemedView>
              <Pressable
                accessibilityLabel='Close trigger response'
                accessibilityRole='button'
                onPress={onClose}
                style={[styles.modalCloseButton, { height: metrics.modalCloseSize, width: metrics.modalCloseSize }]}>
                <X color={Palette.textSecondary} size={15} />
              </Pressable>
            </ThemedView>

            {!isReset && !isUnlock ? (
              <>
                <ThemedView flexDirection='row' gap={metrics.sectionGap} wrap>
                  <InfoPill label='Charge point' metrics={metrics} value={summary.chargePointID} />
                  <InfoPill label='Connector' metrics={metrics} value={summary.connectorID} />
                  <InfoPill label='Transaction' metrics={metrics} value={summary.transactionID === '0' ? 'Không có phiên' : summary.transactionID} />
                </ThemedView>

                <ThemedView style={[styles.timestampPanel, { gap: metrics.sectionGap, padding: metrics.cardPadding }]}>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                    Thời điểm ghi nhận
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22} selectable>
                    {summary.timestampText}
                  </ThemedText>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} selectable>
                    {summary.rawTimestamp}
                  </ThemedText>
                </ThemedView>

                <ThemedView flexDirection='row' gap={metrics.sectionGap} wrap>
                  <MetricCard label='Tổng năng lượng' metrics={metrics} tone='accent' value={summary.energyText} />
                  <MetricCard label='Công suất tức thời' metrics={metrics} value={summary.powerText} />
                </ThemedView>

                <ThemedView style={[styles.phasePanel, { padding: metrics.cardPadding }]}>
                  <ThemedView flexDirection='row' gap={metrics.sectionGap} paddingBottom={metrics.sectionGap}>
                    <ThemedText color={Palette.textTertiary} flex={0.7} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                      Pha
                    </ThemedText>
                    <ThemedText color={Palette.textTertiary} flex={1} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                      Điện áp
                    </ThemedText>
                    <ThemedText color={Palette.textTertiary} flex={1} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                      Dòng điện
                    </ThemedText>
                  </ThemedView>
                  {summary.phases.map(phase => (
                    <ThemedView key={phase.phase} style={[styles.phaseRow, { gap: metrics.sectionGap, paddingVertical: metrics.sectionGap }]}>
                      <ThemedText
                        color={Palette.textPrimary}
                        flex={0.7}
                        fontFamily={FontFamily.bold}
                        fontSize={metrics.itemTitleFontSize}
                        lineHeight={metrics.itemTitleLineHeight}>
                        {phase.phase}
                      </ThemedText>
                      <ThemedText
                        color={Palette.textPrimary}
                        flex={1}
                        fontFamily={FontFamily.semibold}
                        fontSize={metrics.itemTitleFontSize}
                        lineHeight={metrics.itemTitleLineHeight}
                        selectable>
                        {phase.voltageText}
                      </ThemedText>
                      <ThemedText
                        color={Palette.textPrimary}
                        flex={1}
                        fontFamily={FontFamily.semibold}
                        fontSize={metrics.itemTitleFontSize}
                        lineHeight={metrics.itemTitleLineHeight}
                        selectable>
                        {phase.currentText}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              </>
            ) : null}

            <ThemedView style={[styles.rawPanel, { gap: metrics.sectionGap, padding: metrics.cardPadding }]}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                Raw response
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16} selectable>
                {responseText}
              </ThemedText>
            </ThemedView>

            <AppButton block label='Đã hiểu' onPress={onClose} />
          </ScrollView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

export function TriggerBoxSheet({ mode = 'trigger', onClose, visible }: TriggerBoxSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const { height, width } = useWindowDimensions();
  const metrics = getServiceSheetMetrics(width, height);
  const { bottom, top } = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedChargerKey, setSelectedChargerKey] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState<unknown>();
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [triggerSucceeded, setTriggerSucceeded] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const chargersQuery = useUtilityChargers(visible);
  const chargers = chargersQuery.data || emptyChargers;
  const selectedCharger = chargers.find(charger => getUtilityChargerSelectionKey(charger) === selectedChargerKey);
  const selectedBoxId = getUtilityChargerTriggerId(selectedCharger);
  const canConfirm = Boolean(selectedBoxId) && (mode !== 'reset' || Boolean(selectedCharger?.vendorId)) && !isSubmitting;
  const headerPadding = { paddingTop: mhs(8) };
  const responseText = stringifyTriggerBoxResponse(lastResponse);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredChargers = normalizedQuery ? chargers.filter(charger => getChargerSearchText(charger).includes(normalizedQuery)) : chargers;
  const isResetMode = mode === 'reset';
  const isUnlockMode = mode === 'unlock';

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
    setSelectedChargerKey(undefined);
    setLastResponse(undefined);
    setResponseModalVisible(false);
    setTriggerSucceeded(false);
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
      setResponseModalVisible(true);
      setTriggerSucceeded(true);
      setToastMessage(`Sent MeterValues trigger to ${selectedBoxId}.`);
      setIsSubmitting(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Trigger failed. Please try again.';
      setTriggerSucceeded(false);
      setToastMessage(message);
      setIsSubmitting(false);
    }
  }

  async function submitReset() {
    if (!selectedBoxId || !selectedCharger?.vendorId) return;

    setIsSubmitting(true);
    setToastMessage('');

    try {
      const response = await requestResetBox({ boxId: selectedBoxId, vendorId: selectedCharger.vendorId });
      setLastResponse(response);
      setResponseModalVisible(true);
      setTriggerSucceeded(true);
      setToastMessage(`Sent reset command to ${selectedBoxId}.`);
      setIsSubmitting(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reset failed. Please try again.';
      setTriggerSucceeded(false);
      setToastMessage(message);
      setIsSubmitting(false);
    }
  }

  async function submitUnlock() {
    if (!selectedBoxId) return;

    setIsSubmitting(true);
    setToastMessage('');

    try {
      const response = await requestUnlockBox({ boxId: selectedBoxId });
      setLastResponse(response);
      setResponseModalVisible(true);
      setTriggerSucceeded(true);
      setToastMessage(`Sent unlock command to ${selectedBoxId}.`);
      setIsSubmitting(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unlock failed. Please try again.';
      setTriggerSucceeded(false);
      setToastMessage(message);
      setIsSubmitting(false);
    }
  }

  function submitSelectedAction() {
    if (isResetMode) return submitReset();
    if (isUnlockMode) return submitUnlock();
    return submitTrigger();
  }

  function renderFooter(props: BottomSheetFooterProps) {
    const footerPadding = { paddingBottom: Math.max(bottom, mhs(16)) };

    return (
      <BottomSheetFooter {...props} bottomInset={0}>
        <ThemedView
          style={[
            styles.footer,
            {
              gap: metrics.footerGap,
              paddingHorizontal: metrics.footerPaddingHorizontal,
              paddingTop: metrics.footerPaddingTop,
            },
            footerPadding,
          ]}>
          <ThemedView flex={1}>
            <AppButton block disabled={isSubmitting} label='Cancel' onPress={close} variant='ghost' />
          </ThemedView>
          <ThemedView flex={1}>
            <AppButton block disabled={!canConfirm} label='Confirm' loading={isSubmitting} onPress={() => void submitSelectedAction()} />
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
      snapPoints={triggerBoxSnapPoints}
      topInset={top}>
      <BottomSheetFlatList
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottom + 112, 132) }]}
        data={filteredChargers}
        ItemSeparatorComponent={() => <ThemedView style={styles.chargerSeparator} />}
        keyExtractor={(charger, index) => getUtilityChargerListKey(charger, index)}
        keyboardShouldPersistTaps='handled'
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          chargersQuery.isLoading ? (
            <ThemedView gap={'three'} paddingVertical={'three'}>
              <ThemedView borderRadius={'large'} height={76} loading />
              <ThemedView borderRadius={'large'} height={76} loading />
              <ThemedView borderRadius={'large'} height={76} loading />
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
              styles.stickyHeader,
              {
                gap: metrics.headerGap,
                paddingBottom: metrics.headerPaddingBottom,
                paddingHorizontal: metrics.headerPaddingHorizontal,
                paddingTop: metrics.headerPaddingTop,
              },
              headerPadding,
            ]}>
            {toastMessage ? (
              <ThemedView style={[styles.notice, triggerSucceeded && styles.noticeSuccess]}>
                <ThemedText
                  color={triggerSucceeded ? Palette.accent : Palette.danger}
                  fontFamily={FontFamily.semibold}
                  fontSize={metrics.noticeFontSize}
                  lineHeight={metrics.noticeLineHeight}>
                  {toastMessage}
                </ThemedText>
              </ThemedView>
            ) : null}

            <ThemedView gap={metrics.sectionGap}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={metrics.titleFontSize} lineHeight={metrics.titleLineHeight}>
                {isResetMode ? 'Reset Box' : isUnlockMode ? 'Unlock Charger' : 'Trigger Box'}
              </ThemedText>
              <ThemedText
                color={Palette.textSecondary}
                fontFamily={FontFamily.regular}
                fontSize={metrics.descriptionFontSize}
                lineHeight={metrics.descriptionLineHeight}>
                {isResetMode
                  ? 'Select a charger, then confirm to check live box status and send a reset command.'
                  : isUnlockMode
                    ? 'Select a charger, then confirm to unlock connector 1 through the hub service.'
                    : 'Select a charger, then confirm to send a MeterValues trigger through the hub service.'}
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
                styles.searchInput,
                {
                  fontSize: metrics.inputFontSize,
                  lineHeight: metrics.inputLineHeight,
                  paddingHorizontal: metrics.inputPaddingHorizontal,
                  paddingVertical: metrics.inputPaddingVertical,
                },
              ]}
              value={query}
            />
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = getUtilityChargerSelectionKey(item) === selectedChargerKey;

          return (
            <Pressable
              accessibilityRole='radio'
              accessibilityState={{ checked: selected }}
              onPress={() => {
                setSelectedChargerKey(getUtilityChargerSelectionKey(item));
                setLastResponse(undefined);
                setResponseModalVisible(false);
                setTriggerSucceeded(false);
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
                {selected ? <ThemedView style={[styles.radioDot, { height: metrics.radioDotSize + 2, width: metrics.radioDotSize + 2 }]} /> : null}
              </ThemedView>
            </Pressable>
          );
        }}
      />
      <TriggerResponseModal
        mode={mode}
        onClose={() => setResponseModalVisible(false)}
        response={lastResponse}
        responseText={responseText}
        visible={responseModalVisible && lastResponse !== undefined}
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
    paddingVertical: 10,
  },
  chargerItemSelected: {
    opacity: 1,
  },
  chargerSeparator: {
    backgroundColor: Palette.borderSubtle,
    height: StyleSheet.hairlineWidth,
    marginLeft: mhs(16),
  },
  content: {
    paddingTop: mhs(4),
  },
  footer: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: mhs(8),
    paddingHorizontal: mhs(12),
    paddingTop: mhs(8),
  },
  notice: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FDA29B',
    borderRadius: mhs(16),
    borderWidth: 1,
    paddingHorizontal: mhs(12),
    paddingVertical: mhs(8),
  },
  noticeSuccess: {
    backgroundColor: '#F0FAF4',
    borderColor: '#CDEEDB',
  },
  infoPill: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    flexGrow: 1,
    gap: mhs(2),
    minWidth: 130,
    padding: mhs(12),
  },
  metricCard: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: mhs(4),
    minWidth: 150,
    padding: mhs(12),
  },
  metricCardAccent: {
    backgroundColor: '#F0FAF4',
    borderColor: '#CDEEDB',
  },
  modalCloseButton: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pressed: {
    opacity: 0.72,
  },
  radio: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioDot: {
    backgroundColor: Palette.accent,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  radioSelected: {
    borderColor: Palette.accent,
  },
  responseModal: {
    margin: 0,
  },
  responseModalContent: {
    gap: mhs(16),
    padding: mhs(12),
  },
  rawPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    gap: mhs(8),
    padding: mhs(12),
  },
  searchInput: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(21),
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: mhs(16),
    paddingVertical: 10,
  },
  stickyHeader: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderBottomWidth: 1,
    gap: mhs(12),
    paddingBottom: mhs(12),
    paddingHorizontal: mhs(12),
    paddingTop: mhs(8),
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: '#E8F4EF',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  phasePanel: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    padding: mhs(12),
  },
  phaseRow: {
    borderColor: Palette.borderSubtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: mhs(8),
    paddingVertical: mhs(8),
  },
  timestampPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    gap: mhs(2),
    padding: mhs(12),
  },
});
