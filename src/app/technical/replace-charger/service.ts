import { apiRequest } from 'utils/api/client';
import type { ChargerBoxResponse, ChargerVehicle, ReplaceChargerValues } from './types';

function getChargerEndpoint(vehicle: ChargerVehicle) {
  return vehicle === 'car' ? 'api/car_boxes' : 'api/bike_boxes';
}

export function normalizeReplaceChargerValues(values: ReplaceChargerValues) {
  const payload: { name: string; station?: string; vendorId: string } = {
    name: values.name.trim(),
    vendorId: values.vendorId.trim(),
  };
  const station = values.station?.trim();

  if (station) {
    payload.station = station;
  }

  return payload;
}

export function replaceCharger(values: ReplaceChargerValues) {
  return apiRequest<ChargerBoxResponse>(`${getChargerEndpoint(values.vehicle)}/${values.chargerId.trim()}`, {
    data: normalizeReplaceChargerValues(values),
    method: 'PATCH',
  });
}
