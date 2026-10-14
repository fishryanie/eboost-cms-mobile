import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint, ScanFace, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { Platform, type PlatformOSType } from 'react-native';

import { biometricCredentialStore } from './biometric-credentials';

const { FINGERPRINT, FACIAL_RECOGNITION, IRIS } = LocalAuthentication.AuthenticationType;

export async function getBiometricAvailability() {
  const unavailable = { authenticationTypes: [] as LocalAuthentication.AuthenticationType[], canUseBiometric: false };

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return unavailable;
  }

  try {
    const [hasHardware, isEnrolled, authenticationTypes, canSaveProtectedCredentials] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      biometricCredentialStore.canUseBiometricAuthentication(),
    ]);
    const hasSupportedType = authenticationTypes.some(type => type === FINGERPRINT || type === FACIAL_RECOGNITION || type === IRIS);

    return {
      authenticationTypes,
      canUseBiometric: hasHardware && isEnrolled && hasSupportedType && canSaveProtectedCredentials,
    };
  } catch {
    return unavailable;
  }
}

function getBiometricType(authenticationTypes: number[], os: PlatformOSType) {
  // Android exposes supported hardware, not which individual method is enrolled.
  // Let the system choose when multiple methods are available.
  if (os !== 'ios' && authenticationTypes.filter(type => type === FINGERPRINT || type === FACIAL_RECOGNITION || type === IRIS).length > 1) {
    return undefined;
  }

  if (authenticationTypes.includes(FACIAL_RECOGNITION)) return FACIAL_RECOGNITION;
  if (authenticationTypes.includes(FINGERPRINT)) return FINGERPRINT;
  if (authenticationTypes.includes(IRIS)) return IRIS;
  return undefined;
}

export function getBiometricButtonLabel(authenticationTypes: number[], os: PlatformOSType) {
  const type = getBiometricType(authenticationTypes, os);

  if (type === FACIAL_RECOGNITION) {
    return os === 'ios' ? 'Face ID' : 'Face recognition';
  }

  if (type === FINGERPRINT) {
    return os === 'ios' ? 'Touch ID' : 'Fingerprint';
  }

  if (type === IRIS) return 'Iris recognition';

  return 'Biometric';
}

export function getBiometricSymbolName(authenticationTypes: number[], os: PlatformOSType): LucideIcon {
  const type = getBiometricType(authenticationTypes, os);

  if (type === FACIAL_RECOGNITION) {
    return ScanFace;
  }

  if (type === FINGERPRINT) {
    return Fingerprint;
  }

  return ShieldCheck;
}
