import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router/react-navigation';
import type { AccessMethod } from 'features/administrator-access/types';
import { useSessionToken } from 'utils/session/use-session-token';

import { hasScreenAccess } from './model';
import { fetchCurrentAdminAccess } from './service';

export const currentAdminAccessKeys = {
  all: ['current-admin-access'] as const,
  session: (token?: string | null) => ['current-admin-access', token || null] as const,
};

export function useCurrentAdminAccess(poll = false) {
  const session = useSessionToken();
  const focused = useIsFocused();
  const token = session.data;
  const query = useQuery({
    enabled: Boolean(token) && focused,
    queryFn: () => fetchCurrentAdminAccess(token!),
    queryKey: currentAdminAccessKeys.session(token),
    staleTime: 30_000,
    refetchInterval: focused && poll ? 30_000 : false,
  });
  return {
    ...query,
    session,
    canAccess: (screen: string, methods: AccessMethod[] = ['READ']) => !query.isError && hasScreenAccess(query.data, screen, methods),
  };
}
