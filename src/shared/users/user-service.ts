import { apiRequest } from 'utils/api/client';
import { getCollectionItems } from 'utils/api/collection';

import { parseUsersPage, type HydraUsersResponse } from './user-pagination';
import { getUserSearchParams } from './user-search';

export const usersPageSize = 20;

export type UserActivityTrendPoint = {
  date?: string | null;
  energy_kwh?: number | string | null;
  orders?: number | string | null;
  time?: string | null;
  total_energy_kwh?: number | string | null;
  total_orders?: number | string | null;
};

export type UserNotificationMessage = {
  '@id'?: string;
  '@type'?: string;
  adminId?: number | string | null;
  contentEn?: string | null;
  contentVn?: string | null;
  id: number;
  imageUrl?: string | null;
  invoiceId?: string | null;
  isSaw?: boolean;
  messageEn?: string | null;
  messageType?: string | null;
  messageVn?: string | null;
  platform?: string | null;
  status?: number | string | null;
  titleEn?: string | null;
  titleVn?: string | null;
  userId: number | string;
  version?: string | null;
};

export type UserSmsLog = {
  '@id'?: string;
  '@type'?: string;
  brandName?: string | null;
  campaignId?: string | null;
  content?: string | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  id: number;
  iriId?: string | null;
  phone?: string | null;
  requestId?: string | null;
  response?: string | null;
  sendDate?: string | null;
  type?: string | null;
  updatedAt?: string | null;
  userId: number | string;
};

type UserActivityTrendResponse = UserActivityTrendPoint[] | { data?: UserActivityTrendPoint[] };

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

export async function fetchUserActivityTrend({ endDate, startDate, userId }: { endDate: string; startDate: string; userId: number | string }) {
  const response = await apiRequest<UserActivityTrendResponse>('api/controller/statistic/chart-statistics', {
    params: {
      endDate,
      period: 'day',
      startDate,
      user: String(userId),
    },
  });

  return getCollectionItems<UserActivityTrendPoint>(response);
}

export async function fetchUserNotificationMessages(userId: number | string) {
  const response = await apiRequest<ApiListResponse<UserNotificationMessage>>('api/notification_messages', {
    params: { userId: String(userId) },
  });

  return getCollectionItems<UserNotificationMessage>(response);
}

export async function fetchUserSmsLogs(userId: number | string) {
  const response = await apiRequest<ApiListResponse<UserSmsLog>>('api/sms_loggers', {
    params: { userId: String(userId) },
  });

  return getCollectionItems<UserSmsLog>(response);
}
