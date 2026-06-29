import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mhs } from 'themes/scaling';
import { useScrollStore } from 'utils/scroll-store';

import { ReplaceMeterSheet } from 'app/(tabs)/technical/components/replace-meter-sheet';
import { SetupLocationSheet } from 'app/(tabs)/technical/components/setup-location-sheet';
import { TriggerBoxSheet } from 'app/(tabs)/technical/features/trigger-box';
import { ThemedText, ThemedView } from 'components/base';
import { Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';

import { screenHorizontalPadding } from 'components/technical/common';
import { styles } from 'components/technical/styles';

import { ChargerServicesSection } from './components/charger-services-section';
import { DomainAnalyzeSection } from './components/domain-analyze-section';
import { NetworkStatusSection } from './components/network-status-section';
import { PeakUsageHoursSection } from './components/peak-usage-hours-section';

export const technicalDetailPanels: TechnicalPanel[] = ['chargers', 'meter-hourly', 'status-logs', 'energy-differ'];

const serviceTileSize = 64;

async function getNetworkStatus(vehicle: TechnicalVehicle) {
  const response = await apiRequest<ApiListResponse<ConnectionLogRecord>>(vehicle === 'car' ? 'api/cars/logs/connection' : 'api/bikes/logs/connection', {
    params: { itemsPerPage: 30, limit: 1000, page: 1 },
    service: 'hub',
  });
  return getCollectionResult(response);
}

export default function TechnicalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const [boxActionMode, setBoxActionMode] = useState<'reset' | 'trigger' | 'unlock' | null>(null);
  const [replaceMeterVisible, setReplaceMeterVisible] = useState(false);
  const [setupLocationVisible, setSetupLocationVisible] = useState(false);
  const {
    data: bikeNetworkData,
    error: bikeNetworkError,
    isLoading: bikeNetworkLoading,
    isRefetching: bikeNetworkRefetching,
    refetch: refetchBikeNetwork,
  } = useQuery({
    queryFn: () => getNetworkStatus('bike'),
    queryKey: ['technical', 'overview-network-status', 'bike'],
  });
  const {
    data: bikeBoxStatusData,
    error: bikeBoxStatusError,
    isLoading: bikeBoxStatusLoading,
    isRefetching: bikeBoxStatusRefetching,
    refetch: refetchBikeBoxStatus,
  } = useQuery({
    queryFn: async () => (await apiRequest<BoxStatusResponse>('api/controller/statistic/bike-box-status')).data || {},
    queryKey: ['technical', 'overview-bike-box-status'],
  });
  const {
    data: carNetworkData,
    error: carNetworkError,
    isLoading: carNetworkLoading,
    isRefetching: carNetworkRefetching,
    refetch: refetchCarNetwork,
  } = useQuery({
    queryFn: () => getNetworkStatus('car'),
    queryKey: ['technical', 'overview-network-status', 'car'],
  });
  const {
    data: carBoxStatusData,
    error: carBoxStatusError,
    isLoading: carBoxStatusLoading,
    isRefetching: carBoxStatusRefetching,
    refetch: refetchCarBoxStatus,
  } = useQuery({
    queryFn: async () => (await apiRequest<BoxStatusResponse>('api/controller/statistic/car-box-status')).data || {},
    queryKey: ['technical', 'overview-car-box-status'],
  });
  const {
    data: domainData,
    error: domainError,
    isLoading: domainLoading,
    isRefetching: domainRefetching,
    refetch: refetchDomain,
  } = useQuery({
    queryFn: async () => getCollectionResult(await apiRequest<ApiListResponse<DomainAnalyzeRecord>>('api/controller/domain/analyze')),
    queryKey: ['technical', 'overview-domain-analyze'],
  });
  const serviceTileWidth = Math.min(serviceTileSize, Math.floor((width - screenHorizontalPadding * 2 - mhs(12) * 3) / 4));

  return (
    <>
      <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
        <ScrollView
          onScroll={e => {
            const offsetY = e.nativeEvent.contentOffset.y;
            useScrollStore.getState().setTabScrolled('technical', offsetY > 20);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[styles.content, { paddingTop: 60 + (useSafeAreaInsets().top || 0) }]}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void refetchBikeNetwork();
                void refetchBikeBoxStatus();
                void refetchCarBoxStatus();
                void refetchCarNetwork();
                void refetchDomain();
                void queryClient.invalidateQueries({ queryKey: ['technical', 'peak-usage-hours'] });
              }}
              refreshing={bikeNetworkRefetching || bikeBoxStatusRefetching || carBoxStatusRefetching || carNetworkRefetching || domainRefetching}
              tintColor={Palette.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <ThemedView gap={'five'} marginTop={12} paddingHorizontal={screenHorizontalPadding}>
            <ThemedView>
              <ThemedText fontFamily='bold' fontSize={34} lineHeight={40} letterSpacing={-0.5}>
                Technical
              </ThemedText>
              <ThemedText fontSize={16} color={Palette.textSecondary} marginTop={mhs(4)}>
                Manage bike and car chargers, monitor network status, and handle technical operations from one place.
              </ThemedText>
            </ThemedView>
            <ThemedView gap={'seven'}>
              <ChargerServicesSection
                tileWidth={serviceTileWidth}
                onBoxAction={setBoxActionMode}
                onReplaceMeter={() => setReplaceMeterVisible(true)}
                onSetupLocation={() => setSetupLocationVisible(true)}
              />
              <PeakUsageHoursSection
                onViewMore={() =>
                  router.push({
                    pathname: '/technical/peak-usage-hours',
                  } as never)
                }
              />
              <NetworkStatusSection
                bikeQuery={{
                  data: bikeNetworkData,
                  error: bikeNetworkError,
                  isLoading: bikeNetworkLoading,
                  refetch: refetchBikeNetwork,
                }}
                bikeBoxStatusQuery={{
                  data: bikeBoxStatusData,
                  error: bikeBoxStatusError,
                  isLoading: bikeBoxStatusLoading,
                  refetch: refetchBikeBoxStatus,
                }}
                carBoxStatusQuery={{
                  data: carBoxStatusData,
                  error: carBoxStatusError,
                  isLoading: carBoxStatusLoading,
                  refetch: refetchCarBoxStatus,
                }}
                carQuery={{
                  data: carNetworkData,
                  error: carNetworkError,
                  isLoading: carNetworkLoading,
                  refetch: refetchCarNetwork,
                }}
                onViewIssues={() =>
                  router.push({
                    pathname: '/technical/network-issues',
                  } as never)
                }
              />
              <DomainAnalyzeSection
                query={{
                  data: domainData,
                  error: domainError,
                  isLoading: domainLoading,
                  refetch: refetchDomain,
                }}
                onViewMore={() =>
                  router.push({
                    pathname: '/technical/ongoing-sessions',
                  } as never)
                }
              />
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ThemedView>
      {boxActionMode ? <TriggerBoxSheet mode={boxActionMode} onClose={() => setBoxActionMode(null)} visible={Boolean(boxActionMode)} /> : null}
      {replaceMeterVisible ? <ReplaceMeterSheet onClose={() => setReplaceMeterVisible(false)} visible={replaceMeterVisible} /> : null}
      {setupLocationVisible ? <SetupLocationSheet onClose={() => setSetupLocationVisible(false)} visible={setupLocationVisible} /> : null}
    </>
  );
}
