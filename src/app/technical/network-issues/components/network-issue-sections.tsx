import { useState } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText, ThemedView } from 'components/base';
import { SearchBar } from 'components/molecules/search-bar';
import { AnimatedHeaderScrollView } from 'components/organisms/animated-header-scrollview';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import { LoadingBlock, RetryBlock, getNetworkIssues } from 'components/technical/list-ui';
import { formatRelativeTime, formatShortTime } from 'components/technical/common';
import { styles } from 'components/technical/styles';

type NetworkIssue = ConnectionLogRecord & {
  vehicle: TechnicalVehicle;
};

type NetworkIssueFilter = 'all' | TechnicalVehicle;

export function IssueFilterSwitch({
  bikeCount,
  carCount,
  filter,
  onChange }: {
  bikeCount: number;
  carCount: number;
  filter: NetworkIssueFilter;
  onChange: (filter: NetworkIssueFilter) => void;
}) {
  const options: { count: number; label: string; value: NetworkIssueFilter }[] = [
    { count: bikeCount + carCount, label: 'All', value: 'all' },
    { count: bikeCount, label: 'Bike', value: 'bike' },
    { count: carCount, label: 'Car', value: 'car' },
  ];

  return (
    <ThemedView flexDirection='row' style={styles.issueSegmentedControl}>
      {options.map(option => {
        const active = filter === option.value;
        return (
          <Pressable
            accessibilityRole='button'
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.issueFilterChip, active && styles.issueFilterChipActive, pressed && styles.pressed]}>
            <ThemedText color={active ? Palette.accent : Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {option.label} {option.count}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

export function NetworkIssueCard({ item }: { item: NetworkIssue }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/technical/box-status-logs', params: { id: item.chargePointID, vehicle: item.vehicle } } as never)}
      style={({ pressed }) => [styles.issueCard, pressed && styles.pressed]}>
      <ThemedView backgroundColor={item.vehicle === 'bike' ? Palette.accent : '#3867D6'} style={styles.issueVehicleRail} />
      <ThemedView flex={1} gap={2} minWidth={0}>
        <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
            {item.chargePointID || '-'}
          </ThemedText>
        </ThemedView>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          {item.stationName || `${item.vehicle === 'bike' ? 'Bike' : 'Car'} charger`} • {formatShortTime(item.timestamp)}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} style={styles.issueAge}>
        {formatRelativeTime(item.timestamp)}
      </ThemedText>
    </Pressable>
  );
}
