import dayjs from 'dayjs';

import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';

import type { StaffActivityLog, StaffCreateInput, StaffListFilters, StaffMember, StaffUpdateInput } from './types';

export const staffPageSize = 20;

export const staffRoles = [
  'ROLE_VIEWER',
  'ROLE_TECHNICIAN',
  'ROLE_CUSTOMER_SERVICE',
  'ROLE_MARKETING',
  'ROLE_EDITOR',
  'ROLE_STAFF',
  'ROLE_ADMIN',
  'ROLE_SUPER_ADMIN',
  'ROLE_DEVELOPER',
] as const;

type StaffPageParams = StaffListFilters & {
  page: number;
};

export function formatStaffRole(role: string) {
  return role.replace('ROLE_', '').replaceAll('_', ' ');
}

export function formatStaffRoleSummary(roles?: string[]) {
  if (!roles?.length) return 'No role';
  if (roles.length <= 2) return roles.map(formatStaffRole).join(', ');
  return `${formatStaffRole(roles[0])}, ${formatStaffRole(roles[1])} +${roles.length - 2}`;
}

export function parseStaffPage(response: ApiListResponse<StaffMember>) {
  return getCollectionResult(response);
}

export async function fetchStaffPage({ id, email, enabled, username, page }: StaffPageParams) {
  const response = await apiRequest<ApiListResponse<StaffMember>>('api/admins', {
    headers: {
      Accept: 'application/ld+json',
    },
    params: {
      id,
      email,
      enabled,
      username,
      itemsPerPage: staffPageSize,
      page,
    },
  });

  return parseStaffPage(response);
}

export function fetchStaffMember(id: number | string) {
  return apiRequest<StaffMember>(`api/admins/${id}`);
}

export async function fetchStaffActivities(id: number | string) {
  const response = await apiRequest<ApiListResponse<StaffActivityLog>>('api/admin_logs', {
    headers: {
      Accept: 'application/ld+json',
    },
    params: {
      'admin.id': String(id),
      itemsPerPage: 20,
      page: 1,
    },
  });

  return getCollectionResult(response).items;
}

export function createStaffMember(input: StaffCreateInput) {
  return apiRequest<StaffMember, StaffCreateInput>('api/admins', {
    data: input,
    method: 'POST',
  });
}

export function updateStaffMember(id: number | string, input: StaffUpdateInput) {
  return apiRequest<StaffMember, StaffUpdateInput>(`api/admins/${id}`, {
    data: input,
    method: 'PATCH',
  });
}

export function updateStaffPassword(id: number | string, password: string) {
  return apiRequest<{ message?: string; statusCode?: string; success?: boolean }>('api/controller/password/admin/update-password-admin', {
    data: { id, password },
    method: 'POST',
  });
}

export function resetStaffPassword(id: number | string) {
  return apiRequest<{ message?: string; success?: boolean }>('api/controller/password/admin/reset-password', {
    data: { adminId: id },
    method: 'POST',
  });
}

export function archiveStaffMember(member: Pick<StaffMember, 'id' | 'name'>) {
  return apiRequest<StaffMember>(`api/admins/${member.id}`, {
    data: {
      deletedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      name: `${member.name}_archived`,
    },
    method: 'PATCH',
  });
}

export function restoreStaffMember(member: Pick<StaffMember, 'id' | 'name'>) {
  return apiRequest<StaffMember>(`api/admins/${member.id}`, {
    data: {
      deletedAt: null,
      name: member.name.endsWith('_archived') ? member.name.replace(/_archived$/, '') : member.name,
    },
    method: 'PATCH',
  });
}
