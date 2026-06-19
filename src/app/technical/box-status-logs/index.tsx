import { useQuery } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { AnimatedHeaderScrollView } from 'components/organisms/animated-header-scrollview';
import { EmptyState } from 'components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';
import { StatusLogCard } from './components/status-log-card';

export default function BoxStatusLogsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; vehicle?: TechnicalVehicle }>();
  const id = params.id || '';
  const vehicle = params.vehicle === 'car' ? 'car' : 'bike';
  const query = useQuery({
    queryKey: ['technical', 'box-status-logs', vehicle, id],
    queryFn: async () => {
      const response = await apiRequest<ApiListResponse<StatusLogRecord>>(vehicle === 'car' ? 'api/logs/box-status' : 'api/bikes/logs/status', {
        params: { charge_point_id: id, limit: 30, page: 1 },
        service: 'hub',
      });
      return getCollectionResult(response);
    },
  });

  const loading = query.isLoading;
  const error = query.error;
  const items = query.data?.items || [];

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <AnimatedHeaderScrollView
        canGoBack
        isFlatList
        subtitle={id}
        largeTitle='Status Logs'
        onBack={() => router.back()}
        largeTitleContainerStyle={styles.largeTitleContainer}
        flatListProps={{
          contentContainerStyle: styles.content,
          data: items,
          keyExtractor: (item: StatusLogRecord, index: number) => `${item.chargePointID || id}-${item.timestamp}-${index}`,
          ListEmptyComponent: loading ? (
            <ThemedView alignItems='center' gap={'three'} paddingVertical={'eight'}>
              <ActivityIndicator color={Palette.accent} size='large' />
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={13} lineHeight={18}>
                Loading status logs...
              </ThemedText>
            </ThemedView>
          ) : error ? (
            <ThemedView alignItems='center' backgroundColor='#FEF2F2' borderRadius='medium' gap='three' padding='four' marginHorizontal='four'>
              <ThemedText color={Palette.danger} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} textAlign='center'>
                {error.message || 'Failed to load status logs'}
              </ThemedText>
              <Pressable onPress={() => query.refetch()} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                <ThemedText color={Palette.danger} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16}>
                  Retry
                </ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <EmptyState message='No status logs found for this charger.' title='No data' />
          ),
          refreshControl: <RefreshControl onRefresh={query.refetch} refreshing={query.isRefetching} tintColor={Palette.accent} />,
          renderItem: ({ item, index }: { item: StatusLogRecord; index: number }) => (
            <StatusLogCard item={item} vehicle={vehicle} isTimeline isLast={index === items.length - 1} />
          ),
          showsVerticalScrollIndicator: false,
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: mhs(12),
    paddingBottom: mhs(64),
  },
  largeTitleContainer: {
    paddingHorizontal: mhs(16),
  },
  pressed: {
    opacity: 0.7,
  },
  retryButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: mhs(12),
    paddingHorizontal: mhs(16),
    paddingVertical: mhs(8),
  },
});
