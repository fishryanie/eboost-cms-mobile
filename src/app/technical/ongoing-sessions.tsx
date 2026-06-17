import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Cable, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'components/base/empty-state';
import { TopTabs } from 'components/base/tabs';
import { SearchBar } from 'components/molecules/search-bar';
import { OngoingSessionCard } from 'features/technical/components/ongoing-session-card';
import { getOngoingSessionKey } from 'features/technical/components/ongoing-session-card.helpers';
import { fetchOngoingSessions } from 'features/technical/technical-service';
import type { OngoingSessionRecord, TechnicalVehicle } from 'features/technical/types';
import { FontFamily, Palette, Spacing } from 'themes';

const status = 'Charging';
const sessionListContentStyle = { flexGrow: 1, paddingHorizontal: 12, paddingTop: Spacing.five, paddingBottom: 40 };

function handleCopy(text?: string) {
  if (text) console.log('Copy:', text);
}

function HeaderTitle({ showBorderBottom = true, title }: { showBorderBottom?: boolean; title: string }) {
  const router = useRouter();

  return (
    <ThemedView
      rowCenter
      safePaddingTop
      backgroundColor={Palette.surfaceBase}
      borderBottomColor={showBorderBottom ? Palette.borderSubtle : 'transparent'}
      borderBottomWidth={showBorderBottom ? 1 : 0}
      paddingBottom={Spacing.three}
      paddingHorizontal={12}>
      <Pressable hitSlop={8} onPress={() => router.back()} style={{ alignItems: 'center', height: 38, justifyContent: 'center', marginRight: 12, width: 38 }}>
        <ChevronLeft color={Palette.textPrimary} size={26} strokeWidth={2.4} />
      </Pressable>

      <ThemedText color={Palette.textPrimary} flex fontFamily={FontFamily.medium} fontSize={18} lineHeight={24} numberOfLines={1}>
        {title}
      </ThemedText>

      <ThemedView height={38} width={12} />
    </ThemedView>
  );
}

export default function OngoingSessionsRoute() {
  const [page] = useState(1);
  const [carSearch, setCarSearch] = useState('');
  const [bikeSearch, setBikeSearch] = useState('');

  const carQuery = useOngoingSessionsQuery({ page, search: carSearch, vehicle: 'car' });
  const bikeQuery = useOngoingSessionsQuery({ page, search: bikeSearch, vehicle: 'bike' });
  const isRefetching = carQuery.isRefetching || bikeQuery.isRefetching;

  const handleRefetch = () => {
    carQuery.refetch();
    bikeQuery.refetch();
  };

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
            contentComponent: (
              <SessionList
                data={bikeQuery.data?.items || []}
                isLoading={bikeQuery.isLoading}
                isRefetching={isRefetching}
                onCopy={handleCopy}
                onRefresh={handleRefetch}
                onSearch={setBikeSearch}
                searchPlaceholder='Search bike session'
              />
            ),
          },
          {
            id: 'car',
            title: 'Ô tô',
            contentComponent: (
              <SessionList
                data={carQuery.data?.items || []}
                isLoading={carQuery.isLoading}
                isRefetching={isRefetching}
                onCopy={handleCopy}
                onRefresh={handleRefetch}
                onSearch={setCarSearch}
                searchPlaceholder='Search car session'
              />
            ),
          },
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
    queryFn: () => fetchOngoingSessions({ page, search, status, vehicle }),
    queryKey: ['technical', 'ongoing-sessions', vehicle, { page, search, status }],
  });
}

function SessionList({
  data,
  isLoading,
  isRefetching,
  onCopy,
  onRefresh,
  onSearch,
  searchPlaceholder,
}: {
  data: OngoingSessionRecord[];
  isLoading: boolean;
  isRefetching: boolean;
  onCopy: (text?: string) => void;
  onRefresh: () => void;
  onSearch: (query: string) => void;
  searchPlaceholder: string;
}) {
  return (
    <FlatList
      contentContainerStyle={sessionListContentStyle}
      data={data}
      ItemSeparatorComponent={() => <ThemedView height={Spacing.four} />}
      keyExtractor={getOngoingSessionKey}
      ListHeaderComponent={
        <ThemedView paddingBottom={Spacing.four}>
          <SearchBar centerWhenUnfocused={false} onClear={() => onSearch('')} onSearch={onSearch} placeholder={searchPlaceholder} />
        </ThemedView>
      }
      ListEmptyComponent={<SessionEmptyState isLoading={isLoading} />}
      refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={isRefetching} tintColor={Palette.accent} />}
      renderItem={({ item }) => <OngoingSessionCard item={item} onCopy={onCopy} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

function SessionEmptyState({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <ThemedView contentCenter flex={1}>
        <ActivityIndicator color={Palette.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView contentCenter flex={1} paddingHorizontal={Spacing.five}>
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
