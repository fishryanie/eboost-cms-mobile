import { useQuery } from '@tanstack/react-query';

import { sessionStore } from './session-store';

export const sessionKeys = {
  token: ['session-token-state'] as const,
};

export function useSessionToken() {
  return useQuery({
    queryFn: () => sessionStore.getToken(),
    queryKey: sessionKeys.token,
  });
}
