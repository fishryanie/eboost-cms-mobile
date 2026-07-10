import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { CheckCircle2, XCircle, User as UserIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Users, Zap, Clock, type LucideIcon } from 'lucide-react-native';
import { ArrowRightLeft, ChevronLeft, ChevronsRight, CreditCard, Lock, Mail, ShieldCheck, Star, Wallet } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { useScrollStore } from 'utils/scroll-store';
import { mhs } from 'themes/scaling';
import { AppButton, EmptyState } from 'components/ui';
import { PaymentCheckoutSheet } from 'shared/operation/components/payment-checkout/payment-checkout-sheet';
import { PaymentResultSheet } from 'shared/operation/components/payment-checkout/payment-result-sheet';
import { UserCard } from 'shared/users/components/user-card';
import { useInfiniteUsers, userKeys } from 'shared/users/hooks';
import { FontFamily, Palette } from 'themes';
import { biometricCredentialStore } from 'utils/auth/biometric-credentials';

import { type DashboardApiData } from 'utils/api/types';

export type BalanceAdjustmentType = 'deduct_wallet' | 'plus_wallet';

export type BalanceAdjustmentInput = {
  amount: number;
  reason: string;
  type: BalanceAdjustmentType;
  userId: number;
};

export type TransferMoneyInput = {
  amount?: number;
  from: number;
  to: number;
};

export type TopUserPerformanceItem = {
  growth?: number;
  total_energy?: number;
  total_orders?: number;
  total_paid?: number;
  total_topup?: number;
  user_email?: string;
  user_id: number;
  user_name?: string;
  user_phone?: string;
};

export type TopStationPerformanceItem = {
  growth?: number;
  station_id: number;
  station_name?: string;
  total_energy?: number;
  total_energy_kwh?: number;
  total_orders?: number;
  total_paid?: number;
};

export type UserGrowthSummary = {
  avg_charge_duration_all_time?: number;
  avg_charge_duration_change_percent?: number;
  charged_today_vs_yesterday_percent?: number;
  today_vs_yesterday_growth_percent?: number;
  total_users?: number;
  users_charged_today?: number;
};

export type UserGrowthChartItem = {
  new_users?: number | string;
  time: string;
  total_users?: number | string;
};
import { apiRequest } from 'utils/api/client';
import { getCollectionItems } from 'utils/api/collection';

type OperationServiceKey = 'adjust-balance' | 'transfer-money' | 'modify-ranking' | 'change-email' | 'change-password' | 'payment-checkout';
type WizardStep = 'auth' | 'input' | 'result';
type ResultState = { message: string; status: 'error' | 'success'; title: string };

type OperationService = {
  accentColor: string;
  description: string;
  icon: React.ElementType;
  key: OperationServiceKey;
  title: string;
};

const screenHorizontalPadding = 18;
const serviceTileSize = 82;
const operationAccent = '#E46B2C';
const emptyUsers: UserListItem[] = [];
const emptyTopUsers: TopUserPerformanceItem[] = [];
const emptyTopStations: TopStationPerformanceItem[] = [];
const emptyGrowth: UserGrowthChartItem[] = [];

const operationServices: OperationService[] = [
  {
    accentColor: '#05C75A',
    description: 'Add or deduct user wallet balance.',
    icon: Wallet,
    key: 'adjust-balance',
    title: 'Adjust Balance',
  },
  {
    accentColor: '#2563EB',
    description: 'Move balance from one user to another.',
    icon: ArrowRightLeft,
    key: 'transfer-money',
    title: 'Transfer Money',
  },
  {
    accentColor: '#B45309',
    description: 'Update membership ranking.',
    icon: Star,
    key: 'modify-ranking',
    title: 'Modify Ranking',
  },
  {
    accentColor: '#C026D3',
    description: 'Replace account email.',
    icon: Mail,
    key: 'change-email',
    title: 'Change Email',
  },
  {
    accentColor: '#DC2626',
    description: 'Set a new user password.',
    icon: Lock,
    key: 'change-password',
    title: 'Change Password',
  },
  {
    accentColor: '#F59E0B',
    description: 'Process user Alepay checkout.',
    icon: CreditCard,
    key: 'payment-checkout',
    title: 'Alepay Checkout',
  },
];

const currencyFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, notation: 'compact' });
const decimalFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function formatCurrency(value?: number | string | null) {
  return `${currencyFormatter.format(Number(value) || 0)} đ`;
}

function formatNumber(value?: number | string | null) {
  return compactFormatter.format(Number(value) || 0);
}

function formatFullNumber(value?: number | string | null) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatDurationMinutes(value?: number | string | null) {
  const minutes = Math.round(Number(value) || 0);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function formatGrowthMonth(value?: string) {
  if (!value) {
    return '--';
  }

  const [year, month] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function getUserName(user?: Pick<UserListItem, 'email' | 'id' | 'name' | 'username'>) {
  if (!user) return '--';
  return user.name || user.email || user.username || `User #${user.id}`;
}

function getLastMonthsRange(months = 12) {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);
  return {
    endDate: end.toISOString().slice(0, 10),
    startDate: start.toISOString().slice(0, 10),
  };
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function parseApiError(error: unknown) {
  return error instanceof Error ? error.message : 'Operation failed. Please try again.';
}

export default function OperationScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isPaymentCheckoutOpen, setIsPaymentCheckoutOpen] = useState(false);
  const [isPaymentResultOpen, setIsPaymentResultOpen] = useState(false);
  const [paymentRecord, setPaymentRecord] = useState<any>(null);
  const topUsersQuery = useQuery({ queryFn: () => apiRequest<DashboardApiData<TopUserPerformanceItem[]>>('api/controller/statistic/top-users', { params: { sortBy: 'total_orders' } }), queryKey: ['operation', 'top-users'] });
  const topStationsQuery = useQuery({ queryFn: () => apiRequest<DashboardApiData<TopStationPerformanceItem[]>>('api/controller/statistic/top-stations', { params: { sortBy: 'total_orders' } }), queryKey: ['operation', 'top-stations'] });
  const growthRange = useMemo(() => getLastMonthsRange(12), []);
  const growthQuery = useQuery({ queryFn: () => apiRequest<DashboardApiData<UserGrowthSummary>>('api/controller/statistic/user-growth'), queryKey: ['operation', 'user-growth'] });
  const growthChartQuery = useQuery({ queryFn: () => apiRequest<DashboardApiData<UserGrowthChartItem[]>>('api/controller/statistic/user-growth-chart', { params: { endDate: growthRange.endDate, period: 'month', startDate: growthRange.startDate } }), queryKey: ['operation', 'user-growth-chart', growthRange] });
  const tileWidth = Math.min(serviceTileSize, Math.floor((width - screenHorizontalPadding * 2 - mhs(12) * 3) / 4));
  const isRefreshing =
    topUsersQuery.isRefetching || topStationsQuery.isRefetching || growthQuery.isRefetching || growthChartQuery.isRefetching;

  const openService = useCallback((service: OperationService) => {
    if (service.key === 'payment-checkout') {
      setIsPaymentCheckoutOpen(true);
      return;
    }
    if (service.key === 'adjust-balance') {
      router.push('/operation/adjust-balance');
      return;
    }
    if (service.key === 'transfer-money') {
      router.push('/operation/transfer-money');
      return;
    }
    if (service.key === 'modify-ranking') {
      router.push('/operation/modify-ranking');
      return;
    }
    if (service.key === 'change-email') {
      router.push('/operation/change-email');
      return;
    }
    if (service.key === 'change-password') {
      router.push('/operation/change-password');
      return;
    }
  }, [router]);

  return (
    <>
      <ThemedView safePaddingBottom flex={1} backgroundColor={Palette.surfaceBase}>
        <ScrollView
          onScroll={e => {
            const offsetY = e.nativeEvent.contentOffset.y;
            useScrollStore.getState().setTabScrolled('operation', offsetY > 20);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[styles.content, { paddingTop: 60 + (useSafeAreaInsets().top || 0) }]}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void topUsersQuery.refetch();
                void topStationsQuery.refetch();
                void growthQuery.refetch();
                void growthChartQuery.refetch();
              }}
              refreshing={isRefreshing}
              tintColor={Palette.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <ThemedView gap={'five'} marginTop={12} paddingHorizontal={screenHorizontalPadding}>
            <ThemedView>
              <ThemedText fontFamily='bold' fontSize={34} lineHeight={40} letterSpacing={-0.5}>
                Operation
              </ThemedText>
              <ThemedText fontSize={16} color={Palette.textSecondary} marginTop={mhs(4)}>
                Manage user accounts and monitor key operational metrics.
              </ThemedText>
            </ThemedView>
            <ThemedView gap={'seven'}>
              <OperationServicesSection onSelectService={openService} tileWidth={tileWidth} />
              <OperationStatsSection
                growth={getCollectionItems(growthChartQuery.data) || []}
                growthSummary={growthQuery.data?.data}
                isLoading={
                  topUsersQuery.isLoading || topStationsQuery.isLoading || growthQuery.isLoading || growthChartQuery.isLoading
                }
                onViewMoreTopStations={() => router.push('/operation/locations')}
                onViewMoreTopUsers={() => router.push('/operation/users')}
                topStations={getCollectionItems(topStationsQuery.data) || []}
                topUsers={getCollectionItems(topUsersQuery.data) || []}
              />
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ThemedView>

      <PaymentCheckoutSheet
        onClose={() => setIsPaymentCheckoutOpen(false)}
        visible={isPaymentCheckoutOpen}
        onSuccess={record => {
          setPaymentRecord(record);
          setIsPaymentResultOpen(true);
        }}
      />
      <PaymentResultSheet onClose={() => setIsPaymentResultOpen(false)} visible={isPaymentResultOpen} record={paymentRecord} />
    </>
  );
}

function OperationServicesSection({ onSelectService, tileWidth }: { onSelectService: (service: OperationService) => void; tileWidth: number }) {
  const rows = chunkItems(operationServices, 4);

  return (
    <ThemedView gap={'three'}>
      <SectionTitle subtitle='Quick access to essential account management actions.' title='User Services' />
      <ThemedView gap={'three'}>
        {rows.map((row, rowIndex) => (
          <ThemedView flexDirection='row' justifyContent='space-between' key={`operation-service-row-${rowIndex}`} style={styles.serviceRow}>
            {row.map(service => (
              <ServiceShortcut key={service.key} onPress={() => onSelectService(service)} service={service} tileWidth={tileWidth} />
            ))}
            {row.length < 4
              ? Array.from({ length: 4 - row.length }).map((_, index) => <ThemedView key={`operation-service-spacer-${rowIndex}-${index}`} width={tileWidth} />)
              : null}
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function ServiceShortcut({ onPress, service, tileWidth }: { onPress: () => void; service: OperationService; tileWidth: number }) {
  const IconComponent = service.icon;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.serviceTile, { width: tileWidth }, pressed && styles.pressed]}>
      <ThemedView style={styles.serviceIcon}>
        <IconComponent color={Palette.textPrimary} size={22} />
      </ThemedView>
      <ThemedView justifyContent='flex-start' width='100%'>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} numberOfLines={2} textAlign='center'>
          {service.title.replace(' ', '\n')}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function OperationStatsSection({
  growth,
  growthSummary,
  isLoading,
  onViewMoreTopStations,
  onViewMoreTopUsers,
  topStations,
  topUsers,
}: {
  growth: UserGrowthChartItem[];
  growthSummary?: UserGrowthSummary;
  isLoading: boolean;
  onViewMoreTopStations: () => void;
  onViewMoreTopUsers: () => void;
  topStations: TopStationPerformanceItem[];
  topUsers: TopUserPerformanceItem[];
}) {
  const { width } = useWindowDimensions();

  if (isLoading) {
    return (
      <ThemedView gap={'three'}>
        <SectionTitle subtitle='Loading dashboard metrics' title='Operation Analytics' />
        <ThemedView borderRadius={'large'} height={128} loading />
      </ThemedView>
    );
  }

  return (
    <ThemedView gap={'three'}>
      <PerformanceHorizontalSection
        accentColor='#0F9F6E'
        description='Highlighting the most active users of the current month.'
        items={topUsers.slice(0, 10).map((item, index) => ({
          label: item.user_name || item.user_email || `User #${item.user_id}`,
          meta: `${formatNumber(item.total_orders)} sessions • ${decimalFormatter.format(Number(item.total_energy) || 0)} kWh`,
          rank: index + 1,
          value: formatCurrency(item.total_paid),
        }))}
        screenWidth={width}
        title='Top User Performance'
        onViewMore={onViewMoreTopUsers}
      />
      <PerformanceHorizontalSection
        accentColor='#2563EB'
        description='Discover top-performing charging stations of the current month.'
        items={topStations.slice(0, 10).map((item, index) => ({
          label: item.station_name || `Station #${item.station_id}`,
          meta: `${formatNumber(item.total_orders)} sessions • ${formatCurrency(item.total_paid)}`,
          rank: index + 1,
          value: `${decimalFormatter.format(Number(item.total_energy ?? item.total_energy_kwh) || 0)} kWh`,
        }))}
        screenWidth={width}
        title='Top Performing Stations'
        onViewMore={onViewMoreTopStations}
      />
      <UserGrowthSection growth={growth} summary={growthSummary} />
    </ThemedView>
  );
}

function PerformanceHorizontalSection({
  accentColor,
  description,
  items,
  onViewMore,
  screenWidth,
  title,
}: {
  accentColor: string;
  description: string;
  items: { label: string; meta: string; rank: number; value: string }[];
  onViewMore: () => void;
  screenWidth: number;
  title: string;
}) {
  const cardWidth = Math.max(206, Math.round(screenWidth * 0.6));

  return (
    <ThemedView gap={'three'}>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
        <ThemedView flex={1} minWidth={0}>
          <SectionTitle subtitle={description} title={title} />
        </ThemedView>
        <Pressable
          accessibilityLabel='View more'
          accessibilityRole='button'
          onPress={onViewMore}
          style={({ pressed }) => [
            { paddingHorizontal: mhs(4), paddingVertical: mhs(8) },
            { flexDirection: 'row', alignItems: 'center', gap: mhs(2) },
            pressed && styles.pressed
          ]}>
          <ThemedText color={accentColor} fontFamily={FontFamily.medium} fontSize={13} lineHeight={18}>
            View more
          </ThemedText>
          <ChevronsRight color={accentColor} size={16} strokeWidth={2.5} />
        </Pressable>
      </ThemedView>
      {items.length ? (
        <ScrollView contentContainerStyle={styles.topUsersScrollerContent} horizontal showsHorizontalScrollIndicator={false} style={styles.topUsersScroller}>
          {items.map((item, index) => (
            <TopUserPerformanceCard index={index} item={item} key={`${title}-${item.label}-${item.rank}`} width={cardWidth} />
          ))}
        </ScrollView>
      ) : (
        <EmptyState message='No dashboard data returned.' title='No data' />
      )}
    </ThemedView>
  );
}

function TopUserPerformanceCard({
  index,
  item,
  width,
}: {
  index: number;
  item: { label: string; meta: string; rank: number; value: string };
  width: number;
}) {
  const rankTone = getTopUserRankTone(index);

  return (
    <ThemedView style={[styles.topUserCard, { width }]}>
      <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
        <ThemedView style={[styles.topUserRankBadge, { backgroundColor: rankTone.badgeBackground }]}>
          <ThemedText color={rankTone.badgeText} fontFamily={FontFamily.bold} fontSize={11} style={styles.topUserRankText}>
            {rankTone.label}
          </ThemedText>
        </ThemedView>
        <ThemedText numberOfLines={1} color={rankTone.badgeText} fontFamily={FontFamily.bold} fontSize={12} style={styles.topUserValue}>
          {item.value}
        </ThemedText>
      </ThemedView>
      <ThemedView gap={'one'}>
        <ThemedText numberOfLines={2} color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} style={styles.topUserName}>
          {item.label}
        </ThemedText>
        <ThemedText numberOfLines={2} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} style={styles.topUserMeta}>
          {item.meta}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function getTopUserRankTone(index: number) {
  if (index === 0) {
    return {
      badgeBackground: '#F1F5F9',
      badgeText: '#A16207',
      label: '1st',
    };
  }

  if (index === 1) {
    return {
      badgeBackground: '#F1F5F9',
      badgeText: '#4B5563',
      label: '2nd',
    };
  }

  if (index === 2) {
    return {
      badgeBackground: '#F1F5F9',
      badgeText: '#C2410C',
      label: '3rd',
    };
  }

  return {
    badgeBackground: '#F1F5F9',
    badgeText: '#0F9F6E',
    label: `${index + 1}th`,
  };
}


function UserGrowthSection({ growth, summary }: { growth: UserGrowthChartItem[]; summary?: UserGrowthSummary }) {
  const maxValue = Math.max(...growth.map(item => Number(item.total_users) || 0), 10);
  const chartItems = growth.slice(-12);

  const barData = chartItems.flatMap(item => [
    {
      value: Number(item.total_users) || 0,
      frontColor: '#059669', // Stronger green
      gradientColor: '#05C75A', // Eboost green
      spacing: 6,
      label: formatGrowthMonth(item.time),
    },
    {
      value: Number(item.new_users) || 0,
      frontColor: '#1D4ED8', // Stronger blue
      gradientColor: '#3B82F6', // Normal blue
    },
  ]);

  return (
    <ThemedView gap={'three'}>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
        <ThemedView flex={1} minWidth={0}>
          <SectionTitle subtitle='Monthly user base trend and charging activity.' title='User Growth' />
        </ThemedView>
        <TrendingUp color={operationAccent} size={18} />
      </ThemedView>
      
      <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={mhs(24)} gap={'four'} padding={mhs(20)}>
        <ThemedView flexDirection='row' gap={'three'}>
          <PremiumGrowthCard 
            label='Total Users' 
            value={formatFullNumber(summary?.total_users)} 
            change={summary?.today_vs_yesterday_growth_percent} 
            icon={Users}
          />
          <PremiumGrowthCard 
            label='Active Today' 
            value={formatFullNumber(summary?.users_charged_today)} 
            change={summary?.charged_today_vs_yesterday_percent} 
            icon={Zap}
          />
          <PremiumGrowthCard 
            label='Avg Duration' 
            value={formatDurationMinutes(summary?.avg_charge_duration_all_time)} 
            change={summary?.avg_charge_duration_change_percent} 
            icon={Clock}
          />
        </ThemedView>
        
        <ThemedView gap={'three'}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} textTransform='uppercase'>
            Trend - Last 12 months
          </ThemedText>
          {chartItems.length ? (
            <BarChart
              data={barData}
              barWidth={16}
              initialSpacing={10}
              endSpacing={20}
              spacing={14}
              barBorderRadius={4}
              showGradient
              yAxisThickness={0}
              xAxisType={'dashed'}
              xAxisColor={Palette.borderSubtle}
              yAxisTextStyle={{color: Palette.textTertiary, fontSize: 10, fontFamily: FontFamily.medium}}
              maxValue={maxValue * 1.1}
              noOfSections={4}
              labelWidth={40}
              xAxisLabelTextStyle={{color: Palette.textSecondary, textAlign: 'center', fontSize: 10, fontFamily: FontFamily.medium}}
              showLine
              lineConfig={{
                color: operationAccent,
                thickness: 3,
                curved: true,
                hideDataPoints: true,
                shiftY: 20,
                initialSpacing: -30,
              }}
            />
          ) : (
            <EmptyState message='No growth data returned.' title='No data' />
          )}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

function PremiumGrowthCard({ change, label, value, icon: Icon }: { change?: number; label: string; value: string; icon: LucideIcon }) {
  const isPositive = Number(change) >= 0;
  const changeColor = isPositive ? '#10B981' : '#F43F5E';
  
  return (
    <ThemedView flex={1} minWidth={0} gap={mhs(4)}>
      <ThemedView flexDirection='row' alignItems='center' gap={mhs(4)}>
        <Icon color={Palette.textTertiary} size={10} />
        <ThemedText flex={1} numberOfLines={1} color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={9} textTransform='uppercase'>
          {label}
        </ThemedText>
      </ThemedView>
      <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      {change !== undefined && (
        <ThemedView flexDirection='row' alignItems='center' gap={2}>
          {isPositive ? <ArrowUpRight color={changeColor} size={10} /> : <ArrowDownRight color={changeColor} size={10} />}
          <ThemedText numberOfLines={1} color={changeColor} fontFamily={FontFamily.semibold} fontSize={11}>
            {Math.abs(change).toFixed(1)}%
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

function SectionTitle({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <ThemedView flex={1} minWidth={0}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={12} letterSpacing={1.8} lineHeight={17} textTransform='uppercase'>
        {title}
      </ThemedText>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} marginTop={2}>
        {subtitle}
      </ThemedText>
    </ThemedView>
  );
}

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
  footerLoader: {
    paddingVertical: mhs(16),
  },
  atRiskMetrics: {
    marginTop: mhs(12),
  },
  growthBar: {
    alignSelf: 'stretch',
    backgroundColor: '#05C75A',
    borderTopLeftRadius: mhs(16),
    borderTopRightRadius: mhs(16),
  },
  growthBarColumn: {
    width: 58,
  },
  growthBarTrack: {
    height: 126,
    width: '100%',
  },
  growthChartScroller: {
    alignItems: 'flex-end',
    gap: mhs(12),
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#FFF4ED',
    borderRadius: mhs(16),
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  inlineMetric: {
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: mhs(8),
  },
  inlineMetricValue: {
    fontVariant: ['tabular-nums'],
  },
  infoCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(16),
  },
  inlineList: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    overflow: 'hidden',
  },
  inlineUserRow: {
    alignItems: 'center',
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mhs(8),
    minHeight: 46,
    paddingHorizontal: mhs(12),
  },
  input: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(21),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: mhs(16),
    paddingVertical: mhs(12),
  },
  levelDot: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  levelOption: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(12),
  },
  levelOptionSelected: {
    borderColor: Palette.accent,
    borderWidth: 1.5,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  resultCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    padding: mhs(24),
  },
  search: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(21),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    height: 48,
    paddingHorizontal: mhs(16),
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: mhs(16),
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: operationAccent,
  },
  segmented: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(21),
    padding: mhs(4),
  },
  selectedAvatar: {
    alignItems: 'center',
    backgroundColor: operationAccent,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  selectedSummary: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(12),
  },
  selectedUserRow: {
    borderColor: Palette.accent,
    borderRadius: mhs(21),
    borderWidth: 1.5,
    marginHorizontal: mhs(8),
    overflow: 'hidden',
  },
  serviceIcon: {
    alignItems: 'center',
    backgroundColor: Palette.antiFlashWhite,
    borderRadius: mhs(16),
    height: mhs(56),
    justifyContent: 'center',
    width: mhs(56),
  },

  serviceRow: {
    width: '100%',
  },
  serviceTile: {
    alignItems: 'center',
    gap: mhs(6),
    minHeight: 88,
    justifyContent: 'flex-start',
    paddingHorizontal: mhs(4),
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mhs(12),
    paddingHorizontal: mhs(16),
    paddingTop: mhs(12),
  },
  sheetList: {
    paddingHorizontal: mhs(8),
  },
  sheetNextButton: {
    height: 42,
    minWidth: 88,
  },
  analyticsRows: {
    marginTop: mhs(12),
  },
  rankNumber: {
    width: 24,
  },
  topUserCard: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: mhs(21),
    borderWidth: StyleSheet.hairlineWidth,
    gap: mhs(8),
    justifyContent: 'flex-start',
    padding: mhs(12),
  },
  topUserMeta: {
    lineHeight: 13,
  },
  topUserName: {
    lineHeight: 16,
  },
  topUserRankBadge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: mhs(12),
    justifyContent: 'center',
    minHeight: 24,
    minWidth: 34,
    paddingHorizontal: mhs(8),
  },
  topUserRankText: {
    fontVariant: ['tabular-nums'],
  },
  topUserValue: {
    flex: 1,
    marginLeft: mhs(8),
    textAlign: 'right',
  },
  topUsersScroller: {
    marginTop: mhs(12),
  },
  topUsersScrollerContent: {
    gap: mhs(12),
    paddingRight: screenHorizontalPadding,
  },
  viewMoreIconOpen: {
    transform: [{ rotate: '90deg' }],
  },
  topRankRow: {
    borderTopColor: Palette.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 58,
    justifyContent: 'center',
    paddingVertical: mhs(12),
  },
  stepPill: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(8),
  },
  stepPillActive: {
    backgroundColor: operationAccent,
  },
  textArea: {
    minHeight: 106,
    textAlignVertical: 'top',
  },
  warningCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(16),
  },
  wizardContent: {
    gap: mhs(16),
    padding: screenHorizontalPadding,
    paddingBottom: 120,
  },
  wizardHeader: {
    alignItems: 'center',
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mhs(12),
    minHeight: 58,
    paddingHorizontal: screenHorizontalPadding,
  },
});
