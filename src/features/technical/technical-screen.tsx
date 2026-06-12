import { useQuery } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { quickServiceGroups, type QuickServiceIconName, type QuickServiceItem } from 'features/services/quick-service-catalog';
import { ReplaceMeterSheet } from 'features/services/replace-meter';
import { TriggerBoxSheet } from 'features/services/trigger-box';
import { AppButton, EmptyState } from 'shared/ui';
import { FontFamily, Palette, Radius, Spacing } from 'themes';

import { useTechnicalPanel } from './hooks';
import { fetchDomainAnalyze, fetchEnergyDiffer, fetchNetworkStatus } from './technical-service';
import type {
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

const detailPanels: TechnicalPanel[] = ['chargers', 'meter-hourly', 'status-logs', 'energy-differ'];
const screenHorizontalPadding = 20;
const serviceTileSize = 70;
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
  const { panel: panelParam } = useLocalSearchParams<{ panel?: string }>();
  const activePanel = detailPanels.includes(panelParam as TechnicalPanel) ? (panelParam as TechnicalPanel) : undefined;
  const [vehicle, setVehicle] = useState<TechnicalVehicle>('bike');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [boxActionMode, setBoxActionMode] = useState<'reset' | 'trigger' | 'unlock' | null>(null);
  const [replaceMeterVisible, setReplaceMeterVisible] = useState(false);
  const params = useMemo<TechnicalQueryParams>(() => ({ page, search, vehicle }), [page, search, vehicle]);
  const panelQueries = useTechnicalPanel(activePanel || 'chargers', params);
  const bikeNetworkQuery = useQuery({
    enabled: !activePanel,
    queryFn: () => fetchNetworkStatus('bike'),
    queryKey: ['technical', 'overview-network-status', 'bike'],
  });
  const carNetworkQuery = useQuery({
    enabled: !activePanel,
    queryFn: () => fetchNetworkStatus('car'),
    queryKey: ['technical', 'overview-network-status', 'car'],
  });
  const domainQuery = useQuery({
    enabled: !activePanel,
    queryFn: fetchDomainAnalyze,
    queryKey: ['technical', 'overview-domain-analyze'],
  });
  const energyDifferQuery = useQuery({
    enabled: activePanel === 'energy-differ',
    queryFn: () => fetchEnergyDiffer({ vehicle }),
    queryKey: ['technical', 'energy-differ-detail', vehicle],
  });
  const serviceTileWidth = Math.min(serviceTileSize, Math.floor((width - screenHorizontalPadding * 2 - Spacing.three * 3) / 4));

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setSearchInput('');
    setSearch('');
  }, [activePanel, vehicle]);

  if (!activePanel) {
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
          data={[]}
          keyExtractor={(_, index) => String(index)}
          ListEmptyComponent={
            <ThemedView gap={Spacing.five} paddingHorizontal={screenHorizontalPadding}>
              <ChargerServicesSection tileWidth={serviceTileWidth} onBoxAction={setBoxActionMode} onReplaceMeter={() => setReplaceMeterVisible(true)} />
              <NetworkStatusSection
                bikeQuery={bikeNetworkQuery}
                carQuery={carNetworkQuery}
                onViewIssues={() =>
                  router.push({
                    pathname: '/technical/network-issues',
                  } as never)
                }
              />
              <DomainAnalyzeSection query={domainQuery} />
            </ThemedView>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void bikeNetworkQuery.refetch();
                void carNetworkQuery.refetch();
                void domainQuery.refetch();
              }}
              refreshing={bikeNetworkQuery.isRefetching || carNetworkQuery.isRefetching || domainQuery.isRefetching}
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

  const listQuery = activePanel === 'chargers' ? panelQueries.chargers : activePanel === 'meter-hourly' ? panelQueries.meterHourly : panelQueries.statusLogs;
  const isEnergyDiffer = activePanel === 'energy-differ';
  const title = panelTitles[activePanel];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList<unknown>
        ListHeaderComponent={
          <ThemedView gap={Spacing.three} paddingHorizontal={screenHorizontalPadding} paddingTop={Spacing.two}>
            <ThemedView alignItems='center' flexDirection='row' gap={Spacing.three} justifyContent='space-between'>
              <ThemedView flex={1} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={24} letterSpacing={0} lineHeight={30}>
                  {title}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} marginTop={3}>
                  Opened from the Technical tab popup menu
                </ThemedText>
              </ThemedView>
              <Pressable accessibilityRole='button' onPress={() => router.setParams({ panel: undefined })} style={styles.overviewButton}>
                <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
                  Main
                </ThemedText>
              </Pressable>
            </ThemedView>
            <VehicleSwitch vehicle={vehicle} onChange={setVehicle} />
            {!isEnergyDiffer ? (
              <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} style={styles.searchWrap}>
                <Search color={Palette.textTertiary} size={18} />
                <TextInput
                  autoCapitalize='none'
                  autoCorrect={false}
                  onChangeText={setSearchInput}
                  placeholder={activePanel === 'chargers' ? 'Search unique ID' : 'Search charger ID'}
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
        data={isEnergyDiffer ? energyDifferQuery.data?.items || [] : listQuery.data?.items || []}
        keyExtractor={(item, index) => getItemKey(item, index)}
        ListEmptyComponent={
          isEnergyDiffer ? (
            <EnergyDifferState query={energyDifferQuery} vehicle={vehicle} />
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
              onLoadMore={() => setPage(current => current + 1)}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => (isEnergyDiffer ? energyDifferQuery.refetch() : listQuery.refetch())}
            refreshing={(isEnergyDiffer ? energyDifferQuery.isRefetching : listQuery.isRefetching) || false}
            tintColor={Palette.accent}
          />
        }
        renderItem={({ item }) =>
          isEnergyDiffer ? (
            <EnergyDifferCard item={item as EnergyDifferRecord} vehicle={vehicle} />
          ) : (
            <TechnicalListItem item={item} panel={activePanel} vehicle={vehicle} />
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
  bikeQuery,
  carQuery,
  onViewIssues,
}: {
  bikeQuery: { data?: { items: ConnectionLogRecord[] }; error: Error | null; isLoading: boolean; refetch: () => void };
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
        <ReportPanel
          badge={`${totalPercent}% ready`}
          caption={`${total.online.toLocaleString()} online / ${total.boxes.toLocaleString()} chargers`}
          title='Fleet connection'>
          <ThemedView style={styles.reportHeroLine}>
            <ProgressBar color={Palette.accent} percent={totalPercent} />
          </ThemedView>
          <ThemedView flexDirection='row' gap={Spacing.two}>
            <CompactStat label='Online' value={total.online} />
            <CompactStat label='Offline' value={total.offline} />
            <CompactStat label='Total' value={total.boxes} />
          </ThemedView>
          <ThemedView style={styles.reportDivider} />
          <NetworkBreakdownRow accent={Palette.accent} label='Bike' summary={bike} />
          <NetworkBreakdownRow accent='#3867D6' label='Car' summary={car} />
        </ReportPanel>
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
  const primary = items.filter(item => item.is_charging_active).length;
  const backup = items.filter(item => item.working && !item.is_charging_active).length;
  const offline = Math.max(items.length - working, 0);
  const totalSessions = items.reduce((sum, item) => sum + Number(item.total_charging || 0), 0);
  const readiness = items.length ? Math.round((working / items.length) * 100) : 0;
  const sortedItems = items.slice().sort((a, b) => Number(b.total_charging || 0) - Number(a.total_charging || 0));

  return (
    <ThemedView gap={Spacing.three} style={styles.dashboardSection}>
      <SectionTitle subtitle='Domain Analyze is shown directly on Technical.' title='Domain Analyze' />
      {query.isLoading ? (
        <LoadingBlock label='Loading domain analyze' />
      ) : query.error ? (
        <RetryBlock message={query.error.message} onRetry={query.refetch} title='Domain analyze unavailable' />
      ) : (
        <ReportPanel badge={`${readiness}% working`} caption={`${totalSessions.toLocaleString()} active sessions`} title='Domain load balance'>
          <StackedBar
            segments={[
              { color: '#3867D6', flex: primary, label: 'Primary' },
              { color: Palette.accent, flex: backup, label: 'Backup' },
              { color: '#D0D5DD', flex: offline, label: 'Offline' },
            ]}
          />
          <ThemedView flexDirection='row' gap={Spacing.two}>
            <CompactStat label='Working' value={working} />
            <CompactStat label='Primary' value={primary} />
            <CompactStat label='Offline' value={offline} />
          </ThemedView>
          <ThemedView style={styles.reportDivider} />
          <ThemedView gap={Spacing.two}>
            {sortedItems.slice(0, 5).map(item => {
              const share = totalSessions ? Math.round((Number(item.total_charging || 0) / totalSessions) * 100) : 0;
              const color = item.working ? (item.is_charging_active ? '#3867D6' : Palette.accent) : '#A5AFBA';
              return (
                <LoadBreakdownRow
                  color={color}
                  key={item.id}
                  label={item.domain || '-'}
                  percent={share}
                  status={item.working ? (item.is_charging_active ? 'Primary' : 'Backup') : 'Offline'}
                  value={Number(item.total_charging || 0)}
                />
              );
            })}
          </ThemedView>
        </ReportPanel>
      )}
    </ThemedView>
  );
}

function StackedBar({ segments }: { segments: { color: string; flex: number; label: string }[] }) {
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.flex, 0), 0);

  return (
    <ThemedView accessibilityLabel={segments.map(segment => `${segment.label}: ${segment.flex}`).join(', ')} flexDirection='row' style={styles.stackedBar}>
      {segments.map(segment => (
        <ThemedView
          backgroundColor={segment.color}
          flex={total > 0 ? Math.max(segment.flex, 0.001) : 1}
          key={segment.label}
          minWidth={segment.flex > 0 ? 6 : 0}
        />
      ))}
    </ThemedView>
  );
}

function ReportPanel({ badge, caption, children, title }: { badge: string; caption: string; children: ReactNode; title: string }) {
  return (
    <ThemedView style={styles.reportPanel}>
      <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} justifyContent='space-between'>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={19}>
            {title}
          </ThemedText>
          <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
            {caption}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.reportBadge}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            {badge}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      {children}
    </ThemedView>
  );
}

function NetworkBreakdownRow({ accent, label, summary }: { accent: string; label: string; summary: NetworkSummary }) {
  return (
    <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} style={styles.breakdownRow}>
      <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two} style={styles.breakdownName}>
        <ThemedView backgroundColor={accent} style={styles.networkMarker} />
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17}>
          {label}
        </ThemedText>
      </ThemedView>
      <ThemedView flex={1} gap={Spacing.one}>
        <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} lineHeight={14}>
            {summary.online.toLocaleString()} online
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} lineHeight={14}>
            {summary.offline.toLocaleString()} offline
          </ThemedText>
        </ThemedView>
        <ProgressBar color={accent} percent={summary.percent} />
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} style={styles.breakdownPercent}>
        {summary.percent}%
      </ThemedText>
    </ThemedView>
  );
}

function LoadBreakdownRow({ color, label, percent, status, value }: { color: string; label: string; percent: number; status: string; value: number }) {
  return (
    <ThemedView gap={Spacing.one} style={styles.loadRow}>
      <ThemedView alignItems='center' flexDirection='row' gap={Spacing.two}>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17}>
            {label}
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} lineHeight={14}>
            {status}
          </ThemedText>
        </ThemedView>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
          {value.toLocaleString()} / {percent}%
        </ThemedText>
      </ThemedView>
      <ProgressBar color={color} percent={percent} />
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
          <ThemedText color={vehicle === option ? Palette.surfaceBase : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
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
        <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={17} lineHeight={22}>
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
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18}>
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
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
          {item.vendorId || item.uniqueId || `#${item.id || '-'}`}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
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
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
          {title}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
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
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
          {chargerId}
        </ThemedText>
        <ThemedText numberOfLines={1} color={errorCode ? Palette.danger : Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
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
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
          {item.charge_point_id || '-'}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
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
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date);
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
  return getLatestConnectionLogs(items)
    .filter(item => normalizeConnectionStatus(item.onlineStatus) !== 'online')
    .map(item => ({ ...item, vehicle }));
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
  breakdownName: {
    width: 48,
  },
  breakdownPercent: {
    textAlign: 'right',
    width: 38,
  },
  breakdownRow: {
    minHeight: 40,
  },
  content: {
    gap: Spacing.four,
    paddingBottom: 180,
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
  itemCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 76,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
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
  loadRow: {
    backgroundColor: '#FBFCFE',
    borderColor: '#F0F3F7',
    borderRadius: Radius.small,
    borderWidth: 1,
    padding: Spacing.two,
  },
  networkMarker: {
    borderRadius: Radius.pill,
    height: 7,
    width: 7,
  },
  overviewButton: {
    alignItems: 'center',
    backgroundColor: '#E8F7EF',
    borderRadius: Radius.pill,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.72,
  },
  progressTrack: {
    backgroundColor: '#EEF2F6',
    borderRadius: Radius.pill,
    height: 4,
  },
  reportBadge: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#EEF2F6',
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: Spacing.two,
  },
  reportDivider: {
    backgroundColor: '#EEF2F6',
    height: 1,
  },
  reportHeroLine: {
    paddingTop: Spacing.one,
  },
  reportPanel: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: '#E6EAF0',
    borderRadius: Radius.medium,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
    shadowColor: '#0F172A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  searchInput: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    minHeight: 46,
    paddingVertical: 0,
  },
  searchWrap: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    minHeight: 48,
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
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  serviceShortcut: {
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 78,
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
  stackedBar: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    height: 8,
    overflow: 'hidden',
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
  vehicleChip: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  vehicleChipActive: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
});
