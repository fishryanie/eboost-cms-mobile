import { useQuery } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { ChevronLeft, ChevronsRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Pressable, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollStore } from 'utils/scroll-store';
import { mhs } from 'themes/scaling';
import { Palette, FontFamily } from 'themes';
import { apiRequest } from 'utils/api/client';

import { getCurrentMonthRange, toSubscriptionStatsSummary, type ShareMetric, type SubscriptionStatsResponse } from 'utils/marketing';
import { MarketingServicesSection } from './components/marketing-services';
import { SubscriptionStatsCard, SectionTitle } from './components/subscription-stats';
import { fetchAtRiskUsers, getCollectionData, type AtRiskUserItem } from 'shared/operation/operation-user-service';

const screenHorizontalPadding = 18;
const serviceTileSize = 82;
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

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

export default function MarketingScreen() {
  const router = useRouter();
  const focusStats = false;
  const onBack = undefined;
  const { width } = useWindowDimensions();
  const [shareMetric] = useState<ShareMetric>('revenue');
  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const statsQuery = useQuery({
    queryFn: () => apiRequest<SubscriptionStatsResponse>('api/controller/statistic/subscription-kw-summary', { params: monthRange }),
    queryKey: ['marketing', 'subscription-package-stats', monthRange.start, monthRange.end],
  });
  const atRiskQuery = useQuery({ queryFn: () => fetchAtRiskUsers(), queryKey: ['operation', 'at-risk-users'] });
  const summary = useMemo(() => toSubscriptionStatsSummary(statsQuery.data, shareMetric), [shareMetric, statsQuery.data]);
  const serviceTileWidth = Math.min(serviceTileSize, Math.floor((width - screenHorizontalPadding * 2 - mhs(12) * 3) / 4));
  const emptyAtRiskUsers: AtRiskUserItem[] = [];

  const isMainScreen = !onBack;
  return (
    <ThemedView safePaddingBottom flex={1} backgroundColor={Palette.surfaceBase}>
      <ScrollView
        onScroll={e => {
          const offsetY = e.nativeEvent.contentOffset.y;
          useScrollStore.getState().setTabScrolled('marketing', offsetY > 20);
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingTop: 60 + (useSafeAreaInsets().top || 0) }]}
        refreshControl={<RefreshControl onRefresh={() => statsQuery.refetch()} refreshing={statsQuery.isRefetching} tintColor={Palette.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {onBack ? (
          <ThemedView gap={'three'} paddingHorizontal={screenHorizontalPadding} paddingTop={'two'}>
            <ThemedView alignItems='center' flexDirection='row' minHeight={38}>
              <Pressable
                accessibilityLabel='Back'
                accessibilityRole='button'
                onPress={onBack}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
              </Pressable>
            </ThemedView>
          </ThemedView>
        ) : null}
        
        <ThemedView marginTop={12} gap={focusStats ? 'three' : 'five'} paddingHorizontal={screenHorizontalPadding}>
          <ThemedView>
            <ThemedText fontFamily='bold' fontSize={34} lineHeight={40} letterSpacing={-0.5}>
              {isMainScreen ? 'Marketing' : 'Subscription Package Stats'}
            </ThemedText>
            {isMainScreen && (
              <ThemedText fontSize={16} color={Palette.textSecondary} marginTop={mhs(4)}>
                Promotions, notifications, bonus, and subscription performance.
              </ThemedText>
            )}
          </ThemedView>
          <ThemedView gap={'seven'}>
            {!focusStats ? <MarketingServicesSection tileWidth={serviceTileWidth} /> : null}
            <SubscriptionStatsCard
              isLoading={statsQuery.isLoading}
              monthRange={monthRange}
              shareMetric={shareMetric}
              summary={summary}
            />
            <AtRiskSubscriptionSection
              accentColor='#D92D20'
              items={getCollectionData(atRiskQuery.data) || emptyAtRiskUsers}
              onViewMore={() => router.push('/marketing/at-risk-users')}
            />
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const atRiskStyles = StyleSheet.create({
  inlineMetric: {
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: mhs(8),
  },
  inlineMetricValue: {
    fontVariant: ['tabular-nums'],
  },
});

function AtRiskSubscriptionSection({ accentColor, items, onViewMore }: { accentColor: string; items: AtRiskUserItem[]; onViewMore: () => void }) {
  const closestDays = items.reduce<number | undefined>((current, item) => {
    if (typeof item.days_left !== 'number') {
      return current;
    }

    return current === undefined ? item.days_left : Math.min(current, item.days_left);
  }, undefined);
  const manualRenewals = items.filter(item => !item.auto_renew).length;

  return (
    <ThemedView gap={'three'}>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
        <ThemedView flex={1} minWidth={0}>
          <SectionTitle title='Subscription Expiry Risk' subtitle='Users approaching expiration.' />
        </ThemedView>
        <Pressable
          accessibilityLabel='View at-risk users'
          accessibilityRole='button'
          disabled={items.length === 0}
          onPress={onViewMore}
          style={({ pressed }) => [
            { paddingHorizontal: mhs(4), paddingVertical: mhs(8) },
            { flexDirection: 'row', alignItems: 'center', gap: mhs(2) },
            pressed && { opacity: 0.72, transform: [{ scale: 0.99 }] },
          ]}>
          <ThemedText color={items.length ? Palette.accent : Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={13} lineHeight={18}>
            View user
          </ThemedText>
          <ChevronsRight color={items.length ? Palette.accent : Palette.textTertiary} size={16} strokeWidth={2.5} />
        </Pressable>
      </ThemedView>

      <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={mhs(24)} padding={mhs(20)}>
        <ThemedView flexDirection='row' gap={'three'}>
          <InlineMetric accentColor={accentColor} label='Expiring users' value={formatNumber(items.length)} />
          <InlineMetric accentColor={accentColor} label='Closest expiry' value={closestDays === undefined ? '--' : `${closestDays}d`} />
          <InlineMetric accentColor={accentColor} label='Manual renew' value={formatNumber(manualRenewals)} />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

function InlineMetric({ accentColor, label, value }: { accentColor: string; label: string; value: string }) {
  return (
    <ThemedView flex={1} minWidth={0} style={atRiskStyles.inlineMetric}>
      <ThemedText numberOfLines={1} color={accentColor} fontFamily={FontFamily.bold} fontSize={16} style={atRiskStyles.inlineMetricValue}>
        {value}
      </ThemedText>
      <ThemedText numberOfLines={2} color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={13}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function formatNumber(value?: number | string | null) {
  return compactNumber.format(Number(value) || 0);
}
