import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const clientSource = readFileSync(new URL('../client.ts', import.meta.url), 'utf8');
const typesSource = readFileSync(new URL('../types.ts', import.meta.url), 'utf8');

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
});
