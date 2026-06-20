import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';

import { fetchStaffActivities, fetchStaffMember, fetchStaffPage } from './staff-service';
import type { StaffListFilters, StaffMember } from './types';

export const staffKeys = {
  activities: (id: number | string) => ['staff', 'activities', String(id)] as const,
  all: ['staff'] as const,
  detail: (id: number | string) => ['staff', 'detail', String(id)] as const,
  list: (filters: StaffListFilters) => ['staff', 'list', filters] as const,
};

export function useInfiniteStaff(filters: StaffListFilters) {
  return useInfiniteQuery<TechnicalList<StaffMember>, Error, InfiniteData<TechnicalList<StaffMember>>, readonly unknown[], number>({
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((total, page) => total + page.items.length, 0);
      if (lastPage.items.length < 1 || loadedCount >= lastPage.total) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchStaffPage({ ...filters, page: pageParam }),
    queryKey: staffKeys.list(filters),
  });
}

export function useStaffMember(id?: number | string | null) {
  return useQuery({
    enabled: !!id,
    queryFn: () => fetchStaffMember(id as number | string),
    queryKey: staffKeys.detail(id || ''),
  });
}

export function useStaffActivities(id?: number | string | null) {
  return useQuery({
    enabled: !!id,
    queryFn: () => fetchStaffActivities(id as number | string),
    queryKey: staffKeys.activities(id || ''),
  });
}
