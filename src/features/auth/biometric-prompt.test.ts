import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { consumePendingBiometricCredentials, setPendingBiometricCredentials } from './biometric-prompt';

describe('pending biometric credentials', () => {
  it('keeps credentials in memory until the home prompt consumes them once', () => {
    setPendingBiometricCredentials({ password: 'secret-password', username: 'admin@example.com' });

    assert.deepEqual(consumePendingBiometricCredentials(), {
      password: 'secret-password',
      username: 'admin@example.com',
    });
    assert.equal(consumePendingBiometricCredentials(), null);
  });
});
