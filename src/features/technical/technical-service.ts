import { apiRequest } from 'shared/api/client';

import type {
  ApiListResponse,
  BoxStatusResponse,
  ChargerRecord,
  ConnectionLogRecord,
  DomainAnalyzeRecord,
  EnergyDifferRecord,
  MeterValueRecord,
  OngoingSessionRecord,
  StatusLogRecord,
  TechnicalEndpoint,
  TechnicalList,
  TechnicalVehicle,
} from './types';

export const technicalPageSize = 30;

function getListItems<T>(response: ApiListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response['hydra:member'])) return response['hydra:member'];
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data) && Array.isArray(response.data.data)) return response.data.data;
  return [];
}

function getListTotal<T>(response: ApiListResponse<T>, fallback: number) {
  if (Array.isArray(response)) return response.length;
  return response['hydra:totalItems'] ?? response.meta?.total_count ?? response.pagination?.total_items ?? response.total ?? fallback;
}

function parseList<T>(response: ApiListResponse<T>): TechnicalList<T> {
  const items = getListItems(response);
  return {
    items,
    total: getListTotal(response, items.length),
  };
}

export function getChargerEndpoint(vehicle: TechnicalVehicle): TechnicalEndpoint {
  return { path: vehicle === 'car' ? 'api/car_boxes' : 'api/bike_boxes' };
}

export function getMeterHourlyEndpoint(vehicle: TechnicalVehicle): TechnicalEndpoint {
  return { path: vehicle === 'car' ? 'api/logs/meter-values' : 'api/bikes/logs/meter-values', service: 'hub' };
}

export function getStatusLogsEndpoint(vehicle: TechnicalVehicle): TechnicalEndpoint {
  return { path: vehicle === 'car' ? 'api/logs/box-status' : 'api/bikes/logs/status', service: 'hub' };
}

export function getNetworkStatusEndpoint(vehicle: TechnicalVehicle): TechnicalEndpoint {
  return { path: vehicle === 'car' ? 'api/cars/logs/connection' : 'api/bikes/logs/connection', service: 'hub' };
}

export async function fetchTechnicalList<T>({
  endpoint,
  page,
  params,
}: {
  endpoint: TechnicalEndpoint;
  page: number;
  params?: Record<string, number | string | undefined>;
}) {
  const response = await apiRequest<ApiListResponse<T>>(endpoint.path, {
    params: {
      itemsPerPage: technicalPageSize,
      limit: technicalPageSize,
      page,
      ...params,
    },
    service: endpoint.service,
  });

  return parseList(response);
}

export function fetchChargers({ page, search, vehicle }: { page: number; search: string; vehicle: TechnicalVehicle }) {
  return fetchTechnicalList<ChargerRecord>({
    endpoint: getChargerEndpoint(vehicle),
    page,
    params: search ? { uniqueId: search } : undefined,
  });
}

export function fetchMeterHourly({ page, search, vehicle }: { page: number; search: string; vehicle: TechnicalVehicle }) {
  return fetchTechnicalList<MeterValueRecord>({
    endpoint: getMeterHourlyEndpoint(vehicle),
    page,
    params: search ? { charge_point_id: search } : undefined,
  });
}

export function fetchStatusLogs({ page, search, vehicle }: { page: number; search: string; vehicle: TechnicalVehicle }) {
  return fetchTechnicalList<StatusLogRecord>({
    endpoint: getStatusLogsEndpoint(vehicle),
    page,
    params: search ? { charge_point_id: search } : undefined,
  });
}

export function fetchNetworkStatus(vehicle: TechnicalVehicle) {
  const endpoint = getNetworkStatusEndpoint(vehicle);
  return fetchTechnicalList<ConnectionLogRecord>({
    endpoint,
    page: 1,
    params: { limit: 1000 },
  });
}

export async function fetchBikeBoxStatus() {
  const response = await apiRequest<BoxStatusResponse>('api/controller/statistic/bike-box-status');
  return response.data || {};
}

export async function fetchCarBoxStatus() {
  const response = await apiRequest<BoxStatusResponse>('api/controller/statistic/car-box-status');
  return response.data || {};
}

export async function fetchDomainAnalyze() {
  const response = await apiRequest<ApiListResponse<DomainAnalyzeRecord>>('api/controller/domain/analyze');
  return parseList(response);
}

export function fetchEnergyDiffer({ vehicle }: { vehicle: TechnicalVehicle }) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return fetchTechnicalList<EnergyDifferRecord>({
    endpoint: { path: 'api/v1/statistics/energy', service: 'hub' },
    page: 1,
    params: {
      end_date: formatDateParam(endDate),
      limit: 100,
      start_date: formatDateParam(startDate),
      type: vehicle,
    },
  });
}

function formatDateParam(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fetchOngoingSessions({ page, search, status }: { page: number; search: string; status?: string }) {
  return fetchTechnicalList<OngoingSessionRecord>({
    endpoint: { path: 'api/controller/statistic/car-realtime-status' },
    page,
    params: {
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    },
  });
}
