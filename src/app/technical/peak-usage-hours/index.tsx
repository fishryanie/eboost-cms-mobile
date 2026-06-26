import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Activity, ChevronLeft } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import {
  fetchPeakUsageHours,
  getHourlyUsageTotals,
  getPeakUsageMoments,
  getQuietUsageMoments,
  getStartDate,
  intervalOptions,
  rangeOptions,
  vehicleOptions,
  type PeakUsageInterval,
  type PeakUsageRange,
  type PeakUsageVehicle,
} from 'app/(tabs)/technical/components/peak-usage-hours-section';
import { peakUsageDayColumns, type PeakUsageDayKey, type PeakUsageRow } from 'app/(tabs)/technical/components/peak-usage-hours.helpers';
import { ThemedText, ThemedView } from 'components/base';
import { screenHorizontalPadding } from 'components/technical/common';
import { LoadingBlock, RetryBlock } from 'components/technical/list-ui';
import { FontFamily, Palette } from 'themes';

type DayProfile = {
  key: PeakUsageDayKey;
  label: string;
  peakHour: string;
  peakValue: number;
  quietHour: string;
  quietValue: number;
  slots: { hour: string; value: number }[];
  total: number;
};

function getDayProfiles(rows: PeakUsageRow[]): DayProfile[] {
  return peakUsageDayColumns.map(day => {
    const slots = rows.map(row => ({ hour: row.hour, value: row[day.key] })).sort((left, right) => right.value - left.value);
    const total = slots.reduce((sum, slot) => sum + slot.value, 0);
    const peak = slots.find(slot => slot.value > 0) ?? slots[0] ?? { hour: '00', value: 0 };
    const quiet = slots.slice().sort((left, right) => left.value - right.value)[0] ?? { hour: '00', value: 0 };

    return {
      key: day.key,
      label: day.label,
      peakHour: peak.hour,
      peakValue: peak.value,
      quietHour: quiet.hour,
      quietValue: quiet.value,
      slots: slots.filter(slot => slot.value > 0).slice(0, 5),
      total,
    };
  });
}

function FilterGroup<TValue extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  onChange: (value: TValue) => void;
  options: { label: string; value: TValue }[];
  value: TValue;
}) {
  return (
    <ThemedView gap={'one'}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} letterSpacing={1} lineHeight={14} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedView flexDirection='row' gap={'one'}>
        {options.map(option => {
          const isActive = option.value === value;

          return (
            <Pressable
              accessibilityRole='button'
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
              <ThemedView
                alignItems='center'
                backgroundColor={isActive ? '#111827' : '#FFFFFF'}
                borderColor={isActive ? '#111827' : '#E4EAF0'}
                borderRadius={'pill'}
                borderWidth={1}
                justifyContent='center'
                minHeight={32}
                paddingHorizontal={12}>
                <ThemedText color={isActive ? '#FFFFFF' : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                  {option.label}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

function SummaryPanel({ range, rows }: { range: PeakUsageRange; rows: PeakUsageRow[] }) {
  const totalSessions = rows.reduce((sum, row) => sum + peakUsageDayColumns.reduce((daySum, day) => daySum + row[day.key], 0), 0);
  const peakMoment = getPeakUsageMoments(rows).find(moment => moment.value > 0);
  const quietMoment = getQuietUsageMoments(rows)[0];

  return (
    <ThemedView backgroundColor='#111827' borderRadius={20} gap={'four'} padding={16}>
      <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
        <ThemedView alignItems='center' backgroundColor='rgba(255,255,255,0.12)' borderRadius={16} height={48} justifyContent='center' width={48}>
          <Activity color='#BFEBCF' size={23} strokeWidth={2.2} />
        </ThemedView>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={28} lineHeight={33}>
            {totalSessions.toLocaleString()}
          </ThemedText>
          <ThemedText color='#CBD5E1' fontFamily={FontFamily.medium} fontSize={12} lineHeight={17}>
            sessions since {getStartDate(range)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView flexDirection='row' gap={'two'}>
        <ThemedView backgroundColor='rgba(239,68,68,0.15)' borderColor='rgba(248,113,113,0.24)' borderRadius={16} borderWidth={1} flex={1} gap={3} padding={12}>
          <ThemedText color='#FCA5A5' fontFamily={FontFamily.bold} fontSize={11} lineHeight={15}>
            Cao điểm
          </ThemedText>
          <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={15} lineHeight={20} numberOfLines={1}>
            {peakMoment ? `${peakMoment.dayLabel} ${peakMoment.hour}:00` : '-'}
          </ThemedText>
          <ThemedText color='#CBD5E1' fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            {peakMoment?.value.toLocaleString() ?? '0'} sessions
          </ThemedText>
        </ThemedView>
        <ThemedView
          backgroundColor='rgba(59,130,246,0.16)'
          borderColor='rgba(147,197,253,0.24)'
          borderRadius={16}
          borderWidth={1}
          flex={1}
          gap={3}
          padding={12}>
          <ThemedText color='#93C5FD' fontFamily={FontFamily.bold} fontSize={11} lineHeight={15}>
            Thấp điểm
          </ThemedText>
          <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={15} lineHeight={20} numberOfLines={1}>
            {quietMoment ? `${quietMoment.dayLabel} ${quietMoment.hour}:00` : '-'}
          </ThemedText>
          <ThemedText color='#CBD5E1' fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            {quietMoment?.value.toLocaleString() ?? '0'} sessions
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

function DemandWindows({ rows, tone }: { rows: PeakUsageRow[]; tone: 'high' | 'low' }) {
  const moments =
    tone === 'high'
      ? getPeakUsageMoments(rows)
          .filter(moment => moment.value > 0)
          .slice(0, 5)
      : getQuietUsageMoments(rows).slice(0, 5);

  if (!moments.length) return null;
  const isHigh = tone === 'high';

  return (
    <ThemedView backgroundColor='#FFFFFF' borderColor='#E8EDF2' borderRadius={18} borderWidth={1} gap={'three'} padding={12}>
      <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          {isHigh ? 'High demand windows' : 'Low demand windows'}
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
          top 5
        </ThemedText>
      </ThemedView>
      <ThemedView gap={'two'}>
        {moments.map((moment, index) => (
          <ThemedView alignItems='center' flexDirection='row' gap={'two'} key={`${moment.dayKey}-${moment.hour}`}>
            <ThemedView
              alignItems='center'
              backgroundColor={index === 0 ? (isHigh ? Palette.danger : '#3867D6') : '#F1F5F9'}
              borderRadius={10}
              height={30}
              justifyContent='center'
              width={30}>
              <ThemedText color={index === 0 ? '#FFFFFF' : Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={11} lineHeight={15}>
                {index + 1}
              </ThemedText>
            </ThemedView>
            <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
              {moment.dayLabel} · {moment.hour}:00
            </ThemedText>
            <ThemedText color={isHigh ? Palette.danger : '#3867D6'} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
              {moment.value.toLocaleString()}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function HourlyBarChart({ rows }: { rows: PeakUsageRow[] }) {
  const totals = getHourlyUsageTotals(rows);
  const maxValue = Math.max(...totals.map(item => item.value), 0);
  const minValue = Math.min(...totals.map(item => item.value), 0);
  const chartHeight = 148;

  if (!totals.length) return null;

  return (
    <ThemedView backgroundColor='#FFFFFF' borderColor='#E8EDF2' borderRadius={18} borderWidth={1} gap={'three'} padding={12}>
      <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          Usage by hour
        </ThemedText>
        <ThemedView flexDirection='row' gap={'two'}>
          <ThemedView alignItems='center' flexDirection='row' gap={4}>
            <ThemedView backgroundColor={Palette.danger} borderRadius={'pill'} height={8} width={8} />
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
              High
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems='center' flexDirection='row' gap={4}>
            <ThemedView backgroundColor='#3867D6' borderRadius={'pill'} height={8} width={8} />
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
              Low
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView alignItems='flex-end' flexDirection='row' gap={3} height={148}>
        {totals.map(item => {
          const isPeak = maxValue > 0 && item.value === maxValue;
          const isQuiet = item.value === minValue;
          const barHeight = maxValue > 0 ? Math.max(6, Math.round((item.value / maxValue) * chartHeight)) : 6;

          return (
            <ThemedView alignItems='center' flex={1} gap={5} justifyContent='flex-end' key={item.hour}>
              <ThemedText
                color={isPeak ? Palette.danger : isQuiet ? '#3867D6' : Palette.textTertiary}
                fontFamily={FontFamily.bold}
                fontSize={8}
                lineHeight={11}>
                {item.value > 0 ? item.value.toLocaleString() : ''}
              </ThemedText>
              <ThemedView backgroundColor={isPeak ? Palette.danger : isQuiet ? '#3867D6' : '#D7DEE8'} borderRadius={'pill'} height={barHeight} width='100%' />
            </ThemedView>
          );
        })}
      </ThemedView>

      <ThemedView flexDirection='row' justifyContent='space-between'>
        {['00', '06', '12', '18', '23'].map(label => (
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} key={label} lineHeight={14}>
            {label}:00
          </ThemedText>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function DayRhythmRow({ item }: { item: DayProfile }) {
  return (
    <ThemedView
      backgroundColor='#FFFFFF'
      borderColor='#E8EDF2'
      borderRadius={16}
      borderWidth={1}
      gap={'three'}
      marginHorizontal={screenHorizontalPadding}
      padding={12}>
      <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
        <ThemedView alignItems='center' backgroundColor='#F1F5F9' borderRadius={13} height={42} justifyContent='center' width={42}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
            {item.label}
          </ThemedText>
        </ThemedView>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
            {item.total.toLocaleString()} sessions
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            peak {item.peakHour}:00 · {item.peakValue.toLocaleString()} / quiet {item.quietHour}:00 · {item.quietValue.toLocaleString()}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
        {item.slots.length ? (
          item.slots.map(slot => (
            <ThemedView backgroundColor='#EEF2FF' borderRadius={'pill'} key={slot.hour} paddingHorizontal={9} paddingVertical={5}>
              <ThemedText color='#3867D6' fontFamily={FontFamily.bold} fontSize={10} lineHeight={14}>
                {slot.hour}:00 · {slot.value.toLocaleString()}
              </ThemedText>
            </ThemedView>
          ))
        ) : (
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            No active slots
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
}

export default function PeakUsageHoursScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = React.useState<PeakUsageVehicle>('all');
  const [interval, setInterval] = React.useState<PeakUsageInterval>(1);
  const [range, setRange] = React.useState<PeakUsageRange>(30);
  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryFn: () => fetchPeakUsageHours({ interval, range, vehicle }),
    queryKey: ['technical', 'peak-usage-hours', vehicle, interval, range],
  });
  const rows = data || [];
  const profiles = isLoading || error || !rows.length ? [] : getDayProfiles(rows);

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1} safePaddingTop>
      <FlatList
        contentContainerStyle={{ gap: 12, paddingBottom: 42, paddingTop: 8 }}
        data={profiles}
        keyExtractor={item => item.key}
        ListHeaderComponent={
          <ThemedView gap={'three'} paddingHorizontal={screenHorizontalPadding}>
            <ThemedView alignItems='center' flexDirection='row' minHeight={38}>
              <Pressable
                accessibilityLabel='Back'
                accessibilityRole='button'
                onPress={() => router.back()}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  height: 34,
                  justifyContent: 'center',
                  marginLeft: -6,
                  opacity: pressed ? 0.72 : 1,
                  width: 34,
                })}>
                <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
              </Pressable>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={30}>
                Peak Usage Hours
              </ThemedText>
            </ThemedView>

            <SummaryPanel range={range} rows={rows} />

            <ThemedView backgroundColor='#F8FAFC' borderColor='#EEF2F6' borderRadius={18} borderWidth={1} gap={'three'} padding={12}>
              <FilterGroup label='Vehicle' onChange={setVehicle} options={vehicleOptions} value={vehicle} />
              <FilterGroup label='Bucket' onChange={setInterval} options={intervalOptions} value={interval} />
              <FilterGroup label='Range' onChange={setRange} options={rangeOptions} value={range} />
            </ThemedView>

            <HourlyBarChart rows={rows} />

            <ThemedView gap={'two'}>
              <DemandWindows rows={rows} tone='high' />
              <DemandWindows rows={rows} tone='low' />
            </ThemedView>

            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
              Day rhythm
            </ThemedText>
          </ThemedView>
        }
        ListEmptyComponent={
          isLoading ? (
            <ThemedView marginHorizontal={screenHorizontalPadding}>
              <LoadingBlock label='Loading peak usage hours' />
            </ThemedView>
          ) : error ? (
            <ThemedView marginHorizontal={screenHorizontalPadding}>
              <RetryBlock message={error.message} onRetry={refetch} title='Peak usage unavailable' />
            </ThemedView>
          ) : (
            <ThemedView
              alignItems='center'
              backgroundColor='#FFFFFF'
              borderColor='#E8EDF2'
              borderRadius={16}
              borderWidth={1}
              justifyContent='center'
              marginHorizontal={screenHorizontalPadding}
              minHeight={108}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17}>
                No usage data
              </ThemedText>
            </ThemedView>
          )
        }
        refreshControl={<RefreshControl onRefresh={() => refetch()} refreshing={isRefetching || false} tintColor={Palette.accent} />}
        renderItem={({ item }) => <DayRhythmRow item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}
