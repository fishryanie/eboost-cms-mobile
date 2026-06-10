import { getApiBaseUrl, setApiBaseUrls } from './config';
import { ApiError, getApiErrorMessage } from './errors';
import type { ApiClientConfig, ApiRequestOptions, ApiService } from './types';

let sessionTokenGetter: NonNullable<ApiClientConfig['getToken']> | undefined;

export { ApiError, setApiBaseUrls };

export function setApiSessionTokenGetter(getToken: NonNullable<ApiClientConfig['getToken']>) {
  sessionTokenGetter = getToken;
}

function joinUrl(baseUrl: string, path: string) {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  if (!baseUrl) return normalizedPath;
  return `${baseUrl}/${normalizedPath}`;
}

function appendParams(url: string, params?: ApiRequestOptions['params']) {
  if (!params) return url;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  if (!query) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

function getContentType(method?: string, data?: unknown) {
  if (typeof FormData !== 'undefined' && data instanceof FormData) return undefined;
  if (method?.toUpperCase() === 'PATCH') return 'application/merge-patch+json';
  if (data !== undefined) return 'application/json';
  return undefined;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') || contentType.includes('+json')) {
    return response.json();
  }
  return response.text();
}

export function createApiClient(config: ApiClientConfig = {}) {
  const fetchImpl = config.fetchImpl || fetch;

  async function request<TResponse = unknown, TData = unknown>(path: string, options: ApiRequestOptions<TData> = {}): Promise<TResponse> {
    const service: ApiService = options.service || 'core';
    const method = options.method || (options.data === undefined ? 'GET' : 'POST');
    const baseUrl = config.baseUrls?.[service] ?? getApiBaseUrl(service);
    if (!baseUrl) {
      throw new ApiError({
        message: `Missing ${service} API URL. Check the EAS production environment variables.`,
        service,
        status: 0,
        title: 'App configuration error',
      });
    }
    const contentType = getContentType(method, options.data);
    const token = options.skipAuth ? undefined : await (config.getToken || sessionTokenGetter)?.();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    };

    if (contentType && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = contentType;
    }

    if (token && !headers.Authorization && !headers.authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    const init: RequestInit = {
      headers,
      method,
    };

    if (options.data !== undefined) {
      init.body = typeof FormData !== 'undefined' && options.data instanceof FormData ? options.data : JSON.stringify(options.data);
    }

    const url = appendParams(joinUrl(baseUrl, path), options.params);
    const response = await fetchImpl(url, init);
    const payload = await parseResponse(response);

    if (!response.ok) {
      throw new ApiError({
        message: getApiErrorMessage(payload, response.statusText || 'Request failed'),
        raw: payload,
        service,
        status: response.status,
        title: response.statusText,
      });
    }

    return payload as TResponse;
  }

  return { request };
}

export const apiClient = createApiClient();

export function apiRequest<TResponse = unknown, TData = unknown>(path: string, options?: ApiRequestOptions<TData>) {
  return apiClient.request<TResponse, TData>(path, options);
}
