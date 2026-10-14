import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { apiRequest } from 'utils/api/client';

export type AdminNotificationId = number | string;

export type AdminNotification = {
  content: string | null;
  createdAt: string | null;
  id: AdminNotificationId;
  isRead: boolean;
  linkDirect: string | null;
  message: string;
  title: string;
  type: string | null;
};

export type AdminNotificationCategory = 'BOX_ISSUE' | 'BOX_RECOVERY' | 'OTHER';

export type AdminNotificationFilters = {
  createdFrom?: string;
  createdTo?: string;
  title?: string;
  type?: string;
};

export type AdminNotificationsPage = {
  items: AdminNotification[];
  nextPage: number | undefined;
};

export type AdminNotificationCache = AdminNotification[] | InfiniteData<AdminNotificationsPage, number>;

const notificationPageSize = 5;

export type CreateAdminNotificationInput = {
  adminIds: number[];
  content: string;
  linkDirect: string;
  message: string;
  title: string;
  type: string;
};

export function getNotificationCategory(type: string | null | undefined): AdminNotificationCategory | null {
  if (!type) return null;
  const normalized = type
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (normalized === 'BOX_ISSUE' || normalized.includes('BOX_ISSUE')) return 'BOX_ISSUE';
  if (normalized === 'BOX_RECOVERY' || normalized.includes('BOX_RECOVERY')) return 'BOX_RECOVERY';
  return 'OTHER';
}

export function getNotificationTypeLabel(type: string | null | undefined): string | null {
  if (!type) return null;
  const category = getNotificationCategory(type);
  if (category === 'BOX_ISSUE') return 'Box Issue';
  if (category === 'BOX_RECOVERY') return 'Box Recovery';
  return type
    .trim()
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

const collectionKeys = ['inbox', 'notifications', 'data', 'items', 'results', 'hydra:member', 'member'] as const;

export const adminNotificationKeys = {
  all: ['admin-notifications'] as const,
  list: (days: number) => ['admin-notifications', 'list', days] as const,
  infinite: (filters: AdminNotificationFilters, itemsPerPage = notificationPageSize) => ['admin-notifications', 'infinite', filters, itemsPerPage] as const,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNotificationRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));

  const record = asRecord(payload);
  if (!record) return [];

  for (const key of collectionKeys) {
    const value = record[key];
    if (Array.isArray(value)) return value.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
    if (asRecord(value)) {
      const nestedRecords = getNotificationRecords(value);
      if (nestedRecords.length) return nestedRecords;
    }
  }

  return [];
}

function getNotificationId(record: Record<string, unknown>): AdminNotificationId | null {
  const id = record.id ?? record.notificationId ?? record.notification_id;
  if (typeof id === 'number' || (typeof id === 'string' && id.trim())) return id;

  const iri = asText(record['@id']);
  const iriId = iri?.match(/\/([^/]+)\/?$/)?.[1];
  return iriId || null;
}

function getReadState(record: Record<string, unknown>) {
  const value = record.isRead ?? record.is_read ?? record.read;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['1', 'true', 'read'].includes(value.toLowerCase());

  const readAt = record.readAt ?? record.read_at;
  if (readAt !== undefined) return readAt !== null && readAt !== '';

  return asText(record.status)?.toLowerCase() === 'read';
}

function normalizeNotification(record: Record<string, unknown>): AdminNotification | null {
  const id = getNotificationId(record);
  if (id === null) return null;

  return {
    content: asText(record.content),
    createdAt: asText(record.createdAt ?? record.created_at ?? record.sentAt ?? record.sent_at ?? record.date),
    id,
    isRead: getReadState(record),
    linkDirect: asText(record.linkDirect ?? record.link_direct),
    message: asText(record.message) || asText(record.content) || 'No message content',
    title: asText(record.title) || 'Notification',
    type: asText(record.type),
  };
}

export function parseAdminNotifications(payload: unknown) {
  return getNotificationRecords(payload)
    .map(normalizeNotification)
    .filter((item): item is AdminNotification => Boolean(item))
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
}

export function getAdminNotificationDateFilters(days: number, now = dayjs()): AdminNotificationFilters {
  return {
    createdFrom: now.subtract(days - 1, 'day').format('YYYY-MM-DD'),
    createdTo: now.format('YYYY-MM-DD'),
  };
}

export function parseAdminNotificationsPage(payload: unknown, page: number, itemsPerPage: number): AdminNotificationsPage {
  const record = asRecord(payload);
  const pagination = asRecord(record?.pagination);
  const view = asRecord(record?.['hydra:view']);
  const records = getNotificationRecords(payload);
  const totalPages = pagination?.total_pages;
  const totalItems = record?.['hydra:totalItems'] ?? record?.totalItems ?? pagination?.total_items;
  let nextPage: number | undefined;

  if (records.length > 0) {
    if (view) {
      const match = asText(view['hydra:next'])?.match(/[?&]page=(\d+)/);
      const next = match ? Number(match[1]) : undefined;
      nextPage = next && next > page ? next : undefined;
    } else if (typeof totalPages === 'number') {
      nextPage = page < totalPages ? page + 1 : undefined;
    } else if (typeof totalItems === 'number') {
      nextPage = page * itemsPerPage < totalItems ? page + 1 : undefined;
    } else {
      nextPage = records.length >= itemsPerPage ? page + 1 : undefined;
    }
  }

  return { items: parseAdminNotifications(payload), nextPage };
}

export function getNextAdminNotificationsPage(lastPage: AdminNotificationsPage, pages: AdminNotificationsPage[]) {
  if (pages.length > 1 && lastPage.items.length > 0) {
    const previousIds = new Set(pages.slice(0, -1).flatMap(page => page.items.map(item => String(item.id))));
    if (lastPage.items.every(item => previousIds.has(String(item.id)))) return undefined;
  }
  return lastPage.nextPage;
}

export function mergeAdminNotificationPages(pages: AdminNotificationsPage[]) {
  const notifications = new Map<string, AdminNotification>();
  for (const page of pages) {
    for (const notification of page.items) {
      const id = String(notification.id);
      if (!notifications.has(id)) notifications.set(id, notification);
    }
  }
  return [...notifications.values()].sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
}

export function updateAdminNotificationCache(current: AdminNotificationCache | undefined, update: (items: AdminNotification[]) => AdminNotification[]) {
  if (!current) return current;
  if (Array.isArray(current)) return update(current);
  return { ...current, pages: current.pages.map(page => ({ ...page, items: update(page.items) })) };
}

export async function fetchAdminNotificationsPage(filters: AdminNotificationFilters, page = 1, itemsPerPage = notificationPageSize) {
  const response = await apiRequest<unknown>('api/controller/admin-notification/get-data', {
    params: { ...filters, itemsPerPage, page },
  });
  return parseAdminNotificationsPage(response, page, itemsPerPage);
}

export function useInfiniteAdminNotifications(filters: AdminNotificationFilters) {
  return useInfiniteQuery({
    queryKey: adminNotificationKeys.infinite(filters),
    queryFn: ({ pageParam }) => fetchAdminNotificationsPage(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: getNextAdminNotificationsPage,
    refetchInterval: 60_000,
  });
}

export async function fetchAdminNotifications(days = 1) {
  const response = await apiRequest<unknown>('api/controller/admin-notification/get-data', {
    params: { days },
  });

  return parseAdminNotifications(response);
}

export function readAdminNotification(notificationId: AdminNotificationId) {
  return apiRequest(`api/controller/admin-notification/read/${encodeURIComponent(String(notificationId))}`);
}

export function deleteAdminNotification(notificationId: AdminNotificationId) {
  return apiRequest(`api/controller/admin-notification/delete/${encodeURIComponent(String(notificationId))}`, {
    method: 'DELETE',
  });
}

export function createAdminNotification(input: CreateAdminNotificationInput) {
  return apiRequest('api/controller/admin-notification/create', {
    data: input,
    method: 'POST',
  });
}

export function useAdminNotifications(days = 1) {
  return useQuery({
    queryFn: () => fetchAdminNotifications(days),
    queryKey: adminNotificationKeys.list(days),
    refetchInterval: 60_000,
  });
}
