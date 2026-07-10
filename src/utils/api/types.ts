import type { AxiosInstance } from 'axios';

export type ApiService = 'building' | 'core' | 'hub';

export type ApiBaseUrls = Partial<Record<ApiService, string>>;

export type ApiRequestOptions<TData = unknown> = {
  data?: TData;
  headers?: Record<string, string>;
  method?: string;
  params?: Record<string, boolean | number | string | null | undefined>;
  service?: ApiService;
  skipAuth?: boolean;
  skipTokenRefresh?: boolean;
};

export type ApiClientConfig = {
  axiosImpl?: AxiosInstance;
  baseUrls?: ApiBaseUrls;
  getRefreshToken?: () => Promise<string | null | undefined> | string | null | undefined;
  getToken?: () => Promise<string | null | undefined> | string | null | undefined;
  onSessionExpired?: () => Promise<void> | void;
  refreshToken?: (refreshToken: string) => Promise<string | null | undefined> | string | null | undefined;
};

export type DashboardApiData<T> = {
  data?: T;
  'hydra:member'?: T;
  'hydra:totalItems'?: number;
  pagination?: {
    limit: number;
    page: number;
    total_items: number;
    total_pages: number;
  };
  summary?: Record<string, number>;
};
