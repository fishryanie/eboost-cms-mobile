import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { ChargerCard } from 'features/chargers/components/charger-card';
import { LocationActionsSheet } from 'features/locations/components/location-actions-sheet';
import { useLocationDetail, useLocationStations } from 'features/locations/hooks';
import { useState } from 'react';
import { AppButton, AppScreen, EmptyState, StatusChip } from 'shared/ui';

export default function LocationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const locationId = String(params.id || '');
  const [actionsOpen, setActionsOpen] = useState(false);
  const locationQuery = useLocationDetail(locationId);
  const stationsQuery = useLocationStations(locationId);
  const location = locationQuery.data;

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {locationQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Palette.accent} />
          <Text style={styles.stateText}>Loading location</Text>
        </View>
      ) : locationQuery.isError || !location ? (
        <View style={styles.centerState}>
          <EmptyState title='Location unavailable' message='The location could not be loaded.' />
          <AppButton label='Retry' onPress={() => locationQuery.refetch()} />
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.titleBlock}>
                <Text style={styles.eyebrow}>Location #{location.id}</Text>
                <Text style={styles.title}>{location.name}</Text>
              </View>
              <AppButton label='Actions' onPress={() => setActionsOpen(true)} />
            </View>
            <View style={styles.chips}>
              <StatusChip label={location.operationStatus?.label || 'Unknown'} tone={location.visible === false ? 'danger' : 'success'} />
              <StatusChip label={location.visible === false ? 'Hidden' : 'On map'} tone={location.visible === false ? 'danger' : 'success'} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Stations</Text>
              <Text style={styles.count}>{stationsQuery.data?.length || 0}</Text>
            </View>
            {stationsQuery.isLoading ? (
              <Text style={styles.stateText}>Loading stations</Text>
            ) : (stationsQuery.data || []).length === 0 ? (
              <EmptyState title='No stations' message='No station records were returned for this location.' />
            ) : (
              <View style={styles.list}>
                {(stationsQuery.data || []).map(station => (
                  <View key={station.id} style={styles.stationCard}>
                    <View>
                      <Text style={styles.stationTitle}>{station.name || `Station #${station.id}`}</Text>
                      <Text style={styles.stationMeta}>Station #{station.id}</Text>
                    </View>
                    <StatusChip label={station.visible === false ? 'Hidden' : 'Visible'} tone={station.visible === false ? 'danger' : 'success'} />
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Charger actions</Text>
              <StatusChip label='Service ready' tone='success' />
            </View>
            <ChargerCard
              charger={{
                enabled: true,
                id: 0,
                name: 'Select a station charger',
                uniqueId: 'Ebox / Ecar workflow',
                visible: true,
              }}
            />
          </View>
        </>
      )}

      <LocationActionsSheet location={location} onClose={() => setActionsOpen(false)} open={actionsOpen} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  backText: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  centerState: {
    gap: Spacing.four,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  count: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  eyebrow: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.four,
    padding: Spacing.four,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  list: {
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  stateText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  stationCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  stationMeta: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginTop: 3,
  },
  stationTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
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
    gap: Spacing.one,
    minWidth: 0,
  },
});
