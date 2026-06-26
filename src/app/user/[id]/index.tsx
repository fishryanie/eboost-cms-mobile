import { mhs } from 'themes/scaling';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { useUserProfile } from 'shared/users/hooks';
import { AppButton, EmptyState, StatusChip } from 'components/ui';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  currency: 'VND',
  maximumFractionDigits: 0,
  style: 'currency',
});

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function BooleanChip({ label, value }: { label: string; value?: boolean }) {
  return <StatusChip label={`${label}: ${value ? 'Yes' : 'No'}`} tone={value ? 'success' : 'muted'} />;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <ThemedView borderBottomColor={Palette.borderSubtle} borderBottomWidth={1} gap={'one'} padding={'four'}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13}>
        {label}
      </ThemedText>
      <ThemedText selectable color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
        {value || 'Not available'}
      </ThemedText>
    </ThemedView>
  );
}

function BalanceHistoryRow({ item }: { item: BalanceHistoryItem }) {
  const positive = item.balanceAction === '+';

  return (
    <ThemedView backgroundColor={Palette.surfaceRaised} borderColor={Palette.borderSubtle} borderRadius={'large'} borderWidth={1} gap={'two'} padding={'four'}>
      <ThemedView alignItems='center' flexDirection='row' gap={'three'} justifyContent='space-between'>
        <ThemedText style={[styles.historyAmount, positive ? styles.positive : styles.negative]}>
          {positive ? '+' : '-'} {currencyFormatter.format(Math.abs(item.amount))}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13}>
          {currencyFormatter.format(item.wallet)}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18}>
        {item.reason || 'No reason provided'}
      </ThemedText>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={12}>
        {formatDate(item.createdAt)}
      </ThemedText>
    </ThemedView>
  );
}

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = String(params.id || '');
  const profileQuery = useUserProfile(userId);
  const user = profileQuery.data;

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingTop safePaddingBottom>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps='handled'
        refreshControl={<RefreshControl onRefresh={() => profileQuery.refetch()} refreshing={profileQuery.isRefetching} tintColor={Palette.accent} />}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
            Back
          </ThemedText>
        </Pressable>

        {!userId ? (
          <EmptyState message='No user ID was provided.' title='User unavailable' />
        ) : profileQuery.isLoading ? (
          <ThemedView gap={'four'}>
            <ThemedView borderRadius={'large'} height={148} loading />
            <ThemedView borderRadius={'large'} height={180} loading />
          </ThemedView>
        ) : profileQuery.isError || !user ? (
          <ThemedView gap={'four'}>
            <EmptyState message='The user profile could not be loaded.' title='User unavailable' />
            <AppButton label='Retry' onPress={() => profileQuery.refetch()} />
          </ThemedView>
        ) : (
          <>
            <ThemedView
              backgroundColor={Palette.surfaceRaised}
              borderColor={Palette.borderSubtle}
              borderRadius={'large'}
              borderWidth={1}
              gap={'three'}
              padding={'four'}>
              <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13} textTransform='uppercase'>
                User #{user.id}
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={27} letterSpacing={0} lineHeight={33}>
                {user.name || user.username || user.email || `User #${user.id}`}
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={30}>
                {currencyFormatter.format(user.balance || 0)}
              </ThemedText>
              <ThemedView flexDirection='row' flexWrap='wrap' gap={8}>
                <StatusChip label={user.enabled === false ? 'Disabled' : 'Enabled'} tone={user.enabled === false ? 'danger' : 'success'} />
                {user.userLevel?.name ? <StatusChip label={user.userLevel.name} /> : null}
              </ThemedView>
            </ThemedView>

            <ThemedView gap={'three'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={19} lineHeight={24}>
                Identity
              </ThemedText>
              <ThemedView backgroundColor={Palette.surfaceRaised} borderColor={Palette.borderSubtle} borderRadius={'large'} borderWidth={1} overflow='hidden'>
                <InfoRow label='Username' value={user.username} />
                <InfoRow label='Email' value={user.email} />
                <InfoRow label='Phone' value={user.phoneNumber} />
                <InfoRow label='Address' value={user.address} />
                <InfoRow label='Created' value={formatDate(user.createdAt)} />
              </ThemedView>
            </ThemedView>

            <ThemedView gap={'three'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={19} lineHeight={24}>
                Account state
              </ThemedText>
              <ThemedView flexDirection='row' flexWrap='wrap' gap={8}>
                <BooleanChip label='Email activated' value={user.activatedMail} />
                <BooleanChip label='Phone verified' value={user.isPhoneVerified} />
                <BooleanChip label='Citizen verified' value={user.isCitizenVerified} />
                <BooleanChip label='Auto charge' value={user.autoCharge} />
                <BooleanChip label='Auto promotion' value={user.autoApplyPromotionCode} />
              </ThemedView>
            </ThemedView>

            <ThemedView gap={'three'}>
              <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={19} lineHeight={24}>
                  Balance history
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={14}>
                  {user.balanceHistory?.length || 0}
                </ThemedText>
              </ThemedView>
              {user.balanceHistory?.length ? (
                <ThemedView gap={'two'}>
                  {user.balanceHistory.map(item => (
                    <BalanceHistoryRow item={item} key={item.id} />
                  ))}
                </ThemedView>
              ) : (
                <EmptyState message='No balance movements were returned.' title='No balance history' />
              )}
            </ThemedView>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: mhs(4),
  },
  content: {
    gap: mhs(16),
    padding: mhs(16),
    paddingBottom: 120,
  },
  historyAmount: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  negative: {
    color: '#B42318',
  },
  positive: {
    color: '#027A48',
  },
});
