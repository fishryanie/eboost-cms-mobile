import { useQuery } from '@tanstack/react-query';
import { useSessionToken } from 'utils/session/use-session-token';

import { getAdminIdentity } from './model';
import { fetchAdminAccesses, fetchManagementAccess } from './service';

export const administratorAccessKeys = {
  all: ['administrator-access'] as const,
  records: (adminId: string) => ['administrator-access', 'records', adminId] as const,
};

export function useAdministratorManagementAccess() {
  const session = useSessionToken();
  const token = session.data;
  const identity = token ? getAdminIdentity(token) : undefined;
  const query = useQuery({
    enabled: Boolean(token),
    queryFn: () => fetchManagementAccess(token!),
    queryKey: [...administratorAccessKeys.all, 'management', identity?.adminId || identity?.username || 'unknown'],
    staleTime: 0,
  });
  return { ...query, session };
}

export function useAdministratorAccesses(adminId: string, enabled: boolean) {
  return useQuery({
    enabled: enabled && /^\d+$/.test(adminId),
    queryFn: () => fetchAdminAccesses(adminId),
    queryKey: administratorAccessKeys.records(adminId),
    staleTime: 0,
  });
}
