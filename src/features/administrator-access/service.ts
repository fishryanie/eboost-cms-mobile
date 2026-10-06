import { apiRequest } from 'utils/api/client';
import { getCollectionItems } from 'utils/api/collection';
import type { ApiRequestOptions } from 'utils/api/types';
import { sessionStore } from 'utils/session/session-store';

import { administratorsScreen, buildPermissionSaveOperations, getAdminIdentity, splitMethods } from './model';
import type { AdminAccessRecord, PermissionMap } from './types';

type AccessRequest = <TResponse = unknown, TData = unknown>(path: string, options?: ApiRequestOptions<TData>) => Promise<TResponse>;
type AdminAccount = { id: number; roles: string[]; username: string };

export function parseAccessCollection(response: unknown): AdminAccessRecord[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object') {
    const collection = response as Record<string, unknown>;
    if (Array.isArray(collection.member)) return collection.member;
    if (Array.isArray(collection['hydra:member']) || Array.isArray(collection.data)) return getCollectionItems(response as ApiListResponse<AdminAccessRecord>);
  }
  throw new Error('The permissions response could not be read. Please retry.');
}

export async function fetchAdminAccesses(adminId: string, request: AccessRequest = apiRequest) {
  if (!/^\d+$/.test(adminId)) throw new Error('Invalid administrator ID.');
  const response = await request<ApiListResponse<AdminAccessRecord>>('api/admin_accesses', {
    headers: { Accept: 'application/ld+json' },
    params: { admin: adminId, pagination: false },
  });
  // An invalid collection must never become an empty draft that removes existing access.
  return parseAccessCollection(response);
}

export async function fetchManagementAccess(token: string, request: AccessRequest = apiRequest) {
  const identity = getAdminIdentity(token);
  if (!identity?.adminId && !identity?.username) throw new Error('Your administrator account could not be identified. Please sign in again.');
  let account: AdminAccount;
  if (identity.adminId) account = await request<AdminAccount>(`api/admins/${identity.adminId}`);
  else {
    const response = await request<ApiListResponse<AdminAccount>>('api/admins', { params: { pagination: false, username: identity.username } });
    const matches = getCollectionItems(response).filter(admin => admin.username === identity.username);
    if (matches.length !== 1) throw new Error('Your administrator account could not be identified. Please sign in again.');
    account = matches[0];
  }
  if (identity.isDeveloper || account.roles?.includes('ROLE_DEVELOPER')) return { adminId: String(account.id), canUpdate: true };
  const records = await fetchAdminAccesses(String(account.id), request);
  return {
    adminId: String(account.id),
    canUpdate: records.some(record => record.screen === administratorsScreen && splitMethods(record.method).includes('UPDATE')),
  };
}

export async function saveAdminAccesses(adminId: string, permissions: PermissionMap, request: AccessRequest = apiRequest) {
  const token = await sessionStore.getToken();
  if (!token || !(await fetchManagementAccess(token, request)).canUpdate) throw new Error('You do not have permission to update administrator access.');
  // Reload before every save/retry: a previous attempt may have saved only some records.
  const records = await fetchAdminAccesses(adminId, request);
  const operations = buildPermissionSaveOperations(permissions, records, adminId);
  for (const operation of operations) {
    await request(operation.id ? `api/admin_accesses/${encodeURIComponent(operation.id)}` : 'api/admin_accesses', {
      data: operation.body,
      method: operation.method,
    });
  }
  return fetchAdminAccesses(adminId, request);
}
