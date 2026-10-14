import { Bike, Car } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { Palette } from 'themes';

import type { BoxErrorRecord } from './model';

export function BoxErrorCard({ box }: { box: BoxErrorRecord }) {
  const VehicleIcon = box.vehicle === 'car' ? Car : Bike;
  const vehicleLabel = box.vehicle === 'car' ? 'Car' : 'Bike';
  const title = (box.vehicle === 'car' ? box.vendor_id || box.unique_id : box.unique_id || box.vendor_id) || `${vehicleLabel} charger`;
  const errorRate = box.error_rate_percent.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const progress = Math.min(100, Math.max(0, box.error_rate_percent));

  return (
    <ThemedView backgroundColor={Palette.surfaceRaised} borderBottomColor={Palette.borderSubtle} borderBottomWidth={1} gap={5} paddingVertical={10}>
      <ThemedView alignItems='center' flexDirection='row' gap={8}>
        <ThemedView accessible accessibilityLabel={`${vehicleLabel} charger`} accessibilityRole='image' alignItems='center' justifyContent='center' width={20}>
          <VehicleIcon color={Palette.textSecondary} size={16} />
        </ThemedView>
        <ThemedText ellipsizeMode='middle' flex={1} fontFamily='semibold' fontSize={15} lineHeight={20} minWidth={0} numberOfLines={1} selectable>
          {title}
        </ThemedText>
        <ThemedText color={Palette.danger} fontFamily='semibold' fontSize={14} lineHeight={20} selectable>
          {errorRate}%
        </ThemedText>
      </ThemedView>

      <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={17} numberOfLines={1} selectable>
        {box.station_name || 'Station unavailable'}
      </ThemedText>

      <ThemedView alignItems='center' flexDirection='row' flexWrap='wrap' gap={10}>
        <ThemedView
          accessible
          accessibilityLabel='Failed session rate'
          accessibilityRole='progressbar'
          accessibilityValue={{ min: 0, max: 100, now: progress, text: `${errorRate}% failed` }}
          backgroundColor={Palette.borderSubtle}
          borderRadius='pill'
          flex={1}
          height={6}
          minWidth={64}
          overflow='hidden'>
          <ThemedView backgroundColor={Palette.danger} borderRadius='pill' height='100%' width={`${progress}%`} />
        </ThemedView>
        <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={17} selectable>
          <ThemedText color={Palette.danger} fontFamily='semibold' fontSize={12} lineHeight={17}>
            {box.failed_sessions.toLocaleString()}
          </ThemedText>
          {' / '}
          {box.total_sessions.toLocaleString()} failed
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
