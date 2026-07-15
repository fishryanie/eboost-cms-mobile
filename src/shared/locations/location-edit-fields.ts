import type { LocationEditorLookupRecord } from './location-service';
import type { UpdateLocationValues } from './hooks';

export type LocationEditorValue = boolean | null | number | string;

export type LocationEditorFieldKey =
  | 'address'
  | 'addressVn'
  | 'contractCode'
  | 'contractEndDate'
  | 'contractStartDate'
  | 'description'
  | 'descriptionVn'
  | 'installationDate'
  | 'latitude'
  | 'locationCode'
  | 'locationStatus'
  | 'locationType'
  | 'longitude'
  | 'name'
  | 'nameVn'
  | 'notes'
  | 'operationStatus'
  | 'priceProfileId'
  | 'province'
  | 'reportCode'
  | 'reportName'
  | 'serviceName'
  | 'visible'
  | 'ward';

export type LocationEditorField = {
  input: 'boolean' | 'date' | 'multiline' | 'number' | 'select' | 'text';
  key: LocationEditorFieldKey;
  label: string;
  partnerOnly?: boolean;
  readOnly?: boolean;
  required?: boolean;
};

export type LocationEditorSection = {
  fields: LocationEditorField[];
  subtitle: string;
  title: string;
};

export type LocationEditorOption = {
  label: string;
  value: string;
};

export type LocationEditorLookups = {
  locationTypes: LocationEditorLookupRecord[];
  operationStatuses: LocationEditorLookupRecord[];
  priceProfiles: LocationEditorLookupRecord[];
  provinces: LocationEditorLookupRecord[];
  wards: LocationEditorLookupRecord[];
};

export const locationEditorSections: LocationEditorSection[] = [
  {
    fields: [
      { input: 'text', key: 'nameVn', label: 'Name (VI)', required: true },
      { input: 'text', key: 'name', label: 'Name (EN)', required: true },
      { input: 'multiline', key: 'addressVn', label: 'Address (VI)', required: true },
      { input: 'multiline', key: 'address', label: 'Address (EN)', required: true },
      { input: 'select', key: 'province', label: 'Province', required: true },
      { input: 'select', key: 'ward', label: 'Ward', required: true },
    ],
    subtitle: 'Shared identity and address information.',
    title: 'General',
  },
  {
    fields: [
      { input: 'number', key: 'latitude', label: 'Latitude', required: true },
      { input: 'number', key: 'longitude', label: 'Longitude', required: true },
      { input: 'select', key: 'operationStatus', label: 'Status' },
      { input: 'select', key: 'locationType', label: 'Location type' },
      { input: 'multiline', key: 'descriptionVn', label: 'Description (VI)' },
      { input: 'multiline', key: 'description', label: 'Description (EN)' },
      { input: 'boolean', key: 'visible', label: 'Visible on map' },
    ],
    subtitle: 'Fields stored on the operation location.',
    title: 'Operation',
  },
  {
    fields: [
      { input: 'text', key: 'locationCode', label: 'Location code', required: true },
      { input: 'select', key: 'locationStatus', label: 'Partner status', partnerOnly: true },
      { input: 'select', key: 'priceProfileId', label: 'Price profile', partnerOnly: true, required: true },
      { input: 'multiline', key: 'notes', label: 'Notes', partnerOnly: true },
      { input: 'text', key: 'contractCode', label: 'Contract code', partnerOnly: true, required: true },
      { input: 'date', key: 'installationDate', label: 'Installation date', partnerOnly: true, required: true },
      { input: 'date', key: 'contractStartDate', label: 'Contract start', partnerOnly: true, required: true },
      { input: 'date', key: 'contractEndDate', label: 'Contract end', partnerOnly: true, required: true },
      { input: 'text', key: 'reportCode', label: 'Report code', partnerOnly: true, readOnly: true },
      { input: 'text', key: 'serviceName', label: 'Service name', partnerOnly: true, required: true },
      { input: 'multiline', key: 'reportName', label: 'Report name', partnerOnly: true, required: true },
    ],
    subtitle: 'Commercial, contract, and reporting information.',
    title: 'Partnership',
  },
];

export function getLocationEditorValue(key: LocationEditorFieldKey, location: LocationRecord, partnership?: LocationPartnership | null): LocationEditorValue {
  switch (key) {
    case 'province':
      return location.ward?.province?.id ?? partnership?.address?.province ?? null;
    case 'ward':
      return location.ward?.id ?? partnership?.address?.ward ?? partnership?.address?.district ?? null;
    case 'operationStatus':
      return location.operationStatus?.iriId ?? location.operationStatus?.id ?? null;
    case 'locationType':
      return location.locationType?.iriId ?? location.locationType?.id ?? null;
    case 'locationCode':
      return partnership?.locationCode ?? stripReportPrefix(location.locationCode ?? location.location_code ?? '');
    case 'locationStatus':
      return partnership?.locationStatus ?? null;
    case 'priceProfileId':
      return partnership?.priceProfileId ?? (partnership?.tariff && typeof partnership.tariff === 'object' ? partnership.tariff.id : null) ?? null;
    case 'notes':
      return partnership?.notes ?? null;
    case 'contractCode':
      return partnership?.contractCode ?? null;
    case 'installationDate':
      return partnership?.installationDate ?? null;
    case 'contractStartDate':
      return partnership?.contractStartDate ?? null;
    case 'contractEndDate':
      return partnership?.contractEndDate ?? null;
    case 'reportCode':
      return partnership?.reportCode ?? null;
    case 'serviceName':
      return partnership?.serviceName ?? null;
    case 'reportName':
      return partnership?.reportName ?? null;
    default:
      return location[key as keyof LocationRecord] as LocationEditorValue;
  }
}

export function getLocationEditorFallbackDisplay(key: LocationEditorFieldKey, location: LocationRecord, partnership?: LocationPartnership | null): string {
  switch (key) {
    case 'province':
      return location.ward?.province?.name || location.ward?.province?.nameVn || 'Not set';
    case 'ward':
      return location.ward?.name || location.ward?.nameVn || 'Not set';
    case 'operationStatus':
      return location.operationStatus?.label || 'Not set';
    case 'locationType':
      return location.locationType?.name || location.locationType?.nameVn || 'Not set';
    case 'priceProfileId':
      return typeof partnership?.tariff === 'string' ? partnership.tariff : partnership?.tariff?.name || partnership?.tariff?.title || 'Not set';
    case 'visible':
      return location.visible === false ? 'No' : 'Yes';
    default: {
      const value = getLocationEditorValue(key, location, partnership);
      return value === null || value === undefined || value === '' ? 'Not set' : String(value);
    }
  }
}

export function getLocationEditorOptions(
  key: LocationEditorFieldKey,
  lookups: LocationEditorLookups,
  location: LocationRecord,
  partnership?: LocationPartnership | null,
  selectedProvince?: LocationEditorValue,
): LocationEditorOption[] {
  switch (key) {
    case 'province':
      return mapOptions(lookups.provinces, 'name', false);
    case 'ward': {
      const provinceId = selectedProvince ?? location.ward?.province?.id ?? partnership?.address?.province;
      return mapOptions(
        lookups.wards.filter(record => !provinceId || getResourceId(record.provinceId ?? record.province) === String(provinceId)),
        'name',
        false,
      );
    }
    case 'operationStatus':
      return mapOptions(lookups.operationStatuses, 'label', true);
    case 'locationStatus':
      return lookups.operationStatuses
        .map(record => {
          const label = record.label || record.labelVn;
          return label ? { label, value: label } : null;
        })
        .filter((option): option is LocationEditorOption => Boolean(option));
    case 'locationType':
      return mapOptions(lookups.locationTypes, 'name', true);
    case 'priceProfileId':
      return mapOptions(lookups.priceProfiles, 'name', false);
    default:
      return [];
  }
}

export function buildLocationEditorPayloads(key: LocationEditorFieldKey, value: LocationEditorValue) {
  const result: { operation?: UpdateLocationValues; partnership?: Record<string, unknown> } = {};

  switch (key) {
    case 'nameVn':
      result.operation = { nameVn: value as string | null };
      result.partnership = { name: value };
      break;
    case 'addressVn':
      result.operation = { addressVn: value as string | null };
      result.partnership = { address: value };
      break;
    case 'province':
      result.operation = { province: value ? `/api/provinces/${value}` : null };
      result.partnership = { province_id: toOptionalNumber(value) };
      break;
    case 'ward':
      result.operation = { ward: value ? `/api/wards/${value}` : null };
      result.partnership = { district_id: toOptionalNumber(value) };
      break;
    case 'operationStatus':
      result.operation = { operationStatus: value as string | null };
      break;
    case 'locationType':
      result.operation = { locationType: value as string | null };
      break;
    case 'locationCode': {
      const locationCode = stripReportPrefix(String(value || '')).trim();
      const reportCode = locationCode ? `EVM-${locationCode}` : null;
      result.operation = { locationCode: reportCode };
      result.partnership = { location_code: locationCode || null, report_code: reportCode };
      break;
    }
    case 'locationStatus':
      result.partnership = { location_status: value };
      break;
    case 'priceProfileId':
      result.partnership = { price_profile_id: toOptionalNumber(value) };
      break;
    case 'notes':
      result.partnership = { notes: value };
      break;
    case 'contractCode':
      result.partnership = { contract_code: value };
      break;
    case 'installationDate':
      result.partnership = { installation_date: value };
      break;
    case 'contractStartDate':
      result.partnership = { contract_start_date: value };
      break;
    case 'contractEndDate':
      result.partnership = { contract_end_date: value };
      break;
    case 'serviceName':
      result.partnership = { service_name: value };
      break;
    case 'reportName':
      result.partnership = { report_name: value };
      break;
    case 'reportCode':
      break;
    default:
      result.operation = { [key]: value } as UpdateLocationValues;
  }

  return result;
}

function mapOptions(records: LocationEditorLookupRecord[], labelKey: 'label' | 'name', preferIri: boolean) {
  return records
    .map(record => {
      const value = preferIri ? record.iriId || record.id : (record.id ?? record.iriId);
      const label = record[labelKey] || record[labelKey === 'name' ? 'nameVn' : 'labelVn'];
      if (value === undefined || value === null || !label) return null;
      return { label, value: String(value) };
    })
    .filter((option): option is LocationEditorOption => Boolean(option));
}

function getResourceId(value: LocationEditorLookupRecord['province'] | LocationEditorLookupRecord['provinceId']) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'object') return getResourceId(value.id ?? value.iriId);
  const rawValue = String(value);
  return rawValue.startsWith('/api/') ? rawValue.split('/').filter(Boolean).pop() : rawValue;
}

function stripReportPrefix(value: string) {
  return value.replace(/^EVM-/i, '');
}

function toOptionalNumber(value: LocationEditorValue) {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(getResourceId(value as number | string));
  return Number.isFinite(numberValue) ? numberValue : null;
}
