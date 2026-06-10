import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getLocationVisibilityAction, restoreLocationName, runRecursiveLocationVisibility } from './location-actions';
import type { LocationRecord } from './types';

const operatingLocation: LocationRecord = {
  id: 7,
  name: 'Mall A',
  operationStatus: { label: 'Operating' },
  visible: false,
};

describe('location actions', () => {
  it('allows showing only operating locations', () => {
    assert.deepEqual(getLocationVisibilityAction(operatingLocation), {
      allowed: true,
      nextVisible: true,
      title: 'Show Location',
    });

    assert.deepEqual(
      getLocationVisibilityAction({
        ...operatingLocation,
        operationStatus: { label: 'Terminated' },
      }),
      {
        allowed: false,
        message: 'Location status must be Operating to show on map.',
        nextVisible: true,
        title: 'Show Location',
      },
    );
  });

  it('allows hiding only stopped, uninstalled, or terminated locations', () => {
    assert.deepEqual(
      getLocationVisibilityAction({
        ...operatingLocation,
        operationStatus: { label: 'Temp Uninstalled' },
        visible: true,
      }),
      {
        allowed: true,
        nextVisible: false,
        title: 'Hide Location',
      },
    );

    assert.deepEqual(
      getLocationVisibilityAction({
        ...operatingLocation,
        visible: true,
      }),
      {
        allowed: false,
        message: 'Location status must be Temp Stop, Temp Uninstalled, Uninstalled or Terminated to hide.',
        nextVisible: false,
        title: 'Hide Location',
      },
    );
  });

  it('patches a location, stations, chargers, and ports during recursive visibility updates', async () => {
    const calls: { url: string; options?: unknown }[] = [];
    const request = async <T>(url: string, options?: unknown): Promise<T> => {
      calls.push({ url, options });
      if (url === 'api/stations') return [{ id: 2 }] as T;
      if (url === 'api/car_boxes') return [{ id: 3, carConnectors: [{ id: 4 }] }] as T;
      if (url === 'api/bike_boxes') return [{ id: 5, outlets: [{ id: 6 }] }] as T;
      return undefined as T;
    };

    await runRecursiveLocationVisibility({ locationId: 1, request, visible: false });

    assert.deepEqual(
      calls.map(call => call.url),
      [
        'api/locations/1',
        'api/stations',
        'api/stations/2',
        'api/car_boxes',
        'api/bike_boxes',
        'api/car_boxes/3',
        'api/car_connectors/4',
        'api/bike_boxes/5',
        'api/outlets/6',
      ],
    );
  });

  it('normalizes restored location names', () => {
    assert.equal(restoreLocationName('Depot_deleted'), 'Depot');
    assert.equal(restoreLocationName('Depot_archived'), 'Depot');
    assert.equal(restoreLocationName('Depot'), 'Depot');
  });
});
