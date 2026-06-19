export function getCollectionItems<T>(response: ApiListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response['hydra:member'])) return response['hydra:member'];
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data) && Array.isArray(response.data.data)) return response.data.data;
  return [];
}

export function getCollectionResult<T>(response: ApiListResponse<T>): TechnicalList<T> {
  const items = getCollectionItems(response);
  const total = Array.isArray(response)
    ? response.length
    : response['hydra:totalItems'] ?? response.meta?.total_count ?? response.pagination?.total_items ?? response.total ?? items.length;

  return { items, total };
}
