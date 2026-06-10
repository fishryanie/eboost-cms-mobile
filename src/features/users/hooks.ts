import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchUserProfile, fetchUsersPage } from './user-service';
import { getNextUsersPage } from './user-pagination';

export const userKeys = {
  all: ['users'] as const,
  detail: (id: number | string) => ['users', 'detail', String(id)] as const,
  list: (search: string) => ['users', 'list', search] as const,
};

export function useInfiniteUsers(search: string) {
  return useInfiniteQuery({
    getNextPageParam: getNextUsersPage,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchUsersPage({ page: pageParam, search }),
    queryKey: userKeys.list(search),
  });
}

export function useUserProfile(id: number | string) {
  return useQuery({
    enabled: !!id,
    queryFn: () => fetchUserProfile(id),
    queryKey: userKeys.detail(id),
  });
}
