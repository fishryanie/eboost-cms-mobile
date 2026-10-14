import { useWindowDimensions } from 'react-native';

import { ThemedView } from 'components/base';

import { TechnicalSearchField, type TechnicalSearchFieldProps } from './search-field';
import { VehicleSegment, type VehicleFilterValue, type VehicleSegmentValue } from './vehicle-segment';

type VehicleSearchToolbarProps = TechnicalSearchFieldProps &
  (
    | { includeAll?: false; onChangeVehicle: (vehicle: VehicleSegmentValue) => void; vehicle: VehicleSegmentValue }
    | { includeAll: true; onChangeVehicle: (vehicle: VehicleFilterValue) => void; vehicle: VehicleFilterValue }
  );

export function VehicleSearchToolbar(props: VehicleSearchToolbarProps) {
  const { width } = useWindowDimensions();
  // Three options need a separate row on compact phones to keep search usable.
  const stacked = props.includeAll && width < 360;

  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection={stacked ? 'column' : 'row'} gap={'two'}>
      <ThemedView backgroundColor='transparent' flex={stacked ? undefined : 1} height={40} minWidth={0} width={stacked ? '100%' : undefined}>
        <TechnicalSearchField
          accessibilityLabel={props.accessibilityLabel}
          autoCapitalize={props.autoCapitalize}
          clearAccessibilityLabel={props.clearAccessibilityLabel}
          onChange={props.onChange}
          placeholder={props.placeholder}
          value={props.value}
        />
      </ThemedView>
      {props.includeAll ? (
        <VehicleSegment includeAll onChange={props.onChangeVehicle} value={props.vehicle} width={stacked ? '100%' : undefined} />
      ) : (
        <VehicleSegment onChange={props.onChangeVehicle} value={props.vehicle} />
      )}
    </ThemedView>
  );
}
