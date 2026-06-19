import { mhs } from "themes/scaling";
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bell, CalendarPlus, ChevronLeft, ChevronRight, Gift, Megaphone, RefreshCw, TicketPercent, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText, ThemedView } from 'components/base';

import { TabIcon } from 'components/tab-icon';
import { getCmsMobileSection, type CmsMobilePanel } from 'constants/mobile-cms-menu';
import { AppScreen, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { apiRequest } from 'utils/api/client';

import {
  getCurrentMonthRange,
  toSubscriptionStatsSummary,
  type ShareMetric,
  type SubscriptionPackageRow,
  type SubscriptionStatsSummary } from 'utils/marketing';
import { MarketingServicesSection, ModuleSection, SubscriptionStatsCard } from './components/marketing-sections';



const screenHorizontalPadding = 18;
const serviceTileSize = 64;
const chartColors = ['#6F8EF6', '#5567F0', '#3843A7', '#141C3A', '#9AA7BD', '#D9DEE7', '#2F9E7F', '#F59E0B'];
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const currencyFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const kwFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

type MarketingServiceItem = {
  icon: LucideIcon;
  labelLines: [string, string];
  label: string;
  panel: string;
  serviceKey: string;
};

const marketingServices: MarketingServiceItem[] = [
  {
    icon: Bell,
    labelLines: ['Push', 'Noti'],
    label: 'Push Noti',
    panel: 'notifications',
    serviceKey: 'push-noti' },
  {
    icon: CalendarPlus,
    labelLines: ['Schedule', 'Noti'],
    label: 'Add Schedule Noti',
    panel: 'notification-message-templates',
    serviceKey: 'schedule-noti' },
  {
    icon: TicketPercent,
    labelLines: ['Promo', 'Code'],
    label: 'New Promo Code',
    panel: 'promotions',
    serviceKey: 'new-promo-code' },
  {
    icon: Gift,
    labelLines: ['New', 'Bonus'],
    label: 'New Bonus',
    panel: 'bonus-topup',
    serviceKey: 'new-bonus' },
];

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 34,
    justifyContent: 'center',
    width: 34 },
  content: {
    gap: mhs(12),
    paddingBottom: 120,
    paddingTop: mhs(8) },
  dividedSection: {
    borderTopColor: Palette.borderSubtle,
    borderTopWidth: 1,
    paddingTop: mhs(16) },
  energyValue: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2 },
  headerIcon: {
    alignItems: 'center',
    borderRadius: mhs(21),
    height: 52,
    justifyContent: 'center',
    width: 52 },
  metricOption: {
    alignItems: 'center',
    borderRadius: mhs(16),
    flex: 1,
    justifyContent: 'center',
    minHeight: 34 },
  metricOptionActive: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderWidth: 1 },
  metricSwitch: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(21),
    gap: mhs(4),
    padding: 4 },
  moduleIcon: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 36,
    justifyContent: 'center',
    width: 36 },
  moduleRow: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(12) },
  packageDot: {
    borderRadius: 5,
    height: 10,
    width: 10 },
  packageRow: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    padding: mhs(12) },
  packageListContent: {
    gap: mhs(8),
    paddingBottom: 120,
    paddingHorizontal: screenHorizontalPadding,
    paddingTop: mhs(12) },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }] },
  progressFill: {
    borderRadius: 5,
    height: 10 },
  progressTrack: {
    backgroundColor: '#EEF2F7',
    borderRadius: 5,
    height: 10,
    overflow: 'hidden' },
  refreshButton: {
    alignItems: 'center',
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38 },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1 },
  serviceIconSurface: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: mhs(12),
    height: 48,
    justifyContent: 'center',
    width: 48 },
  serviceRow: {
    width: '100%' },
  serviceShortcut: {
    alignItems: 'center',
    gap: mhs(4),
    minHeight: 74 },
  summaryStat: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    padding: mhs(12) },
  textButton: {
    paddingHorizontal: mhs(4),
    paddingVertical: mhs(8) } });


export default function MarketingScreen() {
  const focusStats = false;
  const onBack = undefined;
  const section = getCmsMobileSection('marketing');
  const { width } = useWindowDimensions();
  const [shareMetric, setShareMetric] = useState<ShareMetric>('revenue');
  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const statsQuery = useQuery({
    queryFn: () => apiRequest<SubscriptionStatsResponse>('api/controller/statistic/subscription-kw-summary', { params: monthRange }),
    queryKey: ['marketing', 'subscription-package-stats', monthRange.start, monthRange.end] });
  const summary = useMemo(() => toSubscriptionStatsSummary(statsQuery.data, shareMetric), [shareMetric, statsQuery.data]);
  const serviceTileWidth = Math.min(serviceTileSize, Math.floor((width - screenHorizontalPadding * 2 - mhs(12) * 3) / 4));

  const isMainScreen = !onBack;
  return (
    <AppScreen
      title={isMainScreen ? "Marketing" : "Subscription Package Stats"}
      subtitle={isMainScreen ? "Promotions, notifications, bonus, and subscription performance." : undefined}
      isFlatList
      flatListProps={{
        contentContainerStyle: styles.content,
        data: [],
        ListEmptyComponent: (
          <ThemedView gap={focusStats ? 'three' : 'five'} paddingHorizontal={screenHorizontalPadding}>
            {!focusStats ? <MarketingServicesSection tileWidth={serviceTileWidth} /> : null}
            <SubscriptionStatsCard
              isFetching={statsQuery.isFetching}
              isLoading={statsQuery.isLoading}
              monthRange={monthRange}
              onMetricChange={setShareMetric}
              onRefresh={() => statsQuery.refetch()}
              shareMetric={shareMetric}
              summary={summary}
              width={width}
            />
            {!focusStats ? <ModuleSection accentColor={section.accentColor} panels={section.panels} /> : null}
          </ThemedView>
        ),
        ListHeaderComponent: onBack ? (
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
        ) : null,
        refreshControl: <RefreshControl onRefresh={() => statsQuery.refetch()} refreshing={statsQuery.isRefetching} tintColor={Palette.accent} />,
        renderItem: null,
        showsVerticalScrollIndicator: false }}
    />
  );
}
