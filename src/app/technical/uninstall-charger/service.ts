import { apiRequest } from 'utils/api/client';
import type { ChargerBoxResponse, ChargerVehicle, UninstallChargerValues } from './types';

function getChargerEndpoint(vehicle: ChargerVehicle) {
  return vehicle === 'car' ? 'api/car_boxes' : 'api/bike_boxes';
}

export function getUninstallChargerPayload() {
  return {
    enabled: false,
    station: null,
    visible: false,
  };
}

export function uninstallCharger(values: UninstallChargerValues) {
  return apiRequest<ChargerBoxResponse>(`${getChargerEndpoint(values.vehicle)}/${values.chargerId.trim()}`, {
    data: getUninstallChargerPayload(),
    method: 'PATCH',
  });
}
