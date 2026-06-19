import { useEffect, useState } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { SearchBar } from 'components/molecules/search-bar';
import { AppScreen } from 'components/ui';
import { FontFamily, Palette } from 'themes';


import { StatusPill, screenHorizontalPadding } from 'components/technical/common';
import { ListState, ListFooter, getItemKey } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';
import { VehicleSwitch } from 'components/technical/vehicle-switch';

export function ChargerCard({ item }: { item: ChargerRecord }) {
  const station = typeof item.station === 'string' ? item.station : item.station?.name || item.stationName || '-';

  return (
    <ThemedView style={styles.itemCard}>
      <ThemedView flex={1} gap={'one'} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          {item.vendorId || item.uniqueId || `#${item.id || '-'}`}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          {item.name || item.uniqueId || 'Unnamed charger'} • {station}
        </ThemedText>
      </ThemedView>
      <StatusPill
        label={item.enabled === false ? 'Disabled' : item.visible === false ? 'Hidden' : 'Active'}
        tone={item.enabled === false ? 'danger' : 'success'}
      />
    </ThemedView>
  );
}
