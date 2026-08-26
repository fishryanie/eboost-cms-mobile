import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildLocationPartnerBoxPayload, findLocationPartnerBox, getPartnerBoxLookupKeys } from '../location-partnership.ts';

describe('location partnership box helpers', () => {
  it('matches partnership boxes by either unique ID or vendor ID', () => {
    const boxes: LocationPartnerBox[] = [
      { id: 1, uniqueId: 'Ebox_1001' },
      { id: 2, vendorId: 'CAR-2002' },
    ];

    assert.equal(findLocationPartnerBox(boxes, { uniqueId: 'Ebox_1001' })?.id, 1);
    assert.equal(findLocationPartnerBox(boxes, { uniqueId: 'Ecar_2', vendorId: 'CAR-2002' })?.id, 2);
    assert.equal(findLocationPartnerBox(boxes, { uniqueId: 'missing' }), undefined);
  });

  it('normalizes and de-duplicates lookup keys', () => {
    assert.deepEqual(getPartnerBoxLookupKeys({ uniqueId: ' Ebox_1001 ', vendorId: 'Ebox_1001' }), ['Ebox_1001']);
  });

  it('builds bike and car payloads using the same identifier contract as the web CMS', () => {
    assert.deepEqual(buildLocationPartnerBoxPayload({ uniqueId: 'Ebox_1001' }, 42), {
      day_report: 0,
      location_id: 42,
      offset: 0,
      standby_energy: 0,
      unique_id: 'Ebox_1001',
    });
    assert.deepEqual(buildLocationPartnerBoxPayload({ uniqueId: 'Ecar_2', vendorId: 'CAR-2002' }, 42), {
      day_report: 0,
      location_id: 42,
      offset: 0,
      standby_energy: 0,
      vendor_id: 'CAR-2002',
    });
  });

  it('rejects a charger without a partnership identifier', () => {
    assert.throws(() => buildLocationPartnerBoxPayload({}, 42), /identifier is unavailable/i);
  });
});
