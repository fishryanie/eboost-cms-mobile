import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, TextInput } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search, XCircle } from 'lucide-react-native';

import { ThemedView } from 'components/base';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { FontFamily, Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';

import { ListState, getItemKey } from 'components/technical/list-ui';
import { VehicleSegment } from 'components/technical/vehicle-segment';
import { ChargerCard } from './components/charger-card';

const PAGE_SIZE = 30;

export default function ChargersScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<TechnicalVehicle>('bike');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listState, setListState] = useState({ search: '', searchInput: '' });
  const { search, searchInput } = listState;

  const query = useInfiniteQuery({
    getNextPageParam: (lastPage: TechnicalList<ChargerRecord>, pages: TechnicalList<ChargerRecord>[], lastPageParam: number) => {
      const loadedItems = pages.reduce((total, currentPage) => total + currentPage.items.length, 0);
      const reportedTotal = pages.reduce((total, currentPage) => Math.max(total, currentPage.total), 0);
      const hasCollectionTotal = reportedTotal > lastPage.items.length;
      const hasNextPage = hasCollectionTotal ? loadedItems < reportedTotal : lastPage.items.length === PAGE_SIZE;

      return hasNextPage ? lastPageParam + 1 : undefined;
    },
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiRequest<ApiListResponse<ChargerRecord>>(vehicle === 'car' ? 'api/car_boxes' : 'api/bike_boxes', {
        headers: { Accept: 'application/ld+json' },
        params: { itemsPerPage: PAGE_SIZE, limit: PAGE_SIZE, page: pageParam, ...(search ? { uniqueId: search } : {}) },
      });
      return getCollectionResult(response);
    },
    queryKey: ['technical', 'chargers', vehicle, { search }],
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setListState(current => ({ ...current, search: current.searchInput.trim() }));
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const items = query.data?.pages.flatMap(currentPage => currentPage.items) || [];
  const total = query.data?.pages[0]?.total;
  const subtitle = searchInput.trim() || (total === undefined ? `All ${vehicle} chargers` : `${total.toLocaleString()} ${vehicle} chargers`);

  function handleVehicleChange(nextVehicle: TechnicalVehicle) {
    setVehicle(nextVehicle);
    setListState({ search: '', searchInput: '' });
  }

  function handleRefresh() {
    setIsRefreshing(true);
    void query.refetch().finally(() => {
      setIsRefreshing(false);
    });
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <AnimatedHeaderFlatList
        canGoBack
        contentContainerStyle={{ gap: 10, paddingBottom: 40, paddingHorizontal: 12 }}
        contentInsetAdjustmentBehavior='never'
        data={items}
        keyExtractor={(item, index) => getItemKey(item, index)}
        largeTitle='Chargers'
        ListEmptyComponent={<ListState error={query.error} isLoading={query.isLoading} onRetry={() => query.refetch()} title='Chargers' />}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ThemedView alignItems='center' paddingVertical={'four'}>
              <ActivityIndicator color={Palette.accent} />
            </ThemedView>
          ) : null
        }
        onBack={() => router.back()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} tintColor={Palette.accent} />}
        renderItem={({ item }) => <ChargerCard item={item as ChargerRecord} vehicle={vehicle} />}
        searchBar={
          <ChargerSearch
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

function ChargerSearch({
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
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
      <ThemedView
        alignItems='center'
        backgroundColor={Palette.surfaceMuted}
        borderColor={Palette.borderSubtle}
        borderCurve='continuous'
        borderRadius={'pill'}
        borderWidth={1}
        flex={1}
        flexDirection='row'
        gap={'two'}
        height={40}
        paddingHorizontal={'three'}>
        <Search color={Palette.textTertiary} size={18} strokeWidth={2} />
        <TextInput
          accessibilityLabel='Search by charger ID'
          autoCapitalize='characters'
          autoCorrect={false}
          cursorColor={Palette.accent}
          onChangeText={onChange}
          placeholder='Search charger ID'
          placeholderTextColor={Palette.textTertiary}
          returnKeyType='search'
          selectionColor={Palette.accent}
          style={{ color: Palette.textPrimary, flex: 1, fontFamily: FontFamily.medium, fontSize: 14, height: '100%', paddingVertical: 0 }}
          value={value}
        />
        {value ? (
          <Pressable accessibilityLabel='Clear charger search' accessibilityRole='button' hitSlop={10} onPress={() => onChange('')}>
            {({ pressed }) => <XCircle color={Palette.textTertiary} opacity={pressed ? 0.55 : 1} size={18} />}
          </Pressable>
        ) : null}
      </ThemedView>
      <VehicleSegment onChange={onChangeVehicle} value={vehicle} />
    </ThemedView>
  );
}
