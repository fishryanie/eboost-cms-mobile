import {
  BadgePercent,
  BadgePlus,
  Bike,
  CreditCard,
  Gift,
  MapPinned,
  ReceiptText,
  TicketPercent,
  UsersRound,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { MiniBadge, SectionHeading, SurfaceCard } from './user-profile-common';
import { UserProfileActivityChart } from './user-profile-activity-chart';
import { formatCurrency, getPaymentSuccessLabel, numberFormatter, profileColors } from './user-profile-helpers';

export function UserProfileOverviewTab({ user }: { user: UserProfile }) {
  const promoAssetCount = (user.promotionCodes?.length || 0) + (user.promotionMoneys?.length || 0) + (user.promotionCodeOneTimeList?.length || 0);
  const purchasedPackageWh = (user.subscriptionHistories || []).reduce((sum, item) => sum + normalizePositiveWattage(item.wattage_consumed), 0);
  const activeQuotaCodes = (user.promotionCodes || []).filter(
    code => normalizePositiveWattage(code.total_wattage_consumed_usage) > 0 && isUnexpiredQuotaCode(code.expired_at),
  );
  const activeQuotaCodeSet = new Set(activeQuotaCodes.flatMap(code => (code.code ? [code.code] : [])));
  const activeQuotaRemainingWh = activeQuotaCodes.reduce((sum, item) => sum + normalizePositiveWattage(item.total_wattage_consumed_usage), 0);
  const activeQuotaUsedWh = (user.promotionCodeHistories || [])
    .filter(item => item.code && activeQuotaCodeSet.has(item.code))
    .reduce((sum, item) => sum + normalizePositiveWattage(item.wattageConsumedPromotionUsage), 0);
  const metrics: Metric[] = [
    { Icon: Zap, label: 'Energy', value: formatDeliveredEnergy(user.totalConsumed) },
    {
      Icon: ReceiptText,
      label: 'Orders',
      value: numberFormatter.format(user.totalCharged || 0),
    },
    {
      Icon: CreditCard,
      label: 'Top-up',
      value: formatCurrency(user.totalTopUp),
    },
    {
      Icon: TicketPercent,
      label: 'Promo inventory',
      value: numberFormatter.format(promoAssetCount),
    },
    {
      Icon: BadgePercent,
      label: 'Paid bills',
      value: formatCurrency(user.totalChargedPaid),
    },
    { Icon: Gift, label: 'Payment success', value: getPaymentSuccessLabel(user) },
    {
      Icon: Wallet,
      label: 'Purchased kWh',
      value: formatEnergyKwh(purchasedPackageWh),
    },
    {
      Icon: BadgePlus,
      label: 'Available kWh',
      value: formatEnergyKwh(activeQuotaRemainingWh),
    },
    {
      Icon: TicketPercent,
      label: 'Used kWh',
      value: formatEnergyKwh(activeQuotaUsedWh),
    },
  ];

  return (
    <ThemedView backgroundColor='transparent' gap={'six'}>
      <ThemedView backgroundColor='transparent' gap={'three'}>
        <SectionHeading eyebrow='Overview' subtitle='Lifetime activity and account totals for this user.' title='General statistics' />
        <MetricGrid metrics={metrics} />
      </ThemedView>

      <UserProfileActivityChart userId={user.id} />

      <ThemedView backgroundColor='transparent' gap={'three'}>
        <SectionHeading eyebrow='Footprint' subtitle='Account relationships and the stations used most recently.' title='User footprint' />
        <SurfaceCard>
          <ThemedView backgroundColor='transparent' gap={'three'}>
            <FootprintRow Icon={Bike} label='Vehicles' value={user.userVehicles?.length || 0} />
            <Divider />
            <FootprintRow Icon={UsersRound} label='Notification groups' value={user.groups?.length || 0} />
            <Divider />
            <FootprintRow Icon={UsersRound} label='Referred users' value={user.referralUsers?.length || 0} />
            <Divider />
            <FootprintRow Icon={MapPinned} label='Recent stations' value={user.recentStations?.length || 0} />
          </ThemedView>
        </SurfaceCard>
        {user.recentStations?.map(station => (
          <SurfaceCard key={station.id}>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
              <ThemedView alignItems='center' backgroundColor='#EAF3EE' borderRadius={10} height={36} justifyContent='center' width={36}>
                <MapPinned color={Palette.accent} size={17} />
              </ThemedView>
              <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={2} selectable>
                  {station.name || station.name_vn || `Station #${station.id}`}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10}>
                  {numberFormatter.format(station.usageCount || 0)} charging uses
                </ThemedText>
              </ThemedView>
              <MiniBadge color={Palette.accent} label={`#${station.id}`} surface={profileColors.accentSurface} />
            </ThemedView>
          </SurfaceCard>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

type Metric = { Icon: LucideIcon; label: string; value: string };

const energyKwhFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

function normalizePositiveWattage(value?: number | null) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}

function formatEnergyKwh(value?: number | null) {
  const wattage = normalizePositiveWattage(value);
  return `${energyKwhFormatter.format(Number((wattage / 1000).toFixed(2)))} kWh`;
}

function formatDeliveredEnergy(value?: number | null) {
  return `${numberFormatter.format(Math.round(normalizePositiveWattage(value) / 1000))} kWh`;
}

function isUnexpiredQuotaCode(expiredAt?: string | null) {
  if (!expiredAt) return true;
  const expiresAt = new Date(expiredAt.replace(' ', 'T')).getTime();
  return Number.isNaN(expiresAt) || expiresAt > Date.now();
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  const rows = Array.from({ length: Math.ceil(metrics.length / 3) }, (_, index) => metrics.slice(index * 3, index * 3 + 3));

  return (
    <SurfaceCard>
      <ThemedView backgroundColor='transparent'>
        {rows.map((row, rowIndex) => (
          <ThemedView backgroundColor='transparent' key={row.map(metric => metric.label).join('-')}>
            {rowIndex > 0 ? <ThemedView backgroundColor={Palette.borderSubtle} height={1} /> : null}
            <ThemedView backgroundColor='transparent' flexDirection='row' paddingVertical={'two'}>
              {row.map((metric, columnIndex) => (
                <ThemedView backgroundColor='transparent' flex={1} flexDirection='row' key={metric.label} minWidth={0}>
                  {columnIndex > 0 ? <ThemedView backgroundColor={Palette.borderSubtle} marginHorizontal={'two'} width={1} /> : null}
                  <MetricCell metric={metric} />
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
    </SurfaceCard>
  );
}

function MetricCell({ metric: { Icon, label, value } }: { metric: Metric }) {
  return (
    <ThemedView backgroundColor='transparent' flex={1} gap={'two'} minHeight={76} minWidth={0} paddingHorizontal={'one'}>
      <ThemedView alignItems='center' backgroundColor='#EAF3EE' borderRadius={9} height={30} justifyContent='center' width={30}>
        <Icon color={Palette.accent} size={15} strokeWidth={2.1} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' gap={1}>
        <ThemedText
          adjustsFontSizeToFit
          color={Palette.textPrimary}
          fontFamily={FontFamily.bold}
          fontSize={13}
          lineHeight={18}
          minimumFontScale={0.65}
          numberOfLines={1}
          selectable>
          {value}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12} numberOfLines={2}>
          {label}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function FootprintRow({ Icon, label, value }: { Icon: LucideIcon; label: string; value: number }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'} minHeight={38}>
      <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={10} height={32} justifyContent='center' width={32}>
        <Icon color={Palette.textSecondary} size={16} />
      </ThemedView>
      <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.medium} fontSize={12}>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} selectable>
        {numberFormatter.format(value)}
      </ThemedText>
    </ThemedView>
  );
}

function Divider() {
  return <ThemedView backgroundColor={Palette.borderSubtle} height={1} />;
}
