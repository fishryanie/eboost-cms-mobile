import { useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';

import { ThemedView } from 'components/base';
import AnimatedHeaderScrollView from 'components/organisms/animated-header-scrollview';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { AppButton, EmptyState } from 'components/ui';
import type { CmsRecord } from 'shared/cms-pages/service';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

import { useUserProfile } from '../hooks';
import { ProfileHeaderAvatar, ProfileLoadingState, ProfileTabBar } from './user-profile-common';
import { UserProfileOverviewTab } from './user-profile-overview-tab';
import { UserProfilePromotions } from './user-profile-promotions';
import { UserProfileSummaryCard } from './user-profile-summary-card';
import {
  UserProfileTransactionCard,
  UserProfileTransactionControls,
  UserProfileTransactionEmpty,
  UserProfileTransactionFilterSheet,
  UserProfileTransactionFooter,
} from './user-profile-transaction-tab';
import { UserProfilePayment } from './user-profile-transactions';
import type { ProfileTab } from './user-profile-types';
import { useUserProfileTransactions } from './use-user-profile-transactions';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const loadingContentStyle = { paddingHorizontal: mhs(16) };
const tabOrder: ProfileTab[] = ['overview', 'payment', 'transactions', 'promotions'];

type ProfileListItem = { kind: 'content'; tab: Exclude<ProfileTab, 'transactions'> } | { kind: 'transaction'; record: CmsRecord };

export function UserProfileScreen({ userId }: { userId: string }) {
  const profileQuery = useUserProfile(userId);
  const user = profileQuery.data;
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [tabDirection, setTabDirection] = useState(1);
  const activeTabIndexRef = useRef(0);
  const transactions = useUserProfileTransactions(userId, activeTab === 'transactions' && Boolean(user));

  if (!userId || profileQuery.isLoading || profileQuery.isError || !user) {
    return (
      <AnimatedHeaderScrollView
        canGoBack
        contentContainerStyle={loadingContentStyle}
        largeTitle='User profile'
        refreshControl={<RefreshControl onRefresh={() => profileQuery.refetch()} refreshing={profileQuery.isRefetching} tintColor={Palette.accent} />}
        showsVerticalScrollIndicator={false}>
        {!userId ? (
          <EmptyState message='No user ID was provided.' title='User unavailable' />
        ) : profileQuery.isLoading ? (
          <ProfileLoadingState />
        ) : (
          <ThemedView backgroundColor='transparent' gap={'four'}>
            <EmptyState message='The user profile could not be loaded.' title='User unavailable' />
            <AppButton block label='Retry' onPress={() => profileQuery.refetch()} />
          </ThemedView>
        )}
      </AnimatedHeaderScrollView>
    );
  }

  const subtitle = `#${user.id}${user.userLevel?.name ? ` · ${user.userLevel.name}` : ''}`;
  const data: ProfileListItem[] =
    activeTab === 'transactions'
      ? transactions.items.map(record => ({ kind: 'transaction' as const, record }))
      : [{ kind: 'content', tab: activeTab } as ProfileListItem];

  function changeTab(nextTab: ProfileTab) {
    const nextIndex = tabOrder.indexOf(nextTab);
    setTabDirection(nextIndex >= activeTabIndexRef.current ? 1 : -1);
    activeTabIndexRef.current = nextIndex;
    setActiveTab(nextTab);
  }

  function refresh() {
    if (activeTab === 'transactions') {
      void Promise.all([profileQuery.refetch(), transactions.refresh()]);
      return;
    }
    void profileQuery.refetch();
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <AnimatedHeaderFlatList
        canGoBack
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 12 }}
        data={data}
        key={activeTab}
        keyExtractor={item =>
          item.kind === 'transaction'
            ? `transaction-${String(item.record.id || item.record.transactionId || item.record.invoiceId || JSON.stringify(item.record))}`
            : `profile-${item.tab}`
        }
        largeHeaderSubtitleStyle={{ color: Palette.textSecondary, fontFamily: FontFamily.medium, fontSize: 13 }}
        largeHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.bold, fontSize: 32 }}
        largeTitle='User profile'
        largeTitleStretchEnabled={false}
        ListEmptyComponent={activeTab === 'transactions' ? <UserProfileTransactionEmpty controller={transactions} /> : null}
        ListFooterComponent={
          activeTab === 'transactions' ? <UserProfileTransactionFooter controller={transactions} /> : <ThemedView backgroundColor='transparent' height={40} />
        }
        ListHeaderComponent={
          <ThemedView backgroundColor='transparent'>
            <UserProfileSummaryCard user={user} />
            <ProfileTabBar activeTab={activeTab} onChange={changeTab} />
            {activeTab === 'transactions' ? <UserProfileTransactionControls controller={transactions} /> : null}
          </ThemedView>
        }
        onEndReached={activeTab === 'transactions' ? transactions.loadMore : undefined}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl
            onRefresh={refresh}
            refreshing={profileQuery.isRefetching || (activeTab === 'transactions' && transactions.isPullRefreshing)}
            tintColor={Palette.accent}
          />
        }
        renderItem={({ item }) => {
          if (item.kind === 'transaction') return <UserProfileTransactionCard item={item.record} />;

          return (
            <AnimatedThemedView
              backgroundColor='transparent'
              entering={(tabDirection > 0 ? FadeInRight : FadeInLeft).duration(190)}
              key={`profile-content-${item.tab}`}>
              <ProfileTabContent tab={item.tab} user={user} />
            </AnimatedThemedView>
          );
        }}
        rightComponent={<ProfileHeaderAvatar user={user} />}
        showsVerticalScrollIndicator={false}
        smallHeaderSubtitleStyle={{ color: Palette.textSecondary, fontFamily: FontFamily.medium, fontSize: 10 }}
        smallHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.semibold, fontSize: 16 }}
        subtitle={subtitle}
      />
      <UserProfileTransactionFilterSheet controller={transactions} userId={userId} />
    </ThemedView>
  );
}

function ProfileTabContent({ tab, user }: { tab: Exclude<ProfileTab, 'transactions'>; user: UserProfile }) {
  if (tab === 'overview') return <UserProfileOverviewTab user={user} />;
  if (tab === 'payment') return <UserProfilePayment user={user} />;
  return <UserProfilePromotions user={user} />;
}
