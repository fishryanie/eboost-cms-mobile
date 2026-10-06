import { getAdminIdentity, hydratePermissions } from 'features/administrator-access/model';
import { fetchAdminAccesses } from 'features/administrator-access/service';
import { apiRequest } from 'utils/api/client';
import { getCollectionItems } from 'utils/api/collection';
import type { ApiRequestOptions } from 'utils/api/types';

import type { CurrentAdminAccess } from './model';

type AccessRequest = <T = unknown, D = unknown>(path: string, options?: ApiRequestOptions<D>) => Promise<T>;
type AdminAccount = { id: number | string; roles?: string[]; username?: string };

export async function fetchCurrentAdminAccess(token: string, request: AccessRequest = apiRequest): Promise<CurrentAdminAccess> {
  const identity = getAdminIdentity(token);
  if (!identity?.adminId && !identity?.username) throw new Error('Không xác định được tài khoản. Vui lòng đăng nhập lại.');
  let adminId = identity.adminId;
  let account: AdminAccount | undefined;
  if (!adminId) {
    const response = await request<ApiListResponse<AdminAccount>>('api/admins', { params: { pagination: false, username: identity.username } });
    const matches = getCollectionItems(response).filter(admin => admin.username === identity.username);
    if (matches.length !== 1 || !/^\d+$/.test(String(matches[0].id))) throw new Error('Không xác định được tài khoản. Vui lòng đăng nhập lại.');
    account = matches[0];
    adminId = String(account.id);
  }
  const [recordsResult, profileResult] = await Promise.allSettled([
    fetchAdminAccesses(adminId, request),
    account || (identity.isDeveloper ? undefined : request<AdminAccount>(`api/admins/${adminId}`).catch(() => undefined)),
  ]);
  const profile = profileResult.status === 'fulfilled' ? profileResult.value : undefined;
  const isDeveloper = identity.isDeveloper || Boolean(profile?.roles?.includes('ROLE_DEVELOPER'));
  if (recordsResult.status === 'rejected' && !isDeveloper) throw recordsResult.reason;
  const records = recordsResult.status === 'fulfilled' ? recordsResult.value : [];
  return { adminId, isDeveloper, permissions: hydratePermissions(records) };
}
