import { apiRequest } from 'utils/api/client';
import type { ExtendPackageValues, PromotionCodeOption, SubscriptionPackageOption, SubscriptionPackageResponse } from './types';

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      'hydra:member'?: T[];
      'hydra:totalItems'?: number;
      'hydra:view'?: {
        'hydra:next'?: string;
      };
      member?: T[];
    };

export type PaginatedCollection<T> = {
  items: T[];
  nextPage?: number;
  totalItems: number;
};

function unwrapCollection<T>(response: CollectionResponse<T>) {
  if (Array.isArray(response)) return response;
  return response.data || response['hydra:member'] || response.member || [];
}

function parsePageNumber(url?: string) {
  if (!url) return undefined;
  const match = url.match(/[?&]page=(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function unwrapPaginatedCollection<T>(response: CollectionResponse<T>): PaginatedCollection<T> {
  if (Array.isArray(response)) {
    return { items: response, totalItems: response.length };
  }

  const items = response.data || response['hydra:member'] || response.member || [];
  return {
    items,
    nextPage: parsePageNumber(response['hydra:view']?.['hydra:next']),
    totalItems: response['hydra:totalItems'] || items.length,
  };
}

export function normalizeExtendPackageValues(values: ExtendPackageValues) {
  return {
    days: Number(values.days) || 0,
  };
}

export function extendPackage(values: ExtendPackageValues) {
  return apiRequest<SubscriptionPackageResponse>(`api/promotion_codes/${values.promoCodeId.trim()}`, {
    data: normalizeExtendPackageValues(values),
    method: 'PATCH',
  });
}

export async function fetchSubscriptionPackages() {
  const response = await apiRequest<CollectionResponse<SubscriptionPackageOption>>('api/subscription_packages', {
    params: { itemsPerPage: 100 },
  });
  return unwrapCollection(response);
}

export async function fetchPromotionCodesPage({ page, search }: { page: number; search: string }) {
  const response = await apiRequest<CollectionResponse<PromotionCodeOption>>('api/promotion_codes', {
    headers: { Accept: 'application/ld+json' },
    params: {
      itemsPerPage: 30,
      page,
      ...(search.trim() ? { code: search.trim() } : {}),
    },
  });
  return unwrapPaginatedCollection(response);
}
