import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cmsServiceGroups, getCmsServiceRoute } from './service-catalog';

describe('cms service catalog', () => {
  it('exposes the primary CMS service groups for the home screen', () => {
    assert.deepEqual(
      cmsServiceGroups.map(service => service.name),
      ['Dashboard', 'PowerTrack', 'Operations', 'Partnerships', 'Marketing', 'Technical', 'Administrators'],
    );
  });

  it('uses route-safe slugs and lucide icons from the CMS menu data', () => {
    for (const service of cmsServiceGroups) {
      assert.match(service.slug, /^[a-z0-9-]+$/);
      assert.equal(typeof service.icon, 'string');
      assert.equal('iconUrl' in service, false);
      assert.equal(getCmsServiceRoute(service), `/menu/${service.slug}`);
      assert.equal(service.routeCount, service.children.length);

      for (const child of service.children) {
        assert.match(child.slug, /^[a-z0-9-]+$/);
        assert.equal(getCmsServiceRoute(child), `/menu/${child.slug}`);
      }
    }
  });
});
