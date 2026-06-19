export type SessionStorageAdapter = {
  deleteItemAsync: (key: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<null | string>;
  setItemAsync: (key: string, value: string) => Promise<void>;
};

const adminTokenKey = 'eboost-admin-token';

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
    clearToken() {
      return Promise.resolve(getStorage()).then(nextStorage => nextStorage.deleteItemAsync(adminTokenKey));
    },
    getToken() {
      return Promise.resolve(getStorage()).then(nextStorage => nextStorage.getItemAsync(adminTokenKey));
    },
    setToken(token: string) {
      return Promise.resolve(getStorage()).then(nextStorage => nextStorage.setItemAsync(adminTokenKey, token));
    },
  };
}

export const sessionStore = createSessionStore();
