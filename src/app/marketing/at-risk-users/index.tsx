import { useQuery } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { RefreshControl, StyleSheet } from 'react-native';
import { mhs } from 'themes/scaling';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { LoadingBlock } from 'app/(tabs)/marketing/components/subscription-stats';
import { fetchAtRiskUsers, getCollectionData } from 'shared/operation/operation-user-service';

const screenHorizontalPadding = 18;

const styles = StyleSheet.create({
  packageLargeTitleContainer: {
    marginHorizontal: -screenHorizontalPadding,
  },
  packageListContent: {
    gap: mhs(8),
    paddingBottom: 120,
    paddingHorizontal: screenHorizontalPadding,
    paddingTop: mhs(12),
  },
  packageRow: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    padding: mhs(12),
  },
  packageDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});

export default function AtRiskUsersScreen() {
  const atRiskQuery = useQuery({ queryFn: () => fetchAtRiskUsers(), queryKey: ['operation', 'at-risk-users'] });
  const items = getCollectionData(atRiskQuery.data) || [];

  return (
    <ThemedView flex={1}>
      <AnimatedHeaderFlatList
        canGoBack
        largeTitle='At-risk Subscriptions'
        subtitle='Users with subscriptions approaching expiration'
        largeTitleContainerStyle={styles.packageLargeTitleContainer}
        contentContainerStyle={styles.packageListContent}
        data={items}
        keyExtractor={item => String(item.subscription_id)}
        ListEmptyComponent={
          atRiskQuery.isLoading ? <LoadingBlock label='Loading users' /> : <EmptyState message='No expiring subscriptions returned.' title='No data' />
        }
        refreshControl={<RefreshControl onRefresh={() => atRiskQuery.refetch()} refreshing={atRiskQuery.isRefetching} tintColor={Palette.accent} />}
        renderItem={({ item }) => (
          <ThemedView alignItems='center' flexDirection='row' gap={'two'} style={styles.packageRow}>
            <ThemedView style={[styles.packageDot, { backgroundColor: '#D92D20' }]} />
            <ThemedView flex={1} minWidth={0}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={2}>
                {item.user?.name || item.user?.email || `User #${item.user?.id || '--'}`}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1}>
                {item.days_left ?? '--'} days left • {(item.risk_types || []).join(', ') || 'subscription expiry'}
              </ThemedText>
            </ThemedView>
            <ThemedView alignItems='flex-end' gap={2}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18} selectable>
                {item.auto_renew ? 'Auto' : 'Manual'}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
                #{item.subscription_id}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}
