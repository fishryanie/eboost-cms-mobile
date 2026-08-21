import { useMemo } from 'react';
import { Alert } from 'react-native';

import { ResourceFormSheet, type ResourceField } from 'app/location/[id]/components/resource-form-sheet';

import { buildLocationEditorPayloads, getLocationEditorOptions, getLocationEditorValue, locationEditorSections } from '../location-edit-fields';
import { useLocationDetail, useLocationEditorLookups, useLocationPartnership, useUpdateLocation, useUpdateLocationPartnership } from '../hooks';
import type { UpdateLocationValues } from '../hooks';
import type { LocationEditorField, LocationEditorLookups, LocationEditorValue } from '../location-edit-fields';

export function LocationResourceFormSheet({ location, onClose, open }: { location?: LocationRecord; onClose: () => void; open: boolean }) {
  const locationDetailQuery = useLocationDetail(location?.id || '', open);
  const resolvedLocation = locationDetailQuery.data || location;
  const embeddedPartnership = resolvedLocation?.partnership || resolvedLocation?.partnershipLocation;
  const partnershipQuery = useLocationPartnership(resolvedLocation);
  const partnership = embeddedPartnership || partnershipQuery.data;
  const lookupsQuery = useLocationEditorLookups(open && Boolean(resolvedLocation));
  const updateLocation = useUpdateLocation(location?.id || '');
  const updatePartnership = useUpdateLocationPartnership(location?.id || '', partnership?.locationId);
  const lookups: LocationEditorLookups = useMemo(
    () => ({
      locationTypes: lookupsQuery.locationTypes.data || [],
      operationStatuses: lookupsQuery.operationStatuses.data || [],
      priceProfiles: lookupsQuery.priceProfiles.data || [],
      provinces: lookupsQuery.provinces.data || [],
      wards: lookupsQuery.wards.data || [],
    }),
    [
      lookupsQuery.locationTypes.data,
      lookupsQuery.operationStatuses.data,
      lookupsQuery.priceProfiles.data,
      lookupsQuery.provinces.data,
      lookupsQuery.wards.data,
    ],
  );
  const editorFields = useMemo(
    () => locationEditorSections.flatMap(section => section.fields.filter(field => !field.partnerOnly || Boolean(partnership))),
    [partnership],
  );
  const fields = useMemo(
    () => (resolvedLocation ? editorFields.map(field => toResourceField(field, resolvedLocation, partnership, lookups, lookupsQuery)) : []),
    [editorFields, lookups, lookupsQuery, partnership, resolvedLocation],
  );
  const initialValues = useMemo(() => {
    if (!resolvedLocation) return undefined;
    return Object.fromEntries(editorFields.map(field => [field.key, getLocationEditorValue(field.key, resolvedLocation, partnership)]));
  }, [editorFields, partnership, resolvedLocation]);
  const preparing = Boolean(location && (locationDetailQuery.isLoading || (!embeddedPartnership && partnershipQuery.isLoading)));

  async function submit(values: Record<string, unknown>) {
    if (!resolvedLocation || !initialValues) return;

    const operationData: UpdateLocationValues = {};
    const partnershipData: Record<string, unknown> = {};

    for (const field of editorFields) {
      if (field.readOnly || sameEditorValue(field, values[field.key], initialValues[field.key])) continue;
      const parsed = parseEditorValue(field, values[field.key] as LocationEditorValue);
      if (parsed.error) {
        Alert.alert('Check information', parsed.error);
        return;
      }

      const payloads = buildLocationEditorPayloads(field.key, parsed.value);
      if (payloads.operation) Object.assign(operationData, payloads.operation);
      if (payloads.partnership) Object.assign(partnershipData, payloads.partnership);
    }

    const hasOperationChanges = Object.keys(operationData).length > 0;
    const hasPartnershipChanges = Boolean(partnership && Object.keys(partnershipData).length > 0);
    if (!hasOperationChanges && !hasPartnershipChanges) {
      onClose();
      return;
    }

    let operationSaved = false;
    try {
      if (hasOperationChanges) {
        await updateLocation.mutateAsync(operationData);
        operationSaved = true;
      }
      if (hasPartnershipChanges) {
        await updatePartnership.mutateAsync(partnershipData);
      }
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The location could not be updated.';
      Alert.alert('Update failed', operationSaved ? `Location saved, but partnership update failed: ${message}` : message);
    }
  }

  return (
    <ResourceFormSheet
      fields={fields}
      initialValues={initialValues}
      loading={updateLocation.isPending || updatePartnership.isPending}
      onClose={onClose}
      onSubmit={values => void submit(values)}
      open={open}
      preparing={preparing}
      resetKey={`${location?.id || 'closed'}:${preparing ? 'loading' : partnership?.locationId || 'core'}`}
      title='Edit location'
    />
  );
}

function toResourceField(
  field: LocationEditorField,
  location: LocationRecord,
  partnership: LocationPartnership | null | undefined,
  lookups: LocationEditorLookups,
  lookupsQuery: ReturnType<typeof useLocationEditorLookups>,
): ResourceField {
  const section = locationEditorSections.find(item => item.fields.some(itemField => itemField.key === field.key));

  return {
    clearOnChange: field.key === 'province' ? ['ward'] : undefined,
    key: field.key,
    keyboard: field.input === 'number' ? 'numeric' : 'default',
    label: field.label,
    loadingOptions: isLookupLoading(field, lookupsQuery),
    multiline: field.input === 'multiline',
    options:
      field.input === 'select'
        ? values => getLocationEditorOptions(field.key, lookups, location, partnership, values.province as LocationEditorValue)
        : undefined,
    placeholder: field.input === 'date' ? 'YYYY-MM-DD' : undefined,
    readOnly: field.readOnly,
    required: field.required,
    section: section?.title,
    sectionDescription: section?.subtitle,
    type: field.input === 'boolean' ? 'switch' : field.input === 'select' ? 'select' : 'text',
  };
}

function isLookupLoading(field: LocationEditorField, lookups: ReturnType<typeof useLocationEditorLookups>) {
  switch (field.key) {
    case 'operationStatus':
    case 'locationStatus':
      return lookups.operationStatuses.isLoading;
    case 'locationType':
      return lookups.locationTypes.isLoading;
    case 'province':
      return lookups.provinces.isLoading;
    case 'ward':
      return lookups.wards.isLoading;
    case 'priceProfileId':
      return lookups.priceProfiles.isLoading;
    default:
      return false;
  }
}

function parseEditorValue(field: LocationEditorField, rawValue: LocationEditorValue): { error?: string; value: LocationEditorValue } {
  if (field.input === 'boolean') return { value: Boolean(rawValue) };

  const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  if (field.required && (value === '' || value === null || value === undefined)) {
    return { error: `${field.label} is required.`, value };
  }
  if (value === '' || value === null || value === undefined) return { value: null };

  if (field.input === 'number') {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return { error: `Enter a valid ${field.label.toLowerCase()}.`, value };
    if (field.key === 'latitude' && (numberValue < -90 || numberValue > 90)) {
      return { error: 'Latitude must be between -90 and 90.', value };
    }
    if (field.key === 'longitude' && (numberValue < -180 || numberValue > 180)) {
      return { error: 'Longitude must be between -180 and 180.', value };
    }
    return { value: numberValue };
  }

  if (field.input === 'date' && !isValidDate(String(value))) {
    return { error: 'Use a valid date in YYYY-MM-DD format.', value };
  }

  return { value };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function sameEditorValue(field: LocationEditorField, left: unknown, right: unknown) {
  if ((left === '' || left === null || left === undefined) && (right === '' || right === null || right === undefined)) return true;
  if (field.input === 'boolean') return Boolean(left) === Boolean(right);
  if (field.input === 'number') return Number(left) === Number(right);
  if (field.input !== 'select') return String(left) === String(right);
  if (String(left) === String(right)) return true;
  const leftId = String(left).split('/').filter(Boolean).pop();
  const rightId = String(right).split('/').filter(Boolean).pop();
  return leftId === rightId;
}
