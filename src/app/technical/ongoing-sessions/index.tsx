import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Cable } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';

import { ThemedView } from 'components/base';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'components/base/empty-state';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { RetryBlock } from 'components/technical/list-ui';
import { VehicleSearchToolbar } from 'components/technical/vehicle-search-toolbar';
import { OngoingSessionCard } from 'app/technical/ongoing-sessions/components/ongoing-session-card';
import { getOngoingSessionKey } from 'app/technical/ongoing-sessions/components/ongoing-session-card.helpers';
import { FontFamily, Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';
import { AdminAccessBoundary } from 'features/admin-access/access-guard';
import { useCurrentAdminAccess } from 'features/admin-access/hooks';

const status = 'Charging';
const sessionListContentStyle = { flexGrow: 1, gap: 16, paddingHorizontal: 12, paddingBottom: 40 };

function handleCopy(text?: string) {
  if (text) console.log('Copy:', text);
}

export default function OngoingSessionsRoute() {
  const router = useRouter();
  const access = useCurrentAdminAccess(true);
  const [vehicle, setVehicle] = useState<TechnicalVehicle>('bike');
  const [listState, setListState] = useState({ search: '', searchInput: '' });
  const { search, searchInput } = listState;
  const screen = vehicle === 'car' ? '/admin/realtime/connectors' : '/admin/realtime/outlets';
  const canRead = access.canAccess(screen) && access.fetchStatus !== 'paused';
  const query = useOngoingSessionsQuery({ enabled: canRead, page: 1, search, vehicle });
  const total = canRead ? query.data?.total : undefined;
  const subtitle = searchInput.trim() || (total === undefined ? `Active ${vehicle} sessions` : `${total.toLocaleString()} active ${vehicle} sessions`);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setListState(current => ({ ...current, search: current.searchInput.trim() }));
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function handleVehicleChange(nextVehicle: TechnicalVehicle) {
    setVehicle(nextVehicle);
    setListState({ search: '', searchInput: '' });
  }

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <AnimatedHeaderFlatList
        canGoBack
        contentContainerStyle={sessionListContentStyle}
        contentInsetAdjustmentBehavior='never'
        data={canRead ? query.data?.items || [] : []}
        keyExtractor={getOngoingSessionKey}
        keyboardShouldPersistTaps='handled'
        largeTitle='Ongoing Sessions'
        ListEmptyComponent={
          <AdminAccessBoundary screen={screen}>
            {query.error ? (
              <RetryBlock message={query.error.message} onRetry={() => void query.refetch()} title='Unable to load ongoing sessions' />
            ) : (
              <SessionEmptyState isLoading={query.isPending} />
            )}
          </AdminAccessBoundary>
        }
        onBack={() => router.back()}
        refreshControl={
          <RefreshControl onRefresh={() => canRead && void query.refetch()} refreshing={canRead && query.isRefetching} tintColor={Palette.accent} />
        }
        renderItem={({ item }) => <OngoingSessionCard item={item} onCopy={handleCopy} vehicle={vehicle} />}
        searchBar={
          <SessionSearch
            onChange={value => setListState(current => ({ ...current, searchInput: value }))}
            onChangeVehicle={handleVehicleChange}
            value={searchInput}
            vehicle={vehicle}
          />
        }
        showsVerticalScrollIndicator={false}
        smallHeaderTitleStyle={{ fontFamily: FontFamily.semibold }}
        subtitle={subtitle}
      />
    </ThemedView>
  );
}

function useOngoingSessionsQuery({ enabled, page, search, vehicle }: { enabled: boolean; page: number; search: string; vehicle: TechnicalVehicle }) {
  return useQuery({
    enabled,
    queryFn: async () => {
      const response = await apiRequest<ApiListResponse<OngoingSessionRecord>>(
        vehicle === 'car' ? 'api/controller/statistic/car-realtime-status' : 'api/controller/statistic/bike-realtime-status',
        { params: { itemsPerPage: 30, limit: 30, page, ...(search ? { search } : {}), status } },
      );
      return getCollectionResult(response);
    },
    queryKey: ['technical', 'ongoing-sessions', vehicle, { page, search, status }],
  });
}

function SessionSearch({
  onChange,
  onChangeVehicle,
  value,
  vehicle,
}: {
  onChange: (value: string) => void;
  onChangeVehicle: (vehicle: TechnicalVehicle) => void;
  value: string;
  vehicle: TechnicalVehicle;
}) {
  return (
    <VehicleSearchToolbar
      accessibilityLabel={`Search ${vehicle} sessions`}
      clearAccessibilityLabel='Clear session search'
      onChange={onChange}
      onChangeVehicle={onChangeVehicle}
      placeholder={`Search ${vehicle} session`}
      value={value}
      vehicle={vehicle}
    />
  );
}

function SessionEmptyState({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <ThemedView gap={'three'} paddingHorizontal={'four'} paddingTop={'four'}>
        <ThemedView borderRadius={'large'} height={96} loading />
        <ThemedView borderRadius={'large'} height={96} loading />
        <ThemedView borderRadius={'large'} height={96} loading />
      </ThemedView>
    );
  }

  return (
    <ThemedView contentCenter flex={1} paddingHorizontal={'five'}>
      <Empty>
        <EmptyMedia variant='icon'>
          <Cable color={Palette.textTertiary} size={40} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No ongoing sessions</EmptyTitle>
          <EmptyDescription>Try adjusting your search criteria.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </ThemedView>
  );
}
