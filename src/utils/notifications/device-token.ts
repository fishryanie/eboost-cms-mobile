import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let cachedDeviceToken: string | undefined;
let tokenRegistrationInFlight: Promise<string | undefined> | undefined;

export function getNotificationDeviceToken() {
  if (cachedDeviceToken) {
    return Promise.resolve(cachedDeviceToken);
  }

  if (!tokenRegistrationInFlight) {
    tokenRegistrationInFlight = registerForPushNotifications()
      .then(token => {
        cachedDeviceToken = token;
        return token;
      })
      .finally(() => {
        tokenRegistrationInFlight = undefined;
      });
  }

  return tokenRegistrationInFlight;
}

async function registerForPushNotifications(): Promise<string | undefined> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        importance: Notifications.AndroidImportance.MAX,
        lightColor: '#FF231F7C',
        name: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    if (!Device.isDevice) {
      console.warn('Must use a physical device for push notifications.');
      return undefined;
    }

    const currentPermissions = await Notifications.getPermissionsAsync();
    const finalPermissions = currentPermissions.granted ? currentPermissions : await Notifications.requestPermissionsAsync();

    if (!finalPermissions.granted) {
      console.warn('Push notification permission was not granted.');
      return undefined;
    }

    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === 'string' ? token.data : undefined;
  } catch (error) {
    console.error('Failed to get the native push token.', error);
    return undefined;
  }
}
