import { mhs } from 'themes/scaling';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Cable } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { HeaderTitle, ThemedView } from 'components/base';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'components/base/empty-state';
import { TopTabs } from 'components/base/tabs';
import { SearchBar } from 'components/molecules/search-bar';
import { OngoingSessionCard } from 'app/technical/ongoing-sessions/components/ongoing-session-card';
import { getOngoingSessionKey } from 'app/technical/ongoing-sessions/components/ongoing-session-card.helpers';
import { Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';

const status = 'Charging';
const sessionListContentStyle = { flexGrow: 1, paddingHorizontal: 12, paddingTop: mhs(24), paddingBottom: 40 };

function handleCopy(text?: string) {
  if (text) console.log('Copy:', text);
}

export default function OngoingSessionsRoute() {
  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <StatusBar style='dark' />
      <HeaderTitle showBorderBottom={false} title='Ongoing Sessions' />
      <TopTabs
        fullWidthTabs
        tabs={[
          {
            id: 'bike',
            title: 'Xe máy',
            contentComponent: <SessionList vehicle='bike' searchPlaceholder='Search bike session' /> },
          {
            id: 'car',
            title: 'Ô tô',
            contentComponent: <SessionList vehicle='car' searchPlaceholder='Search car session' /> },
        ]}
        activeColor={Palette.accent}
        inactiveColor={Palette.textSecondary}
        underlineColor={Palette.accent}
        tabBarContainerStyle={{ borderBottomWidth: 1, borderBottomColor: Palette.borderSubtle }}
      />
    </ThemedView>
  );
}

function useOngoingSessionsQuery({ page, search, vehicle }: { page: number; search: string; vehicle: TechnicalVehicle }) {
  return useQuery({
    queryFn: async () => {
      const response = await apiRequest<ApiListResponse<OngoingSessionRecord>>(
        vehicle === 'car' ? 'api/controller/statistic/car-realtime-status' : 'api/controller/statistic/bike-realtime-status',
        { params: { itemsPerPage: 30, limit: 30, page, ...(search ? { search } : {}), status } },
      );
      return getCollectionResult(response);
    },
    queryKey: ['technical', 'ongoing-sessions', vehicle, { page, search, status }] });
}

function SessionList({ searchPlaceholder, vehicle }: { searchPlaceholder: string; vehicle: TechnicalVehicle }) {
  const [page] = useState(1);
  const [search, setSearch] = useState('');
  const query = useOngoingSessionsQuery({ page, search, vehicle });

  return (
    <FlatList
      contentContainerStyle={sessionListContentStyle}
      data={query.data?.items || []}
      ItemSeparatorComponent={() => <ThemedView height={16} />}
      keyExtractor={getOngoingSessionKey}
      ListHeaderComponent={
        <ThemedView paddingBottom={'four'}>
          <SearchBar centerWhenUnfocused={false} onClear={() => setSearch('')} onSearch={setSearch} placeholder={searchPlaceholder} />
        </ThemedView>
      }
      ListEmptyComponent={<SessionEmptyState isLoading={query.isLoading} />}
      refreshControl={<RefreshControl onRefresh={query.refetch} refreshing={query.isRefetching} tintColor={Palette.accent} />}
      renderItem={({ item }) => <OngoingSessionCard item={item} onCopy={handleCopy} vehicle={vehicle} />}
      showsVerticalScrollIndicator={false}
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
