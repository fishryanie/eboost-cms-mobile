import { useEffect, useState } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { SearchBar } from 'components/molecules/search-bar';
import { AppScreen } from 'components/ui';
import { FontFamily, Palette } from 'themes';


import { formatShortTime, screenHorizontalPadding } from 'components/technical/common';
import { ListState, ListFooter, formatNumber, getItemKey } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';
import { VehicleSwitch } from 'components/technical/vehicle-switch';

function getCarMeterSummary(record: MeterValueRecord) {
  const energy = record.sampledValues?.find(item => item.measurand === 'Energy.Active.Import.Register');
  const power = record.sampledValues?.find(item => item.measurand === 'Power.Active.Import');

  return [
    `C${record.connectorID ?? '-'}`,
    `T${record.transactionID ?? '-'}`,
    energy ? `E ${energy.value} ${energy.unit || ''}` : undefined,
    power ? `P ${power.value} ${power.unit || ''}` : undefined,
  ]
    .filter(Boolean)
    .join(' • ');
}

export function MeterCard({ item, vehicle }: { item: MeterValueRecord; vehicle: TechnicalVehicle }) {
  const title = vehicle === 'car' ? item.chargePointID || '-' : item.uniqueID || '-';
  const subtitle = vehicle === 'car' ? getCarMeterSummary(item) : `P ${formatNumber(item.pEnergy)} • PM ${formatNumber(item.pmEnergy)}`;

  return (
    <ThemedView style={styles.itemCard}>
      <ThemedView flex={1} gap={'one'} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          {title}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          {subtitle}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={15} textAlign='right'>
        {formatShortTime(item.timestamp || item.receivedAt)}
      </ThemedText>
    </ThemedView>
  );
}
