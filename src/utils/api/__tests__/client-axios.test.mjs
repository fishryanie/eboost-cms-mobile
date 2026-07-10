import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const clientSource = readFileSync(new URL('../client.ts', import.meta.url), 'utf8');
const typesSource = readFileSync(new URL('../types.ts', import.meta.url), 'utf8');
const authServiceSource = readFileSync(new URL('../../auth/auth-service.ts', import.meta.url), 'utf8');
const sessionStoreSource = readFileSync(new URL('../../session/session-store.ts', import.meta.url), 'utf8');

describe('API client axios transport', () => {
  it('uses axios instead of fetch as the request transport', () => {
    assert.match(clientSource, /import axios/);
    assert.match(clientSource, /axiosImpl/);
    assert.match(typesSource, /axiosImpl\?: AxiosInstance/);
    assert.doesNotMatch(clientSource, /fetchImpl/);
    assert.doesNotMatch(typesSource, /fetchImpl/);
    assert.doesNotMatch(clientSource, /RequestInit/);
    assert.doesNotMatch(clientSource, /parseResponse|response: Response/);
  });

  it('preserves ApiError handling for axios response and network failures', () => {
    assert.match(clientSource, /isAxiosError/);
    assert.match(clientSource, /error\.response/);
    assert.match(clientSource, /status: error\.response\.status/);
    assert.match(clientSource, /raw: error\.response\.data/);
    assert.match(clientSource, /status: 0/);
  });

  it('refreshes the session and retries once when an authenticated request returns 401', () => {
    assert.match(typesSource, /skipTokenRefresh\?: boolean/);
    assert.match(clientSource, /setApiSessionRefreshTokenGetter/);
    assert.match(clientSource, /setApiSessionRefreshHandler/);
    assert.match(clientSource, /refreshSessionToken/);
    assert.match(clientSource, /error\.response\.status === 401/);
    assert.match(clientSource, /!options\.skipTokenRefresh/);
    assert.match(clientSource, /nextAccessToken/);
    assert.match(clientSource, /skipTokenRefresh: true/);
  });

  it('stores refresh tokens and exposes a refresh endpoint response contract', () => {
    assert.match(authServiceSource, /refresh_token\?: string/);
    assert.match(authServiceSource, /refreshToken\?: string/);
    assert.match(authServiceSource, /refreshAdminSession/);
    assert.match(authServiceSource, /api\/admin\/refresh-token/);
    assert.match(sessionStoreSource, /adminRefreshTokenKey/);
    assert.match(sessionStoreSource, /getRefreshToken/);
    assert.match(sessionStoreSource, /setTokens/);
    assert.match(sessionStoreSource, /clearTokens/);
  });
});
