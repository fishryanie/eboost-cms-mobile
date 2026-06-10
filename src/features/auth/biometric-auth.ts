import type { PlatformOSType } from 'react-native';

const fingerprintType = 1;
const facialRecognitionType = 2;

export function getBiometricButtonLabel(authenticationTypes: number[], os: PlatformOSType) {
  if (authenticationTypes.includes(facialRecognitionType)) {
    return 'Face ID';
  }

  if (authenticationTypes.includes(fingerprintType)) {
    return os === 'ios' ? 'Touch ID' : 'Fingerprint';
  }

  return 'Biometric';
}

export function getBiometricSymbolName(authenticationTypes: number[]) {
  if (authenticationTypes.includes(facialRecognitionType)) {
    return 'faceid';
  }

  if (authenticationTypes.includes(fingerprintType)) {
    return 'touchid';
  }

  return 'lock.shield';
}
