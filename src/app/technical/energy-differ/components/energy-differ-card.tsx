import { useState } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { AppScreen, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';


import { screenHorizontalPadding } from 'components/technical/common';
import { LoadingBlock, RetryBlock, formatNumber, getItemKey } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';
import { VehicleSwitch } from 'components/technical/vehicle-switch';

export function EnergyDifferState({
  query }: {
  query: { data?: { items: EnergyDifferRecord[] }; error: Error | null; isLoading: boolean; refetch: () => void };
}) {
  if (query.isLoading) return <LoadingBlock label="Loading energy differ" />;
  if (query.error) return <RetryBlock message={query.error.message} onRetry={query.refetch} title="Energy differ unavailable" />;
  if (!query.data?.items.length) return <EmptyState message="This month has no energy differ rows." title="No energy differ data" />;
  return null;
}

export function EnergyDifferCard({ item, vehicle }: { item: EnergyDifferRecord; vehicle: TechnicalVehicle }) {
  return (
    <ThemedView style={styles.itemCard}>
      <ThemedView flex={1} gap={'one'} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          {item.charge_point_id || '-'}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          {item.station_name || `${vehicle} energy`}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18} textAlign='right'>
        {formatNumber(item.energy_difference)}
      </ThemedText>
    </ThemedView>
  );
}
