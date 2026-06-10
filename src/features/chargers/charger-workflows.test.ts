import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ensureUninstalledVendorId,
  getWorkflowChargerIdentifier,
  getWorkflowChargerType,
  removeUninstalledVendorId,
  resetCharger,
  triggerCharger,
  unlockCharger,
} from './charger-workflows';
import type { WorkflowChargerRecord } from './types';

describe('charger workflow helpers', () => {
  it('detects charger type and MQTT identifier', () => {
    const car: WorkflowChargerRecord = { id: 1, uniqueId: 'Ecar_1', vendorId: 'CP-1' };
    const bike: WorkflowChargerRecord = { id: 2, uniqueId: 'Ebox_1', vendorId: 'BOX-1' };

    assert.equal(getWorkflowChargerType(car), 'car');
    assert.equal(getWorkflowChargerType(bike), 'bike');
    assert.equal(getWorkflowChargerIdentifier(car), 'CP-1');
    assert.equal(getWorkflowChargerIdentifier(bike), 'Ebox_1');
  });

  it('normalizes uninstall vendor suffix', () => {
    assert.equal(ensureUninstalledVendorId('CP-1'), 'CP-1_Uninstalled');
    assert.equal(ensureUninstalledVendorId('CP-1_Uninstalled'), 'CP-1_Uninstalled');
    assert.equal(removeUninstalledVendorId('CP-1_Uninstalled'), 'CP-1');
  });

  it('sends MQTT reset, trigger, and unlock payloads to hub service', async () => {
    const calls: { url: string; options?: { data?: unknown; method?: string; service?: string } }[] = [];
    const request = async (url: string, options?: { data?: unknown; method?: string; service?: string }) => {
      calls.push({ url, options });
      return { status: 'Accepted' };
    };

    await resetCharger({ chargePointId: 'CP-1', request, type: 'Soft' });
    await triggerCharger({ chargePointId: 'CP-1', connector: 0, request, requestedMessage: 'MeterValues' });
    await unlockCharger({ chargePointId: 'CP-1', connectorID: 1, request });

    assert.deepEqual(calls, [
      {
        url: 'api/v1/device/CP-1/reset',
        options: { data: { type: 'Soft' }, method: 'POST', service: 'hub' },
      },
      {
        url: 'api/v1/device/CP-1/trigger',
        options: {
          data: { connector: 0, requestedMessage: 'MeterValues' },
          method: 'POST',
          service: 'hub',
        },
      },
      {
        url: 'api/v1/device/CP-1/unlock',
        options: { data: { connectorID: 1 }, method: 'POST', service: 'hub' },
      },
    ]);
  });
});
