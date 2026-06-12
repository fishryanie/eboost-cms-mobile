import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  fetchUtilityChargers,
  requestResetBox,
  requestTriggerBox,
  requestUnlockBox,
  ResetBoxStatusError,
  TriggerBoxResponseError,
} from './trigger-box-service';

describe('trigger box service', () => {
  it('triggers meter values on the hub service for a box id', async () => {
    const calls: { options?: { data?: unknown; method?: string; service?: string }; url: string }[] = [];
    const request = async (url: string, options?: { data?: unknown; method?: string; service?: string }) => {
      calls.push({ options, url });
      return { meterValue: 42, status: 'Accepted' };
    };

    const response = await requestTriggerBox({
      boxId: 'CP-001',
      request,
    });

    assert.deepEqual(response, { meterValue: 42, status: 'Accepted' });
    assert.deepEqual(calls, [
      {
        options: {
          data: { connector: 0, requestedMessage: 'MeterValues' },
          method: 'POST',
          service: 'hub',
        },
        url: 'api/v1/device/CP-001/trigger',
      },
    ]);
  });

  it('surfaces trigger payload errors as thrown errors', async () => {
    await assert.rejects(
      () =>
        requestTriggerBox({
          boxId: 'CP-002',
          request: async () => ({ error: 'Box is offline', status: 'Rejected' }),
        }),
      (error: unknown) => error instanceof TriggerBoxResponseError && error.message === 'Box is offline',
    );
  });

  it('loads all utility chargers from the controller utility endpoint', async () => {
    const calls: { options?: { params?: unknown }; url: string }[] = [];
    const request = async (url: string, options?: { params?: unknown }) => {
      calls.push({ options, url });
      return [
        { id: 1, stationName: 'Station A', uniqueId: 'Ebox_001', vendorId: 'BOX-001' },
        { id: 2, stationName: null, uniqueId: 'Ecar_001', vendorId: 'CP-001' },
      ];
    };

    const chargers = await fetchUtilityChargers(request);

    assert.deepEqual(chargers, [
      { id: 1, stationName: 'Station A', uniqueId: 'Ebox_001', vendorId: 'BOX-001' },
      { id: 2, stationName: null, uniqueId: 'Ecar_001', vendorId: 'CP-001' },
    ]);
    assert.deepEqual(calls, [
      {
        options: { params: { pagination: false } },
        url: 'api/controller/utilities/chargers',
      },
    ]);
  });

  it('checks box status before resetting a selected box', async () => {
    const calls: { options?: { data?: unknown; method?: string; service?: string }; url: string }[] = [];
    const request = async (url: string, options?: { data?: unknown; method?: string; service?: string }) => {
      calls.push({ options, url });
      if (url === 'api/box-status') {
        return {
          'CP-001_0': 'Available',
          'CP-001_1': 'Preparing',
        };
      }
      return { status: 'Accepted' };
    };

    const response = await requestResetBox({
      boxId: 'CP-001',
      request,
      vendorId: 'CP-001',
    });

    assert.deepEqual(response, { status: 'Accepted' });
    assert.deepEqual(calls, [
      {
        options: { service: 'hub' },
        url: 'api/box-status',
      },
      {
        options: {
          data: { type: 'Soft' },
          method: 'POST',
          service: 'hub',
        },
        url: 'api/v1/device/CP-001/reset',
      },
    ]);
  });

  it('blocks reset when any matching vendor connector is charging', async () => {
    const calls: { options?: { data?: unknown; method?: string; service?: string }; url: string }[] = [];
    const request = async (url: string, options?: { data?: unknown; method?: string; service?: string }) => {
      calls.push({ options, url });
      return {
        'CP-001_0': 'Unavailable',
        'CP-001_1': 'Charging',
        'CP-002_1': 'Available',
      };
    };

    await assert.rejects(
      () =>
        requestResetBox({
          boxId: 'CP-001',
          request,
          vendorId: 'CP-001',
        }),
      (error: unknown) => error instanceof ResetBoxStatusError && error.message === 'Box CP-001 is charging and cannot be reset.',
    );

    assert.deepEqual(calls, [
      {
        options: { service: 'hub' },
        url: 'api/box-status',
      },
    ]);
  });

  it('unlocks connector 1 on the hub service for a box id', async () => {
    const calls: { options?: { data?: unknown; method?: string; service?: string }; url: string }[] = [];
    const request = async (url: string, options?: { data?: unknown; method?: string; service?: string }) => {
      calls.push({ options, url });
      return { status: 'Accepted' };
    };

    const response = await requestUnlockBox({
      boxId: ' CP-001 ',
      request,
    });

    assert.deepEqual(response, { status: 'Accepted' });
    assert.deepEqual(calls, [
      {
        options: {
          data: { connectorID: 1 },
          method: 'POST',
          service: 'hub',
        },
        url: 'api/v1/device/CP-001/unlock',
      },
    ]);
  });
});
