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
};

export type ApiClientConfig = {
  axiosImpl?: AxiosInstance;
  baseUrls?: ApiBaseUrls;
  getToken?: () => Promise<string | null | undefined> | string | null | undefined;
};
