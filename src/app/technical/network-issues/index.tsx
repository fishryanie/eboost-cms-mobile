import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';

import { ThemedView } from 'components/base';
import { SearchBar } from 'components/molecules/search-bar';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { getNetworkIssues, LoadingBlock, RetryBlock } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';
import { EmptyState } from 'components/ui';
import { Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';
import { AccessMessage } from 'features/admin-access/access-guard';
import { useCurrentAdminAccess } from 'features/admin-access/hooks';

import { IssueFilterSwitch, NetworkIssueCard } from './components/network-issue-sections';

type NetworkIssue = ConnectionLogRecord & { vehicle: TechnicalVehicle };
type NetworkIssueFilter = 'all' | TechnicalVehicle;

async function getNetworkLogs(vehicle: TechnicalVehicle) {
  const response = await apiRequest<ApiListResponse<ConnectionLogRecord>>(vehicle === 'car' ? 'api/cars/logs/connection' : 'api/bikes/logs/connection', {
    params: { itemsPerPage: 30, limit: 1000, page: 1 },
    service: 'hub',
  });
  return getCollectionResult(response);
}

export default function NetworkIssuesScreen() {
  const router = useRouter();
  const access = useCurrentAdminAccess();
  const canReadBike = access.canAccess('/admin/dashboard') || access.canAccess('/admin/realtime/outlets');
  const canReadCar = access.canAccess('/admin/dashboard') || access.canAccess('/admin/realtime/connectors');
  const [filter, setFilter] = useState<NetworkIssueFilter>('all');
  const [issueSearch, setIssueSearch] = useState('');
  const bikeQuery = useQuery({ enabled: canReadBike, queryFn: () => getNetworkLogs('bike'), queryKey: ['technical', 'network-issues', 'bike'] });
  const carQuery = useQuery({ enabled: canReadCar, queryFn: () => getNetworkLogs('car'), queryKey: ['technical', 'network-issues', 'car'] });
  const bikeIssues = getNetworkIssues(canReadBike ? bikeQuery.data?.items || [] : [], 'bike');
  const carIssues = getNetworkIssues(canReadCar ? carQuery.data?.items || [] : [], 'car');
  const issues = useMemo(() => {
    const source: NetworkIssue[] = filter === 'bike' ? bikeIssues : filter === 'car' ? carIssues : [...bikeIssues, ...carIssues];
    const search = issueSearch.trim().toLowerCase();
    if (!search) return source;
    return source.filter(item => `${item.chargePointID || ''} ${item.stationName || ''}`.toLowerCase().includes(search));
  }, [bikeIssues, carIssues, filter, issueSearch]);
  const loading = bikeQuery.isLoading || carQuery.isLoading;
  const error = bikeQuery.error || carQuery.error;

  return (
    <ThemedView flex={1}>
      <AnimatedHeaderFlatList
        largeTitle='Network Issues'
        subtitle='Chargers currently offline'
        canGoBack
        onBack={() => router.back()}
        searchBar={<SearchBar placeholder='Search charger or station' onSearch={setIssueSearch} centerWhenUnfocused={false} />}
        ListHeaderComponent={
          <ThemedView gap={'two'} paddingBottom={'three'}>
            <IssueFilterSwitch bikeCount={bikeIssues.length} carCount={carIssues.length} filter={filter} onChange={setFilter} />
          </ThemedView>
        }
        contentContainerStyle={[styles.content, styles.issueListContent]}
        data={issues}
        keyExtractor={(item: NetworkIssue, index: number) => `${item.vehicle}-${item.chargePointID || index}`}
        ListEmptyComponent={
          (filter === 'bike' && !canReadBike) || (filter === 'car' && !canReadCar) ? (
            <AccessMessage compact />
          ) : loading ? (
            <LoadingBlock label='Loading network issues' />
          ) : error ? (
            <RetryBlock
              message={error.message}
              onRetry={() => {
                if (canReadBike) bikeQuery.refetch();
                if (canReadCar) carQuery.refetch();
              }}
              title='Network issues unavailable'
            />
          ) : (
            <EmptyState message='Try another charger ID, station name, or filter.' title='No matching offline boxes' />
          )
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              if (canReadBike) bikeQuery.refetch();
              if (canReadCar) carQuery.refetch();
            }}
            refreshing={bikeQuery.isRefetching || carQuery.isRefetching}
            tintColor={Palette.accent}
          />
        }
        renderItem={({ item, index }: { item: NetworkIssue; index: number }) => <NetworkIssueCard item={item} isLast={index === issues.length - 1} />}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}
