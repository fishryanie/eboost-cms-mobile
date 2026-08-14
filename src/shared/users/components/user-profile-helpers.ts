import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { Palette } from 'themes';
import { getDisplayImageUrl } from 'utils/media/image-url';

import { getUserLoginProvider } from '../user-account';
import type { ProfileRecord } from './user-profile-types';

export const profileColors = {
  accent: Palette.accent,
  accentBorder: '#CFE2D7',
  accentSurface: '#EAF3EE',
  danger: '#D92D20',
  dangerBorder: '#FECDCA',
  dangerSurface: '#FEF3F2',
  info: '#1570EF',
  infoSurface: '#EFF8FF',
  purple: '#7F56D9',
  purpleSurface: '#F4F3FF',
  warning: '#B54708',
  warningSurface: '#FFFAEB',
} as const;

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  currency: 'VND',
  maximumFractionDigits: 0,
  style: 'currency',
});

export const numberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 1,
});

export function formatCurrency(value?: number | null) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatDate(value?: string | null, dateOnly = false) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-GB', dateOnly ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatEnergy(value?: number | null) {
  const wattHours = Number(value) || 0;
  if (wattHours >= 1000) return `${numberFormatter.format(wattHours / 1000)} kWh`;
  return `${numberFormatter.format(wattHours)} Wh`;
}

export function formatPhone(value?: string | null) {
  if (!value) return 'Not available';
  const trimmed = value.trim();
  return trimmed.startsWith('84') ? `+${trimmed}` : trimmed;
}

export function getDisplayName(user: UserProfile) {
  return user.name || user.username || user.email || `User #${user.id}`;
}

export function getInitials(user: UserProfile) {
  const source = getDisplayName(user)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getAvatarUrl(user: UserProfile) {
  return getDisplayImageUrl(user.image?.url || user.avatarUrl || user.avatar_url || user.avatar?.url || user.avatar?.path);
}

export function getProviderLabel(username?: string | null) {
  const provider = getUserLoginProvider(username);
  if (provider === 'google') return 'Google account';
  if (provider === 'apple') return 'Apple account';
  return 'Password account';
}

export function getBalanceReason(reason?: string | null) {
  const normalized = String(reason || '').toUpperCase();
  if (normalized.startsWith('EBIKE')) return 'Bike charging';
  if (normalized.startsWith('ECAR')) return 'Car charging';
  if (normalized.startsWith('MM')) return 'MoMo top-up';
  return 'Wallet adjustment';
}

export function getLedgerSummary(user: UserProfile) {
  const history = user.balanceHistory || [];
  const credits = history.filter(item => item.balanceAction === '+');
  const debits = history.filter(item => item.balanceAction !== '+');

  return {
    creditAmount: credits.reduce((total, item) => total + Math.abs(Number(item.amount) || 0), 0),
    creditCount: credits.length,
    debitAmount: debits.reduce((total, item) => total + Math.abs(Number(item.amount) || 0), 0),
    debitCount: debits.length,
  };
}

export function getPaymentSuccessLabel(user: UserProfile) {
  const attempts = [...toProfileRecords(user.momoHistories), ...toProfileRecords(user.alePayHistories)];
  if (!attempts.length) return '—';
  const successes = attempts.filter(item => String(item.status || '').toUpperCase() === 'SUCCESS').length;
  return `${Math.round((successes / attempts.length) * 100)}%`;
}

export function toProfileRecord(value: unknown): ProfileRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as ProfileRecord;
  return { value };
}

export function toProfileRecords(values?: unknown[] | null) {
  return (values || []).map(toProfileRecord);
}

export function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/^./, value => value.toUpperCase());
}

export function formatRecordValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not available';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return numberFormatter.format(value);
  if (typeof value === 'string') {
    const looksLikeDate = /^\d{4}-\d{2}-\d{2}(T|\s)/.test(value);
    return looksLikeDate ? formatDate(value) : value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function getRecordTitle(record: ProfileRecord, index: number) {
  const candidate = record.name || record.code || record.title || record.label || record.invoiceId || record.transactionCode || record.orderCode || record.id;
  return candidate ? String(candidate) : `Record ${index + 1}`;
}

export function getRecordSubtitle(record: ProfileRecord) {
  const status = record.status ? String(record.status) : undefined;
  const date = record.createdAt || record.updatedAt || record.usedAt || record.date;
  const formattedDate = typeof date === 'string' ? formatDate(date) : undefined;
  return [status, formattedDate].filter(Boolean).join(' · ') || 'Tap to view every field';
}

export async function copyProfileValue(value: string, label: string) {
  await Clipboard.setStringAsync(value);
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  Toast.show({
    text1: 'Copied',
    text2: `${label} copied to clipboard.`,
    type: 'success',
  });
}
