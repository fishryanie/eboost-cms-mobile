import { BatteryCharging, CheckCircle2, MailCheck, PhoneCall, TicketPercent, type LucideIcon } from 'lucide-react-native';
import { RefreshControl } from 'react-native';

import { Switch, ThemedText, ThemedView } from 'components/base';
import AnimatedHeaderScrollView from 'components/organisms/animated-header-scrollview';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

import { useUserProfile } from '../hooks';
import { ProfileLoadingState, SectionHeading, SurfaceCard } from './user-profile-common';
import { getDisplayName, profileColors } from './user-profile-helpers';

const settingsContentStyle = { paddingHorizontal: mhs(16) };

export function UserProfileSettingsScreen({ userId }: { userId: string }) {
  const profileQuery = useUserProfile(userId);
  const user = profileQuery.data;

  return (
    <AnimatedHeaderScrollView
      canGoBack
      contentContainerStyle={settingsContentStyle}
      largeHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.bold, fontSize: 32 }}
      largeTitle='Account settings'
      refreshControl={<RefreshControl onRefresh={() => profileQuery.refetch()} refreshing={profileQuery.isRefetching} tintColor={Palette.accent} />}
      showsVerticalScrollIndicator={false}
      smallHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.semibold, fontSize: 16 }}
      subtitle={user ? getDisplayName(user) : `User #${userId}`}>
      {!userId ? (
        <EmptyState message='No user ID was provided.' title='User unavailable' />
      ) : profileQuery.isLoading ? (
        <ProfileLoadingState />
      ) : profileQuery.isError || !user ? (
        <ThemedView backgroundColor='transparent' gap={'four'}>
          <EmptyState message='The account settings could not be loaded.' title='Settings unavailable' />
          <AppButton block label='Retry' onPress={() => profileQuery.refetch()} />
        </ThemedView>
      ) : (
        <ActiveControls user={user} />
      )}
    </AnimatedHeaderScrollView>
  );
}

function ActiveControls({ user }: { user: UserProfile }) {
  const controls: { Icon: LucideIcon; label: string; value: boolean }[] = [
    { Icon: BatteryCharging, label: 'Auto charge', value: Boolean(user.autoCharge) },
    { Icon: TicketPercent, label: 'Auto apply discount', value: Boolean(user.autoApplyPromotionCode) },
    { Icon: CheckCircle2, label: 'Account enabled', value: user.enabled !== false },
    { Icon: MailCheck, label: 'Email verified', value: Boolean(user.activatedMail) },
    { Icon: PhoneCall, label: 'Phone verified', value: Boolean(user.isPhoneVerified) },
  ];

  return (
    <ThemedView backgroundColor='transparent' gap={'four'}>
      <SectionHeading eyebrow='Active controls' subtitle='Operational account states returned by the user profile service.' title={getDisplayName(user)} />
      <SurfaceCard>
        <ThemedView backgroundColor='transparent'>
          {controls.map((control, index) => (
            <ControlRow {...control} isLast={index === controls.length - 1} key={control.label} />
          ))}
        </ThemedView>
      </SurfaceCard>
      <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={14} gap={'two'} padding={'three'}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12}>
          Read-only controls
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={17}>
          These switches reflect the current CMS state. Account mutations continue to use the dedicated operation flows.
        </ThemedText>
      </ThemedView>
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
      minHeight={58}>
      <ThemedView
        alignItems='center'
        backgroundColor={value ? profileColors.accentSurface : Palette.surfaceMuted}
        borderRadius={11}
        height={36}
        justifyContent='center'
        width={36}>
        <Icon color={value ? Palette.accent : Palette.textTertiary} size={18} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' flex={1} gap={1}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13}>
          {label}
        </ThemedText>
        <ThemedText color={value ? Palette.accent : Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
          {value ? 'Active' : 'Inactive'}
        </ThemedText>
      </ThemedView>
      <ThemedView backgroundColor='transparent' pointerEvents='none'>
        <Switch accessibilityLabel={`${label}: ${value ? 'On' : 'Off'}`} value={value} />
      </ThemedView>
    </ThemedView>
  );
}
