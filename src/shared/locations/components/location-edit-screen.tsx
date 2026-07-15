import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ChevronRight, RefreshCcw } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import AnimatedHeaderScrollViewComponent from 'components/organisms/animated-header-scrollview';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import {
  buildLocationEditorPayloads,
  getLocationEditorFallbackDisplay,
  getLocationEditorOptions,
  getLocationEditorValue,
  locationEditorSections,
} from '../location-edit-fields';
import { useLocationDetail, useLocationEditorLookups, useLocationPartnership, useUpdateLocation, useUpdateLocationPartnership } from '../hooks';
import { LocationFieldEditorModal } from './location-field-editor-modal';
import type { LocationEditorField, LocationEditorLookups, LocationEditorOption, LocationEditorValue } from '../location-edit-fields';

export function LocationEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const locationId = Array.isArray(id) ? id[0] : String(id || '');
  const locationQuery = useLocationDetail(locationId);
  const location = locationQuery.data;
  const partnershipQuery = useLocationPartnership(location);
  const partnership = partnershipQuery.data;
  const lookupsQuery = useLocationEditorLookups(Boolean(location));
  const updateLocation = useUpdateLocation(locationId);
  const updatePartnership = useUpdateLocationPartnership(locationId, partnership?.locationId);
  const [activeField, setActiveField] = useState<LocationEditorField>();
  const [draftValue, setDraftValue] = useState<LocationEditorValue>('');
  const [editorError, setEditorError] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<LocationEditorValue>();
  const [saving, setSaving] = useState(false);

  const lookups: LocationEditorLookups = {
    locationTypes: lookupsQuery.locationTypes.data || [],
    operationStatuses: lookupsQuery.operationStatuses.data || [],
    priceProfiles: lookupsQuery.priceProfiles.data || [],
    provinces: lookupsQuery.provinces.data || [],
    wards: lookupsQuery.wards.data || [],
  };
  const refreshing = locationQuery.isRefetching || partnershipQuery.isRefetching;

  const refresh = () => {
    void locationQuery.refetch();
    void partnershipQuery.refetch();
  };

  function openField(field: LocationEditorField) {
    if (!location || field.readOnly || (field.partnerOnly && !partnership)) return;
    updateLocation.reset();
    updatePartnership.reset();
    setEditorError('');
    setDraftValue(getLocationEditorValue(field.key, location, partnership));
    setActiveField(field);
  }

  function closeEditor() {
    if (saving) return;
    setActiveField(undefined);
    setDraftValue('');
    setEditorError('');
  }

  async function saveField() {
    if (!activeField || !location) return;
    const parsedValue = parseEditorValue(activeField, draftValue);

    if (parsedValue.error) {
      setEditorError(parsedValue.error);
      return;
    }

    const payloads = buildLocationEditorPayloads(activeField.key, parsedValue.value);
    let operationSaved = false;
    setEditorError('');
    setSaving(true);

    try {
      if (payloads.operation) {
        await updateLocation.mutateAsync(payloads.operation);
        operationSaved = true;
        if (activeField.key === 'province') setSelectedProvince(parsedValue.value);
      }
      if (payloads.partnership && partnership) {
        await updatePartnership.mutateAsync(payloads.partnership);
      }
      setActiveField(undefined);
      setDraftValue('');
      if (process.env.EXPO_OS === 'ios') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'This change could not be saved.';
      setEditorError(operationSaved ? `Operation saved. Partnership update failed: ${message}` : message);
    } finally {
      setSaving(false);
    }
  }

  if (locationQuery.isLoading) {
    return (
      <ThemedView backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} padding={'four'} safePaddingTop>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView borderRadius={'large'} height={270} loading />
        <ThemedView borderRadius={'large'} height={220} loading />
      </ThemedView>
    );
  }

  if (locationQuery.isError || !location) {
    return (
      <ThemedView alignItems='center' backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} justifyContent='center' padding={'four'}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState message='The location details could not be loaded.' title='Location unavailable' />
        <AppButton label='Retry' onPress={() => locationQuery.refetch()} />
      </ThemedView>
    );
  }

  const optionsFor = (field: LocationEditorField) => getLocationEditorOptions(field.key, lookups, location, partnership, selectedProvince);
  const activeOptions = activeField ? optionsFor(activeField) : [];
  const activeOptionsLoading = activeField ? isLookupLoading(activeField, lookupsQuery) : false;

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimatedHeaderScrollViewComponent
        canGoBack
        contentContainerStyle={{ backgroundColor: Palette.surfaceBase, gap: 26, paddingHorizontal: 16 }}
        largeHeaderSubtitleStyle={{ color: Palette.textSecondary, fontFamily: FontFamily.regular, fontSize: 16 }}
        largeHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.semibold, fontSize: 34 }}
        largeTitle='Edit location'
        rightComponent={
          <Pressable accessibilityLabel='Refresh location' disabled={refreshing} hitSlop={8} onPress={refresh}>
            <ThemedView
              alignItems='center'
              backgroundColor={Palette.surfaceMuted}
              borderRadius={'pill'}
              height={36}
              justifyContent='center'
              opacity={refreshing ? 0.6 : 1}
              width={36}>
              {refreshing ? <ActivityIndicator color={Palette.accent} size='small' /> : <RefreshCcw color={Palette.textPrimary} size={17} />}
            </ThemedView>
          </Pressable>
        }
        showsVerticalScrollIndicator={false}
        smallHeaderSubtitleStyle={{ color: Palette.textSecondary, fontFamily: FontFamily.regular }}
        smallHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.semibold }}
        subtitle={location.nameVn || location.name}>
        <ThemedView backgroundColor='transparent' gap={4} paddingHorizontal={4}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={20} lineHeight={26}>
            Edit details
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
            {location.displayAddress || location.addressVn || location.address || 'Address not set'}
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontSize={12} lineHeight={17}>
            Tap a value to edit. Changes are saved individually.
          </ThemedText>
        </ThemedView>

        <ThemedView backgroundColor='transparent' gap={26} paddingBottom={28}>
          {locationEditorSections.map(section => (
            <ThemedView backgroundColor='transparent' gap={9} key={section.title}>
              <ThemedView backgroundColor='transparent' gap={2} paddingHorizontal={4}>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} letterSpacing={0.5} textTransform='uppercase'>
                  {section.title}
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontSize={12} lineHeight={16}>
                  {section.subtitle}
                </ThemedText>
              </ThemedView>

              {section.title === 'Partnership' ? (
                <PartnershipNotice isError={partnershipQuery.isError} isLoading={partnershipQuery.isLoading} partnership={partnership} />
              ) : null}

              <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={16} overflow='hidden'>
                {section.fields.map((field, index) => {
                  const value = getLocationEditorValue(field.key, location, partnership);
                  const options = optionsFor(field);
                  const displayValue = getEditorDisplayValue(field, value, options, location, partnership);
                  const disabled = Boolean(field.readOnly || (field.partnerOnly && !partnership));

                  return (
                    <ThemedView backgroundColor='transparent' key={field.key} opacity={disabled ? 0.48 : 1}>
                      <Pressable
                        accessibilityHint={disabled ? undefined : `Opens an editor for ${field.label.toLowerCase()}`}
                        accessibilityLabel={`${field.label}, ${displayValue}`}
                        accessibilityRole={disabled ? 'text' : 'button'}
                        disabled={disabled}
                        onPress={() => openField(field)}
                        style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
                        <ThemedView
                          alignItems='center'
                          backgroundColor='transparent'
                          flexDirection='row'
                          gap={10}
                          minHeight={58}
                          paddingHorizontal={14}
                          paddingVertical={10}>
                          <ThemedText color={Palette.textPrimary} flex={0.86} fontFamily={FontFamily.medium} fontSize={14} lineHeight={19}>
                            {field.label}
                          </ThemedText>
                          <ThemedText
                            color={displayValue === 'Not set' ? Palette.textTertiary : Palette.textSecondary}
                            flex={1}
                            fontSize={13}
                            lineHeight={18}
                            numberOfLines={field.input === 'multiline' ? 2 : 1}
                            selectable
                            textAlign='right'>
                            {displayValue}
                          </ThemedText>
                          {!field.readOnly ? <ChevronRight color='#B8B8BD' size={17} strokeWidth={2.2} /> : null}
                        </ThemedView>
                      </Pressable>
                      {index < section.fields.length - 1 ? <ThemedView backgroundColor={Palette.borderSubtle} height={1} marginLeft={14} /> : null}
                    </ThemedView>
                  );
                })}
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </AnimatedHeaderScrollViewComponent>

      <LocationFieldEditorModal
        error={editorError}
        field={activeField}
        key={activeField?.key || 'closed'}
        loadingOptions={activeOptionsLoading}
        onClose={closeEditor}
        onSave={saveField}
        onValueChange={setDraftValue}
        options={activeOptions}
        saving={saving}
        value={draftValue}
      />
    </ThemedView>
  );
}

function PartnershipNotice({ isError, isLoading, partnership }: { isError: boolean; isLoading: boolean; partnership?: LocationPartnership | null }) {
  if (isLoading) {
    return (
      <ThemedView alignItems='center' backgroundColor='#EEF7F2' borderRadius={12} flexDirection='row' gap={10} padding={12}>
        <ActivityIndicator color={Palette.accent} size='small' />
        <ThemedText color={Palette.textSecondary} flex={1} fontSize={12} lineHeight={17}>
          Checking partnership data...
        </ThemedText>
      </ThemedView>
    );
  }

  if (isError || !partnership) {
    return (
      <ThemedView backgroundColor='#FFF4E8' borderRadius={12} padding={12}>
        <ThemedText color='#8A541E' fontSize={12} lineHeight={17}>
          {isError ? 'Partnership data could not be loaded.' : 'No partnership record is linked to this location.'}
        </ThemedText>
      </ThemedView>
    );
  }

  if (partnership.detailAvailable === false) {
    return (
      <ThemedView backgroundColor='#FFF4E8' borderRadius={12} padding={12}>
        <ThemedText color='#8A541E' fontSize={12} lineHeight={17}>
          Some partnership details are unavailable. Available values can still be edited.
        </ThemedText>
      </ThemedView>
    );
  }

  return null;
}

function getEditorDisplayValue(
  field: LocationEditorField,
  value: LocationEditorValue,
  options: LocationEditorOption[],
  location: LocationRecord,
  partnership?: LocationPartnership | null,
) {
  if (field.input === 'select') {
    const selected = options.find(option => resourceId(option.value) === resourceId(value));
    if (selected) return selected.label;
  }
  return getLocationEditorFallbackDisplay(field.key, location, partnership);
}

function resourceId(value: LocationEditorValue) {
  if (value === null || value === undefined) return '';
  return String(value).split('/').filter(Boolean).pop() || '';
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
