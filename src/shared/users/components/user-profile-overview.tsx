import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AtSign,
  BadgeDollarSign,
  BatteryCharging,
  Bike,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  IdCard,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  UserRound,
  WalletCards,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Switch } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { ImagePreviewModal } from 'components/media/image-preview-modal';
import { FontFamily, Palette } from 'themes';
import { getDisplayImageUrl } from 'utils/media/image-url';

import {
  formatCurrency,
  formatDate,
  formatEnergy,
  formatPhone,
  getAvatarUrl,
  getDisplayName,
  getInitials,
  getPaymentSuccessLabel,
  getProviderLabel,
  numberFormatter,
  profileColors,
} from './user-profile-helpers';
import { CopyButton, MiniBadge, ProfileRecordList, RecordDetails, SectionHeading, SurfaceCard } from './user-profile-common';

export function UserProfileOverview({ user }: { user: UserProfile }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'six'}>
      <PersonalProfileCard user={user} />
      <MetricsGrid user={user} />
      <AccountControls user={user} />
      <IdentityDetails user={user} />
      <StationFootprint stations={user.recentStations || []} />
      <ThemedView backgroundColor='transparent' gap={'three'}>
        <SectionHeading
          count={user.userVehicles?.length || 0}
          eyebrow='Assets'
          subtitle='Every vehicle object returned by the user profile endpoint.'
          title='Vehicle types'
        />
        <ProfileRecordList emptyMessage='No vehicle is linked to this account.' emptyTitle='No registered vehicles' records={user.userVehicles} />
      </ThemedView>
      <UserLevelDetails user={user} />
    </ThemedView>
  );
}

function PersonalProfileCard({ user }: { user: UserProfile }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);
  const levelColor = user.userLevel?.backgroundColor || Palette.accent;
  const levelImageUrl = getDisplayImageUrl(user.userLevel?.image?.url);

  return (
    <>
      <SurfaceCard>
        <ThemedView gap={'four'}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} letterSpacing={1.2} textTransform='uppercase'>
              Personal profile
            </ThemedText>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
              <CalendarDays color={Palette.textTertiary} size={12} />
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} selectable>
                Joined {formatDate(user.createdAt, true)}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
            <Pressable
              accessibilityLabel={avatarUrl ? `Open avatar for ${displayName}` : undefined}
              accessibilityRole={avatarUrl ? 'button' : undefined}
              disabled={!avatarUrl}
              onPress={() => setPreviewOpen(true)}>
              {({ pressed }) => (
                <ThemedView
                  alignItems='center'
                  backgroundColor='#EAF3EF'
                  borderColor='#D3E4DC'
                  borderRadius={'pill'}
                  borderWidth={2}
                  height={72}
                  justifyContent='center'
                  opacity={pressed ? 0.72 : 1}
                  overflow='hidden'
                  width={72}>
                  {avatarUrl ? (
                    <Image accessibilityLabel={`${displayName} avatar`} contentFit='cover' source={{ uri: avatarUrl }} style={{ height: 72, width: 72 }} />
                  ) : (
                    <ThemedText color='#446052' fontFamily={FontFamily.bold} fontSize={22}>
                      {getInitials(user)}
                    </ThemedText>
                  )}
                </ThemedView>
              )}
            </Pressable>

            <ThemedView backgroundColor='transparent' flex={1} gap={'two'} minWidth={0}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={23} numberOfLines={2} selectable>
                {displayName}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} selectable>
                #{user.id} · {getProviderLabel(user.username)}
              </ThemedText>
              <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'one'}>
                <MiniBadge
                  color={user.enabled === false ? profileColors.danger : profileColors.accent}
                  label={user.enabled === false ? 'Disabled' : 'Active'}
                  surface={user.enabled === false ? profileColors.dangerSurface : profileColors.accentSurface}
                />
                {user.userLevel?.name ? (
                  <ThemedView
                    alignItems='center'
                    backgroundColor={levelColor}
                    borderRadius={'pill'}
                    flexDirection='row'
                    gap={4}
                    paddingHorizontal={'two'}
                    paddingVertical={4}>
                    {levelImageUrl ? (
                      <Image contentFit='contain' source={{ uri: levelImageUrl }} style={{ height: 13, width: 13 }} />
                    ) : (
                      <Sparkles color='#FFFFFF' size={11} />
                    )}
                    <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={10} textTransform='uppercase'>
                      {user.userLevel.name}
                    </ThemedText>
                  </ThemedView>
                ) : null}
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={14} overflow='hidden'>
            <CompactContact Icon={Phone} copyLabel='Phone number' copyValue={user.phoneNumber} label='Phone' value={formatPhone(user.phoneNumber)} />
            <CompactContact Icon={Mail} copyLabel='Email address' copyValue={user.email} isLast label='Email' value={user.email || 'Not available'} />
          </ThemedView>

          <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={'two'}>
            <MapPin color={Palette.textTertiary} size={15} />
            <ThemedText color={Palette.textSecondary} flex={1} fontFamily={FontFamily.medium} fontSize={12} lineHeight={18} selectable>
              {user.address || 'No address provided'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </SurfaceCard>
      <ImagePreviewModal imageUrl={avatarUrl} onClose={() => setPreviewOpen(false)} title={displayName} visible={previewOpen} />
    </>
  );
}

function CompactContact({
  Icon,
  copyLabel,
  copyValue,
  isLast,
  label,
  value,
}: {
  Icon: LucideIcon;
  copyLabel: string;
  copyValue?: string | null;
  isLast?: boolean;
  label: string;
  value: string;
}) {
  return (
    <ThemedView
      alignItems='center'
      borderBottomColor={isLast ? 'transparent' : Palette.borderSubtle}
      borderBottomWidth={isLast ? 0 : 1}
      flexDirection='row'
      gap={'two'}
      minHeight={48}
      paddingHorizontal={'three'}>
      <Icon color={Palette.textTertiary} size={15} />
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={10} width={44}>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17} numberOfLines={2} selectable>
        {value}
      </ThemedText>
      <CopyButton label={copyLabel} value={copyValue} />
    </ThemedView>
  );
}

function MetricsGrid({ user }: { user: UserProfile }) {
  const promoAssetCount = (user.promotionCodes?.length || 0) + (user.promotionMoneys?.length || 0) + (user.promotionMoneyHistories?.length || 0);
  const metrics: { Icon: LucideIcon; color: string; label: string; surface: string; value: string }[] = [
    { Icon: WalletCards, color: profileColors.accent, label: 'Balance', surface: profileColors.accentSurface, value: formatCurrency(user.balance) },
    { Icon: Zap, color: profileColors.info, label: 'Energy', surface: profileColors.infoSurface, value: formatEnergy(user.totalConsumed) },
    {
      Icon: Bike,
      color: profileColors.warning,
      label: 'Sessions',
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
    { Icon: ReceiptText, color: profileColors.danger, label: 'Paid bills', surface: profileColors.dangerSurface, value: formatCurrency(user.totalChargedPaid) },
    {
      Icon: TicketPercent,
      color: profileColors.purple,
      label: 'Promo assets',
      surface: profileColors.purpleSurface,
      value: numberFormatter.format(promoAssetCount),
    },
    { Icon: BadgeDollarSign, color: '#0E9384', label: 'Payment success', surface: '#F0FDF9', value: getPaymentSuccessLabel(user) },
    { Icon: Gauge, color: '#475467', label: 'Wallet movements', surface: '#F2F4F7', value: numberFormatter.format(user.balanceHistory?.length || 0) },
  ];

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading eyebrow='Overview' subtitle='Lifetime account metrics from the profile response.' title='Account summary' />
      <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'three'}>
        {metrics.map(metric => (
          <MetricCard {...metric} key={metric.label} />
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function MetricCard({ Icon, color, label, surface, value }: { Icon: LucideIcon; color: string; label: string; surface: string; value: string }) {
  return (
    <ThemedView
      backgroundColor={Palette.surfaceRaised}
      borderColor={Palette.borderSubtle}
      borderCurve='continuous'
      borderRadius={16}
      borderWidth={1}
      gap={'three'}
      minHeight={94}
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
          minimumFontScale={0.75}
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

function AccountControls({ user }: { user: UserProfile }) {
  const controls = [
    { Icon: BatteryCharging, label: 'Auto charge', value: Boolean(user.autoCharge) },
    { Icon: TicketPercent, label: 'Auto apply discount', value: Boolean(user.autoApplyPromotionCode) },
    { Icon: CheckCircle2, label: 'Account enabled', value: user.enabled !== false },
    { Icon: Mail, label: 'Email verified', value: Boolean(user.activatedMail) },
    { Icon: Phone, label: 'Phone verified', value: Boolean(user.isPhoneVerified) },
    { Icon: ShieldCheck, label: 'Citizen verified', value: Boolean(user.isCitizenVerified) },
    { Icon: UserRound, label: 'New account', value: Boolean(user.isNew) },
  ];

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading eyebrow='Controls' subtitle='Read-only state returned for this account.' title='Account controls' />
      <SurfaceCard>
        <ThemedView backgroundColor='transparent'>
          {controls.map((control, index) => (
            <ControlRow {...control} isLast={index === controls.length - 1} key={control.label} />
          ))}
        </ThemedView>
      </SurfaceCard>
    </ThemedView>
  );
}

function ControlRow({ Icon, isLast, label, value }: { Icon: LucideIcon; isLast: boolean; label: string; value: boolean }) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor='transparent'
      borderBottomColor={isLast ? 'transparent' : Palette.borderSubtle}
      borderBottomWidth={isLast ? 0 : 1}
      flexDirection='row'
      gap={'three'}
      minHeight={52}>
      <ThemedView
        alignItems='center'
        backgroundColor={value ? profileColors.accentSurface : Palette.surfaceMuted}
        borderRadius={10}
        height={32}
        justifyContent='center'
        width={32}>
        <Icon color={value ? Palette.accent : Palette.textTertiary} size={16} />
      </ThemedView>
      <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.medium} fontSize={13}>
        {label}
      </ThemedText>
      <ThemedView pointerEvents='none' backgroundColor='transparent'>
        <Switch
          accessibilityLabel={`${label}: ${value ? 'On' : 'Off'}`}
          ios_backgroundColor='#D0D5DD'
          style={{ transform: [{ scale: 0.78 }] }}
          thumbColor='#FFFFFF'
          trackColor={{ false: '#D0D5DD', true: Palette.accent }}
          value={value}
        />
      </ThemedView>
    </ThemedView>
  );
}

function IdentityDetails({ user }: { user: UserProfile }) {
  const rows: { Icon: LucideIcon; copyLabel?: string; copyValue?: string | null; label: string; value: string }[] = [
    { Icon: UserRound, label: 'Name', value: user.name || 'Not available' },
    { Icon: IdCard, copyLabel: 'User ID', copyValue: String(user.id), label: 'User ID', value: String(user.id) },
    { Icon: AtSign, copyLabel: 'Username', copyValue: user.username, label: 'Username', value: user.username || 'Not available' },
    { Icon: IdCard, copyLabel: 'User identifier', copyValue: user.userIdentifier, label: 'User identifier', value: user.userIdentifier || 'Not available' },
    { Icon: Mail, copyLabel: 'Email', copyValue: user.email, label: 'Email', value: user.email || 'Not available' },
    { Icon: Phone, copyLabel: 'Phone number', copyValue: user.phoneNumber, label: 'Phone', value: formatPhone(user.phoneNumber) },
    { Icon: CalendarDays, label: 'Date of birth', value: formatDate(user.dateOfBirth, true) },
    {
      Icon: ShieldCheck,
      copyLabel: 'Citizen identification',
      copyValue: user.citizenIdentification,
      label: 'Citizen ID',
      value: user.citizenIdentification || 'Not available',
    },
    { Icon: MapPin, copyLabel: 'Address', copyValue: user.address, label: 'Address', value: user.address || 'Not available' },
    { Icon: CalendarDays, label: 'Created at', value: formatDate(user.createdAt) },
    { Icon: CalendarDays, label: 'Deleted at', value: formatDate(user.deletedAt) },
    { Icon: UserRound, copyLabel: 'Avatar URL', copyValue: user.avatarUrl, label: 'Avatar URL', value: user.avatarUrl || 'Not available' },
  ];

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading eyebrow='Identity' subtitle='Complete scalar identity data from the API payload.' title='Account details' />
      <SurfaceCard>
        <ThemedView backgroundColor='transparent'>
          {rows.map((row, index) => (
            <IdentityRow {...row} isLast={index === rows.length - 1} key={row.label} />
          ))}
        </ThemedView>
      </SurfaceCard>
    </ThemedView>
  );
}

function IdentityRow({
  Icon,
  copyLabel,
  copyValue,
  isLast,
  label,
  value,
}: {
  Icon: LucideIcon;
  copyLabel?: string;
  copyValue?: string | null;
  isLast: boolean;
  label: string;
  value: string;
}) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor='transparent'
      borderBottomColor={isLast ? 'transparent' : Palette.borderSubtle}
      borderBottomWidth={isLast ? 0 : 1}
      flexDirection='row'
      gap={'three'}
      minHeight={58}
      paddingVertical={'two'}>
      <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={10} height={32} justifyContent='center' width={32}>
        <Icon color={Palette.textSecondary} size={15} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={9} letterSpacing={0.7} textTransform='uppercase'>
          {label}
        </ThemedText>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={18} selectable>
          {value}
        </ThemedText>
      </ThemedView>
      {copyLabel ? <CopyButton label={copyLabel} value={copyValue} /> : null}
    </ThemedView>
  );
}

function StationFootprint({ stations }: { stations: UserRecentStation[] }) {
  const router = useRouter();
  const totalUses = stations.reduce((total, station) => total + (Number(station.usageCount) || 0), 0);

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading count={stations.length} eyebrow='Station footprint' subtitle='Where this account charges most often.' title='Recent stations' />
      {stations.length ? (
        <SurfaceCard>
          <ThemedView backgroundColor='transparent' gap={'four'}>
            <ThemedView backgroundColor='transparent' flexDirection='row' gap={'three'}>
              <FootprintStat label='Tracked uses' value={numberFormatter.format(totalUses)} />
              <FootprintStat label='Stations' value={numberFormatter.format(stations.length)} />
            </ThemedView>
            {stations.map((station, index) => {
              const share = totalUses ? Math.round(((station.usageCount || 0) / totalUses) * 100) : 0;
              return (
                <ThemedView backgroundColor='transparent' gap={'three'} key={station.id}>
                  {index ? <ThemedView backgroundColor={Palette.borderSubtle} height={1} /> : null}
                  <Pressable
                    accessibilityRole='button'
                    onPress={() => router.push({ pathname: '/station/[stationId]', params: { stationId: station.id } })}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
                      <ThemedView
                        alignItems='center'
                        backgroundColor={profileColors.accentSurface}
                        borderRadius={12}
                        height={40}
                        justifyContent='center'
                        width={40}>
                        <MapPin color={Palette.accent} size={19} />
                      </ThemedView>
                      <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
                        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={2} selectable>
                          {station.name || station.name_vn || `Station #${station.id}`}
                        </ThemedText>
                        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10}>
                          {station.usageCount || 0} uses · {share}% share · {station.public ? 'Public' : 'Private'} · {station.full_time ? '24/7' : 'Scheduled'}
                        </ThemedText>
                      </ThemedView>
                      <ChevronRight color={Palette.textTertiary} size={18} />
                    </ThemedView>
                  </Pressable>
                  <ThemedView backgroundColor='#E7EEEA' borderRadius={'pill'} height={7} overflow='hidden'>
                    <ThemedView backgroundColor={Palette.accent} borderRadius={'pill'} height={7} width={`${share}%`} />
                  </ThemedView>
                  <RecordDetails record={station} />
                </ThemedView>
              );
            })}
          </ThemedView>
        </SurfaceCard>
      ) : (
        <ProfileRecordList emptyMessage='No station footprint was returned for this account.' emptyTitle='No recent stations' records={[]} />
      )}
    </ThemedView>
  );
}

function FootprintStat({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={13} flex={1} gap={2} padding={'three'}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} selectable>
        {value}
      </ThemedText>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function UserLevelDetails({ user }: { user: UserProfile }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading eyebrow='Membership' subtitle='Complete user-level object returned by the API.' title='User level details' />
      {user.userLevel ? (
        <SurfaceCard>
          <RecordDetails record={user.userLevel} />
        </SurfaceCard>
      ) : (
        <ProfileRecordList emptyMessage='No user level is assigned to this account.' emptyTitle='No membership level' records={[]} />
      )}
    </ThemedView>
  );
}
