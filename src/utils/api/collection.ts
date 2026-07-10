import { type DashboardApiData } from 'utils/api/types';

export function getCollectionItems<T>(response?: ApiListResponse<T> | DashboardApiData<T[]> | null | undefined): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];
  if ('hydra:member' in response && Array.isArray(response['hydra:member'])) return response['hydra:member'] as T[];
  if ('data' in response && Array.isArray(response.data)) return response.data as T[];
  if ('data' in response && response.data && !Array.isArray(response.data) && 'data' in (response.data as any) && Array.isArray((response.data as any).data)) return (response.data as any).data as T[];
  return [];
}

export function getCollectionResult<T>(response?: ApiListResponse<T> | DashboardApiData<T[]> | null | undefined): TechnicalList<T> {
  const items = getCollectionItems<T>(response);
  if (!response) return { items: [], total: 0 };
  const total = Array.isArray(response)
    ? response.length
    : (('hydra:totalItems' in response ? response['hydra:totalItems'] : undefined) ?? ('meta' in response ? (response.meta as any)?.total_count : undefined) ?? ('pagination' in response ? (response.pagination as any)?.total_items : undefined) ?? ('total' in response ? (response as any).total : undefined) ?? items.length);

  return { items, total };
}
