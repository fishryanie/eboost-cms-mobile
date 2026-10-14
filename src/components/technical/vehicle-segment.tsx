import { AppSegment } from 'components/ui/app-segment';

export type VehicleSegmentValue = 'bike' | 'car';

type VehicleSegmentProps = {
  onChange: (vehicle: VehicleSegmentValue) => void;
  value: VehicleSegmentValue;
};

const vehicleOptions = [
  { label: 'Cars', value: 'car' },
  { label: 'Bikes', value: 'bike' },
] as const;

export function VehicleSegment({ onChange, value }: VehicleSegmentProps) {
  return <AppSegment onChange={onChange} options={vehicleOptions} value={value} width={126} />;
}
