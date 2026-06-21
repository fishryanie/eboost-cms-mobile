import { Pressable, ActivityIndicator } from 'react-native';
import { ChevronsRight } from 'lucide-react-native';
import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';
import { AppButton, EmptyState } from 'components/ui';
import { styles } from 'components/technical/styles';

export function SectionTitle({ actionLabel, onAction, subtitle, title }: { actionLabel?: string; onAction?: () => void; subtitle: string; title: string }) {
  return (
    <ThemedView gap={'one'} minWidth={0}>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'} justifyContent='space-between'>
        <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.bold} fontSize={12} letterSpacing={1.8} lineHeight={17} textTransform='uppercase'>
          {title}
        </ThemedText>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole='button' onPress={onAction} style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
              {actionLabel}
            </ThemedText>
            <ChevronsRight color={Palette.accent} size={16} strokeWidth={2} />
          </Pressable>
        ) : null}
      </ThemedView>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} marginTop={2}>
        {subtitle}
      </ThemedText>
    </ThemedView>
  );
}

export function CompactStat({ label, value }: { label: string; value: number }) {
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

export function ProgressBar({ color, percent }: { color: string; percent: number }) {
  return (
    <ThemedView overflow='hidden' style={styles.progressTrack}>
      <ThemedView backgroundColor={color} height='100%' width={`${Math.max(2, Math.min(percent, 100))}%`} />
    </ThemedView>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <ThemedView alignItems='center' gap={'three'} paddingTop={'five'}>
      <ActivityIndicator color={Palette.accent} />
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

export function RetryBlock({ message, onRetry, title }: { message: string; onRetry: () => void; title: string }) {
  return (
    <ThemedView gap={'four'} paddingTop={'two'}>
      <EmptyState message={message} title={title} />
      <AppButton label='Retry' onPress={onRetry} />
    </ThemedView>
  );
}

export function ListState({ error, isLoading, onRetry, title }: { error: Error | null; isLoading: boolean; onRetry: () => void; title: string }) {
  if (isLoading) return <LoadingBlock label={`Loading ${title.toLowerCase()}...`} />;
  if (error) return <RetryBlock message={error.message} onRetry={onRetry} title={`Unable to load ${title.toLowerCase()}`} />;
  return null;
}

export function ListFooter({
  canLoadMore,
  isFetching,
  onLoadMore,
  page,
  total }: {
  canLoadMore: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  page: number;
  total: number;
}) {
  return (
    <ThemedView alignItems='center' gap={'two'} paddingVertical={'four'}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16}>
        Page {page} • {total.toLocaleString()} total
      </ThemedText>
      {canLoadMore ? <AppButton label={isFetching ? 'Loading...' : 'Next page'} loading={isFetching} onPress={onLoadMore} /> : null}
    </ThemedView>
  );
}

export function formatNumber(value?: number) {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 3 });
}

export function getItemKey(item: unknown, index: number) {
  const record = item as Record<string, unknown>;
  return String(record.id || record.uniqueId || record.vendorId || record.chargePointID || record.uniqueID || `${index}`);
}

export function normalizeConnectionStatus(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'online' || normalized === 'on') return 'online';
  return 'offline';
}

export function getLatestConnectionLogs(items: ConnectionLogRecord[]) {
  return Array.from(
    new Map(
      items
        .filter(item => item.chargePointID)
        .sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime())
        .map(item => [item.chargePointID, item]),
    ).values(),
  );
}

export type NetworkSummary = {
  boxes: number;
  logs: number;
  offline: number;
  online: number;
  percent: number;
};

export function getNetworkSummary(items: ConnectionLogRecord[]): NetworkSummary {
  const latest = getLatestConnectionLogs(items);
  const online = latest.filter(item => normalizeConnectionStatus(item.onlineStatus) === 'online').length;
  const offline = latest.length - online;

  return {
    boxes: latest.length,
    logs: items.length,
    offline,
    online,
    percent: latest.length ? Math.round((online / latest.length) * 100) : 0 };
}

export function getNetworkIssues(items: ConnectionLogRecord[], vehicle: TechnicalVehicle): (ConnectionLogRecord & { vehicle: TechnicalVehicle })[] {
  return getLatestConnectionLogs(items).reduce<(ConnectionLogRecord & { vehicle: TechnicalVehicle })[]>((issues, item) => {
    if (normalizeConnectionStatus(item.onlineStatus) !== 'online') {
      issues.push({ ...item, vehicle });
    }
    return issues;
  }, []);
}

export function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
