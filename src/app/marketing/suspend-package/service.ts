import { apiRequest } from 'utils/api/client';
import type { SubscriptionPackageOption, SubscriptionPackageResponse, SuspendPackageValues } from './types';

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      'hydra:member'?: T[];
      member?: T[];
    };

function unwrapCollection<T>(response: CollectionResponse<T>) {
  if (Array.isArray(response)) return response;
  return response.data || response['hydra:member'] || response.member || [];
}

export function getSuspendPackagePayload() {
  return { enabled: false };
}

export function suspendPackage(values: SuspendPackageValues) {
  return apiRequest<SubscriptionPackageResponse>(`api/subscription_packages/${values.packageId.trim()}`, {
    data: getSuspendPackagePayload(),
    method: 'PATCH',
  });
}

export async function fetchSubscriptionPackages() {
  const response = await apiRequest<CollectionResponse<SubscriptionPackageOption>>('api/subscription_packages', {
    params: { enabled: true, itemsPerPage: 100 },
  });
  return unwrapCollection(response);
}
