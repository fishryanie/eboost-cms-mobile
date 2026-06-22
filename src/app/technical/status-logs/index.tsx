import { useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { ThemedView } from 'components/base';
import { SearchBar } from 'components/molecules/search-bar';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';

import { ListState, ListFooter, getItemKey } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';
import { VehicleSwitch } from 'components/technical/vehicle-switch';
import { StatusLogCard } from 'app/technical/status-logs/components/status-log-card';

export default function StatusLogsScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<TechnicalVehicle>('bike');
  const stateKey = `status-logs:${vehicle}`;
  const [listState, setListState] = useState({ page: 1, search: '', searchInput: '', stateKey });
  const { page, search, searchInput } = listState;
  const params: TechnicalQueryParams = { page, search, vehicle };

  const query = useQuery({
    queryFn: async () => {
      const response = await apiRequest<ApiListResponse<StatusLogRecord>>(vehicle === 'car' ? 'api/logs/box-status' : 'api/bikes/logs/status', {
        params: { itemsPerPage: 30, limit: 30, page, ...(search ? { charge_point_id: search } : {}) },
        service: 'hub',
      });
      return getCollectionResult(response);
    },
    queryKey: ['technical', 'status-logs', params],
  });

  if (listState.stateKey !== stateKey) {
    setListState({ page: 1, search: '', searchInput: '', stateKey });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setListState(current => ({ ...current, page: 1, search: current.searchInput.trim() }));
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  return (
    <ThemedView flex={1}>
      <AnimatedHeaderFlatList
        largeTitle='Status Logs'
        largeTitleContainerStyle={styles.issueLargeTitleContainer}
        canGoBack
        onBack={() => router.back()}
        searchBar={
          <SearchBar
            placeholder='Search charger ID'
            onSearch={value => setListState(current => ({ ...current, searchInput: value }))}
            centerWhenUnfocused={false}
            enableWidthAnimation={false}
          />
        }
        ListHeaderComponent={
          <ThemedView gap={'three'} paddingBottom={'three'}>
            <VehicleSwitch vehicle={vehicle} onChange={setVehicle} />
          </ThemedView>
        }
        contentContainerStyle={[styles.content, styles.issueListContent]}
        data={query.data?.items || []}
        keyExtractor={(item, index) => getItemKey(item, index)}
        ListEmptyComponent={<ListState error={query.error} isLoading={query.isLoading} onRetry={() => query.refetch()} title='Status Logs' />}
        ListFooterComponent={
          query.data?.total ? (
            <ListFooter
              canLoadMore={page * 30 < query.data.total}
              isFetching={query.isFetching}
              page={page}
              total={query.data.total}
              onLoadMore={() => setListState(current => ({ ...current, page: current.page + 1 }))}
            />
          ) : null
        }
        refreshControl={<RefreshControl onRefresh={() => query.refetch()} refreshing={query.isRefetching || false} tintColor={Palette.accent} />}
        renderItem={({ item }) => <StatusLogCard item={item as StatusLogRecord} vehicle={vehicle} />}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}
