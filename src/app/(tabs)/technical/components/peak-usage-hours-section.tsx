import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Activity } from 'lucide-react-native';

import {
  normalizePeakUsageRows,
  peakUsageDayColumns,
  type PeakUsageDayKey,
  type PeakUsageRaw,
  type PeakUsageRow,
} from 'app/(tabs)/technical/components/peak-usage-hours.helpers';
import { ThemedText, ThemedView } from 'components/base';
import { LoadingBlock, RetryBlock, SectionTitle } from 'components/technical/list-ui';
import { DashboardApiData, getCollectionData } from 'shared/operation/operation-user-service';
import { FontFamily, Palette } from 'themes';
import { apiRequest } from 'utils/api/client';

export type PeakUsageVehicle = 'all' | TechnicalVehicle;
export type PeakUsageInterval = 1 | 2 | 3;
export type PeakUsageRange = 7 | 30 | 90;

export const vehicleOptions: { label: string; value: PeakUsageVehicle }[] = [
  { label: 'All', value: 'all' },
  { label: 'Bike', value: 'bike' },
  { label: 'Car', value: 'car' },
];

export const intervalOptions: { label: string; value: PeakUsageInterval }[] = [
  { label: '1h', value: 1 },
  { label: '2h', value: 2 },
  { label: '3h', value: 3 },
];

export const rangeOptions: { label: string; value: PeakUsageRange }[] = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

export type PeakUsageMoment = {
  dayKey: PeakUsageDayKey;
  dayLabel: string;
  hour: string;
  value: number;
};

export type PeakUsageDayTotal = {
  key: PeakUsageDayKey;
  label: string;
  value: number;
};

export function getStartDate(range: PeakUsageRange) {
  if (range === 30) return dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  return dayjs().subtract(range, 'day').format('YYYY-MM-DD');
}

export async function fetchPeakUsageHours({ interval, range, vehicle }: { interval: PeakUsageInterval; range: PeakUsageRange; vehicle: PeakUsageVehicle }) {
  const response = await apiRequest<DashboardApiData<PeakUsageRaw[]>>('api/controller/statistic/active-hours', {
    params: {
      interval,
      startDate: getStartDate(range),
      vehicle: vehicle === 'all' ? undefined : vehicle,
    },
  });

  return normalizePeakUsageRows(getCollectionData(response));
}

export function getPeakUsageMoments(rows: PeakUsageRow[]) {
  return rows
    .flatMap(row =>
      peakUsageDayColumns.map(day => ({
        dayKey: day.key,
        dayLabel: day.label,
        hour: row.hour,
        value: row[day.key],
      })),
    )
    .sort((left, right) => right.value - left.value);
}

export function getQuietUsageMoments(rows: PeakUsageRow[]) {
  return getPeakUsageMoments(rows)
    .slice()
    .sort((left, right) => left.value - right.value);
}

export function getHourlyUsageTotals(rows: PeakUsageRow[]) {
  return rows.map(row => ({
    hour: row.hour,
    value: peakUsageDayColumns.reduce((sum, day) => sum + row[day.key], 0),
  }));
}

export function getPeakUsageDayTotals(rows: PeakUsageRow[]): PeakUsageDayTotal[] {
  return peakUsageDayColumns
    .map(day => ({
      key: day.key,
      label: day.label,
      value: rows.reduce((sum, row) => sum + row[day.key], 0),
    }))
    .sort((left, right) => right.value - left.value);
}

function MiniHourlyBars({ rows }: { rows: PeakUsageRow[] }) {
  const totals = getHourlyUsageTotals(rows);
  const maxValue = Math.max(...totals.map(item => item.value), 0);
  const chartHeight = 54;

  return (
    <ThemedView gap={'one'}>
      <ThemedView alignItems='flex-end' flexDirection='row' gap={2} height={54}>
        {totals.map(item => {
          const barHeight = maxValue > 0 ? Math.max(5, Math.round((item.value / maxValue) * chartHeight)) : 5;

          const getBarColor = () => {
            if (maxValue === 0) return '#CBD5E1';
            const ratio = item.value / maxValue;
            if (ratio >= 0.85) return Palette.danger;
            if (ratio >= 0.65) return '#F97316';
            if (ratio >= 0.45) return '#F59E0B';
            if (ratio >= 0.25) return Palette.accent;
            return '#CBD5E1';
          };
          return (
            <ThemedView alignItems='center' flex={1} justifyContent='flex-end' key={item.hour}>
              <ThemedView backgroundColor={getBarColor()} borderRadius={'pill'} height={barHeight} width='100%' />
            </ThemedView>
          );
        })}
      </ThemedView>
      <ThemedView flexDirection='row' justifyContent='space-between'>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
          00
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
          06
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
          12
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
          18
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
          23
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export function PeakUsageHoursSection({ onViewMore }: { onViewMore?: () => void }) {
  const vehicle: PeakUsageVehicle = 'all';
  const interval: PeakUsageInterval = 1;
  const range: PeakUsageRange = 30;
  const { data, error, isLoading, refetch } = useQuery({
    queryFn: () => fetchPeakUsageHours({ interval, range, vehicle }),
    queryKey: ['technical', 'peak-usage-hours', vehicle, interval, range],
  });
  const rows = data || [];
  const totalSessions = rows.reduce((sum, row) => sum + peakUsageDayColumns.reduce((daySum, day) => daySum + row[day.key], 0), 0);

  return (
    <ThemedView gap={'three'} marginTop={4}>
      <SectionTitle actionLabel='View more' onAction={onViewMore} subtitle='Fixed summary: All vehicles · 30d.' title='Peak Usage Hours' />
      {isLoading ? (
        <LoadingBlock label='Loading peak usage hours' />
      ) : error ? (
        <RetryBlock message={error.message} onRetry={refetch} title='Peak usage unavailable' />
      ) : (
        <ThemedView>
          <ThemedView alignItems='stretch' flexDirection='row' gap={'three'}>
            <ThemedView flex={1} gap={'two'} minWidth={0}>
              {rows.length ? <MiniHourlyBars rows={rows} /> : null}
            </ThemedView>
            <ThemedView alignItems='flex-end' gap={2}>
              <Activity color={Palette.accent} size={16} strokeWidth={2.2} />
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={23}>
                {totalSessions.toLocaleString()}
              </ThemedText>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
                sessions
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}
