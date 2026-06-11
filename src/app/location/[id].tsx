import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

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
        <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
          Back
        </ThemedText>
      </Pressable>

      {locationQuery.isLoading ? (
        <ThemedView gap={Spacing.four}>
          <ActivityIndicator color={Palette.accent} />
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20} textAlign='center'>
            Loading location
          </ThemedText>
        </ThemedView>
      ) : locationQuery.isError || !location ? (
        <ThemedView gap={Spacing.four}>
          <EmptyState title='Location unavailable' message='The location could not be loaded.' />
          <AppButton label='Retry' onPress={() => locationQuery.refetch()} />
        </ThemedView>
      ) : (
        <>
          <ThemedView
            backgroundColor={Palette.surfaceRaised}
            borderColor={Palette.borderSubtle}
            borderRadius={Radius.large}
            borderWidth={1}
            gap={Spacing.four}
            padding={Spacing.four}>
            <ThemedView alignItems='flex-start' flexDirection='row' gap={Spacing.three} justifyContent='space-between'>
              <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
                <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13} textTransform='uppercase'>
                  Location #{location.id}
                </ThemedText>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={28} letterSpacing={0} lineHeight={34}>
                  {location.name}
                </ThemedText>
              </ThemedView>
              <AppButton label='Actions' onPress={() => setActionsOpen(true)} />
            </ThemedView>
            <ThemedView flexDirection='row' flexWrap='wrap' gap={Spacing.two}>
              <StatusChip label={location.operationStatus?.label || 'Unknown'} tone={location.visible === false ? 'danger' : 'success'} />
              <StatusChip label={location.visible === false ? 'Hidden' : 'On map'} tone={location.visible === false ? 'danger' : 'success'} />
            </ThemedView>
          </ThemedView>

          <ThemedView gap={Spacing.three}>
            <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                Stations
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={14}>
                {stationsQuery.data?.length || 0}
              </ThemedText>
            </ThemedView>
            {stationsQuery.isLoading ? (
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20} textAlign='center'>
                Loading stations
              </ThemedText>
            ) : (stationsQuery.data || []).length === 0 ? (
              <EmptyState title='No stations' message='No station records were returned for this location.' />
            ) : (
              <ThemedView gap={Spacing.three}>
                {(stationsQuery.data || []).map(station => (
                  <ThemedView
                    key={station.id}
                    alignItems='center'
                    backgroundColor={Palette.surfaceRaised}
                    borderColor={Palette.borderSubtle}
                    borderRadius={Radius.large}
                    borderWidth={1}
                    flexDirection='row'
                    gap={Spacing.three}
                    justifyContent='space-between'
                    padding={Spacing.four}>
                    <ThemedView>
                      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22}>
                        {station.name || `Station #${station.id}`}
                      </ThemedText>
                      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} marginTop={3}>
                        Station #{station.id}
                      </ThemedText>
                    </ThemedView>
                    <StatusChip label={station.visible === false ? 'Hidden' : 'Visible'} tone={station.visible === false ? 'danger' : 'success'} />
                  </ThemedView>
                ))}
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView gap={Spacing.three}>
            <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                Charger actions
              </ThemedText>
              <StatusChip label='Service ready' tone='success' />
            </ThemedView>
            <ChargerCard
              charger={{
                enabled: true,
                id: 0,
                name: 'Select a station charger',
                uniqueId: 'Ebox / Ecar workflow',
                visible: true,
              }}
            />
          </ThemedView>
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
});
