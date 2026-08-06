import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from 'utils/api/client';

import {
  createLocation,
  createResource,
  fetchLocation,
  fetchLocationEditorLookup,
  fetchLocationPartnership,
  fetchLocations,
  fetchLocationStations,
  fetchAssignableChargers,
  fetchStationChargers,
  relocateLocation,
  syncPartnershipLocation,
  updateLocationPartnership,
  updateResource,
  uploadLocationImage,
  getLocationPartnershipLookupCode,
} from './location-service';
import { restoreLocation, runRecursiveLocationVisibility } from './location-actions';
import type { CreateLocationInput, RelocateLocationInput, UploadLocationImageInput } from './location-service';

export const locationKeys = {
  all: ['locations'] as const,
  detail: (id: number | string) => ['locations', String(id)] as const,
  editorLookup: (service: string, path: string) => ['locations', 'editor-lookup', service, path] as const,
  partnership: (id: number | string, lookupCode?: string) =>
    lookupCode ? (['locations', String(id), 'partnership', lookupCode] as const) : (['locations', String(id), 'partnership'] as const),
  list: (search: string) => ['locations', 'list', search] as const,
  stations: (id: number | string) => ['locations', String(id), 'stations'] as const,
  chargers: (id: number | string) => ['stations', String(id), 'chargers'] as const,
  assignableChargers: (type?: ChargerVehicle) => (type ? (['stations', 'assignable-chargers', type] as const) : (['stations', 'assignable-chargers'] as const)),
};

export function useLocations(search: string) {
  return useQuery({
    queryFn: () => fetchLocations({ search }),
    queryKey: locationKeys.list(search),
  });
}

export function useStationChargers(id: number | string) {
  return useInfiniteQuery<Awaited<ReturnType<typeof fetchStationChargers>>>({
    enabled: !!id,
    getNextPageParam: lastPage => lastPage.nextPage,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchStationChargers(id, Number(pageParam)),
    queryKey: locationKeys.chargers(id),
  });
}

export function useAssignableChargers(type?: ChargerVehicle, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(type),
    queryFn: () => fetchAssignableChargers(type as ChargerVehicle),
    queryKey: locationKeys.assignableChargers(type),
    staleTime: 1000 * 30,
  });
}

export function useLocationResourceMutations(locationId: number | string, stationId?: number | string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(locationId) }),
      queryClient.invalidateQueries({ queryKey: locationKeys.stations(locationId) }),
      queryClient.invalidateQueries({ queryKey: locationKeys.assignableChargers() }),
      ...(stationId ? [queryClient.invalidateQueries({ queryKey: locationKeys.chargers(stationId) })] : []),
    ]);
  };

  const patch = useMutation({
    mutationFn: ({ data, id, path }: { data: Record<string, unknown>; id: number | string; path: string }) => updateResource(path, id, data),
    onSuccess: invalidate,
  });

  const create = useMutation({
    mutationFn: ({ data, path }: { data: Record<string, unknown>; path: string }) => createResource(path, data),
    onSuccess: invalidate,
  });

  return { create, patch };
}

export function useLocationDetail(id: number | string) {
  return useQuery({
    enabled: !!id,
    queryFn: () => fetchLocation(id),
    queryKey: locationKeys.detail(id),
  });
}

export type UpdateLocationValues = Partial<
  Pick<LocationRecord, 'address' | 'addressVn' | 'description' | 'descriptionVn' | 'latitude' | 'locationCode' | 'longitude' | 'name' | 'nameVn' | 'visible'>
> & {
  locationType?: string | null;
  operationStatus?: string | null;
  province?: string | null;
  ward?: string | null;
};

export function useUpdateLocation(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation<LocationRecord, Error, UpdateLocationValues>({
    mutationFn: data => updateResource<LocationRecord>('api/locations', id, data),
    onSuccess: async location => {
      queryClient.setQueryData(locationKeys.detail(id), location);
      await queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

export function useLocationPartnership(location?: LocationRecord) {
  const lookupCode = location ? getLocationPartnershipLookupCode(location) : undefined;

  return useQuery({
    enabled: !!location?.id,
    queryFn: () => fetchLocationPartnership(location as LocationRecord),
    queryKey: locationKeys.partnership(location?.id || '', lookupCode),
  });
}

export function useLocationPriceProfiles(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => fetchLocationEditorLookup('api/v1/partner/price-profile', 'building'),
    queryKey: locationKeys.editorLookup('building', 'price_profiles'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLocationEditorLookups(enabled: boolean) {
  const operationStatuses = useQuery({
    enabled,
    queryFn: () => fetchLocationEditorLookup('api/operation_statuses'),
    queryKey: locationKeys.editorLookup('core', 'operation_statuses'),
    staleTime: 1000 * 60 * 5,
  });
  const locationTypes = useQuery({
    enabled,
    queryFn: () => fetchLocationEditorLookup('api/location_types'),
    queryKey: locationKeys.editorLookup('core', 'location_types'),
    staleTime: 1000 * 60 * 5,
  });
  const provinces = useQuery({
    enabled,
    queryFn: () => fetchLocationEditorLookup('api/provinces'),
    queryKey: locationKeys.editorLookup('core', 'provinces'),
    staleTime: 1000 * 60 * 10,
  });
  const wards = useQuery({
    enabled,
    queryFn: () => fetchLocationEditorLookup('api/wards'),
    queryKey: locationKeys.editorLookup('core', 'wards'),
    staleTime: 1000 * 60 * 10,
  });
  const priceProfiles = useLocationPriceProfiles(enabled);

  return { locationTypes, operationStatuses, priceProfiles, provinces, wards };
}

export function useUpdateLocationPartnership(locationId: number | string, partnershipId?: number | string | null) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Record<string, unknown>>({
    mutationFn: data => {
      if (!partnershipId) throw new Error('Partnership location is unavailable.');
      return updateLocationPartnership(partnershipId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: locationKeys.partnership(locationId) });
    },
  });
}

export function useLocationStations(id: number | string) {
  return useQuery({
    enabled: !!id,
    queryFn: () => fetchLocationStations(id),
    queryKey: locationKeys.stations(id),
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation<LocationRecord, Error, CreateLocationInput>({
    mutationFn: input => createLocation(input),
    onSuccess: async location => {
      await queryClient.invalidateQueries({ queryKey: locationKeys.all });
      await queryClient.setQueryData(locationKeys.detail(location.id), location);
    },
  });
}

export function useUploadLocationImage() {
  const queryClient = useQueryClient();

  return useMutation<LocationRecord, Error, UploadLocationImageInput>({
    mutationFn: input => uploadLocationImage(input),
    onSuccess: async (_location, input) => {
      await queryClient.invalidateQueries({ queryKey: locationKeys.all });
      await queryClient.invalidateQueries({ queryKey: locationKeys.detail(input.id) });
    },
  });
}

export function useRelocateLocation() {
  const queryClient = useQueryClient();

  return useMutation<LocationRecord, Error, RelocateLocationInput>({
    mutationFn: input => relocateLocation(input),
    onSuccess: async (_location, input) => {
      await queryClient.invalidateQueries({ queryKey: locationKeys.all });
      await queryClient.invalidateQueries({ queryKey: locationKeys.detail(input.id) });
    },
  });
}

export function useLocationActionMutations(locationId?: number | string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: locationKeys.all });
    if (locationId) {
      await queryClient.invalidateQueries({ queryKey: locationKeys.detail(locationId) });
      await queryClient.invalidateQueries({ queryKey: locationKeys.partnership(locationId) });
      await queryClient.invalidateQueries({ queryKey: locationKeys.stations(locationId) });
    }
  };

  const visibility = useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) => runRecursiveLocationVisibility({ locationId: id, request: apiRequest, visible }),
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => restoreLocation({ id, name, request: apiRequest }),
    onSuccess: invalidate,
  });

  const sync = useMutation({
    mutationFn: syncPartnershipLocation,
    onSuccess: invalidate,
  });

  return { restore, sync, visibility };
}
