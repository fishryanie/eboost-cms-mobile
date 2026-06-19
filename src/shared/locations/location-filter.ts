
export function getLocationStatus(location: LocationRecord) {
  return location.operationStatus?.label || 'Unknown';
}

export function getLocationStatusOptions(locations: LocationRecord[]) {
  return [...new Set(locations.map(getLocationStatus))].sort((a, b) => a.localeCompare(b));
}

export function filterLocationsByStatus(locations: LocationRecord[], status: string) {
  if (!status) return locations;
  return locations.filter(location => getLocationStatus(location) === status);
}
