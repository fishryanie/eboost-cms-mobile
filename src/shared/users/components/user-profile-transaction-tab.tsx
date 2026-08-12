import { SlidersHorizontal } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { EmptyState } from 'components/ui';
import { TransactionFilterSheet } from 'shared/cms-pages/transaction-filter-sheet';
import { TransactionListSkeleton } from 'shared/cms-pages/transaction-list-skeleton';
import { TransactionQuickFilters } from 'shared/cms-pages/transaction-quick-filters';
import { TransactionSessionCard } from 'shared/cms-pages/transaction-session-card';
import type { CmsRecord } from 'shared/cms-pages/service';
import { FontFamily, Palette } from 'themes';

import { SectionHeading } from './user-profile-common';
import type { UserProfileTransactionsController } from './use-user-profile-transactions';

export function UserProfileTransactionControls({ controller }: { controller: UserProfileTransactionsController }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'} paddingBottom={'four'}>
      <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={'three'}>
        <ThemedView backgroundColor='transparent' flex={1}>
          <SectionHeading
            count={controller.totalItems}
            eyebrow='Charging activity'
            subtitle='The same live transaction feed, scoped to this user.'
            title='Transactions'
          />
        </ThemedView>
        <Pressable
          accessibilityLabel={`Open transaction filters${controller.activeFilterCount ? `, ${controller.activeFilterCount} active` : ''}`}
          accessibilityRole='button'
          onPress={controller.openFilters}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <ThemedView
            alignItems='center'
            backgroundColor={controller.activeFilterCount ? '#EAF8F0' : Palette.surfaceRaised}
            borderColor={controller.activeFilterCount ? '#9DD9B8' : Palette.borderSubtle}
            borderRadius={'pill'}
            borderWidth={1}
            flexDirection='row'
            gap={'one'}
            height={40}
            paddingHorizontal={'three'}>
            <SlidersHorizontal color={controller.activeFilterCount ? Palette.accent : Palette.textSecondary} size={17} strokeWidth={2.2} />
            {controller.activeFilterCount ? (
              <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={11}>
                {controller.activeFilterCount}
              </ThemedText>
            ) : null}
          </ThemedView>
        </Pressable>
      </ThemedView>
      <TransactionQuickFilters
        filters={controller.filters}
        onChangeFilters={controller.changeFilters}
        onChangeVehicle={controller.changeVehicle}
        vehicle={controller.vehicle}
      />
      {controller.isFetching && !controller.isFetchingNextPage && !controller.isPullRefreshing ? (
        <ThemedView backgroundColor={Palette.accent} borderRadius={'pill'} height={3} loading />
      ) : null}
    </ThemedView>
  );
}

export function UserProfileTransactionCard({ item }: { item: CmsRecord }) {
  return (
    <ThemedView backgroundColor='transparent' paddingBottom={16}>
      <TransactionSessionCard item={item} />
    </ThemedView>
  );
}

export function UserProfileTransactionEmpty({ controller }: { controller: UserProfileTransactionsController }) {
  if (controller.isLoading) return <TransactionListSkeleton />;

  if (controller.isError) {
    return (
      <ThemedView backgroundColor='transparent' gap={'three'} paddingTop={'four'}>
        <EmptyState
          message={controller.error instanceof Error ? controller.error.message : 'The transaction list could not be loaded.'}
          title='Transactions unavailable'
        />
        <Pressable accessibilityRole='button' onPress={() => controller.refetch()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <ThemedView alignItems='center' backgroundColor={Palette.accent} borderRadius={'pill'} height={44} justifyContent='center'>
            <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={13}>
              Retry
            </ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
    );
  }

  return <EmptyState message='No car or bike charging sessions match the selected filters for this user.' title='No transactions' />;
}

export function UserProfileTransactionFooter({ controller }: { controller: UserProfileTransactionsController }) {
  if (!controller.isFetchingNextPage) return null;
  return <ThemedView alignSelf='center' borderRadius={'pill'} height={16} loading marginVertical={24} width={112} />;
}

export function UserProfileTransactionFilterSheet({ controller, userId }: { controller: UserProfileTransactionsController; userId: string }) {
  return (
    <TransactionFilterSheet
      fixedUserId={userId}
      onApply={controller.applyFilters}
      onChange={controller.setFilterDraft}
      onClose={controller.closeFilters}
      values={controller.filterDraft}
      vehicle={controller.vehicle}
      visible={controller.filterVisible}
    />
  );
}
