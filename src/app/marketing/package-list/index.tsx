import { useQuery } from '@tanstack/react-query';
import { ThemedView } from 'components/base';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';
import { mhs } from 'themes/scaling';

import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { EmptyState } from 'components/ui';
import { Palette } from 'themes';
import { apiRequest } from 'utils/api/client';

import { LoadingBlock, PackageRow } from 'app/(tabs)/marketing/components/subscription-stats';
import {
  getCurrentMonthRange,
  toSubscriptionStatsSummary,
  type ShareMetric,
  type SubscriptionPackageRow,
  type SubscriptionStatsResponse,
} from 'utils/marketing';

const screenHorizontalPadding = 18;
const chartColors = ['#6F8EF6', '#5567F0', '#3843A7', '#141C3A', '#9AA7BD', '#D9DEE7', '#2F9E7F', '#F59E0B'];

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  content: {
    gap: mhs(12),
    paddingBottom: 120,
    paddingTop: mhs(8),
  },
  dividedSection: {
    borderTopColor: Palette.borderSubtle,
    borderTopWidth: 1,
    paddingTop: mhs(16),
  },
  energyValue: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
  },
  headerIcon: {
    alignItems: 'center',
    borderRadius: mhs(21),
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  metricOption: {
    alignItems: 'center',
    borderRadius: mhs(16),
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
  },
  metricOptionActive: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderWidth: 1,
  },
  metricSwitch: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(21),
    gap: mhs(4),
    padding: 4,
  },
  moduleIcon: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  moduleRow: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(12),
  },
  packageDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  packageRow: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    padding: mhs(12),
  },
  packageLargeTitleContainer: {
    marginHorizontal: -screenHorizontalPadding,
  },
  packageListContent: {
    gap: mhs(8),
    paddingBottom: 120,
    paddingHorizontal: screenHorizontalPadding,
    paddingTop: mhs(12),
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  progressFill: {
    borderRadius: 5,
    height: 10,
  },
  progressTrack: {
    backgroundColor: '#EEF2F7',
    borderRadius: 5,
    height: 10,
    overflow: 'hidden',
  },
  refreshButton: {
    alignItems: 'center',
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  serviceIconSurface: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: mhs(12),
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  serviceRow: {
    width: '100%',
  },
  serviceShortcut: {
    alignItems: 'center',
    gap: mhs(4),
    minHeight: 74,
  },
  summaryStat: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    padding: mhs(12),
  },
  textButton: {
    paddingHorizontal: mhs(4),
    paddingVertical: mhs(8),
  },
});

export default function SubscriptionPackageListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ metric?: string }>();
  const initialMetric: ShareMetric = params.metric === 'purchases' ? 'purchases' : 'revenue';
  const onBack = () => router.back();
  const [shareMetric] = useState<ShareMetric>(initialMetric);
  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const statsQuery = useQuery({
    queryFn: () => apiRequest<SubscriptionStatsResponse>('api/controller/statistic/subscription-kw-summary', { params: monthRange }),
    queryKey: ['marketing', 'subscription-package-list', monthRange.start, monthRange.end],
  });
  const summary = useMemo(() => toSubscriptionStatsSummary(statsQuery.data, shareMetric), [shareMetric, statsQuery.data]);

  return (
    <ThemedView flex={1}>
      <AnimatedHeaderFlatList
        largeTitle='Package Performance'
        subtitle={`${monthRange.start} - ${monthRange.end}`}
        largeTitleContainerStyle={styles.packageLargeTitleContainer}
        canGoBack
        onBack={onBack}
        contentContainerStyle={styles.packageListContent}
        data={summary.rows}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          statsQuery.isLoading ? (
            <LoadingBlock label='Loading packages' />
          ) : (
            <EmptyState message='No subscription package history was returned for this month.' title='No packages found' />
          )
        }
        refreshControl={<RefreshControl onRefresh={() => statsQuery.refetch()} refreshing={statsQuery.isRefetching} tintColor={Palette.accent} />}
        renderItem={({ item, index }: { item: SubscriptionPackageRow; index: number }) => (
          <PackageRow color={chartColors[index % chartColors.length]} row={item} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}
