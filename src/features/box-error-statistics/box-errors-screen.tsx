import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { screenHorizontalPadding } from 'components/technical/common';
import { LoadingBlock, RetryBlock } from 'components/technical/list-ui';
import { VehicleSearchToolbar } from 'components/technical/vehicle-search-toolbar';
import { EmptyState } from 'components/ui';
import { useCurrentAdminAccess } from 'features/admin-access/hooks';
import { Palette } from 'themes';

import { BoxErrorCard } from './box-error-card';
import { filterBoxErrors, type BoxErrorFilter, type BoxErrorRecord, type BoxErrorStatistics } from './model';
import { fetchBoxErrorStatistics } from './service';

const emptyBoxes: BoxErrorRecord[] = [];

export default function BoxErrorsScreen() {
  const router = useRouter();
  const access = useCurrentAdminAccess();
  const [filter, setFilter] = useState<BoxErrorFilter>('all');
  const [search, setSearch] = useState('');
  const query = useQuery({
    enabled: access.canAccess('/admin/technical/box-error-statistics'),
    queryFn: () => fetchBoxErrorStatistics(),
    queryKey: ['technical', 'box-error-statistics'],
  });
  const boxes = query.data?.boxes || emptyBoxes;
  const filteredBoxes = useMemo(() => filterBoxErrors(boxes, filter, search), [boxes, filter, search]);
  const hasFilters = filter !== 'all' || Boolean(search.trim());

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <AnimatedHeaderFlatList
        largeTitle='24h Charger Failures'
        canGoBack
        onBack={() => router.back()}
        searchBar={
          <VehicleSearchToolbar
            accessibilityLabel='Search box or station'
            clearAccessibilityLabel='Clear box error search'
            includeAll
            onChange={setSearch}
            onChangeVehicle={setFilter}
            placeholder='Search box or station'
            value={search}
            vehicle={filter}
          />
        }
        contentContainerStyle={{ paddingHorizontal: screenHorizontalPadding }}
        data={filteredBoxes}
        keyExtractor={(box: BoxErrorRecord) => `${box.vehicle}-${box.box_id}`}
        keyboardShouldPersistTaps='handled'
        ListHeaderComponent={
          <ThemedView gap={8} paddingBottom={6}>
            {query.data ? (
              <ThemedView gap={3}>
                <ThemedView flexDirection='row' flexWrap='wrap' gap={6} justifyContent='space-between'>
                  <ThemedText fontFamily='semibold' fontSize={12} lineHeight={18} selectable>
                    {query.data.total_items.toLocaleString()} boxes
                  </ThemedText>
                  <ThemedText color={Palette.danger} fontFamily='medium' fontSize={12} lineHeight={18} selectable>
                    Threshold: {query.data.error_threshold.toLocaleString()}%
                  </ThemedText>
                </ThemedView>
                <ThemedText color={Palette.textSecondary} fontSize={11} lineHeight={16} selectable>
                  {dayjs.unix(query.data.start_time).format('DD/MM/YYYY HH:mm')}
                  {' → '}
                  {dayjs.unix(query.data.end_time).format('DD/MM/YYYY HH:mm')}
                </ThemedText>
              </ThemedView>
            ) : null}
            {query.data && query.error ? (
              <RetryBlock message={query.error.message} onRetry={() => void query.refetch()} title='Unable to refresh charger error rates' />
            ) : null}
            {query.data && hasFilters && filteredBoxes.length > 0 ? (
              <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={18}>
                {filteredBoxes.length.toLocaleString()} shown
              </ThemedText>
            ) : null}
          </ThemedView>
        }
        ListEmptyComponent={<BoxErrorsEmptyState hasFilters={hasFilters} query={query} />}
        refreshControl={<RefreshControl onRefresh={() => void query.refetch()} refreshing={query.isRefetching} tintColor={Palette.accent} />}
        renderItem={({ item }) => <BoxErrorCard box={item} />}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

function BoxErrorsEmptyState({ hasFilters, query }: { hasFilters: boolean; query: UseQueryResult<BoxErrorStatistics, Error> }) {
  if (!query.data) {
    if (query.error) return <RetryBlock message={query.error.message} onRetry={() => void query.refetch()} title='Charger error rates unavailable' />;
    if (query.fetchStatus === 'paused') return <EmptyState title='You are offline' message='Connect to the internet and pull down to retry.' />;
    return <LoadingBlock label='Loading charger error rates...' />;
  }
  return (
    <EmptyState
      title={hasFilters ? 'No matching chargers' : 'No charger errors'}
      message={hasFilters ? 'Try another box ID, station name, or vehicle filter.' : 'No boxes were returned for this reporting period and error threshold.'}
    />
  );
}
