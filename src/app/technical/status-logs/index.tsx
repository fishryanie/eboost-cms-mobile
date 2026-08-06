import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';

import { StatusLogCard } from 'app/technical/status-logs/components/status-log-card';
import { StatusLogFilters, type StatusLogDateRange } from 'app/technical/status-logs/components/status-log-filters';
import { getStatusOptions } from 'app/technical/status-logs/status-options';
import { ThemedView } from 'components/base';
import { SearchBar } from 'components/molecules/search-bar';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { ListState } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';
import { Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';

const PAGE_SIZE = 30;

export default function StatusLogsScreen() {
  const routeParams = useLocalSearchParams<{ boxId?: string; id?: string; station?: string; vehicle?: TechnicalVehicle }>();
  const routeBoxId = (routeParams.id || routeParams.boxId || '').trim();
  const routeStation = (routeParams.station || '').trim();
  const routeVehicle: TechnicalVehicle = routeParams.vehicle === 'car' ? 'car' : 'bike';

  return <StatusLogsContent key={`${routeVehicle}:${routeBoxId}`} initialBoxId={routeBoxId} initialVehicle={routeVehicle} station={routeStation} />;
}

function StatusLogsContent({ initialBoxId, initialVehicle, station }: { initialBoxId: string; initialVehicle: TechnicalVehicle; station: string }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<TechnicalVehicle>(initialVehicle);
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState<StatusLogDateRange>();
  const [listState, setListState] = useState(() => ({ search: initialBoxId, searchInput: initialBoxId }));
  const { search, searchInput } = listState;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setListState(current => ({ ...current, search: current.searchInput.trim() }));
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const query = useInfiniteQuery({
    getNextPageParam: (lastPage: TechnicalList<StatusLogRecord>, pages: TechnicalList<StatusLogRecord>[], lastPageParam: number) => {
      const loadedItems = pages.reduce((total, currentPage) => total + currentPage.items.length, 0);
      return lastPage.items.length > 0 && loadedItems < lastPage.total ? lastPageParam + 1 : undefined;
    },
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiRequest<ApiListResponse<StatusLogRecord>>(vehicle === 'car' ? 'api/logs/box-status' : 'api/bikes/logs/status', {
        params: {
          itemsPerPage: PAGE_SIZE,
          limit: PAGE_SIZE,
          page: pageParam,
          ...(dateRange ? { end_time: dateRange.endDate, start_time: dateRange.startDate } : {}),
          ...(search ? { charge_point_id: search } : {}),
          ...(status ? { status } : {}),
        },
        service: 'hub',
      });

      return getCollectionResult(response);
    },
    queryKey: ['technical', 'status-logs', vehicle, { dateRange, search, status }],
  });

  const items = query.data?.pages.flatMap(page => page.items) || [];
  const subtitle = searchInput ? (station && searchInput.trim() === initialBoxId ? `${station} • ${searchInput.trim()}` : searchInput.trim()) : 'All chargers';

  function handleVehicleChange(nextVehicle: TechnicalVehicle) {
    setVehicle(nextVehicle);
    setStatus(currentStatus => (getStatusOptions(nextVehicle).some(option => option.value === currentStatus) ? currentStatus : ''));
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <AnimatedHeaderFlatList
        canGoBack
        contentContainerStyle={[styles.content, styles.issueListContent]}
        contentInsetAdjustmentBehavior='automatic'
        data={items}
        keyExtractor={(item, index) =>
          `${item.id || item.timestamp || item.receivedAt || 'status-log'}:${item.connectorID ?? item.connector_id ?? '-'}:${index}`
        }
        largeTitle='Status Logs'
        largeTitleContainerStyle={styles.issueLargeTitleContainer}
        ListEmptyComponent={<ListState error={query.error} isLoading={query.isLoading} onRetry={() => query.refetch()} title='Status Logs' />}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ThemedView alignItems='center' paddingVertical={'four'}>
              <ActivityIndicator color={Palette.accent} />
            </ThemedView>
          ) : null
        }
        ListHeaderComponent={
          <ThemedView gap={'three'} paddingBottom={'three'}>
            <StatusLogFilters
              dateRange={dateRange}
              onChangeDateRange={setDateRange}
              onChangeStatus={setStatus}
              onChangeVehicle={handleVehicleChange}
              status={status}
              vehicle={vehicle}
            />
          </ThemedView>
        }
        onBack={() => router.back()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl onRefresh={() => query.refetch()} refreshing={query.isRefetching} tintColor={Palette.accent} />}
        renderItem={({ item, index }) => <StatusLogCard isLast={index === items.length - 1} item={item as StatusLogRecord} vehicle={vehicle} />}
        searchBar={
          <SearchBar
            centerWhenUnfocused={false}
            enableWidthAnimation={false}
            initialValue={initialBoxId}
            onClear={() => setListState(current => ({ ...current, searchInput: '' }))}
            onSearch={value => setListState(current => ({ ...current, searchInput: value }))}
            placeholder='Filter by charger ID'
          />
        }
        showsVerticalScrollIndicator={false}
        subtitle={subtitle}
      />
    </ThemedView>
  );
}
