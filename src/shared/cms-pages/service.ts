import { apiRequest } from 'utils/api/client';

import type { CmsSectionConfig } from './config';

export type CmsRecord = Record<string, unknown> & {
  id?: number | string;
};

type CollectionEnvelope = {
  data?: CmsRecord[] | { data?: CmsRecord[]; total?: number };
  'hydra:member'?: CmsRecord[];
  'hydra:totalItems'?: number;
  'hydra:view'?: { 'hydra:next'?: string };
  member?: CmsRecord[];
  total?: number;
};

export type CmsPage = {
  items: CmsRecord[];
  nextPage?: number;
  totalItems: number;
};

const PAGE_SIZE = 20;

function parseNextPage(url?: string) {
  if (!url) return undefined;
  const match = url.match(/[?&]page=(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function unwrapResponse(response: unknown, page: number): CmsPage {
  if (Array.isArray(response)) {
    return { items: response as CmsRecord[], totalItems: response.length };
  }

  if (!response || typeof response !== 'object') {
    return { items: [], totalItems: 0 };
  }

  const envelope = response as CollectionEnvelope;
  const nestedData = envelope.data && !Array.isArray(envelope.data) ? envelope.data : undefined;
  const items = envelope['hydra:member'] || (Array.isArray(envelope.data) ? envelope.data : undefined) || nestedData?.data || envelope.member;

  if (!items) {
    if (envelope.data && !Array.isArray(envelope.data)) {
      return { items: [envelope.data as CmsRecord], totalItems: 1 };
    }
    return { items: [response as CmsRecord], totalItems: 1 };
  }

  const totalItems = envelope['hydra:totalItems'] ?? nestedData?.total ?? envelope.total ?? items.length;
  const hydraNextPage = parseNextPage(envelope['hydra:view']?.['hydra:next']);
  const inferredNextPage = page * PAGE_SIZE < totalItems && items.length > 0 ? page + 1 : undefined;

  return {
    items,
    nextPage: hydraNextPage ?? inferredNextPage,
    totalItems,
  };
}

export async function fetchCmsRecord(endpoint: string, id?: number | string, params?: Record<string, boolean | number | string>) {
  const path = id === undefined || id === '' ? endpoint : `${endpoint}/${id}`;
  const response = await apiRequest<unknown>(path, { headers: { Accept: 'application/ld+json' }, params });
  const page = unwrapResponse(response, 1);
  return page.items[0] || (response as CmsRecord);
}

export async function fetchCmsCollectionRecords(endpoint: string, params?: Record<string, boolean | number | string>) {
  const response = await apiRequest<unknown>(endpoint, {
    headers: { Accept: 'application/ld+json' },
    params: { pagination: false, ...params },
  });
  return unwrapResponse(response, 1).items;
}

export function saveCmsRecord({
  data,
  endpoint,
  id,
  method,
}: {
  data: Record<string, unknown>;
  endpoint: string;
  id?: number | string;
  method: 'PATCH' | 'POST' | 'PUT';
}) {
  const path = id === undefined || id === '' ? endpoint : `${endpoint}/${id}`;
  return apiRequest<CmsRecord, Record<string, unknown>>(path, { data, method });
}

export function deleteCmsRecord(endpoint: string, id: number | string) {
  return apiRequest(`${endpoint}/${id}`, { method: 'DELETE' });
}

export async function uploadCmsImage({
  asset,
  folder,
  targetId,
}: {
  asset: { fileName?: string | null; mimeType?: string | null; uri: string };
  folder: string;
  targetId: number | string;
}) {
  const formData = new FormData();
  formData.append('file', {
    name: asset.fileName || `${folder}.jpg`,
    type: asset.mimeType || 'image/jpeg',
    uri: asset.uri,
  } as unknown as Blob);

  return apiRequest<{ file_path?: string; results?: { media?: { url?: string } }[] }, FormData>(`api/controller/image/upload/${targetId}/${folder}`, {
    data: formData,
    method: 'POST',
  });
}

export async function fetchCmsSectionPage({
  filters,
  page,
  search,
  section,
}: {
  filters?: Record<string, boolean | number | string>;
  page: number;
  search: string;
  section: CmsSectionConfig;
}) {
  const response = await apiRequest<unknown>(section.endpoint, {
    headers: { Accept: 'application/ld+json' },
    params: {
      itemsPerPage: PAGE_SIZE,
      page,
      ...section.params,
      ...filters,
      ...(section.searchParam && search ? { [section.searchParam]: search } : {}),
    },
  });

  return unwrapResponse(response, page);
}
