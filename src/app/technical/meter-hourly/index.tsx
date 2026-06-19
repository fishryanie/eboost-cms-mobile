import { useEffect, useState } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { SearchBar } from 'components/molecules/search-bar';
import { AppScreen } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';

import { formatShortTime, screenHorizontalPadding } from 'components/technical/common';
import { ListState, ListFooter, formatNumber, getItemKey } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';
import { VehicleSwitch } from 'components/technical/vehicle-switch';
import { MeterCard } from './components/meter-card';


function getCarMeterSummary(record: MeterValueRecord) {
  const energy = record.sampledValues?.find(item => item.measurand === 'Energy.Active.Import.Register');
  const power = record.sampledValues?.find(item => item.measurand === 'Power.Active.Import');

  return [
    `C${record.connectorID ?? '-'}`,
    `T${record.transactionID ?? '-'}`,
    energy ? `E ${energy.value} ${energy.unit || ''}` : undefined,
    power ? `P ${power.value} ${power.unit || ''}` : undefined,
  ]
    .filter(Boolean)
    .join(' • ');
}

export default function MeterHourlyScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<TechnicalVehicle>('bike');
  const stateKey = `meter-hourly:${vehicle}`;
  const [listState, setListState] = useState({ page: 1, search: '', searchInput: '', stateKey });
  const { page, search, searchInput } = listState;
  const params: TechnicalQueryParams = { page, search, vehicle };
  
  const query = useQuery({
    queryFn: async () => {
      const response = await apiRequest<ApiListResponse<MeterValueRecord>>(
        vehicle === 'car' ? 'api/logs/meter-values' : 'api/bikes/logs/meter-values',
        {
          params: { itemsPerPage: 30, limit: 30, page, ...(search ? { charge_point_id: search } : {}) },
          service: 'hub' },
      );
      return getCollectionResult(response);
    },
    queryKey: ['technical', 'meter-hourly', params] });

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
    <AppScreen
      title="Meter Hourly"
      isFlatList
      flatListProps={{
        contentContainerStyle: styles.content,
        data: query.data?.items || [],
        keyExtractor: (item, index) => getItemKey(item, index),
        ListHeaderComponent: (
          <ThemedView gap={'three'} paddingHorizontal={screenHorizontalPadding} paddingTop={'one'}>
            <ThemedView alignItems='center' flexDirection='row' minHeight={38}>
              <Pressable
                accessibilityLabel='Back'
                accessibilityRole='button'
                onPress={() => router.back()}
                style={({ pressed }) => [styles.issueNavButton, pressed && styles.pressed]}>
                <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
              </Pressable>
            </ThemedView>
            <VehicleSwitch vehicle={vehicle} onChange={setVehicle} />
            <SearchBar
              placeholder="Search charger ID"
              onSearch={value => setListState(current => ({ ...current, searchInput: value }))}
              centerWhenUnfocused={false}
              enableWidthAnimation={false}
            />
          </ThemedView>
        ),
        ListEmptyComponent: (
          <ListState error={query.error} isLoading={query.isLoading} onRetry={() => query.refetch()} title="Meter Hourly" />
        ),
        ListFooterComponent: query.data?.total ? (
          <ListFooter
            canLoadMore={page * 30 < query.data.total}
            isFetching={query.isFetching}
            page={page}
            total={query.data.total}
            onLoadMore={() => setListState(current => ({ ...current, page: current.page + 1 }))}
          />
        ) : null,
        refreshControl: (
          <RefreshControl
            onRefresh={() => query.refetch()}
            refreshing={query.isRefetching || false}
            tintColor={Palette.accent}
          />
        ),
        renderItem: ({ item }) => <MeterCard item={item as MeterValueRecord} vehicle={vehicle} />,
        showsVerticalScrollIndicator: false }}
    />
  );
}
