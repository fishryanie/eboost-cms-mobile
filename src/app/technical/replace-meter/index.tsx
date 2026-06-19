import { mhs } from 'themes/scaling';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import { useReplaceMeter } from './hooks';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { FontFamily, Palette } from 'themes';

function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

function getPositiveNumber(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
}

function getMetricNumber(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : undefined;
}

export default function ReplaceMeterScreen() {
  const params = useLocalSearchParams<{
    boxIdentifier: string;
    chargerType: 'bike' | 'car';
    partnerBoxId: string;
    partnerLocationId: string;
    uniqueId: string;
    vendorId: string;
  }>();
  const router = useRouter();
  const replaceMeterMutation = useReplaceMeter();

  const [replacementDate, setReplacementDate] = useState(getTodayText());
  const [closingIndex, setClosingIndex] = useState('');
  const [newMeterIndex, setNewMeterIndex] = useState('');
  const [connectorId, setConnectorId] = useState('');
  const [partnerBoxId, setPartnerBoxId] = useState(params.partnerBoxId || '');
  const [partnershipLocationId, setPartnershipLocationId] = useState(params.partnerLocationId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedPartnerBoxId = getPositiveNumber(partnerBoxId);
  const resolvedPartnershipLocationId = getPositiveNumber(partnershipLocationId);
  const resolvedClosingIndex = getMetricNumber(closingIndex);
  const resolvedNewMeterIndex = getMetricNumber(newMeterIndex);
  const resolvedConnectorId = params.chargerType === 'car' ? getPositiveNumber(connectorId) : undefined;

  const canConfirm =
    Boolean(params.boxIdentifier) &&
    Boolean(resolvedPartnerBoxId) &&
    Boolean(resolvedPartnershipLocationId) &&
    Boolean(replacementDate.trim()) &&
    resolvedClosingIndex !== undefined &&
    resolvedNewMeterIndex !== undefined &&
    !isSubmitting;

  async function submitReplaceMeter() {
    if (!canConfirm) {
      Alert.alert('Error', 'Please fill all required meter fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await replaceMeterMutation.mutateAsync({
        boxIdentifier: params.boxIdentifier,
        chargerType: params.chargerType,
        closingIndex: resolvedClosingIndex!,
        connectorId: resolvedConnectorId,
        newMeterIndex: resolvedNewMeterIndex!,
        partnerBoxId: resolvedPartnerBoxId!,
        partnershipLocationId: resolvedPartnershipLocationId!,
        replacementDate: replacementDate.trim() });
      setIsSubmitting(false);
      Alert.alert('Success', `Created reports #${response.removeMeterReportId} and #${response.installMeterReportId}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Replace meter failed. Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Replace Meter' />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'four'}>
          <ThemedView gap={'one'} paddingBottom={'two'}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={14}>
              Replacing meter for:
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16}>
              {params.uniqueId} / {params.vendorId}
            </ThemedText>
          </ThemedView>

          <FloatingTextInput label='* Replacement Date (YYYY-MM-DD)' value={replacementDate} onChangeText={setReplacementDate} />

          <ThemedView flexDirection='row' gap={'three'}>
            <ThemedView flex={1}>
              <FloatingTextInput label='* Closing Meter Index' value={closingIndex} onChangeText={setClosingIndex} keyboardType='decimal-pad' />
            </ThemedView>
            <ThemedView flex={1}>
              <FloatingTextInput label='* New Meter Index' value={newMeterIndex} onChangeText={setNewMeterIndex} keyboardType='decimal-pad' />
            </ThemedView>
          </ThemedView>

          <ThemedView flexDirection='row' gap={'three'}>
            <ThemedView flex={1}>
              <FloatingTextInput
                label='* Partner Location ID'
                value={partnershipLocationId}
                onChangeText={setPartnershipLocationId}
                keyboardType='number-pad'
              />
            </ThemedView>
            <ThemedView flex={1}>
              <FloatingTextInput label='* Partner Box ID' value={partnerBoxId} onChangeText={setPartnerBoxId} keyboardType='number-pad' />
            </ThemedView>
          </ThemedView>

          {params.chargerType === 'car' ? (
            <FloatingTextInput label='Connector ID (optional)' value={connectorId} onChangeText={setConnectorId} keyboardType='number-pad' />
          ) : null}
        </ThemedView>
      </ScrollView>

      <BottomButton onPress={submitReplaceMeter} title='Replace Meter' loading={isSubmitting} disabled={!canConfirm} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: mhs(16),
    paddingBottom: 100, // Make room for the BottomButton
  } });
