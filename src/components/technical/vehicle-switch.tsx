import { VehicleSegment } from './vehicle-segment';

export function VehicleSwitch({ onChange, vehicle }: { onChange: (vehicle: TechnicalVehicle) => void; vehicle: TechnicalVehicle }) {
  return <VehicleSegment onChange={onChange} value={vehicle} />;
}
