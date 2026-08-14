import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchUserActivityTrend, fetchUserNotificationMessages, fetchUserProfile, fetchUsersPage, fetchUserSmsLogs } from './user-service';
import { getNextUsersPage } from './user-pagination';

export const userKeys = {
  all: ['users'] as const,
  activityTrend: (id: number | string, startDate: string, endDate: string) => ['users', 'activity-trend', String(id), startDate, endDate] as const,
  detail: (id: number | string) => ['users', 'detail', String(id)] as const,
  list: (search: string) => ['users', 'list', search] as const,
  notificationMessages: (id: number | string) => ['users', 'notification-messages', String(id)] as const,
  smsLogs: (id: number | string) => ['users', 'sms-logs', String(id)] as const,
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

export function useUserActivityTrend(id: number | string, startDate: string, endDate: string) {
  return useQuery({
    enabled: !!id && !!startDate && !!endDate,
    queryFn: () => fetchUserActivityTrend({ endDate, startDate, userId: id }),
    queryKey: userKeys.activityTrend(id, startDate, endDate),
    staleTime: 1000 * 60 * 10,
  });
}

export function useUserNotificationMessages(id: number | string, enabled = true) {
  return useQuery({
    enabled: enabled && !!id,
    queryFn: () => fetchUserNotificationMessages(id),
    queryKey: userKeys.notificationMessages(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserSmsLogs(id: number | string, enabled = true) {
  return useQuery({
    enabled: enabled && !!id,
    queryFn: () => fetchUserSmsLogs(id),
    queryKey: userKeys.smsLogs(id),
    staleTime: 1000 * 60 * 5,
  });
}
