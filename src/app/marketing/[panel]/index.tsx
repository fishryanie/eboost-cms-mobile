import { useQuery } from '@tanstack/react-query';
import { SubscriptionStatsCard } from 'app/(tabs)/marketing/components/subscription-stats';
import { getMenuPanel, getMenuSection } from 'components/animated-tab-bar/constants';
import { ThemedView } from 'components/base';
import { CmsPlaceholderPanelScreen } from 'components/cms-placeholder-panel-screen';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { apiRequest } from 'utils/api/client';
import { getCurrentMonthRange, ShareMetric, SubscriptionStatsResponse, toSubscriptionStatsSummary } from 'utils/marketing';

export default function MarketingPanelRoute() {
  const router = useRouter();
  const [shareMetric] = useState<ShareMetric>('revenue');
  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const statsQuery = useQuery({
    queryFn: () => apiRequest<SubscriptionStatsResponse>('api/controller/statistic/subscription-kw-summary', { params: monthRange }),
    queryKey: ['marketing', 'subscription-package-stats', monthRange.start, monthRange.end],
  });
  const summary = useMemo(() => toSubscriptionStatsSummary(statsQuery.data, shareMetric), [shareMetric, statsQuery.data]);
  const { panel: panelParam } = useLocalSearchParams<{ panel?: string | string[] }>();
  const section = getMenuSection('marketing');
  const panel = getMenuPanel('marketing', panelParam);

  if (!panel) {
    return <Redirect href='/(tabs)/marketing' />;
  }

  if (panel.key === 'subscriptions') {
    return (
      <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingTop>
        <FlatList
          {...{
            contentContainerStyle: { paddingBottom: mhs(64) },
            data: [],
            ListEmptyComponent: (
              <ThemedView gap={'three'} paddingHorizontal={18}>
                <SubscriptionStatsCard
                  isLoading={statsQuery.isLoading}
                  monthRange={monthRange}
                  shareMetric={shareMetric}
                  summary={summary}
                />
              </ThemedView>
            ),
            refreshControl: <RefreshControl onRefresh={() => statsQuery.refetch()} refreshing={statsQuery.isRefetching} tintColor={Palette.accent} />,
            renderItem: null,
          }}
        />
      </ThemedView>
    );
  }

  return <CmsPlaceholderPanelScreen accentColor={section.accentColor} panel={panel} onBack={() => router.back()} />;
}
