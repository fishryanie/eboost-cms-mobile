import { apiRequest } from 'shared/api/client';

import type { WorkflowChargerRecord } from './types';
import { resetCharger, triggerCharger, unlockCharger } from './charger-workflows';

export function fetchCarBox(id: number | string) {
  return apiRequest<WorkflowChargerRecord>(`api/car_boxes/${id}`);
}

export function fetchBikeBox(id: number | string) {
  return apiRequest<WorkflowChargerRecord>(`api/bike_boxes/${id}`);
}

export function requestResetCharger(chargePointId: string, type: 'Hard' | 'Soft') {
  return resetCharger({ chargePointId, request: apiRequest, type });
}

export function requestTriggerCharger(chargePointId: string, values: { connector: number; requestedMessage: string }) {
  return triggerCharger({
    chargePointId,
    connector: values.connector,
    request: apiRequest,
    requestedMessage: values.requestedMessage,
  });
}

export function requestUnlockCharger(chargePointId: string, connectorID: number) {
  return unlockCharger({ chargePointId, connectorID, request: apiRequest });
}
