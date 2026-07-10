import React from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'react-native-gifted-charts';
import { Palette, FontFamily } from 'themes';
import { ThemedText, ThemedView } from 'components/base';
import { apiRequest } from 'utils/api/client';
import {
  buildChargingProfileChartData,
  chartColors,
  filterMobileChartSeries,
  mobileChartPresets,
  type ChartSeries,
  type MobileChartPreset,
  type TransactionDetail,
} from './charging-profile-chart.helpers';

interface ChargingProfileChartProps {
  compact?: boolean;
  fallbackEnergyKwh?: number;
  mobileCard?: boolean;
  showSummary?: boolean;
  transactionId?: string | null;
}

const formatNumber = (value?: number, digits = 2) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return value.toFixed(digits);
};

const mobileChartSurface = '#F6FBF8';
const mobileChartRule = '#DDEFE5';
const mobilePointerSurface = '#10291D';

const getSeriesUnit = (label: string) => {
  if (label === 'Power') return 'kW';
  if (label === 'SoC') return '%';
  if (label === 'Voltage' || label.startsWith('V ')) return 'V';
  return 'A';
};

export const ChargingProfileChart: React.FC<ChargingProfileChartProps> = ({
  compact = false,
  fallbackEnergyKwh,
  mobileCard = false,
  showSummary = false,
  transactionId,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const { data, isLoading, error } = useQuery({
    queryKey: ['transaction-detail', transactionId],
    queryFn: () => apiRequest<TransactionDetail>(`api/transactions/${transactionId}`, { service: 'hub' }),
    enabled: !!transactionId,
  });

  const chartData = buildChargingProfileChartData(data);

  if (!transactionId) {
    if (mobileCard) return <MobileChartState text='No transaction data' />;

    return (
      <ThemedView alignItems='center' flex={1} justifyContent='center' padding={'four'}>
        <ThemedText color={Palette.textSecondary}>No transaction ID available</ThemedText>
      </ThemedView>
    );
  }

  if (isLoading) {
    if (mobileCard) return <MobileChartSkeleton />;

    return (
      <ThemedView flex={1} gap={'three'} padding={compact ? 'two' : 'four'}>
        {showSummary && (
          <ThemedView flexDirection='row' gap={'two'}>
            <ThemedView borderRadius={'medium'} flex={1} height={54} loading />
            <ThemedView borderRadius={'medium'} flex={1} height={54} loading />
          </ThemedView>
        )}
        <ThemedView borderRadius={'large'} flex={1} loading minHeight={compact ? 160 : 180} />
        <ThemedView alignSelf='center' borderRadius={'pill'} height={18} loading width='62%' />
      </ThemedView>
    );
  }

  if (error || !chartData || (!chartData.dataSet1 && !chartData.dataSet2)) {
    if (mobileCard) return <MobileChartState text='No current data yet' />;

    return (
      <ThemedView alignItems='center' flex={1} justifyContent='center' padding={'four'}>
        <ThemedText color={Palette.textSecondary}>No profile data available</ThemedText>
      </ThemedView>
    );
  }

  const { dataSet1, dataSet2, hasPower, hasCurrent, hasVoltage } = chartData;

  if (mobileCard) {
    return <MobileElectricalChart chartData={chartData} width={Math.max(280, windowWidth - 64)} />;
  }

  const width = Math.max(260, windowWidth - (compact ? 88 : 64));
  const height = compact ? 158 : 180;

  return (
    <ThemedView flex={1} gap={compact ? 'two' : 'three'} padding={compact ? 'two' : 'two'}>
      <ThemedText fontFamily={FontFamily.semibold} fontSize={14} color={Palette.textPrimary}>
        Charging Profile
      </ThemedText>

      {showSummary && (
        <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
          <SummaryTile label='Energy' value={`${formatNumber(data?.totalEnergyKWh ?? fallbackEnergyKwh, 2)} kWh`} />
          <SummaryTile label='Avg Power' value={`${formatNumber(data?.avgPowerKW, 2)} kW`} />
          <SummaryTile label='Current L1' value={`${formatNumber(chartData.latestCurrent, 1)} A`} />
          <SummaryTile label='Start Meter' value={`${formatNumber(data?.startMeter ? data.startMeter / 1000 : undefined, 2)} kWh`} />
        </ThemedView>
      )}

      <ChartLegend compact={compact} hasCurrent={hasCurrent} hasPower={hasPower} hasVoltage={hasVoltage} />

      <ThemedView minHeight={height + 34} position='relative' justifyContent='center'>
        {dataSet1 && (
          <ThemedView position='absolute' top={0} left={0} right={0} bottom={0} zIndex={1}>
            <LineChart
              dataSet={dataSet1}
              width={width}
              height={height}
              thickness={2}
              dataPointsRadius={2}
              hideRules
              yAxisTextStyle={{ color: Palette.textTertiary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: Palette.textTertiary, fontSize: 10 }}
              spacing={Math.max((width - 40) / (dataSet1[0].data.length || 1), 5)}
              initialSpacing={0}
              yAxisColor={Palette.borderSubtle}
              xAxisColor={Palette.borderSubtle}
              color={chartColors.power}
            />
          </ThemedView>
        )}
        {dataSet2 && (
          <ThemedView position='absolute' top={0} left={0} right={0} bottom={0} zIndex={2} pointerEvents='none'>
            <LineChart
              dataSet={dataSet2}
              width={width}
              height={height}
              thickness={2}
              dataPointsRadius={2}
              hideRules
              hideDataPoints={!hasPower && !hasCurrent}
              hideYAxisText={false}
              yAxisSide={1}
              yAxisTextStyle={{ color: Palette.textTertiary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: 'transparent', fontSize: 10 }}
              spacing={Math.max((width - 40) / (dataSet2[0].data.length || 1), 5)}
              initialSpacing={0}
              yAxisColor='transparent'
              xAxisColor='transparent'
              hideAxesAndRules={true}
              color={chartColors.voltage}
            />
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
};

function MobileElectricalChart({ chartData, width }: { chartData: NonNullable<ReturnType<typeof buildChargingProfileChartData>>; width: number }) {
  const [preset, setPreset] = React.useState<MobileChartPreset>('current');
  const [focusedSeriesLabel, setFocusedSeriesLabel] = React.useState<string | null>(null);
  const presetSeries = filterMobileChartSeries(chartData.mobileSeries, preset);
  const availableSeries = presetSeries?.length ? presetSeries : chartData.mobileSeries;
  const focusedSeries = focusedSeriesLabel ? availableSeries.find(series => series.label === focusedSeriesLabel) : undefined;
  const visibleSeries = focusedSeries ? [focusedSeries] : availableSeries;
  const firstSeriesLength = visibleSeries[0]?.data.length || 0;
  const chartWidth = Math.max(240, width - 40);
  const chartHeight = width < 320 ? 142 : 158;
  const lineSeries = visibleSeries.map(series => ({
    ...series,
    dataPointsRadius: visibleSeries.length === 1 ? 2.6 : 2,
    hideDataPoints: visibleSeries.length > 1 || firstSeriesLength > 24,
    thickness: visibleSeries.length === 1 ? 3.2 : series.label === 'Current' || series.label === 'Power' ? 2.6 : 2.2,
  }));

  if (!visibleSeries.length) return <MobileChartState text='No current data yet' />;

  return (
    <ThemedView flex={1} gap={'two'} justifyContent='space-between' paddingHorizontal={'three'} paddingVertical={'two'}>
      <ThemedView gap={'one'}>
        <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={17}>
            Charging profile
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
            {chartData.latestLabel ? `Updated ${chartData.latestLabel}` : 'Live'}
          </ThemedText>
        </ThemedView>

        <ThemedView flexDirection='row' flexWrap='wrap' gap={'one'}>
          {mobileChartPresets.map(item => {
            const selected = item.value === preset;
            const hasData = item.value === 'all' || Boolean(filterMobileChartSeries(chartData.mobileSeries, item.value)?.length);

            return (
              <Pressable
                key={item.value}
                accessibilityRole='button'
                accessibilityState={{ disabled: !hasData, selected }}
                disabled={!hasData}
                hitSlop={4}
                onPress={event => {
                  event.stopPropagation();
                  setPreset(item.value);
                  setFocusedSeriesLabel(null);
                }}>
                <ThemedView
                  backgroundColor={selected ? '#EAF8EF' : Palette.surfaceMuted}
                  borderColor={selected ? '#BDE9CC' : Palette.borderSubtle}
                  borderRadius={'pill'}
                  borderWidth={1}
                  justifyContent='center'
                  minHeight={32}
                  opacity={hasData ? 1 : 0.45}
                  paddingHorizontal={'three'}>
                  <ThemedText color={selected ? Palette.accent : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={14}>
                    {item.label}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
        </ThemedView>
      </ThemedView>

      <ThemedView
        backgroundColor={mobileChartSurface}
        borderColor={mobileChartRule}
        borderRadius={'large'}
        borderWidth={1}
        minHeight={chartHeight + 52}
        overflow='hidden'
        paddingHorizontal={'two'}
        paddingTop={'three'}>
        <LineChart
          animateOnDataChange
          animateTogether
          dataSet={lineSeries}
          disableScroll={firstSeriesLength <= 18}
          endSpacing={12}
          height={chartHeight}
          hideDataPoints={visibleSeries.length > 1 || firstSeriesLength > 24}
          initialSpacing={4}
          noOfSections={5}
          onDataChangeAnimationDuration={350}
          pointerConfig={{
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerColor: Palette.accent,
            pointerLabelComponent: (items: ({ date?: string; label?: string; value?: number } | undefined)[]) => (
              <MobilePointerLabel items={items} series={visibleSeries} />
            ),
            pointerLabelHeight: Math.min(190, 48 + visibleSeries.length * 22),
            pointerLabelWidth: 156,
            pointerStripColor: '#9BCFB0',
            pointerStripUptoDataPoint: true,
            pointerStripWidth: 1.5,
            radius: 4,
            shiftPointerLabelX: -52,
            shiftPointerLabelY: -18,
            strokeDashArray: [3, 5],
          }}
          renderDataPointsAfterAnimationEnds
          rulesColor={mobileChartRule}
          rulesType='solid'
          showFractionalValues
          spacing={Math.max((chartWidth - 24) / Math.max(firstSeriesLength - 1, 1), 7)}
          thickness={2.6}
          width={chartWidth}
          xAxisColor={mobileChartRule}
          xAxisLabelTextStyle={{ color: Palette.textSecondary, fontSize: 10, fontFamily: FontFamily.medium }}
          yAxisColor='transparent'
          yAxisTextStyle={{ color: Palette.textSecondary, fontSize: 10, fontFamily: FontFamily.medium }}
        />
      </ThemedView>

      <MobileSeriesLegend focusedSeriesLabel={focusedSeriesLabel} onSelect={setFocusedSeriesLabel} series={availableSeries} />

      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
        Hold the chart for values · Tap a legend to isolate its line
      </ThemedText>
    </ThemedView>
  );
}

function MobilePointerLabel({ items, series }: { items: ({ date?: string; label?: string; value?: number } | undefined)[]; series: ChartSeries[] }) {
  const visibleItems = items.filter((item): item is { date?: string; label?: string; value?: number } => Boolean(item)).slice(0, 7);
  const label = visibleItems[0]?.date || visibleItems[0]?.label || 'Live';
  const overflowCount = Math.max(0, items.length - visibleItems.length);

  return (
    <ThemedView backgroundColor={mobilePointerSurface} borderRadius={'medium'} gap={3} paddingHorizontal={'two'} paddingVertical={'two'} width={156}>
      <ThemedText color='#B7E5C9' fontFamily={FontFamily.semibold} fontSize={10} lineHeight={13} numberOfLines={1}>
        {label}
      </ThemedText>
      {visibleItems.map((item, index) => (
        <ThemedView key={series[index]?.label || item.date || item.label} alignItems='center' flexDirection='row' justifyContent='space-between' gap={'two'}>
          <ThemedView alignItems='center' flexDirection='row' flexShrink={1} gap={'one'}>
            <ThemedView backgroundColor={series[index]?.color || Palette.accent} borderRadius={'pill'} height={3} width={12} />
            <ThemedText color='#D7F5E2' flexShrink={1} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13} numberOfLines={1}>
              {series[index]?.label || item.label || 'Series'}
            </ThemedText>
          </ThemedView>
          <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={11} lineHeight={14} numberOfLines={1}>
            {formatNumber(item.value, 1)} {getSeriesUnit(series[index]?.label || '')}
          </ThemedText>
        </ThemedView>
      ))}
      {overflowCount > 0 ? (
        <ThemedText color='#B7E5C9' fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
          +{overflowCount} more
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

function MobileSeriesLegend({
  focusedSeriesLabel,
  onSelect,
  series,
}: {
  focusedSeriesLabel: string | null;
  onSelect: (label: string | null) => void;
  series: ChartSeries[];
}) {
  return (
    <ThemedView flexDirection='row' flexWrap='wrap' gap={'one'}>
      {focusedSeriesLabel ? (
        <Pressable
          accessibilityLabel='Show all lines'
          accessibilityRole='button'
          hitSlop={4}
          onPress={event => {
            event.stopPropagation();
            onSelect(null);
          }}>
          <ThemedView
            alignItems='center'
            backgroundColor='#EAF8EF'
            borderColor='#BDE9CC'
            borderRadius={'pill'}
            borderWidth={1}
            justifyContent='center'
            minHeight={30}
            paddingHorizontal={'two'}>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={13}>
              All lines
            </ThemedText>
          </ThemedView>
        </Pressable>
      ) : null}
      {series.map(item => {
        const selected = item.label === focusedSeriesLabel;

        return (
          <Pressable
            key={item.label}
            accessibilityLabel={`${selected ? 'Selected' : 'Show'} ${item.label} line`}
            accessibilityRole='button'
            accessibilityState={{ selected }}
            hitSlop={4}
            onPress={event => {
              event.stopPropagation();
              onSelect(selected ? null : item.label);
            }}>
            <ThemedView
              alignItems='center'
              backgroundColor={selected ? Palette.surfaceMuted : Palette.surfaceBase}
              borderColor={selected ? item.color : Palette.borderSubtle}
              borderRadius={'pill'}
              borderWidth={1}
              flexDirection='row'
              gap={'one'}
              justifyContent='center'
              minHeight={30}
              paddingHorizontal={'two'}>
              <ThemedView backgroundColor={item.color} borderRadius={'pill'} height={4} width={16} />
              <ThemedText color={selected ? Palette.textPrimary : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={13}>
                {item.label} · {getSeriesUnit(item.label)}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

function MobileChartSkeleton() {
  return (
    <ThemedView flex={1} gap={'three'} padding={'three'}>
      <ThemedView flexDirection='row' gap={'two'}>
        <ThemedView borderRadius={'pill'} flex={1} height={30} loading />
        <ThemedView borderRadius={'pill'} width={76} height={30} loading />
      </ThemedView>
      <ThemedView borderRadius={'large'} flex={1} loading minHeight={132} />
    </ThemedView>
  );
}

function MobileChartState({ text }: { text: string }) {
  return (
    <ThemedView alignItems='center' flex={1} justifyContent='center' padding={'three'}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16} textAlign='center'>
        {text}
      </ThemedText>
    </ThemedView>
  );
}

function ChartLegend({ compact, hasCurrent, hasPower, hasVoltage }: { compact: boolean; hasCurrent: boolean; hasPower: boolean; hasVoltage: boolean }) {
  return (
    <ThemedView flexDirection='row' flexWrap='wrap' gap={10} justifyContent='center' marginBottom={compact ? 8 : 16}>
      {hasPower && (
        <ThemedView alignItems='center' flexDirection='row' gap={4}>
          <ThemedView width={12} height={12} backgroundColor={chartColors.power} borderRadius={2} />
          <ThemedText fontSize={10} color={Palette.textSecondary}>
            Power (kW)
          </ThemedText>
        </ThemedView>
      )}
      {hasCurrent && (
        <ThemedView alignItems='center' flexDirection='row' gap={4}>
          <ThemedView width={12} height={12} backgroundColor={chartColors.current} borderRadius={2} />
          <ThemedText fontSize={10} color={Palette.textSecondary}>
            Current L1(A)
          </ThemedText>
        </ThemedView>
      )}
      {hasVoltage && (
        <ThemedView alignItems='center' flexDirection='row' gap={4}>
          <ThemedView width={12} height={12} backgroundColor={chartColors.voltage} borderRadius={2} />
          <ThemedText fontSize={10} color={Palette.textSecondary}>
            Voltage (V)
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView
      backgroundColor={Palette.surfaceMuted}
      borderColor={Palette.borderSubtle}
      borderRadius={'medium'}
      borderWidth={1}
      flexGrow={1}
      minWidth='47%'
      paddingHorizontal={'two'}
      paddingVertical={'two'}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19} numberOfLines={1}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}
