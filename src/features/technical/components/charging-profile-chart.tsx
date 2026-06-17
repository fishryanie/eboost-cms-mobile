import React, { useMemo } from 'react';
import { ActivityIndicator, Dimensions, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'react-native-gifted-charts';
import { Palette, Radius, Spacing, FontFamily } from 'themes';
import { ThemedText, ThemedView } from 'components/base';
import { fetchTransactionDetail } from '../technical-service';

interface ChargingProfileChartProps {
  transactionId?: string | null;
}

export const ChargingProfileChart: React.FC<ChargingProfileChartProps> = ({ transactionId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transaction-detail', transactionId],
    queryFn: () => fetchTransactionDetail(transactionId as string),
    enabled: !!transactionId,
  });

  const chartData = useMemo(() => {
    if (!data || !data.meterValues || data.meterValues.length === 0) return null;

    const meterValues = data.meterValues;

    // We'll limit the number of labels shown on the X-axis so it doesn't overlap
    const step = Math.max(1, Math.floor(meterValues.length / 8));

    const getVal = (m: any, measurand: string, phase?: string) => {
      const sample = m.sampledValues?.find((s: any) => s.measurand === measurand && (phase ? s.phase === phase : !s.phase));
      return sample ? parseFloat(sample.value) : 0;
    };

    const powerData: any[] = [];
    const currentData: any[] = [];
    const voltageData: any[] = [];

    let hasPower = false;
    let hasCurrent = false;
    let hasVoltage = false;

    meterValues.forEach((m: any, index: number) => {
      const date = new Date(m.timestamp);
      const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const showLabel = index % step === 0;

      const pVal = getVal(m, 'Power.Active.Import') / 1000;
      if (pVal > 0) hasPower = true;
      powerData.push({
        value: pVal,
        label: showLabel ? label : '',
        labelTextStyle: { color: Palette.textTertiary, fontSize: 10, fontFamily: FontFamily.regular },
      });

      const cL1 = getVal(m, 'Current.Import', 'L1');
      const cTotal = getVal(m, 'Current.Import');
      const cVal = cL1 || cTotal; // Prefer L1 if exists, otherwise total
      if (cVal > 0) hasCurrent = true;
      currentData.push({ value: cVal });

      const vL1 = getVal(m, 'Voltage', 'L1');
      const vTotal = getVal(m, 'Voltage');
      const vVal = vL1 || vTotal;
      if (vVal > 0) hasVoltage = true;
      voltageData.push({ value: vVal });
    });

    const dataSet1 = [];
    if (hasPower) dataSet1.push({ data: powerData, color: '#00b96b', dataPointsColor: '#00b96b', startFillColor: '#00b96b', endFillColor: '#00b96b' });
    if (hasCurrent) dataSet1.push({ data: currentData, color: '#ff9c3a', dataPointsColor: '#ff9c3a', startFillColor: '#ff9c3a', endFillColor: '#ff9c3a' });

    const dataSet2 = [];
    if (hasVoltage) dataSet2.push({ data: voltageData, color: '#ff4d4f', dataPointsColor: '#ff4d4f', startFillColor: '#ff4d4f', endFillColor: '#ff4d4f' });

    return {
      dataSet1: dataSet1.length > 0 ? dataSet1 : undefined,
      dataSet2: dataSet2.length > 0 ? dataSet2 : undefined,
      hasPower,
      hasCurrent,
      hasVoltage,
    };
  }, [data]);

  if (!transactionId) {
    return (
      <ThemedView alignItems="center" flex={1} justifyContent="center" padding={Spacing.four}>
        <ThemedText color={Palette.textSecondary}>No transaction ID available</ThemedText>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView alignItems="center" flex={1} justifyContent="center" padding={Spacing.four}>
        <ActivityIndicator color={Palette.accent} size="large" />
      </ThemedView>
    );
  }

  if (error || !chartData || (!chartData.dataSet1 && !chartData.dataSet2)) {
    return (
      <ThemedView alignItems="center" flex={1} justifyContent="center" padding={Spacing.four}>
        <ThemedText color={Palette.textSecondary}>No profile data available</ThemedText>
      </ThemedView>
    );
  }

  const { dataSet1, dataSet2, hasPower, hasCurrent, hasVoltage } = chartData;

  const width = Dimensions.get('window').width - 64; // Adjust based on padding
  
  // Custom legend
  const renderLegend = () => {
    return (
      <ThemedView flexDirection="row" flexWrap="wrap" gap={12} justifyContent="center" marginBottom={16}>
        {hasPower && (
          <ThemedView alignItems="center" flexDirection="row" gap={4}>
            <View style={{ width: 12, height: 12, backgroundColor: '#00b96b', borderRadius: 2 }} />
            <ThemedText fontSize={10} color={Palette.textSecondary}>Power (kW)</ThemedText>
          </ThemedView>
        )}
        {hasCurrent && (
          <ThemedView alignItems="center" flexDirection="row" gap={4}>
            <View style={{ width: 12, height: 12, backgroundColor: '#ff9c3a', borderRadius: 2 }} />
            <ThemedText fontSize={10} color={Palette.textSecondary}>Current (A)</ThemedText>
          </ThemedView>
        )}
        {hasVoltage && (
          <ThemedView alignItems="center" flexDirection="row" gap={4}>
            <View style={{ width: 12, height: 12, backgroundColor: '#ff4d4f', borderRadius: 2 }} />
            <ThemedText fontSize={10} color={Palette.textSecondary}>Voltage (V)</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    );
  };

  return (
    <ThemedView flex={1} padding={Spacing.two}>
      <ThemedText fontFamily={FontFamily.semibold} fontSize={14} marginBottom={12} color={Palette.textPrimary}>
        Charging Profile
      </ThemedText>
      
      {renderLegend()}
      
      <ThemedView flex={1} position="relative" justifyContent="center">
        {dataSet1 && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
            <LineChart
              dataSet={dataSet1}
              width={width}
              height={180}
              thickness={2}
              dataPointsRadius={2}
              hideRules
              yAxisTextStyle={{ color: Palette.textTertiary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: Palette.textTertiary, fontSize: 10 }}
              spacing={Math.max((width - 40) / (dataSet1[0].data.length || 1), 5)}
              initialSpacing={0}
              yAxisColor={Palette.borderSubtle}
              xAxisColor={Palette.borderSubtle}
              color="#00b96b"
            />
          </View>
        )}
        {dataSet2 && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} pointerEvents="none">
            <LineChart
              dataSet={dataSet2}
              width={width}
              height={180}
              thickness={2}
              dataPointsRadius={2}
              hideRules
              hideDataPoints={!hasPower && !hasCurrent} // hide if only one dataset to prevent duplicate points?
              hideYAxisText={false}
              yAxisSide={1} // right side
              yAxisTextStyle={{ color: Palette.textTertiary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: 'transparent', fontSize: 10 }} // Hide X labels for second chart
              spacing={Math.max((width - 40) / (dataSet2[0].data.length || 1), 5)}
              initialSpacing={0}
              yAxisColor="transparent" // Hide axis line
              xAxisColor="transparent"
              hideAxesAndRules={true}
              color="#ff4d4f"
            />
          </View>
        )}
      </ThemedView>
    </ThemedView>
  );
};
