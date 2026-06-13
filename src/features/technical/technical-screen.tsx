import { useQuery } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { useRouter } from 'expo-router';
import {
  BadgeDollarSign,
  BadgeInfo,
  Cable,
  ChevronLeft,
  ChevronRight,
  CircleMinus,
  CirclePlus,
  Gauge,
  LockOpen,
  PencilLine,
  QrCode,
  RotateCcw,
  Search,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { quickServiceGroups, type QuickServiceIconName, type QuickServiceItem } from 'features/services/quick-service-catalog';
import { ReplaceMeterSheet } from 'features/services/replace-meter';
import { TriggerBoxSheet } from 'features/services/trigger-box';
import { AppButton, EmptyState } from 'shared/ui';
import { FontFamily, Palette, Radius, Spacing } from 'themes';

import { useTechnicalPanel } from './hooks';
import { fetchBikeBoxStatus, fetchCarBoxStatus, fetchDomainAnalyze, fetchEnergyDiffer, fetchNetworkStatus } from './technical-service';
import type {
  BoxStatusData,
  ChargerRecord,
  ConnectionLogRecord,
  DomainAnalyzeRecord,
  EnergyDifferRecord,
  MeterValueRecord,
  StatusLogRecord,
  TechnicalPanel,
  TechnicalQueryParams,
  TechnicalVehicle,
} from './types';

export const technicalDetailPanels: TechnicalPanel[] = ['chargers', 'meter-hourly', 'status-logs', 'energy-differ'];
const screenHorizontalPadding = 18;
const serviceTileSize = 64;
const networkDangerTextColor = '#B42318';
const networkSuccessTextColor = Palette.accentPressed;
const emptyOverviewData: unknown[] = [];
const shortDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
});
const quickServiceIcons: Record<QuickServiceIconName, LucideIcon> = {
  badgeDollarSign: BadgeDollarSign,
  badgeInfo: BadgeInfo,
  cable: Cable,
  circleMinus: CircleMinus,
  circlePlus: CirclePlus,
  gauge: Gauge,
  lockOpen: LockOpen,
  pencilLine: PencilLine,
  qrCode: QrCode,
  rotateCcw: RotateCcw,
  wrench: Wrench,
  zap: Zap,
};

const panelTitles: Record<TechnicalPanel, string> = {
  chargers: 'Chargers',
  'domain-analyze': 'Domain Analyze',
  'energy-differ': 'Energy Differ',
  'meter-hourly': 'Meter Hourly',
  'network-status': 'Charger Network Status',
  'status-logs': 'Status Logs',
};

export function TechnicalScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [boxActionMode, setBoxActionMode] = useState<'reset' | 'trigger' | 'unlock' | null>(null);
  const [replaceMeterVisible, setReplaceMeterVisible] = useState(false);
  const {
    data: bikeNetworkData,
    error: bikeNetworkError,
    isLoading: bikeNetworkLoading,
    isRefetching: bikeNetworkRefetching,
    refetch: refetchBikeNetwork,
  } = useQuery({
    queryFn: () => fetchNetworkStatus('bike'),
    queryKey: ['technical', 'overview-network-status', 'bike'],
  });
  const {
    data: bikeBoxStatusData,
    error: bikeBoxStatusError,
    isLoading: bikeBoxStatusLoading,
    isRefetching: bikeBoxStatusRefetching,
    refetch: refetchBikeBoxStatus,
  } = useQuery({
    queryFn: fetchBikeBoxStatus,
    queryKey: ['technical', 'overview-bike-box-status'],
  });
  const {
    data: carNetworkData,
    error: carNetworkError,
    isLoading: carNetworkLoading,
    isRefetching: carNetworkRefetching,
    refetch: refetchCarNetwork,
  } = useQuery({
    queryFn: () => fetchNetworkStatus('car'),
    queryKey: ['technical', 'overview-network-status', 'car'],
  });
  const {
    data: carBoxStatusData,
    error: carBoxStatusError,
    isLoading: carBoxStatusLoading,
    isRefetching: carBoxStatusRefetching,
    refetch: refetchCarBoxStatus,
  } = useQuery({
    queryFn: fetchCarBoxStatus,
    queryKey: ['technical', 'overview-car-box-status'],
  });
  const {
    data: domainData,
    error: domainError,
    isLoading: domainLoading,
    isRefetching: domainRefetching,
    refetch: refetchDomain,
  } = useQuery({
    queryFn: fetchDomainAnalyze,
    queryKey: ['technical', 'overview-domain-analyze'],
  });
  const serviceTileWidth = Math.min(serviceTileSize, Math.floor((width - screenHorizontalPadding * 2 - Spacing.three * 3) / 4));

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        ListHeaderComponent={
          <ThemedView gap={Spacing.three} paddingHorizontal={screenHorizontalPadding} paddingTop={Spacing.two}>
            <ThemedView>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={26} letterSpacing={0} lineHeight={31}>
                Technical
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} marginTop={3}>
                Charger service, network health, and domain load
              </ThemedText>
            </ThemedView>
          </ThemedView>
        }
        contentContainerStyle={styles.content}
        data={emptyOverviewData}
        keyExtractor={(_, index) => String(index)}
        ListEmptyComponent={
          <ThemedView gap={Spacing.five} paddingHorizontal={screenHorizontalPadding}>
            <ChargerServicesSection tileWidth={serviceTileWidth} onBoxAction={setBoxActionMode} onReplaceMeter={() => setReplaceMeterVisible(true)} />
            <NetworkStatusSection
              bikeQuery={{
                data: bikeNetworkData,
                error: bikeNetworkError,
                isLoading: bikeNetworkLoading,
                refetch: refetchBikeNetwork,
              }}
              bikeBoxStatusQuery={{
                data: bikeBoxStatusData,
                error: bikeBoxStatusError,
                isLoading: bikeBoxStatusLoading,
                refetch: refetchBikeBoxStatus,
              }}
              carBoxStatusQuery={{
                data: carBoxStatusData,
                error: carBoxStatusError,
                isLoading: carBoxStatusLoading,
                refetch: refetchCarBoxStatus,
              }}
              carQuery={{
                data: carNetworkData,
                error: carNetworkError,
                isLoading: carNetworkLoading,
                refetch: refetchCarNetwork,
              }}
              onViewIssues={() =>
                router.push({
                  pathname: '/technical/network-issues',
                } as never)
              }
            />
            <DomainAnalyzeSection
              query={{
                data: domainData,
                error: domainError,
                isLoading: domainLoading,
                refetch: refetchDomain,
              }}
            />
          </ThemedView>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void refetchBikeNetwork();
              void refetchBikeBoxStatus();
              void refetchCarBoxStatus();
              void refetchCarNetwork();
              void refetchDomain();
            }}
            refreshing={bikeNetworkRefetching || bikeBoxStatusRefetching || carBoxStatusRefetching || carNetworkRefetching || domainRefetching}
            tintColor={Palette.accent}
          />
        }
        renderItem={null}
        showsVerticalScrollIndicator={false}
      />
      {boxActionMode ? <TriggerBoxSheet mode={boxActionMode} onClose={() => setBoxActionMode(null)} visible={Boolean(boxActionMode)} /> : null}
      {replaceMeterVisible ? <ReplaceMeterSheet onClose={() => setReplaceMeterVisible(false)} visible={replaceMeterVisible} /> : null}
    </SafeAreaView>
  );
}

export function TechnicalPanelScreen({ onBack, panel }: { onBack: () => void; panel: TechnicalPanel }) {
  const [vehicle, setVehicle] = useState<TechnicalVehicle>('bike');
  const stateKey = `${panel}:${vehicle}`;
  const [listState, setListState] = useState({ page: 1, search: '', searchInput: '', stateKey });
  const { page, search, searchInput } = listState;
  const params: TechnicalQueryParams = { page, search, vehicle };
  const panelQueries = useTechnicalPanel(panel, params);
  const {
    data: energyDifferData,
    error: energyDifferError,
    isLoading: energyDifferLoading,
    isRefetching: energyDifferRefetching,
    refetch: refetchEnergyDiffer,
  } = useQuery({
    enabled: panel === 'energy-differ',
    queryFn: () => fetchEnergyDiffer({ vehicle }),
    queryKey: ['technical', 'energy-differ-detail', vehicle],
  });
  const listQuery = panel === 'chargers' ? panelQueries.chargers : panel === 'meter-hourly' ? panelQueries.meterHourly : panelQueries.statusLogs;
  const isEnergyDiffer = panel === 'energy-differ';
  const title = panelTitles[panel];

  if (listState.stateKey !== stateKey) {
    setListState({ page: 1, search: '', searchInput: '', stateKey });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setListState(current => ({ ...current, page: 1, search: current.searchInput.trim() }));
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleVehicleChange = (nextVehicle: TechnicalVehicle) => {
    setVehicle(nextVehicle);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList<unknown>
        ListHeaderComponent={
          <ThemedView gap={Spacing.three} paddingHorizontal={screenHorizontalPadding} paddingTop={Spacing.one}>
            <ThemedView alignItems='center' flexDirection='row' minHeight={38}>
              <Pressable accessibilityLabel='Back' accessibilityRole='button' onPress={onBack} style={({ pressed }) => [styles.issueNavButton, pressed && styles.pressed]}>
                <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
              </Pressable>
              <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={16} lineHeight={21} textAlign='center'>
                {title}
              </ThemedText>
              <ThemedView width={34} />
            </ThemedView>
            <VehicleSwitch vehicle={vehicle} onChange={handleVehicleChange} />
            {!isEnergyDiffer ? (
              <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} style={styles.searchWrap}>
                <Search color={Palette.textTertiary} size={18} />
                <TextInput
                  autoCapitalize='none'
                  autoCorrect={false}
                  onChangeText={value => setListState(current => ({ ...current, searchInput: value }))}
                  placeholder={panel === 'chargers' ? 'Search unique ID' : 'Search charger ID'}
                  placeholderTextColor='#98A2B3'
                  returnKeyType='search'
                  style={styles.searchInput}
                  value={searchInput}
                />
              </ThemedView>
            ) : null}
          </ThemedView>
        }
        contentContainerStyle={styles.content}
        data={isEnergyDiffer ? energyDifferData?.items || [] : listQuery.data?.items || []}
        keyExtractor={(item, index) => getItemKey(item, index)}
        ListEmptyComponent={
          isEnergyDiffer ? (
            <EnergyDifferState
              query={{
                data: energyDifferData,
                error: energyDifferError,
                isLoading: energyDifferLoading,
                refetch: refetchEnergyDiffer,
              }}
              vehicle={vehicle}
            />
          ) : (
            <ListState error={listQuery.error} isLoading={listQuery.isLoading} onRetry={() => listQuery.refetch()} title={title} />
          )
        }
        ListFooterComponent={
          !isEnergyDiffer && listQuery.data?.total ? (
            <ListFooter
              canLoadMore={page * 30 < listQuery.data.total}
              isFetching={listQuery.isFetching}
              page={page}
              total={listQuery.data.total}
              onLoadMore={() => setListState(current => ({ ...current, page: current.page + 1 }))}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => (isEnergyDiffer ? refetchEnergyDiffer() : listQuery.refetch())}
            refreshing={(isEnergyDiffer ? energyDifferRefetching : listQuery.isRefetching) || false}
            tintColor={Palette.accent}
          />
        }
        renderItem={({ item }) =>
          isEnergyDiffer ? (
            <EnergyDifferCard item={item as EnergyDifferRecord} vehicle={vehicle} />
          ) : (
            <TechnicalListItem item={item} panel={panel} vehicle={vehicle} />
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function ChargerServicesSection({
  onBoxAction,
  onReplaceMeter,
  tileWidth,
}: {
  onBoxAction: (mode: 'reset' | 'trigger' | 'unlock') => void;
  onReplaceMeter: () => void;
  tileWidth: number;
}) {
  const services = quickServiceGroups[0]?.services || [];
  const rows = chunkItems(services, 4);

  return (
    <ThemedView gap={Spacing.three}>
      <SectionTitle subtitle='Same charger service shortcuts used on Home.' title='Charger Services' />
      <ThemedView gap={Spacing.three}>
        {rows.map((row, rowIndex) => (
          <ThemedView flexDirection='row' justifyContent='space-between' key={`service-row-${rowIndex}`} style={styles.serviceRow}>
            {row.map(service => (
              <QuickServiceShortcut
                key={service.slug}
                tileWidth={tileWidth}
                onPress={
                  service.slug === 'trigger-charger'
                    ? () => onBoxAction('trigger')
                    : service.slug === 'reset'
                      ? () => onBoxAction('reset')
                      : service.slug === 'unlock-charger'
                        ? () => onBoxAction('unlock')
                        : service.slug === 'replace-meter'
                          ? onReplaceMeter
                          : undefined
                }
                service={service}
              />
            ))}
            {row.length < 4
              ? Array.from({ length: 4 - row.length }).map((_, index) => <ThemedView key={`service-spacer-${rowIndex}-${index}`} width={tileWidth} />)
              : null}
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function QuickServiceShortcut({ onPress, service, tileWidth }: { onPress?: () => void; service: QuickServiceItem; tileWidth: number }) {
  const Icon = quickServiceIcons[service.icon];

  return (
    <Pressable
      accessibilityLabel={service.name}
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [styles.serviceShortcut, { width: tileWidth }, pressed && styles.pressed]}>
      <ThemedView style={styles.serviceIconSurface}>
        <Icon color={Palette.textTertiary} size={23} strokeWidth={1.9} />
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13} numberOfLines={2} textAlign='center'>
        {service.labelLines.filter(Boolean).join(' ')}
      </ThemedText>
    </Pressable>
  );
}

function NetworkStatusSection({
  bikeBoxStatusQuery,
  bikeQuery,
  carBoxStatusQuery,
  carQuery,
  onViewIssues,
}: {
  bikeBoxStatusQuery: { data?: BoxStatusData; error: Error | null; isLoading: boolean; refetch: () => void };
  bikeQuery: { data?: { items: ConnectionLogRecord[] }; error: Error | null; isLoading: boolean; refetch: () => void };
  carBoxStatusQuery: { data?: BoxStatusData; error: Error | null; isLoading: boolean; refetch: () => void };
  carQuery: { data?: { items: ConnectionLogRecord[] }; error: Error | null; isLoading: boolean; refetch: () => void };
  onViewIssues: () => void;
}) {
  const bike = getNetworkSummary(bikeQuery.data?.items || []);
  const car = getNetworkSummary(carQuery.data?.items || []);
  const total = {
    boxes: bike.boxes + car.boxes,
    online: bike.online + car.online,
    offline: bike.offline + car.offline,
  };
  const totalPercent = total.boxes ? Math.round((total.online / total.boxes) * 100) : 0;
  const loading = bikeQuery.isLoading || carQuery.isLoading;
  const error = bikeQuery.error || carQuery.error;

  return (
    <ThemedView gap={Spacing.three} style={styles.dashboardSection}>
      <SectionTitle
        actionLabel='View issues'
        onAction={onViewIssues}
        subtitle='Bike and car network status from CMS dashboard.'
        title='Charger Network Status'
      />
      {loading ? (
        <LoadingBlock label='Loading network status' />
      ) : error ? (
        <RetryBlock
          message={error.message}
          onRetry={() => {
            bikeQuery.refetch();
            carQuery.refetch();
          }}
          title='Network status unavailable'
        />
      ) : (
        <ThemedView gap={Spacing.two} style={styles.networkFlatBlock}>
          <ThemedView alignItems='center' flexDirection='row' gap={Spacing.three}>
            <ThemedView flex={1} minWidth={0}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
                Fleet connection
              </ThemedText>
              <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} lineHeight={14}>
                {total.online.toLocaleString()} online / {total.boxes.toLocaleString()} chargers
              </ThemedText>
            </ThemedView>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18} style={styles.networkReadyValue}>
              {totalPercent}% ready
            </ThemedText>
          </ThemedView>
          <ProgressBar color={Palette.accent} percent={totalPercent} />
          <ThemedView flexDirection='row' gap={Spacing.two}>
            <CompactStat label='Online' value={total.online} />
            <CompactStat label='Offline' value={total.offline} />
            <CompactStat label='Total' value={total.boxes} />
          </ThemedView>
          <VehicleNetworkLane accent={Palette.accent} isFirst query={bikeBoxStatusQuery} summary={bike} title='Bike' vehicle='bike' />
          <VehicleNetworkLane accent='#3867D6' query={carBoxStatusQuery} summary={car} title='Car' vehicle='car' />
        </ThemedView>
      )}
    </ThemedView>
  );
}

type NetworkIssue = ConnectionLogRecord & {
  vehicle: TechnicalVehicle;
};

type NetworkIssueFilter = 'all' | TechnicalVehicle;

export function NetworkIssuesScreen({
  bikeQuery,
  carQuery,
  onBack,
}: {
  bikeQuery: {
    data?: { items: ConnectionLogRecord[] };
    error: Error | null;
    isLoading: boolean;
    isRefetching: boolean;
    refetch: () => void;
  };
  carQuery: {
    data?: { items: ConnectionLogRecord[] };
    error: Error | null;
    isLoading: boolean;
    isRefetching: boolean;
    refetch: () => void;
  };
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<NetworkIssueFilter>('all');
  const [issueSearch, setIssueSearch] = useState('');
  const bikeIssues = getNetworkIssues(bikeQuery.data?.items || [], 'bike');
  const carIssues = getNetworkIssues(carQuery.data?.items || [], 'car');
  const issuePool = filter === 'bike' ? bikeIssues : filter === 'car' ? carIssues : [...bikeIssues, ...carIssues];
  const normalizedIssueSearch = issueSearch.trim().toLowerCase();
  const issues = normalizedIssueSearch
    ? issuePool.filter(item => [item.chargePointID, item.stationName].some(value => value?.toLowerCase().includes(normalizedIssueSearch)))
    : issuePool;
  const loading = bikeQuery.isLoading || carQuery.isLoading;
  const error = bikeQuery.error || carQuery.error;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList<NetworkIssue>
        ListHeaderComponent={
          <ThemedView gap={Spacing.three} paddingTop={Spacing.one} style={styles.issueHeader}>
            <ThemedView alignItems='center' flexDirection='row' minHeight={38}>
              <Pressable
                accessibilityLabel='Back'
                accessibilityRole='button'
                onPress={onBack}
                style={({ pressed }) => [styles.issueNavButton, pressed && styles.pressed]}>
                <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
              </Pressable>
              <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={16} lineHeight={21} textAlign='center'>
                Network Issues
              </ThemedText>
              <ThemedView width={34} />
            </ThemedView>
            <ThemedView gap={Spacing.two}>
              <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} style={styles.issueSearchWrap}>
                <Search color={Palette.textTertiary} size={16} />
                <TextInput
                  autoCapitalize='none'
                  autoCorrect={false}
                  onChangeText={setIssueSearch}
                  placeholder='Search charger or station'
                  placeholderTextColor='#98A2B3'
                  returnKeyType='search'
                  style={styles.issueSearchInput}
                  value={issueSearch}
                />
              </ThemedView>
              <IssueFilterSwitch bikeCount={bikeIssues.length} carCount={carIssues.length} filter={filter} onChange={setFilter} />
            </ThemedView>
          </ThemedView>
        }
        contentContainerStyle={[styles.content, styles.issueListContent]}
        data={issues}
        keyExtractor={(item, index) => `${item.vehicle}-${item.chargePointID || index}`}
        ListEmptyComponent={
          loading ? (
            <LoadingBlock label='Loading network issues' />
          ) : error ? (
            <RetryBlock
              message={error.message}
              onRetry={() => {
                bikeQuery.refetch();
                carQuery.refetch();
              }}
              title='Network issues unavailable'
            />
          ) : (
            <EmptyState message='Try another charger ID, station name, or filter.' title='No matching offline boxes' />
          )
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              bikeQuery.refetch();
              carQuery.refetch();
            }}
            refreshing={bikeQuery.isRefetching || carQuery.isRefetching}
            tintColor={Palette.accent}
          />
        }
        renderItem={({ item }) => <NetworkIssueCard item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function IssueFilterSwitch({
  bikeCount,
  carCount,
  filter,
  onChange,
}: {
  bikeCount: number;
  carCount: number;
  filter: NetworkIssueFilter;
  onChange: (filter: NetworkIssueFilter) => void;
}) {
  const options: { count: number; label: string; value: NetworkIssueFilter }[] = [
    { count: bikeCount + carCount, label: 'All', value: 'all' },
    { count: bikeCount, label: 'Bike', value: 'bike' },
    { count: carCount, label: 'Car', value: 'car' },
  ];

  return (
    <ThemedView flexDirection='row' style={styles.issueSegmentedControl}>
      {options.map(option => {
        const active = filter === option.value;
        return (
          <Pressable
            accessibilityRole='button'
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.issueFilterChip, active && styles.issueFilterChipActive, pressed && styles.pressed]}>
            <ThemedText color={active ? Palette.accent : Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {option.label} {option.count}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

function NetworkIssueCard({ item }: { item: NetworkIssue }) {
  return (
    <ThemedView style={styles.issueCard}>
      <ThemedView backgroundColor={item.vehicle === 'bike' ? Palette.accent : '#3867D6'} style={styles.issueVehicleRail} />
      <ThemedView flex={1} gap={2} minWidth={0}>
        <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two}>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
            {item.chargePointID || '-'}
          </ThemedText>
        </ThemedView>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          {item.stationName || `${item.vehicle === 'bike' ? 'Bike' : 'Car'} charger`} • {formatShortTime(item.timestamp)}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} style={styles.issueAge}>
        {formatRelativeTime(item.timestamp)}
      </ThemedText>
    </ThemedView>
  );
}

function DomainAnalyzeSection({ query }: { query: { data?: { items: DomainAnalyzeRecord[] }; error: Error | null; isLoading: boolean; refetch: () => void } }) {
  const items = query.data?.items || [];
  const working = items.filter(item => item.working).length;
  const active = items.filter(item => item.is_charging_active).length;
  const backup = items.filter(item => item.working && !item.is_charging_active).length;
  const offline = Math.max(items.length - working, 0);
  const totalSessions = items.reduce((sum, item) => sum + Number(item.total_charging || 0), 0);
  const readiness = items.length ? Math.round((working / items.length) * 100) : 0;
  const sortedItems = items.slice().sort((a, b) => Number(b.total_charging || 0) - Number(a.total_charging || 0));
  const visibleDomains = sortedItems.slice(0, 5);

  return (
    <ThemedView gap={Spacing.three} style={styles.dashboardSection}>
      <SectionTitle subtitle='Load routing across active CMS domains.' title='Domain Analyze' />
      {query.isLoading ? (
        <LoadingBlock label='Loading domain analyze' />
      ) : query.error ? (
        <RetryBlock message={query.error.message} onRetry={query.refetch} title='Domain analyze unavailable' />
      ) : (
        <ThemedView gap={Spacing.four}>
          <ThemedView alignItems='center' flexDirection='row' gap={Spacing.four}>
            <DomainDonut
              segments={[
                { color: Palette.accent, value: active },
                { color: '#3867D6', value: backup },
                { color: '#D0D5DD', value: offline },
              ]}
              total={items.length}
            />
            <ThemedView flex={1} gap={Spacing.two} minWidth={0}>
              <ThemedView alignItems='baseline' flexDirection='row' gap={Spacing.two}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={29} style={styles.domainReadiness}>
                  {totalSessions.toLocaleString()}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
                  sessions
                </ThemedText>
              </ThemedView>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
                {readiness}% working • {items.length.toLocaleString()} domains
              </ThemedText>
              <ThemedView flexDirection='row' flexWrap='wrap' gap={Spacing.two}>
                <DomainLegendItem color={Palette.accent} label='Active' value={active} />
                <DomainLegendItem color='#3867D6' label='Standby' value={backup} />
                <DomainLegendItem color='#98A2B3' label='Silent' value={offline} />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.domainDivider} />

          <ThemedView gap={Spacing.two}>
            {visibleDomains.map((item, index) => {
              const share = totalSessions ? Math.round((Number(item.total_charging || 0) / totalSessions) * 100) : 0;
              return <DomainApiBarRow index={index + 1} item={item} key={item.id} percent={share} />;
            })}
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

type BoxStatusKey = Exclude<keyof BoxStatusData, 'All' | 'offline' | 'online'>;
type BoxStatusMeta = { color: string; key: BoxStatusKey; label: string; tone: 'danger' | 'neutral' | 'success' | 'warning' };
type BoxStatusSegment = { label: string; value: number };

const bikeBoxStatusMeta: BoxStatusMeta[] = [
  { color: networkSuccessTextColor, key: 'Available', label: 'Available', tone: 'success' },
  { color: '#C69214', key: 'Charging', label: 'Charging', tone: 'warning' },
];

const carBoxStatusMeta: BoxStatusMeta[] = [
  { color: networkSuccessTextColor, key: 'Available', label: 'Available', tone: 'success' },
  { color: '#C69214', key: 'Charging', label: 'Charging', tone: 'warning' },
  { color: '#6B7280', key: 'Preparing', label: 'Preparing', tone: 'neutral' },
  { color: '#8B5CF6', key: 'Finishing', label: 'Finishing', tone: 'neutral' },
  { color: '#7C3AED', key: 'Reserved', label: 'Reserved', tone: 'neutral' },
  { color: '#F59E0B', key: 'SuspendedEV', label: 'Suspended EV', tone: 'warning' },
  { color: '#D97706', key: 'SuspendedEVSE', label: 'Suspended EVSE', tone: 'warning' },
  { color: '#F97316', key: 'Unavailable', label: 'Unavailable', tone: 'warning' },
  { color: networkDangerTextColor, key: 'Faulted', label: 'Faulted', tone: 'danger' },
  { color: '#98A2B3', key: 'Other', label: 'Other', tone: 'neutral' },
];

function VehicleNetworkLane({
  accent,
  isFirst,
  query,
  summary,
  title,
  vehicle,
}: {
  accent: string;
  isFirst?: boolean;
  query: {
    data?: BoxStatusData;
    error: Error | null;
    isLoading: boolean;
    refetch: () => void;
  };
  summary: NetworkSummary;
  title: string;
  vehicle: TechnicalVehicle;
}) {
  if (query.isLoading) {
    return (
      <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} style={styles.connectorStrip}>
        <ActivityIndicator color={accent} size='small' />
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
          Loading {title.toLowerCase()}...
        </ThemedText>
      </ThemedView>
    );
  }

  if (query.error) {
    return (
      <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} style={[styles.connectorStrip, styles.connectorPanelWarning]}>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} flex={1} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
          {title} unavailable
        </ThemedText>
        <Pressable accessibilityRole='button' onPress={query.refetch} style={({ pressed }) => [styles.connectorRetryButton, pressed && styles.pressed]}>
          <ThemedText color={Palette.danger} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={14}>
            Retry
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const status = query.data || {};
  const total = Number(status.All || 0);
  const meta = vehicle === 'bike' ? bikeBoxStatusMeta : carBoxStatusMeta;
  const visibleItems = getBoxStatusItems(status, meta).filter(item => item.value > 0 || (vehicle === 'car' && (item.key === 'Unavailable' || item.key === 'Faulted')));
  const assetNoun = vehicle === 'bike' ? 'outlets' : 'connectors';
  const assetSegments: BoxStatusSegment[] = [{ label: `${assetNoun[0].toUpperCase()}${assetNoun.slice(1)}`, value: total }];
  visibleItems.forEach(item => {
    assetSegments.push({ label: item.label, value: item.value });
  });

  return (
    <ThemedView gap={Spacing.two} style={[styles.vehicleNetworkLane, isFirst && styles.vehicleNetworkLaneFirst]}>
      <ThemedView alignItems='center' flexDirection='row' gap={16}>
        <ThemedView alignItems='center' style={styles.vehicleProgressColumn}>
          <CircularProgress color={accent} percent={summary.percent} />
        </ThemedView>
        <ThemedView flex={1} gap={2} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
            {title}
          </ThemedText>
          <ThemedView flexDirection='row' flexWrap='wrap' style={styles.vehicleInlineMeta}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
              {summary.boxes.toLocaleString()} Chargers -{' '}
            </ThemedText>
            <ThemedText color={networkSuccessTextColor} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
              {summary.online.toLocaleString()} Online
            </ThemedText>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
              {' / '}
            </ThemedText>
            <ThemedText color={networkDangerTextColor} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
              {summary.offline.toLocaleString()} Offline
            </ThemedText>
          </ThemedView>
          <StatusMetadataLine segments={assetSegments} />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

function StatusMetadataLine({ segments }: { segments: BoxStatusSegment[] }) {
  return (
    <ThemedView flexDirection='row' flexWrap='wrap' style={styles.statusMetadataLine}>
      {segments.map((segment, index) => (
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={10} key={`${segment.label}-${index}`} lineHeight={14}>
          {index ? ' · ' : ''}
          {segment.value.toLocaleString()} {segment.label}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

function CircularProgress({ color, percent }: { color: string; percent: number }) {
  const size = 58;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedPercent = Math.max(0, Math.min(percent, 100));
  const dash = (normalizedPercent / 100) * circumference;

  return (
    <ThemedView alignItems='center' justifyContent='center' style={styles.circularProgressWrap}>
      <Svg height={size} width={size}>
        <Circle cx={size / 2} cy={size / 2} fill='none' r={radius} stroke='#EEF2F6' strokeWidth={strokeWidth} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill='none'
          r={radius}
          rotation='-90'
          origin={`${size / 2}, ${size / 2}`}
          stroke={color}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap='round'
          strokeWidth={strokeWidth}
        />
      </Svg>
      <ThemedView alignItems='center' justifyContent='center' style={styles.circularProgressCenter}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={12} lineHeight={15} style={styles.connectorTotal}>
          {normalizedPercent}%
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function getBoxStatusItems(status: BoxStatusData, meta: BoxStatusMeta[]) {
  return meta.map(item => ({
    ...item,
    value: Number(status[item.key] || 0),
  }));
}

function DomainDonut({ segments, total }: { segments: { color: string; value: number }[]; total: number }) {
  const size = 82;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const donutSegments = segments.reduce<{ color: string; dash: number; offset: number }[]>((acc, segment) => {
    const previousOffset = acc.reduce((sum, item) => sum + item.dash, 0);
    const dash = total ? (segment.value / total) * circumference : 0;
    return [...acc, { color: segment.color, dash, offset: previousOffset }];
  }, []);

  return (
    <ThemedView alignItems='center' justifyContent='center' style={styles.domainDonutWrap}>
      <Svg height={size} width={size}>
        <Circle cx={size / 2} cy={size / 2} fill='none' r={radius} stroke='#EEF2F6' strokeWidth={strokeWidth} />
        {donutSegments.map(segment => {
          return (
            <Circle
              cx={size / 2}
              cy={size / 2}
              fill='none'
              key={segment.color}
              r={radius}
              rotation='-90'
              origin={`${size / 2}, ${size / 2}`}
              stroke={segment.color}
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap='round'
              strokeWidth={strokeWidth}
            />
          );
        })}
      </Svg>
      <ThemedView alignItems='center' justifyContent='center' style={styles.domainDonutCenter}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={19} style={styles.domainReadiness}>
          {total.toLocaleString()}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
          APIs
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function DomainLegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <ThemedView alignItems='center' flexDirection='row' gap={Spacing.one}>
      <ThemedView backgroundColor={color} style={styles.domainDot} />
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
        {label} {value.toLocaleString()}
      </ThemedText>
    </ThemedView>
  );
}

function DomainApiBarRow({ index, item, percent }: { index: number; item: DomainAnalyzeRecord; percent: number }) {
  const routeStatus = item.working ? (item.is_charging_active ? 'Active' : 'Standby') : 'Silent';
  const color = routeStatus === 'Active' ? Palette.accent : routeStatus === 'Standby' ? '#3867D6' : '#98A2B3';
  const value = Number(item.total_charging || 0);

  return (
    <ThemedView gap={Spacing.one} style={styles.domainApiRow}>
      <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two}>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={11} lineHeight={15} style={styles.domainRouteIndex}>
          {index}
        </ThemedText>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17}>
            {item.domain || '-'}
          </ThemedText>
        </ThemedView>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17} style={styles.domainRoutePercent}>
          {percent}%
        </ThemedText>
      </ThemedView>
      <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two}>
        <ThemedView style={styles.domainApiTrack}>
          <ThemedView backgroundColor={color} height='100%' width={`${Math.max(2, Math.min(percent, 100))}%`} />
        </ThemedView>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} style={styles.domainApiMeta}>
          {value.toLocaleString()} • {routeStatus}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function CompactStat({ label, value }: { label: string; value: number }) {
  return (
    <ThemedView flex={1} style={styles.compactStat}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} lineHeight={14}>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
        {value.toLocaleString()}
      </ThemedText>
    </ThemedView>
  );
}

function ProgressBar({ color, percent }: { color: string; percent: number }) {
  return (
    <ThemedView overflow='hidden' style={styles.progressTrack}>
      <ThemedView backgroundColor={color} height='100%' width={`${Math.max(2, Math.min(percent, 100))}%`} />
    </ThemedView>
  );
}

function VehicleSwitch({ onChange, vehicle }: { onChange: (vehicle: TechnicalVehicle) => void; vehicle: TechnicalVehicle }) {
  return (
    <ThemedView flexDirection='row' gap={Spacing.two}>
      {(['bike', 'car'] as TechnicalVehicle[]).map(option => (
        <Pressable
          accessibilityRole='button'
          key={option}
          onPress={() => onChange(option)}
          style={({ pressed }) => [styles.vehicleChip, vehicle === option && styles.vehicleChipActive, pressed && styles.pressed]}>
          <ThemedText color={vehicle === option ? Palette.surfaceBase : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17}>
            {option === 'bike' ? 'Bike' : 'Car'}
          </ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}

function SectionTitle({ actionLabel, onAction, subtitle, title }: { actionLabel?: string; onAction?: () => void; subtitle: string; title: string }) {
  return (
    <ThemedView gap={Spacing.one}>
      <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} justifyContent='space-between'>
        <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={16} lineHeight={21}>
          {title}
        </ThemedText>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole='button' onPress={onAction} style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {actionLabel}
            </ThemedText>
            <ChevronRight color={Palette.textSecondary} size={14} strokeWidth={2} />
          </Pressable>
        ) : null}
      </ThemedView>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
        {subtitle}
      </ThemedText>
    </ThemedView>
  );
}

function ListState({ error, isLoading, onRetry, title }: { error: Error | null; isLoading: boolean; onRetry: () => void; title: string }) {
  if (isLoading) return <LoadingBlock label={`Loading ${title.toLowerCase()}`} />;
  if (error) return <RetryBlock message={error.message || 'Please refresh and try again.'} onRetry={onRetry} title={`${title} unavailable`} />;
  return <EmptyState message='Try another filter or refresh the list.' title={`No ${title.toLowerCase()} found`} />;
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <ThemedView alignItems='center' gap={Spacing.three} paddingTop={Spacing.five}>
      <ActivityIndicator color={Palette.accent} />
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function RetryBlock({ message, onRetry, title }: { message: string; onRetry: () => void; title: string }) {
  return (
    <ThemedView gap={Spacing.four} paddingTop={Spacing.two}>
      <EmptyState message={message} title={title} />
      <AppButton label='Retry' onPress={onRetry} />
    </ThemedView>
  );
}

function ListFooter({
  canLoadMore,
  isFetching,
  onLoadMore,
  page,
  total,
}: {
  canLoadMore: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  page: number;
  total: number;
}) {
  return (
    <ThemedView alignItems='center' gap={Spacing.two} paddingVertical={Spacing.four}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16}>
        Page {page} • {total.toLocaleString()} total
      </ThemedText>
      {canLoadMore ? <AppButton label={isFetching ? 'Loading...' : 'Next page'} loading={isFetching} onPress={onLoadMore} /> : null}
    </ThemedView>
  );
}

function TechnicalListItem({ item, panel, vehicle }: { item: unknown; panel: TechnicalPanel; vehicle: TechnicalVehicle }) {
  if (panel === 'chargers') return <ChargerCard item={item as ChargerRecord} />;
  if (panel === 'meter-hourly') return <MeterCard item={item as MeterValueRecord} vehicle={vehicle} />;
  return <StatusLogCard item={item as StatusLogRecord} vehicle={vehicle} />;
}

function ChargerCard({ item }: { item: ChargerRecord }) {
  const station = typeof item.station === 'string' ? item.station : item.station?.name || item.stationName || '-';

  return (
    <ThemedView style={styles.itemCard}>
      <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          {item.vendorId || item.uniqueId || `#${item.id || '-'}`}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          {item.name || item.uniqueId || 'Unnamed charger'} • {station}
        </ThemedText>
      </ThemedView>
      <StatusPill
        label={item.enabled === false ? 'Disabled' : item.visible === false ? 'Hidden' : 'Active'}
        tone={item.enabled === false ? 'danger' : 'success'}
      />
    </ThemedView>
  );
}

function MeterCard({ item, vehicle }: { item: MeterValueRecord; vehicle: TechnicalVehicle }) {
  const title = vehicle === 'car' ? item.chargePointID || '-' : item.uniqueID || '-';
  const subtitle = vehicle === 'car' ? getCarMeterSummary(item) : `P ${formatNumber(item.pEnergy)} • PM ${formatNumber(item.pmEnergy)}`;

  return (
    <ThemedView style={styles.itemCard}>
      <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          {title}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          {subtitle}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={15} textAlign='right'>
        {formatShortTime(item.timestamp || item.receivedAt)}
      </ThemedText>
    </ThemedView>
  );
}

function StatusLogCard({ item, vehicle }: { item: StatusLogRecord; vehicle: TechnicalVehicle }) {
  const chargerId = item.chargePointID || item.vendor_id || item.box_id || item.boxId || '-';
  const errorCode = item.errorCode || item.error_code || item.vendorErrorCode || item.vendor_error_code || '';
  const status = formatStatus(item.status, vehicle);

  return (
    <ThemedView style={[styles.itemCard, errorCode ? styles.itemCardWarning : undefined]}>
      <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          {chargerId}
        </ThemedText>
        <ThemedText numberOfLines={1} color={errorCode ? Palette.danger : Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          C{item.connectorID ?? item.connector_id ?? '-'} • {errorCode || item.info || 'Normal event'}
        </ThemedText>
      </ThemedView>
      <ThemedView alignItems='flex-end' gap={Spacing.one}>
        <StatusPill label={status} tone={status === 'Faulted' || errorCode ? 'danger' : 'neutral'} />
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={15}>
          {formatShortTime(item.timestamp || item.receivedAt)}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function EnergyDifferState({
  query,
  vehicle,
}: {
  query: { data?: { items: EnergyDifferRecord[] }; error: Error | null; isLoading: boolean; refetch: () => void };
  vehicle: TechnicalVehicle;
}) {
  if (query.isLoading) return <LoadingBlock label='Loading energy differ' />;
  if (query.error) return <RetryBlock message={query.error.message} onRetry={query.refetch} title='Energy differ unavailable' />;
  if (!query.data?.items.length) return <EmptyState message='This month has no energy differ rows.' title='No energy differ data' />;
  return null;
}

function EnergyDifferCard({ item, vehicle }: { item: EnergyDifferRecord; vehicle: TechnicalVehicle }) {
  return (
    <ThemedView style={styles.itemCard}>
      <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19}>
          {item.charge_point_id || '-'}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
          {item.station_name || `${vehicle} energy`}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18} textAlign='right'>
        {formatNumber(item.energy_difference)}
      </ThemedText>
    </ThemedView>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'danger' | 'neutral' | 'success' }) {
  return (
    <ThemedView style={[styles.statusPill, tone === 'success' ? styles.statusPillSuccess : tone === 'danger' ? styles.statusPillDanger : undefined]}>
      <ThemedText
        color={tone === 'success' ? Palette.accent : tone === 'danger' ? Palette.danger : Palette.textSecondary}
        fontFamily={FontFamily.bold}
        fontSize={11}
        lineHeight={15}
        numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function getItemKey(item: unknown, index: number) {
  const record = item as Record<string, unknown>;
  return String(record.id || record.uniqueId || record.vendorId || record.chargePointID || record.uniqueID || `${index}`);
}

function formatNumber(value?: number) {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 3 });
}

function formatShortTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return shortDateTimeFormatter.format(date);
}

function formatRelativeTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 365) return '>1y ago';
  return `${diffDays}d ago`;
}

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

function formatStatus(value: StatusLogRecord['status'], vehicle: TechnicalVehicle) {
  if (value === undefined || value === null || value === '') return '-';
  if (vehicle === 'car') return String(value);

  const bikeStatus: Record<number, string> = {
    0: 'Available',
    1: 'Charging',
    2: 'Finishing',
    3: 'Unavailable',
    4: 'Faulted',
  };

  return bikeStatus[Number(value)] || String(value);
}

function normalizeConnectionStatus(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'online' || normalized === 'on') return 'online';
  return 'offline';
}

function getLatestConnectionLogs(items: ConnectionLogRecord[]) {
  return Array.from(
    new Map(
      items
        .filter(item => item.chargePointID)
        .sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime())
        .map(item => [item.chargePointID, item]),
    ).values(),
  );
}

type NetworkSummary = {
  boxes: number;
  logs: number;
  offline: number;
  online: number;
  percent: number;
};

function getNetworkSummary(items: ConnectionLogRecord[]): NetworkSummary {
  const latest = getLatestConnectionLogs(items);
  const online = latest.filter(item => normalizeConnectionStatus(item.onlineStatus) === 'online').length;
  const offline = latest.length - online;

  return {
    boxes: latest.length,
    logs: items.length,
    offline,
    online,
    percent: latest.length ? Math.round((online / latest.length) * 100) : 0,
  };
}

function getNetworkIssues(items: ConnectionLogRecord[], vehicle: TechnicalVehicle): NetworkIssue[] {
  return getLatestConnectionLogs(items).reduce<NetworkIssue[]>((issues, item) => {
    if (normalizeConnectionStatus(item.onlineStatus) !== 'online') {
      issues.push({ ...item, vehicle });
    }
    return issues;
  }, []);
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

const styles = StyleSheet.create({
  issueNavButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    marginLeft: -6,
    width: 34,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: 180,
  },
  connectorStrip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#EEF2F6',
    borderRadius: Radius.small,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  connectorPanelWarning: {
    backgroundColor: Palette.dangerSurface,
    borderColor: '#F5B5AE',
  },
  connectorRetryButton: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: '#F5B5AE',
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  connectorTotal: {
    fontVariant: ['tabular-nums'],
  },
  circularProgressCenter: {
    height: 38,
    position: 'absolute',
    width: 38,
  },
  circularProgressWrap: {
    height: 58,
    width: 58,
  },
  compactStat: {
    backgroundColor: '#F8FAFC',
    borderColor: '#EEF2F6',
    borderRadius: Radius.small,
    borderWidth: 1,
    gap: 2,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  dashboardSection: {
    marginTop: Spacing.one,
  },
  domainApiMeta: {
    textAlign: 'right',
    width: 76,
  },
  domainApiRow: {
    minHeight: 42,
  },
  domainApiTrack: {
    backgroundColor: '#EEF2F6',
    borderRadius: Radius.pill,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  domainDivider: {
    backgroundColor: '#EEF2F6',
    height: 1,
  },
  domainDot: {
    borderRadius: Radius.pill,
    height: 7,
    width: 7,
  },
  domainDonutCenter: {
    height: 48,
    position: 'absolute',
    width: 48,
  },
  domainDonutWrap: {
    height: 82,
    width: 82,
  },
  domainReadiness: {
    fontVariant: ['tabular-nums'],
  },
  domainRouteIndex: {
    textAlign: 'center',
    width: 14,
  },
  domainRoutePercent: {
    textAlign: 'right',
    width: 38,
  },
  itemCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    marginHorizontal: screenHorizontalPadding,
    minHeight: 64,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  itemCardWarning: {
    backgroundColor: Palette.dangerSurface,
    borderColor: '#F5B5AE',
  },
  issueCard: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomColor: '#EEF2F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 58,
    paddingVertical: Spacing.two,
  },
  issueFilterChip: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: '#EEF2F6',
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  issueFilterChipActive: {
    backgroundColor: '#E8F7EF',
    borderColor: '#D8F0E3',
  },
  issueHeader: {
    backgroundColor: Palette.surfaceBase,
  },
  issueAge: {
    textAlign: 'right',
    width: 54,
  },
  issueListContent: {
    paddingBottom: 40,
    paddingHorizontal: screenHorizontalPadding,
  },
  issueSearchInput: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    minHeight: 40,
    paddingVertical: 0,
  },
  issueSearchWrap: {
    backgroundColor: '#F6F8FA',
    borderRadius: Radius.pill,
    minHeight: 42,
    paddingHorizontal: Spacing.three,
  },
  issueSegmentedControl: {
    gap: Spacing.two,
  },
  issueVehicleRail: {
    borderRadius: Radius.pill,
    height: 34,
    width: 3,
  },
  networkMarker: {
    borderRadius: Radius.pill,
    height: 7,
    width: 7,
  },
  networkFlatBlock: {
    gap: Spacing.two,
  },
  networkReadyValue: {
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  overviewButton: {
    alignItems: 'center',
    backgroundColor: '#E8F7EF',
    borderRadius: Radius.pill,
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.72,
  },
  progressTrack: {
    backgroundColor: '#EEF2F6',
    borderRadius: Radius.pill,
    height: 6,
  },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  searchInput: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    minHeight: 42,
    paddingVertical: 0,
  },
  searchWrap: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  sectionAction: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#EEF2F6',
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 1,
    minHeight: 28,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.one,
  },
  serviceGrid: {
    rowGap: Spacing.four,
    width: '100%',
  },
  serviceIconSurface: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: Radius.small,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  serviceShortcut: {
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 74,
  },
  serviceRow: {
    width: '100%',
  },
  signalChip: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.small,
    gap: 1,
    maxWidth: 118,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    width: 108,
  },
  signalRow: {
    gap: Spacing.two,
  },
  signalStrip: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.medium,
    borderWidth: 1,
    minHeight: 86,
    padding: Spacing.three,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    maxWidth: 96,
    minHeight: 28,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  statusPillDanger: {
    backgroundColor: Palette.dangerSurface,
  },
  statusPillSuccess: {
    backgroundColor: '#E8F7EF',
  },
  statusMetadataLine: {
    columnGap: 0,
    rowGap: 1,
  },
  vehicleChip: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  vehicleChipActive: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  vehicleInlineMeta: {
    columnGap: 0,
    rowGap: 1,
  },
  vehicleNetworkLane: {
    backgroundColor: 'transparent',
    borderTopColor: '#EEF2F6',
    borderTopWidth: 1,
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  vehicleNetworkLaneFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  vehicleProgressColumn: {
    width: 58,
  },
});
