import { apiRequest } from 'shared/api/client';
import type { ApiRequestOptions } from 'shared/api/types';

export type TriggerBoxRequest = <TResponse = unknown, TData = unknown>(url: string, options?: ApiRequestOptions<TData>) => Promise<TResponse>;

export type UtilityCharger = {
  id: number;
  stationName: string | null;
  uniqueId: string;
  vendorId: string;
};

export type TriggerBoxValues = {
  boxId: string;
  connector?: number;
  request?: TriggerBoxRequest;
  requestedMessage?: 'BootNotification' | 'Heartbeat' | 'MeterValues' | 'StatusNotification' | string;
};

export type ResetBoxValues = {
  boxId: string;
  request?: TriggerBoxRequest;
  type?: 'Hard' | 'Soft';
  vendorId: string;
};

export type UnlockBoxValues = {
  boxId: string;
  connectorID?: number;
  request?: TriggerBoxRequest;
};

type BoxStatusMap = Record<string, string>;

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      'hydra:member'?: T[];
      member?: T[];
    };

export class TriggerBoxResponseError extends Error {
  raw: unknown;

  constructor(message: string, raw: unknown) {
    super(message);
    this.name = 'TriggerBoxResponseError';
    this.raw = raw;
  }
}

export class ResetBoxStatusError extends Error {
  constructor(vendorId: string) {
    super(`Box ${vendorId} is charging and cannot be reset.`);
    this.name = 'ResetBoxStatusError';
  }
}

function getResponseError(response: unknown) {
  if (!response || typeof response !== 'object') return undefined;

  const candidate = response as Record<string, unknown>;
  if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;
  if (typeof candidate.message === 'string' && String(candidate.status || '').toLowerCase() === 'error') return candidate.message;

  return undefined;
}

function unwrapCollection<T>(response: CollectionResponse<T>) {
  if (Array.isArray(response)) return response;
  return response.data || response['hydra:member'] || response.member || [];
}

export async function fetchUtilityChargers(request: TriggerBoxRequest = apiRequest) {
  const response = await request<CollectionResponse<UtilityCharger>>('api/controller/utilities/chargers', {
    params: { pagination: false },
  });

  return unwrapCollection(response);
}

export function getBoxStatusVendorId(statusKey: string) {
  return statusKey.split('_')[0];
}

export function isVendorCharging(statuses: BoxStatusMap, vendorId: string) {
  return Object.entries(statuses).some(([statusKey, status]) => getBoxStatusVendorId(statusKey) === vendorId && status === 'Charging');
}

export function fetchBoxStatuses(request: TriggerBoxRequest = apiRequest) {
  return request<BoxStatusMap>('api/box-status', {
    service: 'hub',
  });
}

export function getUtilityChargerTriggerId(charger?: Pick<UtilityCharger, 'uniqueId' | 'vendorId'>) {
  if (!charger) return '';
  return charger.uniqueId.startsWith('Ecar') ? charger.vendorId || charger.uniqueId : charger.uniqueId;
}

export async function requestResetBox({ boxId, request = apiRequest, type = 'Soft', vendorId }: ResetBoxValues) {
  const normalizedBoxId = boxId.trim();
  const normalizedVendorId = vendorId.trim();
  const statuses = await fetchBoxStatuses(request);

  if (isVendorCharging(statuses, normalizedVendorId)) {
    throw new ResetBoxStatusError(normalizedVendorId);
  }

  return request(`api/v1/device/${normalizedBoxId}/reset`, {
    data: { type },
    method: 'POST',
    service: 'hub',
  });
}

export function requestUnlockBox({ boxId, connectorID = 1, request = apiRequest }: UnlockBoxValues) {
  const normalizedBoxId = boxId.trim();

  return request(`api/v1/device/${normalizedBoxId}/unlock`, {
    data: { connectorID },
    method: 'POST',
    service: 'hub',
  });
}

export async function requestTriggerBox({ boxId, connector = 0, request = apiRequest, requestedMessage = 'MeterValues' }: TriggerBoxValues) {
  const normalizedBoxId = boxId.trim();
  const response = await request(`api/v1/device/${normalizedBoxId}/trigger`, {
    data: { connector, requestedMessage },
    method: 'POST',
    service: 'hub',
  });
  const responseError = getResponseError(response);

  if (responseError) {
    throw new TriggerBoxResponseError(responseError, response);
  }

  return response;
}

export function stringifyTriggerBoxResponse(response: unknown) {
  if (response === undefined || response === null || response === '') return 'No response payload.';
  if (typeof response === 'string') return response;

  return JSON.stringify(response, null, 2);
}
