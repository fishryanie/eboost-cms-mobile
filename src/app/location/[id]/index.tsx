import { mhs } from 'themes/scaling';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { ChargerCard } from 'app/location/[id]/components/charger-card';
import { LocationActionsSheet } from 'shared/locations/components/location-actions-sheet';
import { useLocationDetail, useLocationStations } from 'shared/locations/hooks';
import { useState } from 'react';
import { AppButton, EmptyState, StatusChip } from 'components/ui';

export default function LocationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const locationId = String(params.id || '');
  const [actionsOpen, setActionsOpen] = useState(false);
  const locationQuery = useLocationDetail(locationId);
  const stationsQuery = useLocationStations(locationId);
  const location = locationQuery.data;

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingTop safePaddingBottom>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps='handled'
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              locationQuery.refetch();
              stationsQuery.refetch();
            }}
            refreshing={locationQuery.isRefetching || stationsQuery.isRefetching}
            tintColor={Palette.accent}
          />
        }>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
            Back
          </ThemedText>
        </Pressable>

        {locationQuery.isLoading ? (
          <ThemedView gap={'four'}>
            <ThemedView borderRadius={'large'} height={128} loading />
            <ThemedView borderRadius={'large'} height={64} loading />
          </ThemedView>
        ) : locationQuery.isError || !location ? (
          <ThemedView gap={'four'}>
            <EmptyState title='Location unavailable' message='The location could not be loaded.' />
            <AppButton label='Retry' onPress={() => locationQuery.refetch()} />
          </ThemedView>
        ) : (
          <>
            <ThemedView
              backgroundColor={Palette.surfaceRaised}
              borderColor={Palette.borderSubtle}
              borderRadius={'large'}
              borderWidth={1}
              gap={'four'}
              padding={'four'}>
              <ThemedView alignItems='flex-start' flexDirection='row' gap={'three'} justifyContent='space-between'>
                <ThemedView flex={1} gap={'one'} minWidth={0}>
                  <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13} textTransform='uppercase'>
                    Location #{location.id}
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={28} letterSpacing={0} lineHeight={34}>
                    {location.name}
                  </ThemedText>
                </ThemedView>
                <AppButton label='Actions' onPress={() => setActionsOpen(true)} />
              </ThemedView>
              <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
                <StatusChip label={location.operationStatus?.label || 'Unknown'} tone={location.visible === false ? 'danger' : 'success'} />
                <StatusChip label={location.visible === false ? 'Hidden' : 'On map'} tone={location.visible === false ? 'danger' : 'success'} />
              </ThemedView>
            </ThemedView>

            <ThemedView gap={'three'}>
              <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                  Stations
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={14}>
                  {stationsQuery.data?.length || 0}
                </ThemedText>
              </ThemedView>
              {stationsQuery.isLoading ? (
                <ThemedView gap={'three'}>
                  <ThemedView borderRadius={'large'} height={72} loading />
                  <ThemedView borderRadius={'large'} height={72} loading />
                </ThemedView>
              ) : (stationsQuery.data || []).length === 0 ? (
                <EmptyState title='No stations' message='No station records were returned for this location.' />
              ) : (
                <ThemedView gap={'three'}>
                  {(stationsQuery.data || []).map(station => (
                    <ThemedView
                      key={station.id}
                      alignItems='center'
                      backgroundColor={Palette.surfaceRaised}
                      borderColor={Palette.borderSubtle}
                      borderRadius={'large'}
                      borderWidth={1}
                      flexDirection='row'
                      gap={'three'}
                      justifyContent='space-between'
                      padding={'four'}>
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

            <ThemedView gap={'three'}>
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
      </ScrollView>

      <LocationActionsSheet location={location} onClose={() => setActionsOpen(false)} open={actionsOpen} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: mhs(4),
  },
  content: {
    gap: mhs(16),
    padding: mhs(16),
    paddingBottom: 120,
  },
});
