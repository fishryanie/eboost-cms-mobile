import { apiRequest } from 'utils/api/client';

export type CreateLocationInput = {
  name: string;
};

export type LocationImageUploadFile =
  | Blob
  | {
      name: string;
      type: string;
      uri: string;
    };

export type UploadLocationImageInput = {
  file: LocationImageUploadFile;
  id: number | string;
};

type RequestFn = <TResponse, TData = unknown>(path: string, options?: Parameters<typeof apiRequest<TResponse, TData>>[1]) => Promise<TResponse>;

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      'hydra:member'?: T[];
      'hydra:totalItems'?: number;
      member?: T[];
      total?: number;
    };

function unwrapCollection<T>(response: CollectionResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.data || response['hydra:member'] || response.member || [];
}

export async function fetchLocations(params?: { search?: string }) {
  const response = await apiRequest<CollectionResponse<LocationRecord>>('api/locations', {
    params: {
      name: params?.search || undefined,
      pagination: false,
    },
  });

  return unwrapCollection(response);
}

export function fetchLocation(id: number | string) {
  return apiRequest<LocationRecord>(`api/locations/${id}`);
}

export function createLocation(input: CreateLocationInput, request: RequestFn = apiRequest) {
  return request<LocationRecord, CreateLocationInput>('api/locations', {
    data: input,
    method: 'POST',
  });
}

export function uploadLocationImage(input: UploadLocationImageInput, request: RequestFn = apiRequest) {
  const formData = new FormData();
  formData.append('file', input.file as Blob);

  return request<LocationRecord, FormData>(`api/controller/image/upload/${input.id}/location`, {
    data: formData,
    method: 'POST',
  });
}

export async function fetchLocationStations(locationId: number | string) {
  const response = await apiRequest<CollectionResponse<StationRecord>>('api/stations', {
    params: { location: String(locationId), pagination: false },
  });

  return unwrapCollection(response);
}

export async function fetchStationChargers(stationId: number | string, page = 1, pageSize = 12) {
  const [cars, bikes] = await Promise.all([
    apiRequest<CollectionResponse<CarBoxRecord>>('api/car_boxes', { params: { station: String(stationId), page, itemsPerPage: pageSize } }),
    apiRequest<CollectionResponse<BikeBoxRecord>>('api/bike_boxes', { params: { station: String(stationId), page, itemsPerPage: pageSize } }),
  ]);

  const carItems = unwrapCollection(cars);
  const bikeItems = unwrapCollection(bikes);
  const totalOf = <T>(response: CollectionResponse<T>, fallback: number) =>
    Array.isArray(response) ? fallback : (response['hydra:totalItems'] ?? response.total ?? fallback);

  return {
    items: [...carItems.map(charger => ({ ...charger, boxType: 'car' as const })), ...bikeItems.map(charger => ({ ...charger, boxType: 'bike' as const }))],
    nextPage: page * pageSize < Math.max(totalOf(cars, carItems.length), totalOf(bikes, bikeItems.length)) ? page + 1 : undefined,
  };
}

export function updateResource<T>(path: string, id: number | string, data: Record<string, unknown>) {
  return apiRequest<T>(`${path}/${id}`, { data, method: 'PATCH' });
}

export function createResource<T>(path: string, data: Record<string, unknown>) {
  return apiRequest<T>(path, { data, method: 'POST' });
}

export function syncPartnershipLocation() {
  return apiRequest('api/v1/partner/locations/sync', {
    method: 'POST',
    service: 'building',
  });
}
