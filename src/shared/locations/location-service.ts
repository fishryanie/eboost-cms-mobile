import { apiRequest } from 'utils/api/client';
import type { ApiService } from 'utils/api/types';

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

export type RelocateLocationInput = {
  id: number | string;
  latitude: number;
  longitude: number;
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

type ItemResponse<T> = T | { data?: T };

export type LocationEditorLookupRecord = {
  id?: number | string;
  iriId?: string;
  label?: string | null;
  labelVn?: string | null;
  name?: string | null;
  nameVn?: string | null;
  province?: { id?: number | string; iriId?: string } | number | string | null;
  provinceId?: number | string | null;
};

type PartnerLocationRecord = {
  address?: {
    district?: number | null;
    full_address?: string | null;
    province?: number | null;
    street_address?: string | null;
    ward?: number | null;
  } | null;
  contract_code?: string | null;
  contract_end_date?: string | null;
  contract_start_date?: string | null;
  id?: number;
  installation_date?: string | null;
  location_code?: string | null;
  location_id?: number | null;
  location_status?: string | null;
  name?: string | null;
  notes?: string | null;
  partner?: {
    email?: string | null;
    name?: string | null;
    phone_number?: string | null;
    username?: string | null;
  } | null;
  price_profile?: { id?: number; name?: string; title?: string } | null;
  price_profile_id?: number | null;
  report_code?: string | null;
  report_name?: string | null;
  service_name?: string | null;
};

function unwrapCollection<T>(response: CollectionResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.data || response['hydra:member'] || response.member || [];
}

function unwrapItem<T>(response: ItemResponse<T>): T {
  if (response && typeof response === 'object' && 'data' in response && response.data) return response.data;
  return response as T;
}

function mapLocationPartnership(partnership: PartnerLocationRecord, detailAvailable: boolean): LocationPartnership {
  return {
    address: partnership.address
      ? {
          district: partnership.address.district,
          fullAddress: partnership.address.full_address,
          province: partnership.address.province,
          streetAddress: partnership.address.street_address,
          ward: partnership.address.ward,
        }
      : null,
    contractCode: partnership.contract_code,
    contractEndDate: partnership.contract_end_date,
    contractStartDate: partnership.contract_start_date,
    detailAvailable,
    installationDate: partnership.installation_date,
    locationCode: partnership.location_code,
    locationId: partnership.location_id ?? partnership.id,
    locationStatus: partnership.location_status,
    mainUser: partnership.partner
      ? {
          email: partnership.partner.email,
          name: partnership.partner.name,
          phone: partnership.partner.phone_number,
          username: partnership.partner.username,
        }
      : null,
    name: partnership.name,
    notes: partnership.notes,
    priceProfileId: partnership.price_profile?.id ?? partnership.price_profile_id,
    reportCode: partnership.report_code,
    reportName: partnership.report_name,
    serviceName: partnership.service_name,
    tariff: partnership.price_profile,
  };
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

export function getLocationPartnershipLookupCode(location: Pick<LocationRecord, 'id' | 'locationCode' | 'location_code'>) {
  const rawCode = location.locationCode?.trim() || location.location_code?.trim();

  if (rawCode) {
    return rawCode.toUpperCase().startsWith('EVM-') ? rawCode : `EVM-${rawCode}`;
  }

  return `EVM-${String(location.id).padStart(4, '0')}`;
}

export async function fetchLocationPartnership(location: Pick<LocationRecord, 'id' | 'locationCode' | 'location_code'>) {
  const lookupCode = getLocationPartnershipLookupCode(location);
  const response = await apiRequest<CollectionResponse<PartnerLocationRecord>>('api/v1/partner/locations', {
    params: { value: lookupCode },
    service: 'building',
  });
  const candidates = unwrapCollection(response);
  const rawLocationCode = location.locationCode?.trim() || location.location_code?.trim();
  const partnership =
    candidates.find(item => item.report_code === lookupCode || item.location_code === rawLocationCode || item.location_id === location.id) || candidates[0];

  if (!partnership) return null;

  const partnershipId = partnership.location_id ?? partnership.id;
  if (!partnershipId) return mapLocationPartnership(partnership, false);

  try {
    const detailResponse = await apiRequest<ItemResponse<PartnerLocationRecord>>(`api/v2/partner/locations/${partnershipId}`, {
      service: 'building',
    });
    return mapLocationPartnership({ ...partnership, ...unwrapItem(detailResponse) }, true);
  } catch {
    return mapLocationPartnership(partnership, false);
  }
}

export async function fetchLocationEditorLookup(path: string, service: ApiService = 'core') {
  const response = await apiRequest<CollectionResponse<LocationEditorLookupRecord>>(path, {
    params: service === 'building' ? { size: 1000 } : { pagination: false },
    service,
  });
  return unwrapCollection(response);
}

export function updateLocationPartnership(id: number | string, data: Record<string, unknown>) {
  return apiRequest(`api/v1/partner/locations/${id}`, {
    data,
    method: 'PATCH',
    service: 'building',
  });
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

export function relocateLocation({ id, latitude, longitude }: RelocateLocationInput, request: RequestFn = apiRequest) {
  return request<LocationRecord, Pick<RelocateLocationInput, 'latitude' | 'longitude'>>(`api/locations/${id}`, {
    data: { latitude, longitude },
    method: 'PATCH',
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

export async function fetchAssignableChargers(type: ChargerVehicle) {
  const path = type === 'car' ? 'api/car_boxes' : 'api/bike_boxes';
  const response = await apiRequest<CollectionResponse<WorkflowChargerRecord>>(path, {
    params: {
      'exists[station]': false,
      pagination: false,
    },
  });

  return unwrapCollection(response)
    .filter(charger => !charger.station)
    .map(charger => ({ ...charger, boxType: type }));
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
