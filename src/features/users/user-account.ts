export type UserLoginProvider = 'apple' | 'google' | 'normal';

export function getUserLoginProvider(username?: string | null): UserLoginProvider {
  const normalized = String(username || '')
    .trim()
    .toLowerCase();
  if (normalized.startsWith('gg_')) return 'google';
  if (normalized.startsWith('a_')) return 'apple';
  return 'normal';
}
