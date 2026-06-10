import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filterLocationsByStatus, getLocationStatusOptions } from './location-filter';
import type { LocationRecord } from './types';

const locations: LocationRecord[] = [
  { id: 1, name: 'A', operationStatus: { label: 'Operating' } },
  { id: 2, name: 'B', operationStatus: { label: 'Terminated' } },
  { id: 3, name: 'C', operationStatus: { label: 'Operating' } },
  { id: 4, name: 'D' },
];

describe('location status filters', () => {
  it('returns unique sorted status options', () => {
    assert.deepEqual(getLocationStatusOptions(locations), ['Operating', 'Terminated', 'Unknown']);
  });

  it('filters locations by status and keeps all locations for an empty filter', () => {
    assert.deepEqual(
      filterLocationsByStatus(locations, 'Operating').map(location => location.id),
      [1, 3],
    );
    assert.deepEqual(
      filterLocationsByStatus(locations, '').map(location => location.id),
      [1, 2, 3, 4],
    );
  });
});
