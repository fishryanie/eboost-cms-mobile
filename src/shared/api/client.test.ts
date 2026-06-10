import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApiError, createApiClient } from './client';

describe('createApiClient', () => {
  it('rejects before fetching when the service base URL is missing', async () => {
    let fetchCalled = false;
    const client = createApiClient({
      baseUrls: { core: '' },
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response();
      },
    });

    await assert.rejects(
      () => client.request('api/admin/login', { method: 'POST', skipAuth: true }),
      (error: unknown) => {
        assert.equal(error instanceof ApiError, true);
        assert.equal((error as ApiError).message, 'Missing core API URL. Check the EAS production environment variables.');
        return true;
      },
    );
    assert.equal(fetchCalled, false);
  });

  it('routes requests to the selected service and attaches auth headers', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const client = createApiClient({
      baseUrls: {
        building: 'https://building.example.test',
        core: 'https://core.example.test',
        hub: 'https://hub.example.test',
      },
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init });
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        });
      },
      getToken: async () => 'token-123',
    });

    const result = await client.request<{ ok: boolean }>('api/v1/device/CP-1/reset', {
      data: { type: 'Soft' },
      method: 'POST',
      service: 'hub',
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(calls[0]?.url, 'https://hub.example.test/api/v1/device/CP-1/reset');
    assert.equal((calls[0]?.init?.headers as Record<string, string>).Authorization, 'Bearer token-123');
    assert.equal((calls[0]?.init?.headers as Record<string, string>)['Content-Type'], 'application/json');
    assert.equal(calls[0]?.init?.body, JSON.stringify({ type: 'Soft' }));
  });

  it('uses merge patch content type for PATCH requests and serializes query params', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const client = createApiClient({
      baseUrls: { core: 'https://core.example.test' },
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init });
        return new Response(JSON.stringify({ visible: false }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        });
      },
    });

    await client.request('api/locations/42', {
      data: { visible: false },
      method: 'PATCH',
      params: { pagination: false, station: 10, empty: undefined },
    });

    assert.equal(calls[0]?.url, 'https://core.example.test/api/locations/42?pagination=false&station=10');
    assert.equal((calls[0]?.init?.headers as Record<string, string>)['Content-Type'], 'application/merge-patch+json');
  });

  it('parses JSON-compatible media types used by Hydra APIs', async () => {
    const client = createApiClient({
      baseUrls: { core: 'https://core.example.test' },
      fetchImpl: async () =>
        new Response(JSON.stringify({ 'hydra:member': [{ id: 1 }] }), {
          headers: { 'content-type': 'application/ld+json; charset=utf-8' },
          status: 200,
        }),
    });

    const result = await client.request<{ 'hydra:member': { id: number }[] }>('api/users');

    assert.deepEqual(result, { 'hydra:member': [{ id: 1 }] });
  });

  it('normalizes failed responses into ApiError', async () => {
    const client = createApiClient({
      baseUrls: { core: 'https://core.example.test' },
      fetchImpl: async () =>
        new Response(JSON.stringify({ message: 'Location status is invalid' }), {
          headers: { 'content-type': 'application/json' },
          status: 422,
          statusText: 'Unprocessable Entity',
        }),
    });

    await assert.rejects(
      () => client.request('api/locations/42', { method: 'PATCH' }),
      (error: unknown) => {
        assert.equal(error instanceof ApiError, true);
        assert.equal((error as ApiError).status, 422);
        assert.equal((error as ApiError).message, 'Location status is invalid');
        assert.equal((error as ApiError).service, 'core');
        return true;
      },
    );
  });
});
