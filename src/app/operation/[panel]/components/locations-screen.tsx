import { mhs } from 'themes/scaling';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput } from 'react-native';
import Modal from 'react-native-modal';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { LocationCard } from 'shared/locations/components/location-card';
import { LocationListSkeleton } from 'shared/locations/components/location-list-skeleton';
import { RelocateLocationModal } from 'shared/locations/components/relocate-location-modal';
import { LocationStationsSheet } from 'shared/locations/components/location-stations-sheet';
import { filterLocationsByStatus, getLocationStatusOptions } from 'shared/locations/location-filter';
import { useCreateLocation, useLocations, useUploadLocationImage } from 'shared/locations/hooks';
import { AppButton, EmptyState } from 'components/ui';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';

export default function LocationScreen({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();
  const [search, setSearch] = useState('');
  const [createOpenState, setCreateOpenState] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [relocateLocation, setRelocateLocation] = useState<LocationRecord | undefined>();
  const [sheetLocation, setSheetLocation] = useState<LocationRecord | undefined>();
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const sheetExitActionRef = useRef<{ locationId: string; type: 'edit' } | { locationId: string; stationId: string; type: 'station' } | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('');
  const locationsQuery = useLocations(search.trim());
  const createLocation = useCreateLocation();
  const uploadLocationImage = useUploadLocationImage();
  const locations = useMemo(() => locationsQuery.data || [], [locationsQuery.data]);
  const statusOptions = useMemo(() => getLocationStatusOptions(locations), [locations]);
  const filteredLocations = useMemo(() => filterLocationsByStatus(locations, statusFilter), [locations, statusFilter]);
  const createOpen = createOpenState || params.action === 'create';

  const closeCreate = useCallback(() => {
    if (createLocation.isPending) return;
    setCreateOpenState(false);
    if (params.action === 'create') {
      router.setParams({ action: undefined });
    }
    setNewLocationName('');
  }, [createLocation.isPending, params.action, router]);

  const submitCreate = useCallback(() => {
    const name = newLocationName.trim();
    if (!name) return;

    createLocation.mutate(
      { name },
      {
        onSuccess: location => {
          setCreateOpenState(false);
          if (params.action === 'create') {
            router.setParams({ action: undefined });
          }
          setNewLocationName('');
          setSheetLocation(location);
          setLocationSheetOpen(true);
        },
      },
    );
  }, [createLocation, newLocationName, params.action, router]);

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
        onEdit={() => router.push({ pathname: '/location/[id]/edit', params: { id: String(item.id) } })}
        onPress={() => {
          setSheetLocation(item);
          setLocationSheetOpen(true);
        }}
        onRelocate={() => setRelocateLocation(item)}
        onUploadImage={() => uploadImageForLocation(item)}
      />
    ),
    [router, uploadImageForLocation],
  );

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <AnimatedHeaderFlatList
        largeTitle='Locations'
        subtitle={`${filteredLocations.length.toLocaleString()} of ${locations.length.toLocaleString()} locations`}
        canGoBack={Boolean(onBack)}
        onBack={onBack}
        largeRightComponent={<CreateLocationButton onPress={() => setCreateOpenState(true)} />}
        rightComponent={<CreateLocationButton onPress={() => setCreateOpenState(true)} />}
        searchBar={
          <TextInput
            autoCapitalize='none'
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder='Search locations'
            placeholderTextColor='#98A2B3'
            returnKeyType='search'
            style={styles.search}
            value={search}
          />
        }
        contentContainerStyle={styles.content}
        data={filteredLocations}
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
            <EmptyState message={search.trim() ? 'Try another location name.' : 'Create a location to get started.'} title='No locations found' />
          )
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
        refreshControl={<RefreshControl onRefresh={() => locationsQuery.refetch()} refreshing={locationsQuery.isRefetching} tintColor={Palette.accent} />}
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
          if (exitAction?.type === 'edit') {
            router.push({ pathname: '/location/[id]/edit', params: { id: exitAction.locationId } });
          } else if (exitAction?.type === 'station') {
            router.push({ pathname: '/station/[stationId]', params: { locationId: exitAction.locationId, stationId: exitAction.stationId } });
          }
        }}
        onManage={location => {
          sheetExitActionRef.current = { locationId: String(location.id), type: 'edit' };
          setLocationSheetOpen(false);
        }}
        onSelectStation={(location, station) => {
          sheetExitActionRef.current = { locationId: String(location.id), stationId: String(station.id), type: 'station' };
          setLocationSheetOpen(false);
        }}
        open={locationSheetOpen}
      />
      <RelocateLocationModal location={relocateLocation} onClose={() => setRelocateLocation(undefined)} />

      <Modal
        animationIn='slideInUp'
        animationInTiming={360}
        animationOut='slideOutDown'
        animationOutTiming={260}
        avoidKeyboard
        backdropColor='#0F172A'
        backdropOpacity={0.28}
        backdropTransitionInTiming={360}
        backdropTransitionOutTiming={260}
        hideModalContentWhileAnimating
        isVisible={createOpen}
        onBackButtonPress={closeCreate}
        onBackdropPress={closeCreate}
        style={styles.bottomModal}>
        <ThemedView
          backgroundColor={Palette.surfaceBase}
          borderTopLeftRadius={'large'}
          borderTopRightRadius={'large'}
          gap={'three'}
          padding={'four'}
          paddingBottom={'six'}>
          <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={18} lineHeight={24}>
              Create location
            </ThemedText>
            <Pressable onPress={closeCreate} style={styles.closeButton}>
              <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={13}>
                Close
              </ThemedText>
            </Pressable>
          </ThemedView>
          <TextInput
            autoFocus
            onChangeText={setNewLocationName}
            placeholder='Location name'
            placeholderTextColor='#98A2B3'
            returnKeyType='done'
            style={styles.modalInput}
            value={newLocationName}
            onSubmitEditing={submitCreate}
          />
          {createLocation.isError ? (
            <ThemedText color={Palette.danger} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
              Could not create this location. Please try again.
            </ThemedText>
          ) : null}
          <AppButton block disabled={!newLocationName.trim()} label='Create new location' loading={createLocation.isPending} onPress={submitCreate} />
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

function CreateLocationButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel='Create location'
      accessibilityRole='button'
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.createButton, pressed && styles.filterChipPressed]}>
      <Plus color={Palette.surfaceBase} size={22} strokeWidth={2.5} />
    </Pressable>
  );
}

function StatusFilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.filterChipPressed]}>
      <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: mhs(20),
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeButton: {
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(4),
  },
  content: {
    paddingBottom: 120,
  },
  filterChip: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: mhs(12),
  },
  filterChipActive: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.border,
  },
  filterChipPressed: {
    opacity: 0.72,
  },
  filterChipText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
  filterChipTextActive: {
    color: Palette.textPrimary,
  },
  filters: {
    gap: mhs(8),
  },
  modalInput: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(21),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: mhs(14),
  },

  search: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: mhs(14),
  },
});
