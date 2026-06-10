import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { useUserProfile } from 'features/users/hooks';
import type { BalanceHistoryItem } from 'features/users/types';
import { AppButton, AppScreen, EmptyState, StatusChip } from 'shared/ui';

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
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value || 'Not available'}
      </Text>
    </View>
  );
}

function BalanceHistoryRow({ item }: { item: BalanceHistoryItem }) {
  const positive = item.balanceAction === '+';

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyTop}>
        <Text style={[styles.historyAmount, positive ? styles.positive : styles.negative]}>
          {positive ? '+' : '-'} {currencyFormatter.format(Math.abs(item.amount))}
        </Text>
        <Text style={styles.historyWallet}>{currencyFormatter.format(item.wallet)}</Text>
      </View>
      <Text style={styles.historyReason}>{item.reason || 'No reason provided'}</Text>
      <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = String(params.id || '');
  const profileQuery = useUserProfile(userId);
  const user = profileQuery.data;

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {!userId ? (
        <EmptyState message='No user ID was provided.' title='User unavailable' />
      ) : profileQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Palette.accent} />
          <Text style={styles.stateText}>Loading user profile</Text>
        </View>
      ) : profileQuery.isError || !user ? (
        <View style={styles.centerState}>
          <EmptyState message='The user profile could not be loaded.' title='User unavailable' />
          <AppButton label='Retry' onPress={() => profileQuery.refetch()} />
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>User #{user.id}</Text>
            <Text style={styles.title}>{user.name || user.username || user.email || `User #${user.id}`}</Text>
            <Text style={styles.balance}>{currencyFormatter.format(user.balance || 0)}</Text>
            <View style={styles.chips}>
              <StatusChip label={user.enabled === false ? 'Disabled' : 'Enabled'} tone={user.enabled === false ? 'danger' : 'success'} />
              {user.userLevel?.name ? <StatusChip label={user.userLevel.name} /> : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identity</Text>
            <View style={styles.infoList}>
              <InfoRow label='Username' value={user.username} />
              <InfoRow label='Email' value={user.email} />
              <InfoRow label='Phone' value={user.phoneNumber} />
              <InfoRow label='Address' value={user.address} />
              <InfoRow label='Created' value={formatDate(user.createdAt)} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account state</Text>
            <View style={styles.chips}>
              <BooleanChip label='Email activated' value={user.activatedMail} />
              <BooleanChip label='Phone verified' value={user.isPhoneVerified} />
              <BooleanChip label='Citizen verified' value={user.isCitizenVerified} />
              <BooleanChip label='Auto charge' value={user.autoCharge} />
              <BooleanChip label='Auto promotion' value={user.autoApplyPromotionCode} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Balance history</Text>
              <Text style={styles.count}>{user.balanceHistory?.length || 0}</Text>
            </View>
            {user.balanceHistory?.length ? (
              <View style={styles.historyList}>
                {user.balanceHistory.map(item => (
                  <BalanceHistoryRow item={item} key={item.id} />
                ))}
              </View>
            ) : (
              <EmptyState message='No balance movements were returned.' title='No balance history' />
            )}
          </View>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  backText: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  balance: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  centerState: {
    gap: Spacing.four,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  count: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  eyebrow: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  historyAmount: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  historyDate: {
    color: Palette.textTertiary,
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  historyList: {
    gap: Spacing.two,
  },
  historyReason: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  historyRow: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.four,
  },
  historyTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  historyWallet: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  infoLabel: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  infoList: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: 1,
    gap: Spacing.one,
    padding: Spacing.four,
  },
  infoValue: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  negative: {
    color: '#B42318',
  },
  positive: {
    color: '#027A48',
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 19,
    lineHeight: 24,
  },
  stateText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 27,
    letterSpacing: 0,
    lineHeight: 33,
  },
});
