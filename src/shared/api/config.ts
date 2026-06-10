import type { ApiBaseUrls, ApiService } from './types';

let apiBaseUrls: ApiBaseUrls = {
  building: process.env.EXPO_PUBLIC_BUILDING_API_URL || process.env.NEXT_PUBLIC_API_PARTNER_ADMIN_UAT_URL || process.env.NEXT_PUBLIC_API_PARTNER_ADMIN_PROD_URL,
  core: process.env.EXPO_PUBLIC_CORE_API_URL || process.env.NEXT_PUBLIC_API_CORE_UAT_PRIMARY || process.env.NEXT_PUBLIC_API_CORE_PROD_PRIMARY,
  hub: process.env.EXPO_PUBLIC_HUB_API_URL || process.env.NEXT_PUBLIC_API_HUB_UAT_URL || process.env.NEXT_PUBLIC_API_HUB_PROD_URL,
};

export function setApiBaseUrls(nextBaseUrls: ApiBaseUrls) {
  apiBaseUrls = { ...apiBaseUrls, ...nextBaseUrls };
}

export function getApiBaseUrl(service: ApiService = 'core') {
  const baseUrl = apiBaseUrls[service];
  if (!baseUrl) {
    return '';
  }
  return baseUrl.replace(/\/$/, '');
}
