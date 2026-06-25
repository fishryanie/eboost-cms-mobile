import { ThemedText, ThemedView } from 'components/base';
import { useRouter } from 'expo-router';
import { ChevronsRight } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { mhs } from 'themes/scaling';

import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import { type ShareMetric, type SubscriptionPackageRow, type SubscriptionStatsSummary } from 'utils/marketing';

const screenHorizontalPadding = 16;
const chartColors = ['#6F8EF6', '#5567F0', '#3843A7', '#141C3A', '#9AA7BD', '#D9DEE7', '#2F9E7F', '#F59E0B'];
const currencyFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const kwFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

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
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  serviceIconSurface: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: mhs(16),
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  serviceRow: {
    width: '100%',
  },
  serviceShortcut: {
    alignItems: 'center',
    gap: mhs(6),
    minHeight: 88,
    justifyContent: 'flex-start',
    paddingHorizontal: mhs(4),
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

export function SubscriptionStatsCard({
  isFetching,
  isLoading,
  monthRange,
  onMetricChange,
  onRefresh,
  shareMetric,
  summary,
  width,
}: {
  isFetching: boolean;
  isLoading: boolean;
  monthRange: { end: string; start: string };
  onMetricChange: (metric: ShareMetric) => void;
  onRefresh: () => void;
  shareMetric: ShareMetric;
  summary: SubscriptionStatsSummary;
  width: number;
}) {
  const router = useRouter();
  const hasRows = summary.rows.length > 0;
  const usedPercent = summary.kwSummary.purchasedKw > 0 ? Math.min(100, Math.round((summary.kwSummary.usedKw / summary.kwSummary.purchasedKw) * 100)) : 0;
  const chartSize = Math.min(172, width - screenHorizontalPadding * 2 - mhs(16) * 2);

  return (
    <ThemedView gap={'three'}>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
        <ThemedView flex={1} minWidth={0}>
          <SectionTitle title='Package Stats' subtitle={`Range: ${monthRange.start} - ${monthRange.end}`} />
        </ThemedView>
        <Pressable
          accessibilityLabel='View subscription packages'
          accessibilityRole='button'
          disabled={summary.rows.length === 0}
          onPress={() =>
            router.push({
              pathname: '/marketing/package-list',
              params: { metric: shareMetric },
            } as never)
          }
          style={({ pressed }) => [styles.textButton, { flexDirection: 'row', alignItems: 'center', gap: mhs(2) }, pressed && styles.pressed]}>
          <ThemedText color={summary.rows.length ? Palette.accent : Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={13} lineHeight={18}>
            View package
          </ThemedText>
          <ChevronsRight color={summary.rows.length ? Palette.accent : Palette.textTertiary} size={16} strokeWidth={2.5} />
        </Pressable>
      </ThemedView>

      <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={mhs(24)} gap={'four'} padding={mhs(20)}>
        {isLoading && !hasRows ? (
          <LoadingBlock label='Loading subscription stats' />
        ) : !hasRows ? (
          <EmptyState message='No subscription history was returned for this month.' title='No package stats' />
        ) : (
          <>
            <ThemedView alignItems='center' flexDirection='row' gap={'five'}>
              <SubscriptionDonut
                rows={summary.rows}
                shareMetric={shareMetric}
                size={120}
                totalPurchases={summary.totalPurchases}
                totalRevenue={summary.totalRevenue}
              />
              <ThemedView flex={1} gap={'two'}>
                <ThemedView flexDirection='row' alignItems='center' justifyContent='space-between'>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} textTransform='uppercase'>
                    Revenue
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13}>
                    {formatCompactCurrency(summary.totalRevenue)}
                  </ThemedText>
                </ThemedView>
                <ThemedView flexDirection='row' alignItems='center' justifyContent='space-between'>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} textTransform='uppercase'>
                    Purchases
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13}>
                    {formatNumber(summary.totalPurchases)}
                  </ThemedText>
                </ThemedView>
                <ThemedView flexDirection='row' alignItems='center' justifyContent='space-between'>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} textTransform='uppercase'>
                    Packages
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13}>
                    {formatNumber(summary.totalSoldPackages)}
                  </ThemedText>
                </ThemedView>
                <ThemedView flexDirection='row' alignItems='center' justifyContent='space-between'>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} textTransform='uppercase'>
                    Buyers
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13}>
                    {formatNumber(summary.totalUniqueBuyers)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <VehicleSplitSection summary={summary} />
            <EnergySection percent={usedPercent} summary={summary} />
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

export function SubscriptionDonut({
  rows,
  shareMetric,
  size,
  totalPurchases,
  totalRevenue,
}: {
  rows: SubscriptionPackageRow[];
  shareMetric: ShareMetric;
  size: number;
  totalPurchases: number;
  totalRevenue: number;
}) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = shareMetric === 'revenue' ? totalRevenue : totalPurchases;
  let accumulated = 0;

  return (
    <ThemedView alignItems='center' justifyContent='center' style={{ height: size, width: size }}>
      <Svg height={size} width={size}>
        <Circle cx={center} cy={center} fill='transparent' r={radius} stroke='#EEF2F7' strokeWidth={strokeWidth} />
        {rows.slice(0, 8).map((row, index) => {
          const value = shareMetric === 'revenue' ? row.revenue : row.count;
          const percent = total > 0 ? value / total : 0;
          const dash = percent * circumference;
          const rotation = (accumulated / circumference) * 360 - 90;
          accumulated += dash;

          return (
            <Circle
              cx={center}
              cy={center}
              fill='transparent'
              key={row.id}
              r={radius}
              stroke={chartColors[index % chartColors.length]}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap='round'
              strokeWidth={strokeWidth}
              transform={`rotate(${rotation} ${center} ${center})`}
            />
          );
        })}
      </Svg>
      <ThemedView alignItems='center' justifyContent='center' pointerEvents='none' style={StyleSheet.absoluteFill}>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} textTransform='uppercase'>
          {shareMetric === 'revenue' ? 'Revenue' : 'Purchases'}
        </ThemedText>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={23} selectable>
          {shareMetric === 'revenue' ? formatCompactCurrency(totalRevenue) : formatNumber(totalPurchases)}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView flex={1} gap={'one'} style={styles.summaryStat}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} lineHeight={14} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={23} numberOfLines={1} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

export function VehicleSplitSection({ summary }: { summary: SubscriptionStatsSummary }) {
  const bikePercent = summary.totalRevenue > 0 ? (summary.bikeStats.revenue / summary.totalRevenue) * 100 : 0;
  const carPercent = summary.totalRevenue > 0 ? (summary.carStats.revenue / summary.totalRevenue) * 100 : 0;

  return (
    <ThemedView gap={'three'} marginTop={mhs(8)}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16} textTransform='uppercase'>
        Vehicle split
      </ThemedText>
      <SplitBar color='#5567F0' label='Bike revenue' percent={bikePercent} value={formatCompactCurrency(summary.bikeStats.revenue)} />
      <SplitBar color='#9AA7BD' label='Car revenue' percent={carPercent} value={formatCompactCurrency(summary.carStats.revenue)} />
      <ThemedView flexDirection='row' gap={'two'}>
        <MiniTableCell label='Bike Purch' value={formatNumber(summary.bikeStats.purchases)} />
        <MiniTableCell label='Bike PKG' value={formatNumber(summary.bikeStats.packages)} />
        <MiniTableCell label='Car Purch' value={formatNumber(summary.carStats.purchases)} />
        <MiniTableCell label='Car PKG' value={formatNumber(summary.carStats.packages)} />
      </ThemedView>
    </ThemedView>
  );
}

export function EnergySection({ percent, summary }: { percent: number; summary: SubscriptionStatsSummary }) {
  return (
    <ThemedView gap={'three'} marginTop={mhs(8)}>
      <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16} textTransform='uppercase'>
          Energy usage
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
          {percent}% used
        </ThemedText>
      </ThemedView>
      <ProgressBar color={Palette.accent} percent={percent} />
      <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
        <EnergyValue label='Valid' value={formatKw(summary.kwSummary.remainingValidKw)} />
        <EnergyValue label='Expired' value={formatKw(summary.kwSummary.remainingExpiredKw)} />
        <EnergyValue label='Purchased' value={formatKw(summary.kwSummary.purchasedKw)} />
        <EnergyValue label='Used' value={formatKw(summary.kwSummary.usedKw)} />
      </ThemedView>
    </ThemedView>
  );
}

export function PackageRow({ color, row }: { color: string; row: SubscriptionPackageRow }) {
  return (
    <ThemedView alignItems='center' flexDirection='row' gap={'two'} style={styles.packageRow}>
      <ThemedView style={[styles.packageDot, { backgroundColor: color }]} />
      <ThemedView flex={1} minWidth={0}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={2}>
          {row.name}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1}>
          {(row.vehicleType || 'Other').toUpperCase()} Discount: {row.discount ?? '-'}% Price: {formatCurrency(row.price)}
        </ThemedText>
      </ThemedView>
      <ThemedView alignItems='flex-end' gap={2}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18} selectable>
          {formatCompactCurrency(row.revenue)}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
          {formatNumber(row.count)} qty · {row.share.toFixed(0)}%
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export function SectionTitle({ subtitle, title }: { subtitle?: string; title: string }) {
  return (
    <ThemedView minWidth={0}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={12} letterSpacing={1.8} lineHeight={17} textTransform='uppercase'>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} marginTop={2}>
          {subtitle}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

export function SplitBar({ color, label, percent, value }: { color: string; label: string; percent: number; value: string }) {
  return (
    <ThemedView gap={'one'}>
      <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
          {label}
        </ThemedText>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18} selectable>
          {value}
        </ThemedText>
      </ThemedView>
      <ProgressBar color={color} percent={percent} />
    </ThemedView>
  );
}

export function ProgressBar({ color, percent }: { color: string; percent: number }) {
  return (
    <ThemedView style={styles.progressTrack}>
      <ThemedView style={[styles.progressFill, { backgroundColor: color, width: `${Math.min(100, Math.max(0, percent))}%` }]} />
    </ThemedView>
  );
}

export function MiniTableCell({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView flex={1} gap={2}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={9} lineHeight={13} numberOfLines={1} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

export function EnergyValue({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.energyValue}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} lineHeight={14} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <ThemedView alignItems='center' gap={'three'} paddingVertical={'five'}>
      <ThemedView alignItems='center' flexDirection='row' gap='four'>
        <ThemedView borderRadius={'pill'} height={100} loading width={100} />
        <ThemedView gap='three'>
          <ThemedView borderRadius={'pill'} height={16} loading width={120} />
          <ThemedView borderRadius={'pill'} height={16} loading width={90} />
          <ThemedView borderRadius={'pill'} height={16} loading width={110} />
        </ThemedView>
      </ThemedView>
      <ThemedView accessibilityLabel={label} borderRadius={'pill'} height={24} loading marginTop={12} width='80%' />
    </ThemedView>
  );
}

export function formatCurrency(value: number) {
  return `${currencyFormatter.format(value)} đ`;
}

export function formatCompactCurrency(value: number) {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1).replace(/\.0$/, '')}B đ`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M đ`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K đ`;
  }
  return `${currencyFormatter.format(value)} đ`;
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatKw(value: number) {
  return `${kwFormatter.format(value)} kW`;
}

export function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
