import { Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { SectionTitle, CompactStat, ProgressBar, LoadingBlock, RetryBlock, getNetworkSummary, NetworkSummary } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';

const networkDangerTextColor = '#B42318';
const networkSuccessTextColor = Palette.accentPressed;

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

export function CircularProgress({ color, percent }: { color: string; percent: number }) {
  const size = 64;
  const strokeWidth = 7;
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
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={16} style={styles.connectorTotal}>
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

export function StatusMetadataLine({ segments }: { segments: BoxStatusSegment[] }) {
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

export function VehicleNetworkLane({
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
    return <ThemedView accessibilityLabel={`Loading ${title.toLowerCase()}`} borderRadius={'medium'} height={42} loading style={styles.connectorStrip} />;
  }

  if (query.error) {
    return (
      <ThemedView alignItems='center' flexDirection='row' gap={'two'} style={[styles.connectorStrip, styles.connectorPanelWarning]}>
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
  const visibleItems = getBoxStatusItems(status as any, meta).filter(
    item => item.value > 0 || (vehicle === 'car' && (item.key === 'Unavailable' || item.key === 'Faulted')),
  );
  const assetNoun = vehicle === 'bike' ? 'outlets' : 'connectors';
  const assetSegments: BoxStatusSegment[] = [{ label: `${assetNoun[0].toUpperCase()}${assetNoun.slice(1)}`, value: total }];
  visibleItems.forEach(item => {
    assetSegments.push({ label: item.label, value: item.value });
  });

  return (
    <ThemedView gap={'two'} style={[styles.vehicleNetworkLane, isFirst && styles.vehicleNetworkLaneFirst]}>
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

export function NetworkStatusSection({
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
    <ThemedView gap={'three'} style={styles.dashboardSection}>
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
        <ThemedView gap={'two'} style={styles.networkFlatBlock}>
          <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
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
          <ThemedView flexDirection='row' gap={'two'}>
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
