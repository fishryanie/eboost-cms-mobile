import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defaultNotificationRoute, getNotificationRoute } from '../notification-route.ts';

describe('notification navigation route', () => {
  it('supports camelCase, snake_case, and legacy URL payload fields', () => {
    assert.equal(getNotificationRoute({ linkDirect: '/notifications' }), '/notifications');
    assert.equal(getNotificationRoute({ link_direct: '/technical/network-issues' }), '/technical/network-issues');
    assert.equal(getNotificationRoute({ url: '/station/123' }), '/station/123');
  });

  it('uses the notification inbox when the payload route is missing or unsafe', () => {
    assert.equal(getNotificationRoute(), defaultNotificationRoute);
    assert.equal(getNotificationRoute({ linkDirect: '' }), defaultNotificationRoute);
    assert.equal(getNotificationRoute({ link_direct: 'https://example.com' }), defaultNotificationRoute);
    assert.equal(getNotificationRoute({ url: '//example.com' }), defaultNotificationRoute);
  });
});
