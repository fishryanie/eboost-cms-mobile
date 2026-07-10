export type SessionStorageAdapter = {
  deleteItemAsync: (key: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<null | string>;
  setItemAsync: (key: string, value: string) => Promise<void>;
};

const adminTokenKey = 'eboost-admin-token';
const adminRefreshTokenKey = 'eboost-admin-refresh-token';

async function getSecureStore(): Promise<SessionStorageAdapter> {
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

export function createSessionStore(storage?: SessionStorageAdapter) {
  const getStorage = () => storage || getSecureStore();

  return {
    async clearToken() {
      const nextStorage = await getStorage();
      await Promise.all([nextStorage.deleteItemAsync(adminTokenKey), nextStorage.deleteItemAsync(adminRefreshTokenKey)]);
    },
    async clearTokens() {
      const nextStorage = await getStorage();
      await Promise.all([nextStorage.deleteItemAsync(adminTokenKey), nextStorage.deleteItemAsync(adminRefreshTokenKey)]);
    },
    getRefreshToken() {
      return Promise.resolve(getStorage()).then(nextStorage => nextStorage.getItemAsync(adminRefreshTokenKey));
    },
    getToken() {
      return Promise.resolve(getStorage()).then(nextStorage => nextStorage.getItemAsync(adminTokenKey));
    },
    setToken(token: string) {
      return Promise.resolve(getStorage()).then(nextStorage => nextStorage.setItemAsync(adminTokenKey, token));
    },
    async setTokens({ refreshToken, token }: { refreshToken?: string; token: string }) {
      const nextStorage = await getStorage();
      await nextStorage.setItemAsync(adminTokenKey, token);

      if (refreshToken) {
        await nextStorage.setItemAsync(adminRefreshTokenKey, refreshToken);
      } else {
        await nextStorage.deleteItemAsync(adminRefreshTokenKey);
      }
    },
  };
}

export const sessionStore = createSessionStore();
