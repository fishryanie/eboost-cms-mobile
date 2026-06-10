import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getBiometricButtonLabel, getBiometricSymbolName } from './biometric-auth';

describe('getBiometricButtonLabel', () => {
  it('prefers Face ID when facial recognition is available', () => {
    assert.equal(getBiometricButtonLabel([1, 2], 'ios'), 'Face ID');
  });

  it('uses Touch ID for iOS fingerprint authentication', () => {
    assert.equal(getBiometricButtonLabel([1], 'ios'), 'Touch ID');
  });

  it('uses Fingerprint for Android fingerprint authentication', () => {
    assert.equal(getBiometricButtonLabel([1], 'android'), 'Fingerprint');
  });
});

describe('getBiometricSymbolName', () => {
  it('uses the Face ID symbol when facial recognition is available', () => {
    assert.equal(getBiometricSymbolName([2]), 'faceid');
  });

  it('uses the Touch ID symbol when fingerprint authentication is available', () => {
    assert.equal(getBiometricSymbolName([1]), 'touchid');
  });
});
