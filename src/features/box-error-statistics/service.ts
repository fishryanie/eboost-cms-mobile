import { apiRequest } from 'utils/api/client';
import type { ApiRequestOptions } from 'utils/api/types';

import type { BoxErrorStatistics } from './model';

type BoxErrorResponse = {
  success: boolean;
  data?: BoxErrorStatistics;
  message?: string;
};

type BoxErrorRequest = <TResponse = unknown, TData = unknown>(path: string, options?: ApiRequestOptions<TData>) => Promise<TResponse>;

export async function fetchBoxErrorStatistics(request: BoxErrorRequest = apiRequest): Promise<BoxErrorStatistics> {
  const response = await request<BoxErrorResponse>('api/controller/statistic/box-error-statistics');
  if (!response?.success || !response.data || !Array.isArray(response.data.boxes)) {
    throw new Error(response?.message || 'Unable to load box error statistics. Please try again.');
  }
  return response.data;
}
