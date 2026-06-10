import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createSessionStore } from './session-store';

describe('createSessionStore', () => {
  it('stores, reads, and clears the admin token through the provided storage', async () => {
    const values = new Map<string, string>();
    const store = createSessionStore({
      deleteItemAsync: async key => {
        values.delete(key);
      },
      getItemAsync: async key => values.get(key) ?? null,
      setItemAsync: async (key, value) => {
        values.set(key, value);
      },
    });

    await store.setToken('admin-token');
    assert.equal(await store.getToken(), 'admin-token');

    await store.clearToken();
    assert.equal(await store.getToken(), null);
  });
});
