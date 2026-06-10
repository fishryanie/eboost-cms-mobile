import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { LocationActionsSheet } from 'features/locations/components/location-actions-sheet';
import { LocationCard } from 'features/locations/components/location-card';
import { LocationListSkeleton } from 'features/locations/components/location-list-skeleton';
import { filterLocationsByStatus, getLocationStatusOptions } from 'features/locations/location-filter';
import { useCreateLocation, useLocations, useUploadLocationImage } from 'features/locations/hooks';
import type { LocationRecord } from 'features/locations/types';
import { AppButton, EmptyState } from 'shared/ui';

export default function LocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();
  const [search, setSearch] = useState('');
  const [createOpenState, setCreateOpenState] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord | undefined>();
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
          router.push({ pathname: '/location/[id]', params: { id: location.id } });
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
        onEdit={() => setSelectedLocation(item)}
        onPress={() => router.push({ pathname: '/location/[id]', params: { id: item.id } })}
        onRelocate={() => router.push({ pathname: '/menu/[slug]', params: { slug: 'pick-lat-lng' } })}
        onUploadImage={() => uploadImageForLocation(item)}
      />
    ),
    [router, uploadImageForLocation],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={filteredLocations}
        keyboardShouldPersistTaps='handled'
        keyExtractor={location => String(location.id)}
        ListEmptyComponent={
          locationsQuery.isLoading ? (
            <LocationListSkeleton />
          ) : locationsQuery.isError ? (
            <View style={styles.centerState}>
              <EmptyState message='The location list could not be loaded.' title='Locations unavailable' />
              <AppButton label='Retry' onPress={() => locationsQuery.refetch()} />
            </View>
          ) : (
            <EmptyState message={search.trim() ? 'Try another location name.' : 'Create a location to get started.'} title='No locations found' />
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Locations</Text>
                <Text style={styles.subtitle}>
                  {filteredLocations.length.toLocaleString()} of {locations.length.toLocaleString()} locations
                </Text>
              </View>
              <AppButton label='Create' onPress={() => setCreateOpenState(true)} style={styles.createButton} />
            </View>
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
            <ScrollView contentContainerStyle={styles.filters} horizontal showsHorizontalScrollIndicator={false}>
              <StatusFilterChip active={!statusFilter} label='All' onPress={() => setStatusFilter('')} />
              {statusOptions.map(status => (
                <StatusFilterChip active={statusFilter === status} key={status} label={status} onPress={() => setStatusFilter(status)} />
              ))}
            </ScrollView>
          </View>
        }
        refreshControl={<RefreshControl onRefresh={() => locationsQuery.refetch()} refreshing={locationsQuery.isRefetching} tintColor={Palette.accent} />}
        renderItem={renderLocation}
        showsVerticalScrollIndicator={false}
      />

      <LocationActionsSheet location={selectedLocation} onClose={() => setSelectedLocation(undefined)} open={Boolean(selectedLocation)} />

      <Modal animationType='slide' onRequestClose={closeCreate} transparent visible={createOpen}>
        <View style={styles.modalBackdrop}>
          <Pressable accessibilityLabel='Close create location' onPress={closeCreate} style={StyleSheet.absoluteFill} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create location</Text>
              <Pressable onPress={closeCreate} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
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
            {createLocation.isError ? <Text style={styles.errorText}>Could not create this location. Please try again.</Text> : null}
            <AppButton block disabled={!newLocationName.trim()} label='Create new location' loading={createLocation.isPending} onPress={submitCreate} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatusFilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.filterChipPressed]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingTop: Spacing.eight,
  },
  closeButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  closeText: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  content: {
    paddingBottom: 120,
  },
  createButton: {
    minHeight: 42,
  },
  errorText: {
    color: Palette.danger,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  filterChip: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: Spacing.three,
  },
  filterChipActive: {
    backgroundColor: Palette.textPrimary,
    borderColor: Palette.textPrimary,
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
    color: Palette.surfaceBase,
  },
  filters: {
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Palette.surfaceBase,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalInput: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: Radius.large,
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: Spacing.four,
  },
  modalTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  search: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: Spacing.four,
  },
  stateText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    marginTop: 2,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 28,
    letterSpacing: 0,
    lineHeight: 34,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
});
