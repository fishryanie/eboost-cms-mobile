import type { BiometricCredentials } from './biometric-credentials';

let pendingBiometricCredentials: BiometricCredentials | null = null;

export function consumePendingBiometricCredentials() {
  const nextCredentials = pendingBiometricCredentials;
  pendingBiometricCredentials = null;
  return nextCredentials;
}

export function setPendingBiometricCredentials(credentials: BiometricCredentials) {
  pendingBiometricCredentials = credentials;
}
