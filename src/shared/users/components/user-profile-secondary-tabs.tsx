import { Copy, Share2 } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { ProfileRecordList, SectionHeading, SurfaceCard } from './user-profile-common';
import { copyProfileValue, profileColors } from './user-profile-helpers';

export function UserProfileReports({ user }: { user: UserProfile }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading
        count={user.reports?.length || 0}
        eyebrow='Reports'
        subtitle='Every report object returned by the user profile endpoint.'
        title='User reports'
      />
      <ProfileRecordList emptyMessage='No report is linked to this account.' emptyTitle='No reports' records={user.reports} />
    </ThemedView>
  );
}

export function UserProfileNotifications({ user }: { user: UserProfile }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading
        count={user.groups?.length || 0}
        eyebrow='Notifications'
        subtitle='Notification groups and enrollment metadata returned for this account.'
        title='Notification groups'
      />
      <ProfileRecordList emptyMessage='No notification group is assigned to this user.' emptyTitle='No notification groups' records={user.groups} />
    </ThemedView>
  );
}

export function UserProfileSms({ user }: { user: UserProfile }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading
        count={user.smsHistories?.length || 0}
        eyebrow='SMS'
        subtitle='SMS records when they are included by the profile endpoint.'
        title='Message history'
      />
      <ProfileRecordList
        emptyMessage='The current profile response does not contain any SMS records.'
        emptyTitle='No SMS history'
        records={user.smsHistories}
      />
    </ThemedView>
  );
}

export function UserProfileReferrals({ user }: { user: UserProfile }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'six'}>
      <ThemedView backgroundColor='transparent' gap={'three'}>
        <SectionHeading eyebrow='Referral code' subtitle='The shareable code and its current availability.' title='Referral identity' />
        <ReferralCodeCard code={user.referralCode} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' gap={'three'}>
        <SectionHeading
          count={user.referralUsers?.length || 0}
          eyebrow='Referred users'
          subtitle='Every referred-user object returned by the profile endpoint.'
          title='Referral network'
        />
        <ProfileRecordList emptyMessage='No users have been referred by this account.' emptyTitle='No referral users' records={user.referralUsers} />
      </ThemedView>
    </ThemedView>
  );
}

function ReferralCodeCard({ code }: { code?: string | null }) {
  return (
    <SurfaceCard>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
        <ThemedView alignItems='center' backgroundColor={profileColors.accentSurface} borderRadius={14} height={48} justifyContent='center' width={48}>
          <Share2 color={Palette.accent} size={21} />
        </ThemedView>
        <ThemedView backgroundColor='transparent' flex={1} gap={3} minWidth={0}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={9} letterSpacing={0.9} textTransform='uppercase'>
            Shareable referral code
          </ThemedText>
          <ThemedText color={code ? Palette.textPrimary : Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22} selectable>
            {code || 'Not assigned'}
          </ThemedText>
        </ThemedView>
        {code ? (
          <Pressable
            accessibilityLabel='Copy referral code'
            accessibilityRole='button'
            hitSlop={8}
            onPress={() => void copyProfileValue(code, 'Referral code')}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <ThemedView alignItems='center' backgroundColor={profileColors.accentSurface} borderRadius={'pill'} height={38} justifyContent='center' width={38}>
              <Copy color={Palette.accent} size={17} />
            </ThemedView>
          </Pressable>
        ) : null}
      </ThemedView>
    </SurfaceCard>
  );
}
