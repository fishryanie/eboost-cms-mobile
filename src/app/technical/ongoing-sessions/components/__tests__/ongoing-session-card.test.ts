import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildChargingProfileChartData, filterMobileChartSeries } from '../../../../../components/technical/charging-profile-chart.helpers.ts';
import {
  formatSessionDuration,
  formatSessionTime,
  getOngoingSessionKey,
  getOngoingSessionPayment,
  hasChargingProfile,
} from '../ongoing-session-card.helpers.ts';

describe('ongoing session presentation helpers', () => {
  it('formats timestamps and protects against invalid durations', () => {
    const localTimestamp = new Date(2024, 5, 13, 7, 0, 0).getTime() / 1000;

    assert.equal(formatSessionTime(localTimestamp), '2024-06-13 07:00:00');
    assert.equal(formatSessionTime(undefined), '-');
    assert.equal(formatSessionDuration(100, 90), '00:00:00');
    assert.equal(formatSessionDuration(100, 3_865), '01:02:45');
  });

  it('calculates paid total from activation or consumed fee with promotion discount', () => {
    const payment = getOngoingSessionPayment({
      charging_session: {
        activation_fee: 4_900,
        promotion_code: { code: 'SN5PC100' },
        promotion_discount: 37,
        total_consumed_fee: 24_245,
      },
    } as OngoingSessionRecord);

    assert.deepEqual(payment, {
      activation: 4_900,
      charging: 24_245,
      discount: 8_971,
      paidTotal: 15_274,
      promotion: 'SN5PC100',
      promotionPercent: 37,
    });
  });

  it('uses a stable key and only enables profile chart when transaction id exists', () => {
    const record = {
      boxId: 'Ebox_0026',
      charging_session: {
        invoice_id: 'EBIKE6A30BCE15718C',
        transaction_id: null,
      },
      connectorId: 1,
      vendorId: 'vendor-26',
    } as OngoingSessionRecord;

    assert.equal(getOngoingSessionKey(record), 'Ebox_0026-1-EBIKE6A30BCE15718C');
    assert.equal(hasChargingProfile(record), false);
  });

  it('builds multi-line mobile chart data like the web CMS transaction chart', () => {
    const data = buildChargingProfileChartData({
      meterValues: [
        {
          timestamp: '2026-07-08T08:00:00.000Z',
          sampledValues: [
            { measurand: 'Power.Active.Import', value: '33000' },
            { measurand: 'Current.Import', value: '93.2' },
            { measurand: 'Current.Import', phase: 'L1', value: '31.1' },
            { measurand: 'Current.Import', phase: 'L2', value: '30.2' },
            { measurand: 'Current.Import', phase: 'L3', value: '31.9' },
            { measurand: 'Voltage', value: '354' },
            { measurand: 'Voltage', phase: 'L1', value: '230' },
            { measurand: 'SoC', value: '55' },
          ],
        },
      ],
    });

    assert.deepEqual(
      data?.mobileSeries.map(series => series.label),
      ['Power', 'Current', 'L1', 'L2', 'L3', 'SoC', 'Voltage', 'V L1'],
    );
    assert.equal(data?.mobileCurrentSet, undefined);
    assert.deepEqual(
      filterMobileChartSeries(data?.mobileSeries, 'current')?.map(series => series.label),
      ['Current', 'L1', 'L2', 'L3'],
    );
  });
});
