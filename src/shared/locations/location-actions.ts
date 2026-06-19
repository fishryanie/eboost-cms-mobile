import type { ApiRequestOptions } from 'utils/api/types';


type RequestLike = <T>(url: string, options?: ApiRequestOptions) => Promise<T>;

const hiddenAllowedStatuses = new Set(['Temporarily Stop', 'Temp Uninstalled', 'Uninstalled', 'Terminated']);

export function getLocationVisibilityAction(location: LocationRecord) {
  const nextVisible = !location.visible;
  const title = nextVisible ? 'Show Location' : 'Hide Location';
  const status = location.operationStatus?.label || '';

  if (!nextVisible && !hiddenAllowedStatuses.has(status)) {
    return {
      allowed: false,
      message: 'Location status must be Temp Stop, Temp Uninstalled, Uninstalled or Terminated to hide.',
      nextVisible,
      title,
    };
  }

  if (nextVisible && status !== 'Operating') {
    return {
      allowed: false,
      message: 'Location status must be Operating to show on map.',
      nextVisible,
      title,
    };
  }

  return { allowed: true, nextVisible, title };
}

export async function runRecursiveLocationVisibility({ locationId, request, visible }: { locationId: number; request: RequestLike; visible: boolean }) {
  await request(`api/locations/${locationId}`, {
    data: { visible },
    method: 'PATCH',
  });

  const stations = await request<StationRecord[]>('api/stations', {
    params: { location: locationId, pagination: false },
  });

  for (const station of stations) {
    await request(`api/stations/${station.id}`, {
      data: { visible },
      method: 'PATCH',
    });

    const [carBoxes, bikeBoxes] = await Promise.all([
      request<CarBoxRecord[]>('api/car_boxes', {
        params: { pagination: false, station: station.id },
      }),
      request<BikeBoxRecord[]>('api/bike_boxes', {
        params: { pagination: false, station: station.id },
      }),
    ]);

    for (const box of carBoxes) {
      await request(`api/car_boxes/${box.id}`, {
        data: { visible },
        method: 'PATCH',
      });

      for (const connector of box.carConnectors || []) {
        await request(`api/car_connectors/${connector.id}`, {
          data: { visible },
          method: 'PATCH',
        });
      }
    }

    for (const box of bikeBoxes) {
      await request(`api/bike_boxes/${box.id}`, {
        data: { visible },
        method: 'PATCH',
      });

      for (const outlet of box.outlets || []) {
        await request(`api/outlets/${outlet.id}`, {
          data: { visible },
          method: 'PATCH',
        });
      }
    }
  }
}

export function restoreLocationName(name: string) {
  if (name.endsWith('_deleted')) return name.replace(/_deleted$/, '');
  if (name.endsWith('_archived')) return name.replace(/_archived$/, '');
  return name;
}

export async function restoreLocation({ id, name, request }: { id: number; name: string; request: RequestLike }) {
  return request(`api/locations/${id}`, {
    data: {
      deletedAt: null,
      name: restoreLocationName(name),
    },
    method: 'PATCH',
  });
}
