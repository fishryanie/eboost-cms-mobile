import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const authServiceSource = readFileSync(new URL('../auth-service.ts', import.meta.url), 'utf8');
const appDrawerSource = readFileSync(new URL('../../../components/app-drawer.tsx', import.meta.url), 'utf8');

describe('admin logout', () => {
  it('calls the authenticated GET logout endpoint without attempting a token refresh', () => {
    assert.match(authServiceSource, /export async function logoutAdmin/);
    assert.match(authServiceSource, /apiRequest<void>\('\/api\/logout'/);
    assert.match(authServiceSource, /headers: deviceId \? \{ 'device-id': deviceId \} : undefined/);
    assert.match(authServiceSource, /method: 'GET'/);
    assert.match(authServiceSource, /skipTokenRefresh: true/);
  });

  it('notifies the server before clearing the local session', () => {
    const serverLogoutIndex = appDrawerSource.indexOf('await logoutAdmin()');
    const localLogoutIndex = appDrawerSource.indexOf('await sessionStore.clearTokens()');

    assert.notEqual(serverLogoutIndex, -1);
    assert.notEqual(localLogoutIndex, -1);
    assert.ok(serverLogoutIndex < localLogoutIndex);
  });
});
