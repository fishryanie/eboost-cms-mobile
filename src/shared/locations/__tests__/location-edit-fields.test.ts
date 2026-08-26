import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildLocationEditorPayloads } from '../location-edit-fields.ts';

describe('location editor payloads', () => {
  it('builds core and partnership payloads for shared fields', () => {
    assert.deepEqual(buildLocationEditorPayloads('nameVn', 'Trạm Quận 1'), {
      operation: { nameVn: 'Trạm Quận 1' },
      partnership: { name: 'Trạm Quận 1' },
    });
    assert.deepEqual(buildLocationEditorPayloads('addressVn', '1 Nguyễn Huệ'), {
      operation: { addressVn: '1 Nguyễn Huệ' },
      partnership: { address: '1 Nguyễn Huệ' },
    });
    assert.deepEqual(buildLocationEditorPayloads('province', '79'), {
      operation: { province: '/api/provinces/79' },
      partnership: { province_id: 79 },
    });
    assert.deepEqual(buildLocationEditorPayloads('ward', '26734'), {
      operation: { ward: '/api/wards/26734' },
      partnership: { district_id: 26734 },
    });
    assert.deepEqual(buildLocationEditorPayloads('locationCode', 'EVM-Q1-01'), {
      operation: { locationCode: 'EVM-Q1-01' },
      partnership: { location_code: 'Q1-01', report_code: 'EVM-Q1-01' },
    });
  });

  it('keeps system-specific fields on their own API', () => {
    assert.deepEqual(buildLocationEditorPayloads('name', 'District 1 Station'), {
      operation: { name: 'District 1 Station' },
    });
    assert.deepEqual(buildLocationEditorPayloads('contractCode', 'CTR-01'), {
      partnership: { contract_code: 'CTR-01' },
    });
  });
});
