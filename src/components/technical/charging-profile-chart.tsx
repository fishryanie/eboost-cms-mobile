import React from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LineChart, type CartesianChartTheme, type LineChartSeries } from 'react-native-chart-kit/v2';
import { Palette, FontFamily } from 'themes';
import { ThemedText, ThemedView } from 'components/base';
import { apiRequest } from 'utils/api/client';
import {
  buildChargingProfileChartData,
  buildMobileChartAxisDomains,
  chartColors,
  defaultMobileChartPreset,
  filterMobileChartSeries,
  getMobileChartAxisTicks,
  mobileChartPresets,
  normalizeMobileChartValue,
  type ChartAxis,
  type ChartAxisDomains,
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

const mobileChartRule = '#E8EDF2';
const chartAxisOrder: ChartAxis[] = ['electrical', 'soc', 'voltage'];
const chartAxisShortLabels: Record<ChartAxis, string> = {
  electrical: 'A/kW',
  soc: 'SoC',
  voltage: 'V',
};

type ChartKitRow = {
  [key: string]: Date | number | string;
  time: Date | number;
};

const desktopChartTheme: CartesianChartTheme = {
  axis: Palette.borderSubtle,
  background: 'transparent',
  grid: Palette.borderSubtle,
  mutedText: Palette.textTertiary,
  plotBackground: 'transparent',
  text: Palette.textTertiary,
  tooltip: {
    background: Palette.surfaceRaised,
    border: Palette.borderSubtle,
    mutedText: Palette.textSecondary,
    text: Palette.textPrimary,
  },
  typography: { axisLabelSize: 10, fontFamily: FontFamily.medium },
};

const overlayChartTheme: CartesianChartTheme = {
  ...desktopChartTheme,
  axis: 'transparent',
  grid: 'transparent',
  mutedText: 'transparent',
  text: 'transparent',
};

const mobileChartTheme: CartesianChartTheme = {
  ...desktopChartTheme,
  axis: mobileChartRule,
  background: 'transparent',
  grid: mobileChartRule,
  mutedText: Palette.textSecondary,
  plotBackground: 'transparent',
  text: Palette.textSecondary,
  tooltip: {
    background: '#10291D',
    border: '#28573F',
    borderRadius: 12,
    labelFontSize: 10,
    mutedText: '#B7E5C9',
    text: '#FFFFFF',
  },
};

const mobileChartCrosshair = { color: '#94A3B8', opacity: 0.8, strokeDasharray: [3, 4], strokeWidth: 1.2 } as const;

function buildLineChartKitData(source: ChartSeries[], domains?: ChartAxisDomains) {
  const pointCount = Math.max(...source.map(item => item.data.length), 0);
  const data: ChartKitRow[] = Array.from({ length: pointCount }, (_, pointIndex) => {
    const referencePoint = source.find(item => item.data[pointIndex])?.data[pointIndex];
    const row: ChartKitRow = {
      time: referencePoint?.timestamp !== undefined ? new Date(referencePoint.timestamp) : pointIndex + 1,
    };

    source.forEach((item, seriesIndex) => {
      const rawValue = item.data[pointIndex]?.value ?? 0;
      row[`series${seriesIndex}`] = domains ? normalizeMobileChartValue(rawValue, domains[item.axis]) : rawValue;
    });

    return row;
  });
  const series: LineChartSeries<ChartKitRow>[] = source.map((item, seriesIndex) => ({
    color: item.color,
    key: item.label,
    label: `${item.label} (${item.unit})`,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: source.length === 1 ? 2.8 : item.label === 'Current' || item.label === 'Power' ? 2.5 : 2,
    yKey: `series${seriesIndex}`,
  }));

  return { data, series };
}

const formatChartAxisValue = (value: number) => formatNumber(value, Math.abs(value - Math.round(value)) < 0.01 ? 0 : 1);
const formatChartTime = (value: Date | number | string) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return String(value);
  return `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`;
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
    return <MobileElectricalChart chartData={chartData} width={Math.max(300, windowWidth - 32)} />;
  }

  const width = Math.max(260, windowWidth - (compact ? 88 : 64));
  const height = compact ? 158 : 180;
  const primaryChart = dataSet1 ? buildLineChartKitData(dataSet1) : undefined;
  const voltageChart = dataSet2 ? buildLineChartKitData(dataSet2) : undefined;

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
        {primaryChart && (
          <ThemedView position='absolute' top={0} left={0} right={0} bottom={0} zIndex={1}>
            <LineChart
              accessibilityLabel='Charging profile power and current chart'
              curve='linear'
              data={primaryChart.data}
              height={height}
              formatYLabel={formatChartAxisValue}
              labelStrategy='auto'
              series={primaryChart.series}
              showDots={false}
              showHorizontalGridLines={false}
              showVerticalGridLines={false}
              theme={desktopChartTheme}
              width={width}
              xKey='time'
              yAxisLabelWidth={40}
              yDomain={{ includeZero: true, nice: true }}
            />
          </ThemedView>
        )}
        {voltageChart && (
          <ThemedView position='absolute' top={0} left={0} right={0} bottom={0} zIndex={2} pointerEvents='none'>
            <LineChart
              accessibilityLabel='Charging profile voltage chart'
              curve='linear'
              data={voltageChart.data}
              height={height}
              labelStrategy='hide'
              series={voltageChart.series}
              showDots={false}
              showHorizontalGridLines={false}
              showVerticalGridLines={false}
              theme={overlayChartTheme}
              width={width}
              xKey='time'
              yAxisLabelWidth={40}
              yDomain={{ includeZero: true, nice: true }}
            />
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
};

function MobileElectricalChart({ chartData, width }: { chartData: NonNullable<ReturnType<typeof buildChargingProfileChartData>>; width: number }) {
  const [preset, setPreset] = React.useState<MobileChartPreset>(defaultMobileChartPreset);
  const [focusedSeriesLabel, setFocusedSeriesLabel] = React.useState<string | null>(null);
  const [selection, setSelection] = React.useState<{ index: number; x: number } | null>(null);
  const presetSeries = filterMobileChartSeries(chartData.mobileSeries, preset);
  const availableSeries = presetSeries?.length ? presetSeries : chartData.mobileSeries;
  const focusedSeries = focusedSeriesLabel ? availableSeries.find(series => series.label === focusedSeriesLabel) : undefined;
  const visibleSeries = focusedSeries ? [focusedSeries] : availableSeries;
  const pointCount = Math.max(...visibleSeries.map(item => item.data.length), 0);
  const activeAxes = chartAxisOrder.filter(axis => visibleSeries.some(series => series.axis === axis));
  const primaryAxis = activeAxes[0];
  const secondaryAxes = activeAxes.slice(1);
  const axisDomains = buildMobileChartAxisDomains(visibleSeries);
  const chart = buildLineChartKitData(visibleSeries, axisDomains);
  const chartContentWidth = Math.max(280, width);
  const secondaryAxisWidth = width < 350 ? 32 : 36;
  const plotWidth = chartContentWidth - secondaryAxes.length * secondaryAxisWidth;
  const chartHeight = width < 340 ? 176 : 188;
  const showDots = pointCount <= 18 && visibleSeries.length <= 6;
  const chartAccessibilityLabel = `Full-session charging profile overview showing ${visibleSeries.map(series => series.label).join(', ')}`;

  if (!visibleSeries.length || !primaryAxis) return <MobileChartState text='No current data yet' />;

  return (
    <ThemedView backgroundColor='transparent' flex={1} gap={'two'} paddingHorizontal={'three'} paddingVertical={'two'}>
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
                  setSelection(null);
                }}>
                <ThemedView
                  backgroundColor={selected ? '#EAF8EF' : Palette.surfaceMuted}
                  borderColor={selected ? '#BDE9CC' : Palette.borderSubtle}
                  borderRadius={'pill'}
                  borderWidth={1}
                  justifyContent='center'
                  minHeight={30}
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

      <MobileSeriesLegend
        focusedSeriesLabel={focusedSeriesLabel}
        onSelect={label => {
          setFocusedSeriesLabel(label);
          setSelection(null);
        }}
        series={availableSeries}
      />

      <ThemedView backgroundColor='transparent' marginHorizontal={-12} minHeight={chartHeight + 24} overflow='hidden'>
        <MobileAxisHeaders primaryAxis={primaryAxis} secondaryAxes={secondaryAxes} series={visibleSeries} secondaryAxisWidth={secondaryAxisWidth} />

        <ThemedView backgroundColor='transparent' flexDirection='row' height={chartHeight}>
          <ThemedView backgroundColor='transparent' height={chartHeight} position='relative' width={plotWidth}>
            <MobilePrimaryAxisGrid axis={primaryAxis} domain={axisDomains[primaryAxis]} height={chartHeight} />
            <LineChart
              accessibilityLabel={chartAccessibilityLabel}
              activeDot={{ fill: '#FFFFFF', radius: 4.2, stroke: 'series', strokeWidth: 2.2 }}
              crosshair={mobileChartCrosshair}
              curve='linear'
              data={chart.data}
              decimation='auto'
              dots={{ fill: '#FFFFFF', radius: 2.4, stroke: 'series', strokeWidth: 1.5 }}
              edgeLabelPolicy='hide'
              formatXLabel={formatChartTime}
              formatYLabel={() => ''}
              height={chartHeight}
              interaction={{
                deselectOnOutsidePress: true,
                mode: 'scrub',
                onDeselect: () => setSelection(null),
                onSelect: event => setSelection({ index: event.index, x: event.position.x }),
                selectionPersistence: 'whileActive',
              }}
              labelMinGap={30}
              labelStrategy='skip'
              legend={false}
              scrollable={false}
              selectedIndex={selection?.index}
              series={chart.series}
              showDots={showDots}
              showHorizontalGridLines={false}
              showVerticalGridLines={false}
              theme={mobileChartTheme}
              tooltip={false}
              width={plotWidth}
              xKey='time'
              yAxisLabelWidth={34}
              yDomain={[0, 1]}
            />

            {selection ? <MobileChartSelection plotWidth={plotWidth} selection={selection} series={visibleSeries} /> : null}
          </ThemedView>

          {secondaryAxes.map(axis => (
            <MobileAxisColumn key={axis} axis={axis} domain={axisDomains[axis]} height={chartHeight} width={secondaryAxisWidth} />
          ))}
        </ThemedView>
      </ThemedView>

      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={13} textAlign='center'>
        Full-session overview · Drag for values
      </ThemedText>
    </ThemedView>
  );
}

function getMobileAxisTitle(axis: ChartAxis, series: ChartSeries[]) {
  if (axis === 'electrical') {
    const axisSeries = series.filter(item => item.axis === axis);
    const hasPower = axisSeries.some(item => item.unit === 'kW');
    const hasCurrent = axisSeries.some(item => item.unit === 'A');
    if (hasPower && hasCurrent) return 'Power (kW) · Current (A)';
    return hasPower ? 'Power (kW)' : 'Current (A)';
  }

  return axis === 'soc' ? 'SoC (%)' : 'Voltage (V)';
}

function MobileAxisHeaders({
  primaryAxis,
  secondaryAxes,
  secondaryAxisWidth,
  series,
}: {
  primaryAxis: ChartAxis;
  secondaryAxes: ChartAxis[];
  secondaryAxisWidth: number;
  series: ChartSeries[];
}) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' minHeight={24} paddingLeft={'three'}>
      <ThemedText color={Palette.textTertiary} flex={1} fontFamily={FontFamily.semibold} fontSize={9} letterSpacing={0.2} lineHeight={12} numberOfLines={1}>
        {getMobileAxisTitle(primaryAxis, series)}
      </ThemedText>
      {secondaryAxes.map(axis => (
        <ThemedText
          key={axis}
          color={series.find(item => item.axis === axis)?.color ?? Palette.textSecondary}
          fontFamily={FontFamily.bold}
          fontSize={8}
          letterSpacing={0.3}
          lineHeight={12}
          textAlign='center'
          width={secondaryAxisWidth}>
          {chartAxisShortLabels[axis]}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

function MobileAxisColumn({ axis, domain, height, width }: { axis: ChartAxis; domain: readonly [number, number]; height: number; width: number }) {
  return (
    <ThemedView backgroundColor='transparent' height={height} justifyContent='space-between' paddingBottom={31} paddingTop={14} width={width}>
      {getMobileChartAxisTicks(domain).map(tick => (
        <ThemedText key={`${axis}-${tick}`} color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={10} textAlign='center'>
          {formatChartAxisValue(tick)}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

function MobilePrimaryAxisGrid({ axis, domain, height }: { axis: ChartAxis; domain: readonly [number, number]; height: number }) {
  const ticks = getMobileChartAxisTicks(domain, axis === 'electrical' ? 6 : 5);
  const plotTop = 16;
  const plotBottom = 32;
  const plotHeight = height - plotTop - plotBottom;

  return (
    <ThemedView backgroundColor='transparent' bottom={0} left={0} pointerEvents='none' position='absolute' right={0} top={0} zIndex={0}>
      <ThemedView backgroundColor='transparent' bottom={plotBottom} left={40} position='absolute' right={8} top={plotTop}>
        {[0, 1, 2, 3, 4].map(index => (
          <ThemedView
            key={`time-grid-${index}`}
            backgroundColor={mobileChartRule}
            bottom={0}
            left={`${index * 25}%`}
            opacity={index === 0 || index === 4 ? 0.45 : 0.62}
            position='absolute'
            top={0}
            width={1}
          />
        ))}
      </ThemedView>
      {ticks.map((tick, index) => {
        const y = plotTop + (plotHeight * index) / Math.max(1, ticks.length - 1);

        return (
          <React.Fragment key={`primary-${tick}`}>
            <ThemedView backgroundColor={mobileChartRule} height={1} left={40} opacity={0.72} position='absolute' right={8} top={y} />
            <ThemedText
              color={Palette.textTertiary}
              fontFamily={FontFamily.medium}
              fontSize={9}
              left={0}
              lineHeight={10}
              position='absolute'
              textAlign='right'
              top={y - 5}
              width={32}>
              {formatChartAxisValue(tick)}
            </ThemedText>
          </React.Fragment>
        );
      })}
    </ThemedView>
  );
}

function MobileChartSelection({ plotWidth, selection, series }: { plotWidth: number; selection: { index: number; x: number }; series: ChartSeries[] }) {
  const selectedSeries = series.filter(item => item.data[selection.index]).slice(0, 5);
  const point = selectedSeries[0]?.data[selection.index];
  const tooltipWidth = 150;
  const left = selection.x < plotWidth / 2 ? Math.max(38, plotWidth - tooltipWidth - 6) : 38;

  if (!point) return null;

  return (
    <ThemedView
      backgroundColor='#FFFFFF'
      borderColor={Palette.borderSubtle}
      borderRadius={'medium'}
      borderWidth={1}
      boxShadow='0 4px 14px rgba(15, 23, 42, 0.14)'
      gap={2}
      left={left}
      paddingHorizontal={'two'}
      paddingVertical={'one'}
      pointerEvents='none'
      position='absolute'
      top={8}
      width={tooltipWidth}
      zIndex={4}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={10} lineHeight={13}>
        {point.date || point.label || 'Selected point'}
      </ThemedText>
      {selectedSeries.map(item => (
        <ThemedView key={item.label} alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
          <ThemedView backgroundColor={item.color} borderRadius={'pill'} height={3} width={12} />
          <ThemedText color={Palette.textSecondary} flex={1} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12} numberOfLines={1}>
            {item.label}
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={9} lineHeight={12}>
            {formatNumber(item.data[selection.index]?.value, item.unit === '%' || item.unit === 'V' ? 0 : 1)} {item.unit}
          </ThemedText>
        </ThemedView>
      ))}
      {series.length > selectedSeries.length ? (
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={8} lineHeight={10}>
          +{series.length - selectedSeries.length} more lines
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
    <ThemedView alignItems='center' flexDirection='row' flexWrap='wrap' gap={4}>
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
            backgroundColor={Palette.surfaceMuted}
            borderRadius={'small'}
            justifyContent='center'
            minHeight={24}
            paddingHorizontal={'one'}>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={13}>
              Show all
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
              backgroundColor={selected ? Palette.surfaceMuted : 'transparent'}
              borderRadius={'small'}
              flexDirection='row'
              gap={4}
              justifyContent='center'
              minHeight={24}
              opacity={focusedSeriesLabel && !selected ? 0.38 : 1}
              paddingHorizontal={'one'}>
              <ThemedView backgroundColor={item.color} borderRadius={'pill'} height={3} width={12} />
              <ThemedText color={selected ? Palette.textPrimary : Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
                {item.label} ({item.unit})
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
