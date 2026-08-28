import { useQuery } from '@tanstack/react-query';

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

export type CreateAdminNotificationInput = {
  adminIds: number[];
  content: string;
  linkDirect: string;
  message: string;
  title: string;
  type: string;
};

const collectionKeys = ['notifications', 'data', 'items', 'results', 'hydra:member', 'member'] as const;

export const adminNotificationKeys = {
  all: ['admin-notifications'] as const,
  list: (days: number) => ['admin-notifications', 'list', days] as const,
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

export async function fetchAdminNotifications(days = 30) {
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

export function useAdminNotifications(days = 30) {
  return useQuery({
    queryFn: () => fetchAdminNotifications(days),
    queryKey: adminNotificationKeys.list(days),
    refetchInterval: 60_000,
  });
}
