import { BadgeDollarSign, Bike, CircleDollarSign, Gauge, MapPinned, ReceiptText, TicketPercent, UsersRound, Zap, type LucideIcon } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { MiniBadge, SectionHeading, SurfaceCard } from './user-profile-common';
import { formatCurrency, formatEnergy, getPaymentSuccessLabel, numberFormatter, profileColors } from './user-profile-helpers';

export function UserProfileOverviewTab({ user }: { user: UserProfile }) {
  const promoAssetCount = (user.promotionCodes?.length || 0) + (user.promotionMoneys?.length || 0) + (user.promotionMoneyHistories?.length || 0);
  const metrics: Metric[] = [
    { Icon: Zap, color: profileColors.info, label: 'Energy delivered', surface: profileColors.infoSurface, value: formatEnergy(user.totalConsumed) },
    {
      Icon: Bike,
      color: profileColors.warning,
      label: 'Charging sessions',
      surface: profileColors.warningSurface,
      value: numberFormatter.format(user.totalCharged || 0),
    },
    {
      Icon: CircleDollarSign,
      color: profileColors.accent,
      label: 'Total top-up',
      surface: profileColors.accentSurface,
      value: formatCurrency(user.totalTopUp),
    },
    {
      Icon: ReceiptText,
      color: profileColors.danger,
      label: 'Charging paid',
      surface: profileColors.dangerSurface,
      value: formatCurrency(user.totalChargedPaid),
    },
    { Icon: BadgeDollarSign, color: '#0E9384', label: 'Payment success', surface: '#F0FDF9', value: getPaymentSuccessLabel(user) },
    {
      Icon: TicketPercent,
      color: profileColors.purple,
      label: 'Promotion assets',
      surface: profileColors.purpleSurface,
      value: numberFormatter.format(promoAssetCount),
    },
    { Icon: Gauge, color: '#475467', label: 'Wallet movements', surface: '#F2F4F7', value: numberFormatter.format(user.balanceHistory?.length || 0) },
    { Icon: MapPinned, color: '#175CD3', label: 'Recent stations', surface: '#EFF8FF', value: numberFormatter.format(user.recentStations?.length || 0) },
  ];

  return (
    <ThemedView backgroundColor='transparent' gap={'six'}>
      <ThemedView backgroundColor='transparent' gap={'three'}>
        <SectionHeading eyebrow='Overview' subtitle='Lifetime activity and account totals for this user.' title='General statistics' />
        <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'three'}>
          {metrics.map(metric => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </ThemedView>
      </ThemedView>

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
              <ThemedView alignItems='center' backgroundColor='#EFF8FF' borderRadius={12} height={40} justifyContent='center' width={40}>
                <MapPinned color='#175CD3' size={18} />
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

type Metric = { Icon: LucideIcon; color: string; label: string; surface: string; value: string };

function MetricCard({ metric: { Icon, color, label, surface, value } }: { metric: Metric }) {
  return (
    <ThemedView
      backgroundColor={Palette.surfaceRaised}
      borderColor={Palette.borderSubtle}
      borderCurve='continuous'
      borderRadius={16}
      borderWidth={1}
      gap={'three'}
      minHeight={96}
      padding={'three'}
      width='48%'>
      <ThemedView alignItems='center' backgroundColor={surface} borderRadius={11} height={32} justifyContent='center' width={32}>
        <Icon color={color} size={17} strokeWidth={2.2} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' gap={1}>
        <ThemedText
          adjustsFontSizeToFit
          color={Palette.textPrimary}
          fontFamily={FontFamily.bold}
          fontSize={15}
          lineHeight={20}
          minimumFontScale={0.72}
          numberOfLines={1}
          selectable>
          {value}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
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
