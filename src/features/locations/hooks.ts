import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from 'shared/api/client';

import { createLocation, fetchLocation, fetchLocations, fetchLocationStations, syncPartnershipLocation, uploadLocationImage } from './location-service';
import { restoreLocation, runRecursiveLocationVisibility } from './location-actions';
import type { CreateLocationInput, UploadLocationImageInput } from './location-service';
import type { LocationRecord } from './types';

export const locationKeys = {
  all: ['locations'] as const,
  detail: (id: number | string) => ['locations', String(id)] as const,
  list: (search: string) => ['locations', 'list', search] as const,
  stations: (id: number | string) => ['locations', String(id), 'stations'] as const,
};

export function useLocations(search: string) {
  return useQuery({
    queryFn: () => fetchLocations({ search }),
    queryKey: locationKeys.list(search),
  });
}

export function useLocationDetail(id: number | string) {
  return useQuery({
    enabled: !!id,
    queryFn: () => fetchLocation(id),
    queryKey: locationKeys.detail(id),
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

export function useLocationActionMutations(locationId?: number | string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: locationKeys.all });
    if (locationId) {
      await queryClient.invalidateQueries({ queryKey: locationKeys.detail(locationId) });
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
