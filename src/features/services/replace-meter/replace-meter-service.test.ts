import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { replaceMeter } from './replace-meter-service';

describe('replace meter service', () => {
  it('creates replacement reports, updates their meter values, and writes partner logs', async () => {
    const calls: { options?: { data?: unknown; method?: string; service?: string }; url: string }[] = [];
    const request = async (url: string, options?: { data?: unknown; method?: string; service?: string }) => {
      calls.push({ options, url });

      if (url === 'api/v2/boxes/car/meter-report') {
        return calls.filter(call => call.url === url).length === 1
          ? {
              data: {
                id: 101,
                offset: 3,
                old_index: 10,
                old_index_real_time: 11,
                price: 4200,
                profit: 12,
                profit_mode: 'percent',
                standby_energy: 5,
                vat: 8,
              },
            }
          : {
              data: {
                id: 102,
                offset: 4,
                old_index: 20,
                old_index_real_time: 21,
                price: 4300,
                profit: 13,
                standby_energy: 6,
                vat: 9,
              },
            };
      }

      return { ok: true };
    };

    const result = await replaceMeter({
      boxIdentifier: 'CP-001',
      chargerType: 'car',
      closingIndex: '123.45',
      connectorId: 2,
      newMeterIndex: 7,
      partnerBoxId: 78,
      partnershipLocationId: 55,
      replacementDate: '2026-06-12',
      request,
    });

    assert.deepEqual(result, {
      installMeterReportId: 102,
      removeMeterReportId: 101,
    });
    assert.deepEqual(calls, [
      {
        options: {
          data: {
            box_id: 'CP-001',
            connector_id: 2,
            isCalculate: true,
            reading_date: '2026-06-12',
            unit: 'kWh',
          },
          method: 'POST',
          service: 'building',
        },
        url: 'api/v2/boxes/car/meter-report',
      },
      {
        options: {
          data: {
            box_id: 'CP-001',
            connector_id: 2,
            isCalculate: true,
            reading_date: '2026-06-13',
            unit: 'kWh',
          },
          method: 'POST',
          service: 'building',
        },
        url: 'api/v2/boxes/car/meter-report',
      },
      {
        options: {
          data: {
            comment: 'CLOSING_METER_READING',
            new_index: 123.45,
            new_index_real_time: 123.45,
            noted: '',
            offset: 3,
            old_index: 10,
            old_index_real_time: 11,
            price: 4200,
            profit: 12,
            profit_mode: 'percent',
            standby_energy: 5,
            vat: 8,
          },
          method: 'PUT',
          service: 'building',
        },
        url: 'api/v1/partner/locations/55/meter-report/101',
      },
      {
        options: {
          data: {
            comment: 'THAY_METER',
            new_index: 7,
            new_index_real_time: 7,
            noted: '',
            offset: 4,
            old_index: 7,
            old_index_real_time: 7,
            price: 4300,
            profit: 13,
            profit_mode: 'percent',
            standby_energy: 6,
            vat: 9,
          },
          method: 'PUT',
          service: 'building',
        },
        url: 'api/v1/partner/locations/55/meter-report/102',
      },
      {
        options: {
          data: {
            box_id: 78,
            description: 'Close meter data before meter replacement.',
            log_date: '2026-06-12',
            offset: 123.45,
            status: 'remove_meter',
          },
          method: 'POST',
          service: 'building',
        },
        url: 'api/v1/partner/locations/55/charger-logs',
      },
      {
        options: {
          data: {
            box_id: 78,
            description: 'Install new meter and record the initial meter index.',
            log_date: '2026-06-13',
            offset: 7,
            status: 'install_meter',
          },
          method: 'POST',
          service: 'building',
        },
        url: 'api/v1/partner/locations/55/charger-logs',
      },
    ]);
  });
});
