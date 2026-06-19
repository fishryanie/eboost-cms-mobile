import { apiRequest } from 'utils/api/client';

import { parseUsersPage, type HydraUsersResponse } from './user-pagination';
import { getUserSearchParams } from './user-search';

export const usersPageSize = 20;

export async function fetchUsersPage({ page, search }: { page: number; search: string }) {
  const response = await apiRequest<HydraUsersResponse<UserListItem>>('api/users', {
    headers: {
      Accept: 'application/ld+json',
    },
    params: {
      itemsPerPage: usersPageSize,
      page,
      ...getUserSearchParams(search),
    },
  });

  return parseUsersPage(response);
}

export function fetchUserProfile(userId: number | string) {
  return apiRequest<UserProfile>('api/controller/user/profile', {
    params: { userId: String(userId) },
  });
}
