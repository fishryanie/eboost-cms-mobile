import { Fingerprint, ScanFace, ShieldCheck, type LucideIcon } from 'lucide-react-native';
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

export function getBiometricSymbolName(authenticationTypes: number[]): LucideIcon {
  if (authenticationTypes.includes(facialRecognitionType)) {
    return ScanFace;
  }

  if (authenticationTypes.includes(fingerprintType)) {
    return Fingerprint;
  }

  return ShieldCheck;
}
