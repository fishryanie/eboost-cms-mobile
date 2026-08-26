type PartnerBoxLookupRecord = {
  uniqueId?: string | null;
  unique_id?: string | null;
  vendorId?: string | null;
  vendor_id?: string | null;
};

export type LocationPartnerBoxPayload = {
  day_report: number;
  location_id: number;
  offset: number;
  standby_energy: number;
  unique_id?: string;
  vendor_id?: string;
};

export function getPartnerBoxLookupKeys(record: PartnerBoxLookupRecord) {
  const keys = [record.uniqueId, record.unique_id, record.vendorId, record.vendor_id]
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value));

  return [...new Set(keys)];
}

export function findLocationPartnerBox(boxes: LocationPartnerBox[] | null | undefined, charger: PartnerBoxLookupRecord) {
  if (!boxes?.length) return undefined;

  const lookupKeys = new Set(getPartnerBoxLookupKeys(charger));
  if (lookupKeys.size === 0) return undefined;

  return boxes.find(box => getPartnerBoxLookupKeys(box).some(key => lookupKeys.has(key)));
}

export function buildLocationPartnerBoxPayload(charger: PartnerBoxLookupRecord, locationId: number): LocationPartnerBoxPayload {
  const uniqueId = charger.uniqueId?.trim() || charger.unique_id?.trim();
  const vendorId = charger.vendorId?.trim() || charger.vendor_id?.trim();
  const identifier = uniqueId?.startsWith('Ebox_') ? { unique_id: uniqueId } : { vendor_id: vendorId || uniqueId };

  if (!identifier.unique_id && !identifier.vendor_id) {
    throw new Error('Charger identifier is unavailable.');
  }

  return {
    day_report: 0,
    location_id: locationId,
    offset: 0,
    standby_energy: 0,
    ...identifier,
  };
}
