import { apiRequest } from 'utils/api/client';
import type { AddChargerValues, ChargerBoxResponse, ChargerVehicle } from './types';

function getChargerEndpoint(vehicle: ChargerVehicle) {
  return vehicle === 'car' ? 'api/car_boxes' : 'api/bike_boxes';
}

export function normalizeAddChargerValues(values: AddChargerValues) {
  return {
    name: values.name.trim(),
    station: values.station.trim(),
    vendorId: values.vendorId.trim(),
  };
}

export function createCharger(values: AddChargerValues) {
  return apiRequest<ChargerBoxResponse>(getChargerEndpoint(values.vehicle), {
    data: normalizeAddChargerValues(values),
    method: 'POST',
  });
}
