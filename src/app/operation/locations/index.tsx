import { mhs } from 'themes/scaling';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Search, Zap } from 'lucide-react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { LocationCard } from 'shared/locations/components/location-card';
import { LocationListSkeleton } from 'shared/locations/components/location-list-skeleton';
import { RelocateLocationModal, RelocateStationModal } from 'shared/locations/components/relocate-location-modal';
import { LocationResourceFormSheet } from 'shared/locations/components/location-resource-form-sheet';
import { LocationStationsSheet } from 'shared/locations/components/location-stations-sheet';
import { useLocations, useLocationStatusOptions, useUploadLocationImage } from 'shared/locations/hooks';
import { AppButton, EmptyState } from 'components/ui';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { StationEditSheet } from 'shared/stations/components/station-details-content';

type StationActionTarget = { location: LocationRecord; station: StationRecord };
type SheetExitAction = { locationId: string; stationId: string; type: 'station' } | { target: StationActionTarget; type: 'edit-station' | 'relocate-station' };

export default function LocationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [editLocation, setEditLocation] = useState<LocationRecord | undefined>();
  const [relocateLocation, setRelocateLocation] = useState<LocationRecord | undefined>();
  const [editStationTarget, setEditStationTarget] = useState<StationActionTarget>();
  const [relocateStationTarget, setRelocateStationTarget] = useState<StationActionTarget>();
  const [sheetLocation, setSheetLocation] = useState<LocationRecord | undefined>();
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const sheetExitActionRef = useRef<SheetExitAction | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('');
  const normalizedSearch = search.trim();
  const searchingCharger = isChargerSearch(normalizedSearch);
  const locationFilters = useMemo(
    () => ({
      charger: searchingCharger ? normalizedSearch : undefined,
      name: normalizedSearch && !searchingCharger ? normalizedSearch : undefined,
      operationStatus: statusFilter || undefined,
    }),
    [normalizedSearch, searchingCharger, statusFilter],
  );
  const locationsQuery = useLocations(locationFilters);
  const statusOptionsQuery = useLocationStatusOptions();
  const uploadLocationImage = useUploadLocationImage();
  const locations = useMemo(() => locationsQuery.data?.pages.flatMap(page => page.items) || [], [locationsQuery.data]);
  const total = locationsQuery.data?.pages[0]?.total ?? locations.length;
  const statusOptions = useMemo(
    () =>
      [...new Set((statusOptionsQuery.data || []).map(option => option.label || option.labelVn).filter((label): label is string => Boolean(label)))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [statusOptionsQuery.data],
  );
  const hasActiveFilters = Boolean(normalizedSearch || statusFilter);
  const uploadImageForLocation = useCallback(
    async (location: LocationRecord) => {
      if (uploadLocationImage.isPending) return;

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Please allow photo library access to upload a location image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      uploadLocationImage.mutate(
        {
          file: {
            name: asset.fileName || `location-${location.id}.jpg`,
            type: asset.mimeType || 'image/jpeg',
            uri: asset.uri,
          },
          id: location.id,
        },
        {
          onError: error => {
            Alert.alert('Upload failed', error.message || 'The location image could not be uploaded.');
          },
        },
      );
    },
    [uploadLocationImage],
  );

  const renderLocation = useCallback(
    ({ item }: { item: LocationRecord }) => (
      <LocationCard
        location={item}
        onEdit={() => setEditLocation(item)}
        onPress={() => {
          setSheetLocation(item);
          setLocationSheetOpen(true);
        }}
        onRelocate={() => setRelocateLocation(item)}
        onUploadImage={() => uploadImageForLocation(item)}
      />
    ),
    [uploadImageForLocation],
  );

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <AnimatedHeaderFlatList
        largeTitle='Locations'
        subtitle={`${locations.length.toLocaleString()} of ${total.toLocaleString()} locations`}
        canGoBack
        onBack={() => router.back()}
        searchBar={<LocationSearchField charger={searchingCharger} onChangeText={setSearch} placeholder='Search location or charger...' value={search} />}
        contentContainerStyle={styles.content}
        data={locations}
        keyboardShouldPersistTaps='handled'
        keyExtractor={location => String(location.id)}
        ListEmptyComponent={
          locationsQuery.isLoading ? (
            <LocationListSkeleton />
          ) : locationsQuery.isError ? (
            <ThemedView alignItems='center' gap={'four'} paddingTop={'eight'}>
              <EmptyState message='The location list could not be loaded.' title='Locations unavailable' />
              <AppButton label='Retry' onPress={() => locationsQuery.refetch()} />
            </ThemedView>
          ) : (
            <EmptyState
              message={hasActiveFilters ? 'Try another location, charger, or status filter.' : 'No locations are currently available.'}
              title='No locations found'
            />
          )
        }
        ListFooterComponent={
          locationsQuery.isFetchingNextPage ? (
            <ThemedView alignItems='center' backgroundColor='transparent' paddingVertical={'four'}>
              <ActivityIndicator color={Palette.accent} size='small' />
            </ThemedView>
          ) : null
        }
        ListHeaderComponent={
          <ThemedView paddingHorizontal={'four'}>
            <ScrollView contentContainerStyle={styles.filters} horizontal showsHorizontalScrollIndicator={false}>
              <StatusFilterChip active={!statusFilter} label='All' onPress={() => setStatusFilter('')} />
              {statusOptions.map(status => (
                <StatusFilterChip active={statusFilter === status} key={status} label={status} onPress={() => setStatusFilter(status)} />
              ))}
            </ScrollView>
          </ThemedView>
        }
        onEndReached={() => {
          if (locationsQuery.hasNextPage && !locationsQuery.isFetchingNextPage) void locationsQuery.fetchNextPage();
        }}
        onEndReachedThreshold={0.35}
        refreshControl={
          <RefreshControl
            onRefresh={() => locationsQuery.refetch()}
            refreshing={locationsQuery.isRefetching && !locationsQuery.isFetchingNextPage}
            tintColor={Palette.accent}
          />
        }
        renderItem={renderLocation}
        showsVerticalScrollIndicator={false}
      />

      <LocationStationsSheet
        location={sheetLocation}
        onClose={() => setLocationSheetOpen(false)}
        onClosed={() => {
          setSheetLocation(undefined);
          const exitAction = sheetExitActionRef.current;
          sheetExitActionRef.current = undefined;
          if (exitAction?.type === 'station') {
            router.push({ pathname: '/station/[stationId]', params: { locationId: exitAction.locationId, stationId: exitAction.stationId } });
          } else if (exitAction?.type === 'edit-station') {
            setEditStationTarget(exitAction.target);
          } else if (exitAction?.type === 'relocate-station') {
            setRelocateStationTarget(exitAction.target);
          }
        }}
        onEditStation={(location, station) => {
          sheetExitActionRef.current = { target: { location, station }, type: 'edit-station' };
          setLocationSheetOpen(false);
        }}
        onRelocateStation={(location, station) => {
          sheetExitActionRef.current = { target: { location, station }, type: 'relocate-station' };
          setLocationSheetOpen(false);
        }}
        onSelectStation={(location, station) => {
          sheetExitActionRef.current = { locationId: String(location.id), stationId: String(station.id), type: 'station' };
          setLocationSheetOpen(false);
        }}
        open={locationSheetOpen}
      />
      <LocationResourceFormSheet location={editLocation} onClose={() => setEditLocation(undefined)} open={Boolean(editLocation)} />
      <RelocateLocationModal location={relocateLocation} onClose={() => setRelocateLocation(undefined)} />
      <RelocateStationModal
        locationId={relocateStationTarget?.location.id}
        onClose={() => setRelocateStationTarget(undefined)}
        station={relocateStationTarget?.station}
      />
      <StationEditSheet
        locationId={editStationTarget?.location.id || ''}
        onClose={() => setEditStationTarget(undefined)}
        open={Boolean(editStationTarget)}
        station={editStationTarget?.station}
      />
    </ThemedView>
  );
}

function isChargerSearch(value: string) {
  return /^(?:Ecar_|Ebox_|\d)/i.test(value);
}

function LocationSearchField({
  charger = false,
  onChangeText,
  placeholder,
  value,
}: {
  charger?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const Icon = charger ? Zap : Search;

  return (
    <ThemedView
      alignItems='center'
      backgroundColor={Palette.surfaceRaised}
      borderColor={Palette.borderSubtle}
      borderCurve='continuous'
      borderRadius={mhs(21)}
      borderWidth={1}
      flexDirection='row'
      gap={'two'}
      minHeight={44}
      paddingHorizontal={'three'}>
      <Icon color={charger ? Palette.accent : Palette.textTertiary} size={17} strokeWidth={2.1} />
      <TextInput
        accessibilityLabel={placeholder}
        accessibilityHint='Ecar_, Ebox_, and numeric searches are treated as charger searches.'
        autoCapitalize='none'
        autoCorrect={false}
        clearButtonMode='while-editing'
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor='#98A2B3'
        returnKeyType='search'
        style={styles.searchInput}
        value={value}
      />
    </ThemedView>
  );
}

function StatusFilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={`Filter locations by ${label}`} accessibilityRole='button' onPress={onPress}>
      {({ pressed }) => (
        <ThemedView
          backgroundColor={active ? Palette.surfaceMuted : Palette.surfaceRaised}
          borderColor={active ? Palette.border : Palette.borderSubtle}
          borderRadius={'pill'}
          borderWidth={1}
          justifyContent='center'
          minHeight={32}
          opacity={pressed ? 0.72 : 1}
          paddingHorizontal={12}>
          <ThemedText color={active ? Palette.textPrimary : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
            {label}
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },
  filters: {
    gap: mhs(8),
  },
  searchInput: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    minHeight: 42,
    paddingVertical: 0,
  },
});
