export function getWorkflowChargerType(charger?: Pick<WorkflowChargerRecord, 'boxType' | 'uniqueId'>) {
  return charger?.boxType === 'car' || charger?.uniqueId?.startsWith('Ecar') ? 'car' : 'bike';
}

export function getWorkflowChargerIdentifier(charger?: Pick<WorkflowChargerRecord, 'boxType' | 'uniqueId' | 'vendorId'>) {
  return getWorkflowChargerType(charger) === 'car' ? charger?.vendorId || charger?.uniqueId || '' : charger?.uniqueId || '';
}

export function ensureUninstalledVendorId(vendorId?: string) {
  if (!vendorId) return vendorId;
  return vendorId.endsWith('_Uninstalled') ? vendorId : `${vendorId}_Uninstalled`;
}

export function removeUninstalledVendorId(vendorId?: string) {
  if (!vendorId) return vendorId;
  return vendorId.replace(/_Uninstalled$/, '');
}

export function resetCharger({ chargePointId, request, type }: { chargePointId: string; request: ChargerRequest; type: 'Hard' | 'Soft' }) {
  return request(`api/v1/device/${chargePointId}/reset`, {
    data: { type },
    method: 'POST',
    service: 'hub',
  });
}

export function triggerCharger({
  chargePointId,
  connector,
  request,
  requestedMessage,
}: {
  chargePointId: string;
  connector: number;
  request: ChargerRequest;
  requestedMessage: 'BootNotification' | 'Heartbeat' | 'MeterValues' | 'StatusNotification' | string;
}) {
  return request(`api/v1/device/${chargePointId}/trigger`, {
    data: { connector, requestedMessage },
    method: 'POST',
    service: 'hub',
  });
}

export function unlockCharger({ chargePointId, connectorID, request }: { chargePointId: string; connectorID: number; request: ChargerRequest }) {
  return request(`api/v1/device/${chargePointId}/unlock`, {
    data: { connectorID },
    method: 'POST',
    service: 'hub',
  });
}
