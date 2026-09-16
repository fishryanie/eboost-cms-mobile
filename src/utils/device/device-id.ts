import * as Application from 'expo-application';
import { Platform } from 'react-native';

let cachedDeviceId: string | undefined;

export async function getDeviceId(): Promise<string | undefined> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const deviceId = Platform.OS === 'android' ? Application.getAndroidId() : Platform.OS === 'ios' ? await Application.getIosIdForVendorAsync() : undefined;

    if (deviceId) {
      cachedDeviceId = deviceId;
    }

    return deviceId || undefined;
  } catch (error) {
    console.error('Failed to get the device ID.', error);
    return undefined;
  }
}
