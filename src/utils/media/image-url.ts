import { getApiBaseUrl } from 'utils/api/config';
import type { ApiBaseUrls, ApiService } from 'utils/api/types';

function isAbsoluteImageUrl(imageUrl: string) {
  return /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(imageUrl) || /^(data|blob|file):/i.test(imageUrl);
}

export function getDisplayImageUrl(imageUrl?: null | string, baseUrls?: ApiBaseUrls, service: ApiService = 'core') {
  const normalizedImageUrl = imageUrl?.trim();
  if (!normalizedImageUrl) return '';
  if (isAbsoluteImageUrl(normalizedImageUrl)) return normalizedImageUrl;

  const baseUrl = (baseUrls?.[service] || getApiBaseUrl(service)).replace(/\/+$/, '');
  if (!baseUrl) return normalizedImageUrl;

  return `${baseUrl}/${normalizedImageUrl.replace(/^\/+/, '')}`;
}
