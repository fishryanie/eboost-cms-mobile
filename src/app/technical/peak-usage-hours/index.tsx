import { useQuery } from '@tanstack/react-query';
import AnimatedHeaderScrollView from 'components/organisms/animated-header-scrollview';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable } from 'react-native';

import {
  fetchPeakUsageHours,
  intervalOptions,
  rangeOptions,
  vehicleOptions,
  type PeakUsageInterval,
  type PeakUsageRange,
  type PeakUsageVehicle,
} from 'app/(tabs)/technical/components/peak-usage-hours-section';
import { getPeakUsageMaxValue, peakUsageDayColumns, type PeakUsageRow } from 'app/(tabs)/technical/components/peak-usage-hours.helpers';
import { ThemedText, ThemedView } from 'components/base';
import { screenHorizontalPadding } from 'components/technical/common';
import { LoadingBlock, RetryBlock } from 'components/technical/list-ui';
import { FontFamily, Palette } from 'themes';

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
    <ThemedView gap={'two'}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={13} letterSpacing={0.5} paddingLeft={4}>
        {label}
      </ThemedText>
      <ThemedView
        flexDirection='row'
        backgroundColor='#F1F5F9'
        borderRadius={12}
        padding={4}
        gap={4}>
        {options.map(option => {
          const isActive = option.value === value;

          return (
            <Pressable key={option.value} onPress={() => onChange(option.value)} style={{ flex: 1 }}>
              <ThemedView
                backgroundColor={isActive ? '#FFFFFF' : 'transparent'}
                borderRadius={8}
                paddingVertical={8}
                alignItems='center'
                style={
                  isActive
                    ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : undefined
                }>
                <ThemedText
                  color={isActive ? Palette.textPrimary : Palette.textSecondary}
                  fontFamily={isActive ? FontFamily.semibold : FontFamily.medium}
                  fontSize={13}>
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

function HeatmapMatrix({ rows }: { rows: PeakUsageRow[] }) {
  const maxValue = React.useMemo(() => getPeakUsageMaxValue(rows), [rows]);

  const getHeatColor = (value: number, maxValue: number) => {
    if (value <= 0 || maxValue <= 0) return { bg: 'rgba(1, 167, 78, 0.1)', text: Palette.textPrimary };

    const ratio = value / maxValue;

    if (ratio >= 0.85) return { bg: '#cf1322', text: '#ffffff' };
    if (ratio >= 0.65) return { bg: '#f59e0b', text: Palette.textPrimary };
    if (ratio >= 0.4) return { bg: '#01A74E', text: Palette.textPrimary };
    if (ratio >= 0.2) return { bg: 'rgba(1, 167, 78, 0.6)', text: Palette.textPrimary };
    return { bg: 'rgba(1, 167, 78, 0.2)', text: Palette.textPrimary };
  };

  return (
    <ThemedView gap={'three'}>
      <ThemedView flexDirection='row' justifyContent='space-between' alignItems='flex-start' flexWrap='wrap' gap={'two'}>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} marginBottom={12}>
          Charging demand heatmap
        </ThemedText>
        <ThemedView flexDirection='row' alignItems='center' gap={'two'}>
          <ThemedView flexDirection='row' alignItems='center' gap={4}>
            <ThemedView backgroundColor='rgba(1, 167, 78, 0.5)' borderRadius={4} height={12} width={12} />
            <ThemedText color={Palette.textSecondary} fontSize={10}>
              Low
            </ThemedText>
          </ThemedView>
          <ThemedView flexDirection='row' alignItems='center' gap={4}>
            <ThemedView backgroundColor='#01A74E' borderRadius={4} height={12} width={12} />
            <ThemedText color={Palette.textSecondary} fontSize={10}>
              Medium
            </ThemedText>
          </ThemedView>
          <ThemedView flexDirection='row' alignItems='center' gap={4}>
            <ThemedView backgroundColor='#cf1322' borderRadius={4} height={12} width={12} />
            <ThemedText color={Palette.textSecondary} fontSize={10}>
              High
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView gap={'one'} paddingBottom={8}>
        <ThemedView flexDirection='row' gap={'one'} paddingBottom={8}>
          <ThemedView width={48}>
            <ThemedText color={Palette.textSecondary} fontSize={10} fontFamily={FontFamily.medium}>
              Hour
            </ThemedText>
          </ThemedView>
          {peakUsageDayColumns.map(day => (
            <ThemedView key={day.key} width={36} alignItems='center'>
              <ThemedText color={Palette.textSecondary} fontSize={10} fontFamily={FontFamily.medium}>
                {day.label}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        {rows.map(row => (
          <ThemedView key={row.hour} flexDirection='row' gap={'two'} alignItems='center'>
            <ThemedView width={40}>
              <ThemedText color={Palette.textSecondary} fontSize={10}>
                {row.hour}:00
              </ThemedText>
            </ThemedView>
            {peakUsageDayColumns.map(day => {
              const colors = getHeatColor(row[day.key], maxValue);
              return (
                <ThemedView key={day.key} square={40} backgroundColor={colors.bg} borderRadius={6} alignItems='center' justifyContent='center'>
                  <ThemedText color={colors.text} fontSize={10} fontFamily={FontFamily.medium}>
                    {row[day.key]}
                  </ThemedText>
                </ThemedView>
              );
            })}
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

export default function PeakUsageHoursScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = React.useState<PeakUsageVehicle>('all');
  const [interval, setInterval] = React.useState<PeakUsageInterval>(1);
  const [range, setRange] = React.useState<PeakUsageRange>(30);
  const { data, error, isLoading, refetch } = useQuery({
    queryFn: () => fetchPeakUsageHours({ interval, range, vehicle }),
    queryKey: ['technical', 'peak-usage-hours', vehicle, interval, range],
  });
  const rows = data || [];

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <AnimatedHeaderScrollView
        largeTitle='Peak Usage Hours'
        canGoBack
        onBack={() => router.back()}
        contentContainerStyle={{ gap: 16, paddingBottom: 42, paddingHorizontal: screenHorizontalPadding }}
        showsVerticalScrollIndicator={false}>
        <ThemedView gap={'three'}>
          <ThemedView gap={'three'} paddingBottom={4}>
            <FilterGroup label='Vehicle' onChange={setVehicle} options={vehicleOptions} value={vehicle} />
            <FilterGroup label='Bucket' onChange={setInterval} options={intervalOptions} value={interval} />
            <FilterGroup label='Range' onChange={setRange} options={rangeOptions} value={range} />
          </ThemedView>

          {isLoading ? (
            <LoadingBlock label='Loading peak usage hours' />
          ) : error ? (
            <RetryBlock message={error.message} onRetry={refetch} title='Peak usage unavailable' />
          ) : rows.length === 0 ? (
            <ThemedView
              alignItems='center'
              backgroundColor='#FFFFFF'
              borderColor='#E8EDF2'
              borderRadius={16}
              borderWidth={1}
              justifyContent='center'
              minHeight={108}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17}>
                No usage data
              </ThemedText>
            </ThemedView>
          ) : (
            <HeatmapMatrix rows={rows} />
          )}
        </ThemedView>
      </AnimatedHeaderScrollView>
    </ThemedView>
  );
}
