import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getPeakUsageIntensity, getPeakUsageMaxValue, normalizePeakUsageHour, normalizePeakUsageRows } from '../peak-usage-hours.helpers.ts';

describe('peak usage hours helpers', () => {
  it('normalizes hours, day values, and sorts rows by hour', () => {
    const rows = normalizePeakUsageRows([
      { hour: '26', mon: '4', tue: null, wed: 'bad', thu: 2, fri: undefined, sat: 1, sun: 0 },
      { hour: 3, mon: 8, tue: '5', wed: 2, thu: 1, fri: 0, sat: null, sun: '7' },
      { hour: 'not-a-number', mon: '1' },
    ]);

    assert.deepEqual(
      rows.map(row => row.hour),
      ['00', '03', '23'],
    );
    assert.equal(rows[0].mon, 1);
    assert.equal(rows[1].tue, 5);
    assert.equal(rows[2].wed, 0);
  });

  it('calculates heatmap max and intensity buckets', () => {
    const rows = normalizePeakUsageRows([
      { hour: 1, mon: 0, tue: 3, wed: 7, thu: 9 },
      { hour: 2, mon: 10, tue: 1 },
    ]);

    assert.equal(getPeakUsageMaxValue(rows), 10);
    assert.equal(getPeakUsageIntensity(0, 10), 'empty');
    assert.equal(getPeakUsageIntensity(2, 10), 'low');
    assert.equal(getPeakUsageIntensity(5, 10), 'medium');
    assert.equal(getPeakUsageIntensity(7, 10), 'high');
    assert.equal(getPeakUsageIntensity(9, 10), 'peak');
  });

  it('pads and clamps hour labels', () => {
    assert.equal(normalizePeakUsageHour(7), '07');
    assert.equal(normalizePeakUsageHour('-2'), '00');
    assert.equal(normalizePeakUsageHour(88), '23');
  });
});
