import { useState } from 'react';
import { Pressable } from 'react-native';
import { AreaChart, type CartesianChartTheme, type LineChartSeries } from 'react-native-chart-kit/v2';
import { RefreshCw } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { useUserActivityTrend } from '../hooks';
import type { UserActivityTrendPoint } from '../user-service';
import { SectionHeading, SurfaceCard } from './user-profile-common';

const activityColor = Palette.accent;
const activitySurface = '#EAF3EE';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const integerFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

const activityChartTheme: CartesianChartTheme = {
  axis: '#D9DEE5',
  background: 'transparent',
  grid: '#E9EDF2',
  mutedText: '#8E8E93',
  plotBackground: 'transparent',
  text: '#636366',
  tooltip: {
    background: '#1C1C1E',
    border: '#3A3A3C',
    borderRadius: 12,
    labelFontSize: 10,
    mutedText: '#AEAEB2',
    text: '#FFFFFF',
  },
  typography: { axisLabelSize: 9, fontFamily: FontFamily.medium },
};

type ActivityMetric = 'energy' | 'sessions';

type ActivityChartRow = {
  day: number;
  energyValue: number;
  sessionValue: number;
};

export function UserProfileActivityChart({ userId }: { userId: number | string }) {
  const [range] = useState(getCurrentMonthRange);
  const [metric, setMetric] = useState<ActivityMetric>('energy');
  const [chartWidth, setChartWidth] = useState(0);
  const query = useUserActivityTrend(userId, range.startDate, range.endDate);
  const chart = buildActivityChart(query.data || [], range.daysInMonth);
  const isEnergy = metric === 'energy';
  const activeColor = activityColor;
  const activeTotal = isEnergy ? chart.totalEnergy : chart.totalSessions;
  const activeUnit = isEnergy ? 'kWh' : 'sessions';
  const yKey: keyof ActivityChartRow & string = isEnergy ? 'energyValue' : 'sessionValue';
  const series: LineChartSeries<ActivityChartRow>[] = [
    {
      areaFill: {
        fromColor: activeColor,
        fromOpacity: 0.28,
        toColor: activeColor,
        toOpacity: 0.015,
      },
      color: activeColor,
      key: metric,
      label: isEnergy ? 'Energy' : 'Charging sessions',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: 2.6,
      yKey,
    },
  ];

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading eyebrow='Activity' subtitle={range.label} title='Monthly trend' />
      <SurfaceCard>
        {query.isLoading ? (
          <ActivityChartSkeleton />
        ) : query.isError ? (
          <ActivityChartError onRetry={() => void query.refetch()} />
        ) : (
          <ThemedView backgroundColor='transparent' gap={'four'}>
            <ThemedView
              alignItems='stretch'
              backgroundColor={Palette.surfaceMuted}
              borderCurve='continuous'
              borderRadius={14}
              flexDirection='row'
              gap={4}
              minHeight={76}
              padding={4}>
              <MetricSwitch
                color={activityColor}
                label='Energy'
                onPress={() => setMetric('energy')}
                selected={isEnergy}
                surface={activitySurface}
                value={`${formatChartNumber(chart.totalEnergy, 1)} kWh`}
              />
              <MetricSwitch
                color={activityColor}
                label='Charging sessions'
                onPress={() => setMetric('sessions')}
                selected={!isEnergy}
                surface={activitySurface}
                value={formatChartNumber(chart.totalSessions, 0)}
              />
            </ThemedView>

            <ThemedView
              backgroundColor='transparent'
              minHeight={212}
              onLayout={event => {
                const nextWidth = Math.floor(event.nativeEvent.layout.width);
                setChartWidth(current => (current === nextWidth ? current : nextWidth));
              }}>
              {chartWidth > 0 ? (
                <AreaChart
                  accessibilityLabel={`${isEnergy ? 'Daily energy' : 'Daily charging sessions'} for ${range.label}: ${formatChartNumber(activeTotal, isEnergy ? 1 : 0)} ${activeUnit}`}
                  activeDot={{ fill: '#FFFFFF', radius: 4.2, stroke: activeColor, strokeWidth: 2.4 }}
                  crosshair={{ color: activeColor, opacity: 0.35, strokeDasharray: [3, 4], strokeWidth: 1 }}
                  curve='monotone'
                  data={chart.rows}
                  decimation='auto'
                  edgeLabelPolicy='shift'
                  formatXLabel={value => String(value)}
                  formatYLabel={value => formatAxisValue(Number(value), isEnergy)}
                  height={212}
                  interaction='scrub'
                  labelMinGap={30}
                  labelStrategy='skip'
                  legend={false}
                  series={series}
                  showDots={false}
                  showHorizontalGridLines
                  showVerticalGridLines={false}
                  theme={activityChartTheme}
                  tooltip
                  width={chartWidth}
                  xKey='day'
                  yAxisLabelWidth='stable'
                  yDomain={{ includeZero: true, nice: true }}
                />
              ) : null}
            </ThemedView>

            {!chart.hasActivity ? (
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} textAlign='center'>
                No charging activity recorded this month.
              </ThemedText>
            ) : (
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} textAlign='center'>
                Touch and drag across the chart for daily values.
              </ThemedText>
            )}
          </ThemedView>
        )}
      </SurfaceCard>
    </ThemedView>
  );
}

function MetricSwitch({
  color,
  label,
  onPress,
  selected,
  surface,
  value,
}: {
  color: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  surface: string;
  value: string;
}) {
  return (
    <Pressable accessibilityRole='button' accessibilityState={{ selected }} onPress={onPress} style={{ alignSelf: 'stretch', flex: 1, minHeight: 68 }}>
      <ThemedView
        backgroundColor={selected ? Palette.surfaceRaised : 'transparent'}
        borderColor={selected ? Palette.borderSubtle : 'transparent'}
        borderCurve='continuous'
        borderRadius={11}
        borderWidth={1}
        gap={'two'}
        minHeight={68}
        paddingHorizontal={'three'}
        paddingVertical={'two'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
          <ThemedView alignItems='center' backgroundColor={surface} borderRadius={'pill'} height={18} justifyContent='center' width={18}>
            <ThemedView backgroundColor={color} borderRadius={'pill'} height={7} width={7} />
          </ThemedView>
          <ThemedText color={selected ? Palette.textPrimary : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={9} numberOfLines={1}>
            {label}
          </ThemedText>
        </ThemedView>
        <ThemedText color={selected ? color : Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={14} numberOfLines={1} selectable>
          {value}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function buildActivityChart(points: UserActivityTrendPoint[], daysInMonth: number) {
  const valuesByDay = new Map<number, { energy: number; sessions: number }>();

  points.forEach(point => {
    const day = getPointDay(point);
    if (!day || day > daysInMonth) return;
    const current = valuesByDay.get(day) || { energy: 0, sessions: 0 };
    valuesByDay.set(day, {
      energy: current.energy + getPointValue(point.energy_kwh, point.total_energy_kwh),
      sessions: current.sessions + getPointValue(point.orders, point.total_orders),
    });
  });

  const rows = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const value = valuesByDay.get(day) || { energy: 0, sessions: 0 };
    return { day, energyValue: value.energy, sessionValue: value.sessions };
  });
  const totalEnergy = rows.reduce((sum, item) => sum + item.energyValue, 0);
  const totalSessions = rows.reduce((sum, item) => sum + item.sessionValue, 0);

  return { hasActivity: totalEnergy > 0 || totalSessions > 0, rows, totalEnergy, totalSessions };
}

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const month = String(monthIndex + 1).padStart(2, '0');
  return {
    daysInMonth,
    endDate: `${year}-${month}-${String(daysInMonth).padStart(2, '0')}`,
    label: monthFormatter.format(now),
    startDate: `${year}-${month}-01`,
  };
}

function getPointDay(point: UserActivityTrendPoint) {
  const raw = point.time || point.date;
  if (!raw) return undefined;
  const isoDay = raw.match(/^\d{4}-\d{2}-(\d{2})/);
  if (isoDay) return Number(isoDay[1]);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.getDate();
}

function getPointValue(value?: number | string | null, fallback?: number | string | null) {
  const number = Number(value ?? fallback ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatAxisValue(value: number, isEnergy: boolean) {
  if (!isEnergy) return formatChartNumber(value, 0);
  return formatChartNumber(value, value < 10 ? 1 : 0);
}

function formatChartNumber(value: number, maximumFractionDigits: number) {
  return (maximumFractionDigits ? decimalFormatter : integerFormatter).format(value);
}

function ActivityChartSkeleton() {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <ThemedView borderRadius={14} height={76} loading />
      <ThemedView borderRadius={12} height={230} loading />
    </ThemedView>
  );
}

function ActivityChartError({ onRetry }: { onRetry: () => void }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' gap={'three'} minHeight={180} justifyContent='center'>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} selectable textAlign='center'>
        Activity data could not be loaded.
      </ThemedText>
      <Pressable accessibilityRole='button' hitSlop={8} onPress={onRetry}>
        <ThemedView
          alignItems='center'
          backgroundColor={Palette.surfaceMuted}
          borderColor={Palette.borderSubtle}
          borderRadius={'pill'}
          borderWidth={1}
          flexDirection='row'
          gap={'two'}
          minHeight={34}
          paddingHorizontal={'three'}>
          <RefreshCw color={Palette.accent} size={14} />
          <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={11}>
            Retry
          </ThemedText>
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}
