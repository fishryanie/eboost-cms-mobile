import { AppSegment } from 'components/ui/app-segment';

export type VehicleSegmentValue = 'bike' | 'car';
export type VehicleFilterValue = 'all' | VehicleSegmentValue;

type VehicleSegmentProps = { width?: number | `${number}%` } & (
  | { includeAll?: false; onChange: (vehicle: VehicleSegmentValue) => void; value: VehicleSegmentValue }
  | { includeAll: true; onChange: (vehicle: VehicleFilterValue) => void; value: VehicleFilterValue }
);

const vehicleOptions = [
  { label: 'Cars', value: 'car' },
  { label: 'Bikes', value: 'bike' },
] as const;

const vehicleFilterOptions = [{ label: 'All', value: 'all' }, ...vehicleOptions] as const;

export function VehicleSegment(props: VehicleSegmentProps) {
  if (props.includeAll) {
    return <AppSegment onChange={props.onChange} options={vehicleFilterOptions} value={props.value} width={props.width ?? 188} />;
  }

  return <AppSegment onChange={props.onChange} options={vehicleOptions} value={props.value} width={props.width ?? 126} />;
}
