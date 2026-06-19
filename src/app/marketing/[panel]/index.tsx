import { mhs } from 'themes/scaling';
import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { ThemedView } from 'components/base';
import { CmsPlaceholderPanelScreen } from 'components/cms-placeholder-panel-screen';
import { SubscriptionStatsCard } from 'app/(tabs)/marketing/components/marketing-sections';
import { AppScreen } from 'components/ui';
import { getCmsMobilePanel, getCmsMobileSection } from 'constants/mobile-cms-menu';
import { apiRequest } from 'utils/api/client';
import { getCurrentMonthRange, toSubscriptionStatsSummary } from 'utils/marketing';

export default function MarketingPanelRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [shareMetric, setShareMetric] = useState<ShareMetric>('revenue');
  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const statsQuery = useQuery({
    queryFn: () => apiRequest<SubscriptionStatsResponse>('api/controller/statistic/subscription-kw-summary', { params: monthRange }),
    queryKey: ['marketing', 'subscription-package-stats', monthRange.start, monthRange.end] });
  const summary = useMemo(() => toSubscriptionStatsSummary(statsQuery.data, shareMetric), [shareMetric, statsQuery.data]);
  const { panel: panelParam } = useLocalSearchParams<{ panel?: string | string[] }>();
  const section = getCmsMobileSection('marketing');
  const panel = getCmsMobilePanel('marketing', panelParam);

  if (!panel) {
    return <Redirect href='/(tabs)/marketing' />;
  }

  if (panel.key === 'subscriptions') {
    return (
      <AppScreen canGoBack onBack={() => router.back()} title='Subscription Package Stats' isFlatList flatListProps={{
        contentContainerStyle: { paddingBottom: mhs(64) },
        data: [],
        ListEmptyComponent: (
          <ThemedView gap={'three'} paddingHorizontal={18}>
            <SubscriptionStatsCard
              isFetching={statsQuery.isFetching}
              isLoading={statsQuery.isLoading}
              monthRange={monthRange}
              onMetricChange={setShareMetric}
              onRefresh={statsQuery.refetch}
              shareMetric={shareMetric}
              summary={summary}
              width={width}
            />
          </ThemedView>
        ),
        renderItem: null }} />
    );
  }

  return <CmsPlaceholderPanelScreen accentColor={section.accentColor} panel={panel} onBack={() => router.back()} />;
}
