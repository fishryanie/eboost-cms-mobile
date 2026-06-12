import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { quickServiceGroups } from './quick-service-catalog';

describe('quick service catalog', () => {
  it('exposes charger services as the first quick service group', () => {
    assert.equal(quickServiceGroups[0]?.name, 'Charger Services');
    assert.deepEqual(
      quickServiceGroups[0]?.services.map(service => service.name),
      [
        'Trigger Charger',
        'Reset',
        'Uninstall Charger',
        'Reinstall Charger',
        'Unlock Charger',
        'Replace Meter',
        'Replace Charger',
        'Add Charger',
        'Download QR Code',
        'Edit Charger Information',
        'Change Charger Price',
        'View Charger Details',
      ],
    );
  });

  it('keeps quick service groups route-safe and icon-backed', () => {
    for (const group of quickServiceGroups) {
      assert.match(group.slug, /^[a-z0-9-]+$/);

      for (const service of group.services) {
        assert.match(service.slug, /^[a-z0-9-]+$/);
        assert.equal(typeof service.icon, 'string');
        assert.equal('iconAsset' in service, false);
      }
    }
  });
});
