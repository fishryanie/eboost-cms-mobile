export type BiometricCredentials = {
  password: string;
  username: string;
};

export type BiometricCredentialStorageOptions = {
  authenticationPrompt?: string;
  keychainService?: string;
  requireAuthentication?: boolean;
};

export type BiometricCredentialStorageAdapter = {
  canUseBiometricAuthentication?: () => boolean;
  deleteItemAsync: (key: string, options?: BiometricCredentialStorageOptions) => Promise<void>;
  getItemAsync: (key: string, options?: BiometricCredentialStorageOptions) => Promise<null | string>;
  setItemAsync: (key: string, value: string, options?: BiometricCredentialStorageOptions) => Promise<void>;
};

const biometricCredentialsKey = 'eboost-biometric-credentials';
const biometricEnabledKey = 'eboost-biometric-enabled';
const biometricKeychainService = 'eboost-cms-biometric-credentials';
const biometricPrompt = 'Unlock saved Eboost CMS credentials.';
const lastUsernameKey = 'eboost-last-admin-username';

async function getSecureStore(): Promise<BiometricCredentialStorageAdapter> {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      deleteItemAsync: async key => {
        window.localStorage.removeItem(key);
      },
      getItemAsync: async key => window.localStorage.getItem(key),
      setItemAsync: async (key, value) => {
        window.localStorage.setItem(key, value);
      },
    };
  }

  return import('expo-secure-store');
}

function parseCredentials(value: null | string): BiometricCredentials | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<BiometricCredentials>;

    if (typeof parsed.username === 'string' && parsed.username.length > 0 && typeof parsed.password === 'string' && parsed.password.length > 0) {
      return {
        password: parsed.password,
        username: parsed.username,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function createBiometricCredentialStore(storage?: BiometricCredentialStorageAdapter) {
  const getStorage = () => storage || getSecureStore();
  const protectedOptions: BiometricCredentialStorageOptions = {
    authenticationPrompt: biometricPrompt,
    keychainService: biometricKeychainService,
    requireAuthentication: true,
  };
  const credentialLookupOptions: BiometricCredentialStorageOptions = {
    keychainService: biometricKeychainService,
  };

  return {
    async canUseBiometricAuthentication() {
      const nextStorage = await getStorage();
      return nextStorage.canUseBiometricAuthentication?.() ?? false;
    },
    async clearCredentials() {
      const nextStorage = await getStorage();
      await Promise.all([nextStorage.deleteItemAsync(biometricCredentialsKey, credentialLookupOptions), nextStorage.deleteItemAsync(biometricEnabledKey)]);
    },
    async getCredentials() {
      const nextStorage = await getStorage();
      const value = await nextStorage.getItemAsync(biometricCredentialsKey, protectedOptions);
      return parseCredentials(value);
    },
    async getLastUsername() {
      const nextStorage = await getStorage();
      return nextStorage.getItemAsync(lastUsernameKey);
    },
    async hasCredentials() {
      const nextStorage = await getStorage();
      const enabled = await nextStorage.getItemAsync(biometricEnabledKey);

      if (enabled !== 'true') {
        return false;
      }

      return enabled === 'true';
    },
    async saveCredentials(credentials: BiometricCredentials) {
      const nextStorage = await getStorage();
      await nextStorage.setItemAsync(biometricCredentialsKey, JSON.stringify(credentials), protectedOptions);
      await nextStorage.setItemAsync(biometricEnabledKey, 'true');
    },
    async setLastUsername(username: string) {
      const nextStorage = await getStorage();
      await nextStorage.setItemAsync(lastUsernameKey, username.trim());
    },
  };
}

export const biometricCredentialStore = createBiometricCredentialStore();
