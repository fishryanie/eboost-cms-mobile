import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createBiometricCredentialStore, type BiometricCredentialStorageAdapter } from './biometric-credentials';

function createMemoryStorage(initialValues?: Record<string, string>) {
  const values = new Map<string, string>(Object.entries(initialValues ?? {}));
  const writes: { key: string; options: unknown; value: string }[] = [];
  const storage: BiometricCredentialStorageAdapter = {
    deleteItemAsync: async key => {
      values.delete(key);
    },
    getItemAsync: async key => values.get(key) ?? null,
    setItemAsync: async (key, value, options) => {
      writes.push({ key, options, value });
      values.set(key, value);
    },
  };

  return { storage, values, writes };
}

describe('createBiometricCredentialStore', () => {
  it('stores credentials behind biometric authentication and marks the feature enabled', async () => {
    const { storage, writes } = createMemoryStorage();
    const store = createBiometricCredentialStore(storage);

    await store.saveCredentials({ password: 'secret-password', username: 'admin@example.com' });

    assert.deepEqual(await store.getCredentials(), {
      password: 'secret-password',
      username: 'admin@example.com',
    });
    assert.equal(await store.hasCredentials(), true);
    assert.equal(writes[0]?.key, 'eboost-biometric-credentials');
    assert.deepEqual(writes[0]?.options, {
      authenticationPrompt: 'Unlock saved Eboost CMS credentials.',
      keychainService: 'eboost-cms-biometric-credentials',
      requireAuthentication: true,
    });
  });

  it('clears credentials and the enabled marker', async () => {
    const { storage } = createMemoryStorage();
    const store = createBiometricCredentialStore(storage);

    await store.saveCredentials({ password: 'secret-password', username: 'admin@example.com' });
    await store.clearCredentials();

    assert.equal(await store.getCredentials(), null);
    assert.equal(await store.hasCredentials(), false);
  });

  it('ignores malformed stored credentials', async () => {
    const { storage } = createMemoryStorage({
      'eboost-biometric-credentials': JSON.stringify({ password: 'secret-password' }),
      'eboost-biometric-enabled': 'true',
    });
    const store = createBiometricCredentialStore(storage);

    assert.equal(await store.getCredentials(), null);
    assert.equal(await store.hasCredentials(), true);
  });

  it('stores the last successful username for settings verification', async () => {
    const { storage } = createMemoryStorage();
    const store = createBiometricCredentialStore(storage);

    await store.setLastUsername(' admin@example.com ');

    assert.equal(await store.getLastUsername(), 'admin@example.com');
  });
});
