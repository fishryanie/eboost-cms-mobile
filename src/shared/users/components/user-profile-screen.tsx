import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Bell, CircleDollarSign, LockKeyhole, Mail, Settings2, UserRoundCog, UsersRound, WalletCards } from 'lucide-react-native';

import { HeaderTitle, ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { HorizontalActionList, type HorizontalActionItem } from 'components/ui/horizontal-action-list';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

import { useUserNotificationMessages, useUserProfile, useUserSmsLogs } from '../hooks';
import { getDisplayName } from './user-profile-helpers';
import { ProfileLoadingState, ProfileTabBar } from './user-profile-common';
import { UserProfileActivityTab } from './user-profile-activity-tab';
import { UserProfileNotificationMessagesTab, UserProfileSmsLogsTab } from './user-profile-message-tabs';
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
import { useUserProfileTransactions, type UserProfileTransactionsController } from './use-user-profile-transactions';

const loadingContentStyle = { paddingBottom: mhs(40), paddingHorizontal: mhs(16), paddingTop: mhs(16) };
const tabOrder: ProfileTab[] = ['overview', 'activity', 'payment', 'transactions', 'promotions', 'sms-logs', 'notification-messages'];
const profileScreenSections = ['profile-summary', 'profile-tabs', 'profile-content'] as const;
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

type UserProfileMessageQueries = {
  notificationMessages: ReturnType<typeof useUserNotificationMessages>;
  smsLogs: ReturnType<typeof useUserSmsLogs>;
};

export function UserProfileScreen({ userId }: { userId: string }) {
  const profileQuery = useUserProfile(userId);
  const router = useRouter();
  const user = profileQuery.data;
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [transactionsRequested, setTransactionsRequested] = useState(false);
  const transactionsRequestedRef = useRef(false);
  const headerScrollY = useSharedValue(0);
  const tabProgress = useSharedValue(0);
  const transactions = useUserProfileTransactions(userId, transactionsRequested && Boolean(user));
  const notificationMessagesQuery = useUserNotificationMessages(userId, activeTab === 'notification-messages' && Boolean(user));
  const smsLogsQuery = useUserSmsLogs(userId, activeTab === 'sms-logs' && Boolean(user));
  const messageQueries = { notificationMessages: notificationMessagesQuery, smsLogs: smsLogsQuery };
  const headerScrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      headerScrollY.set(Math.max(0, event.contentOffset.y));
    },
  });

  const requestTransactions = () => {
    if (transactionsRequestedRef.current) return;
    transactionsRequestedRef.current = true;
    setTransactionsRequested(true);
  };

  const changeTab = (nextTab: ProfileTab) => {
    if (nextTab === activeTab) return;
    if (nextTab === 'transactions') requestTransactions();
    setActiveTab(nextTab);
  };

  if (!userId || profileQuery.isLoading || profileQuery.isError || !user) {
    return (
      <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
        <HeaderTitle showBorderBottom={false} title='User profile' />
        <ScrollView
          contentContainerStyle={loadingContentStyle}
          contentInsetAdjustmentBehavior='automatic'
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
        </ScrollView>
      </ThemedView>
    );
  }

  function refresh(tab: ProfileTab) {
    if (tab === 'transactions') {
      void Promise.all([profileQuery.refetch(), transactions.refresh()]);
      return;
    }
    if (tab === 'notification-messages') {
      void Promise.all([profileQuery.refetch(), notificationMessagesQuery.refetch()]);
      return;
    }
    if (tab === 'sms-logs') {
      void Promise.all([profileQuery.refetch(), smsLogsQuery.refetch()]);
      return;
    }
    void profileQuery.refetch();
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle
        rightComponent={<ProfileSettingsButton onPress={() => router.push({ pathname: '/user/[id]/settings', params: { id: String(user.id) } })} />}
        showBorderBottom={false}
        title='User profile'
        titleComponent={<ProfileHeaderTitle name={getDisplayName(user)} scrollY={headerScrollY} />}
      />
      <Animated.FlatList
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 12 }}
        data={profileScreenSections}
        extraData={activeTab}
        keyExtractor={item => item}
        onEndReached={activeTab === 'transactions' ? transactions.loadMore : undefined}
        onEndReachedThreshold={0.45}
        onScroll={headerScrollHandler}
        refreshControl={
          <RefreshControl
            onRefresh={() => refresh(activeTab)}
            refreshing={
              profileQuery.isRefetching ||
              (activeTab === 'transactions' && transactions.isPullRefreshing) ||
              (activeTab === 'notification-messages' && notificationMessagesQuery.isRefetching) ||
              (activeTab === 'sms-logs' && smsLogsQuery.isRefetching)
            }
            tintColor={Palette.accent}
          />
        }
        renderItem={({ item }) => {
          if (item === 'profile-summary') {
            return (
              <ThemedView backgroundColor='transparent' paddingTop={'two'}>
                <UserProfileSummaryCard user={user} />
                <ThemedView backgroundColor='transparent' height={16} />
                <HorizontalActionList
                  actions={getUserActions(user, router, () => Alert.alert('Add to Group', 'Group assignment is not available in the mobile CMS yet.'))}
                  bleed={12}
                  edgePadding={12}
                />
                <ThemedView backgroundColor='transparent' height={4} />
              </ThemedView>
            );
          }

          if (item === 'profile-tabs') {
            return (
              <ThemedView backgroundColor={Palette.surfaceBase}>
                <ProfileTabBar activeTab={activeTab} onChange={changeTab} progress={tabProgress} />
              </ThemedView>
            );
          }

          return (
            <UserProfilePager
              activeTab={activeTab}
              messageQueries={messageQueries}
              onSelect={changeTab}
              progress={tabProgress}
              transactions={transactions}
              user={user}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
      />
      <UserProfileTransactionFilterSheet controller={transactions} userId={userId} />
    </ThemedView>
  );
}

function ProfileHeaderTitle({ name, scrollY }: { name: string; scrollY: SharedValue<number> }) {
  const defaultTitleStyle = useAnimatedStyle(() => {
    const scrollOffset = scrollY.get();

    return {
      opacity: interpolate(scrollOffset, [24, 88], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(scrollOffset, [24, 88], [0, -28], Extrapolation.CLAMP) }],
    };
  });
  const userNameStyle = useAnimatedStyle(() => {
    const scrollOffset = scrollY.get();

    return {
      opacity: interpolate(scrollOffset, [24, 88], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(scrollOffset, [24, 88], [28, 0], Extrapolation.CLAMP) }],
    };
  });

  return (
    <ThemedView backgroundColor='transparent' flex={1} height={24} overflow='hidden'>
      <AnimatedThemedView
        backgroundColor='transparent'
        bottom={0}
        justifyContent='center'
        left={0}
        position='absolute'
        right={0}
        style={defaultTitleStyle}
        top={0}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={18} lineHeight={24} numberOfLines={1}>
          User profile
        </ThemedText>
      </AnimatedThemedView>
      <AnimatedThemedView backgroundColor='transparent' bottom={0} justifyContent='center' left={0} position='absolute' right={0} style={userNameStyle} top={0}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={18} lineHeight={24} numberOfLines={1}>
          {name}
        </ThemedText>
      </AnimatedThemedView>
    </ThemedView>
  );
}

function ProfileSettingsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityLabel='Open user settings' accessibilityRole='button' hitSlop={8} onPress={onPress}>
      {({ pressed }) => (
        <ThemedView
          alignItems='center'
          backgroundColor={Palette.surfaceMuted}
          borderRadius={'pill'}
          height={38}
          justifyContent='center'
          opacity={pressed ? 0.6 : 1}
          width={38}>
          <Settings2 color={Palette.textPrimary} size={20} strokeWidth={2.1} />
        </ThemedView>
      )}
    </Pressable>
  );
}

function getUserActions(user: UserProfile, router: ReturnType<typeof useRouter>, onAddToGroup: () => void): HorizontalActionItem[] {
  const params = { userId: String(user.id) };

  return [
    { icon: UserRoundCog, key: 'modify-ranking', label: 'Modify Ranking', onPress: () => router.push({ pathname: '/operation/modify-ranking', params }) },
    { icon: WalletCards, key: 'adjust-balance', label: 'Adjust Balance', onPress: () => router.push({ pathname: '/operation/adjust-balance', params }) },
    { icon: CircleDollarSign, key: 'transfer-money', label: 'Transfer Money', onPress: () => router.push({ pathname: '/operation/transfer-money', params }) },
    { icon: UsersRound, key: 'add-to-group', label: 'Add to Group', onPress: onAddToGroup },
    { icon: Bell, key: 'push-notification', label: 'Push Notification', onPress: () => router.push({ pathname: '/marketing/push-notice', params }) },
    { icon: LockKeyhole, key: 'change-password', label: 'Change Password', onPress: () => router.push({ pathname: '/operation/change-password', params }) },
    { icon: Mail, key: 'change-email', label: 'Change Email', onPress: () => router.push({ pathname: '/operation/change-email', params }) },
  ];
}

function UserProfilePager({
  activeTab,
  messageQueries,
  onSelect,
  progress,
  transactions,
  user,
}: {
  activeTab: ProfileTab;
  messageQueries: UserProfileMessageQueries;
  onSelect: (tab: ProfileTab) => void;
  progress: SharedValue<number>;
  transactions: UserProfileTransactionsController;
  user: UserProfile;
}) {
  const pagerRef = useRef<PagerView>(null);
  const selectedIndex = Math.max(0, tabOrder.indexOf(activeTab));
  const lastPagerIndexRef = useRef(selectedIndex);
  const pendingPageIndexRef = useRef<number | undefined>(undefined);
  const [pageHeights, setPageHeights] = useState<Partial<Record<ProfileTab, number>>>({});
  const measuredPageHeights = Object.values(pageHeights);
  const activePageHeight = pageHeights[activeTab] ?? (measuredPageHeights.length > 0 ? Math.max(...measuredPageHeights) : undefined);

  const rememberPageHeight = (tab: ProfileTab, height: number) => {
    const roundedHeight = Math.ceil(height);
    setPageHeights(current => (current[tab] === roundedHeight ? current : { ...current, [tab]: roundedHeight }));
  };

  useEffect(() => {
    if (!activePageHeight) {
      progress.set(withTiming(selectedIndex, { duration: 220 }));
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      const distance = Math.abs(selectedIndex - lastPagerIndexRef.current);
      if (distance === 0) return;

      if (distance === 1) {
        pagerRef.current?.setPage(selectedIndex);
      } else {
        pagerRef.current?.setPageWithoutAnimation(selectedIndex);
        progress.set(withTiming(selectedIndex, { duration: 220 }));
      }
      lastPagerIndexRef.current = selectedIndex;
    });
    return () => cancelAnimationFrame(frame);
  }, [activePageHeight, progress, selectedIndex]);

  if (!activePageHeight) {
    return (
      <ThemedView backgroundColor='transparent' onLayout={event => rememberPageHeight(activeTab, event.nativeEvent.layout.height)}>
        <UserProfilePagerPage messageQueries={messageQueries} tab={activeTab} transactions={transactions} user={user} />
      </ThemedView>
    );
  }

  return (
    <ThemedView accessibilityHint='Swipe left or right to change profile tab' backgroundColor='transparent' height={activePageHeight}>
      <PagerView
        initialPage={selectedIndex}
        keyboardDismissMode='on-drag'
        onPageScroll={event => {
          progress.set(event.nativeEvent.position + event.nativeEvent.offset);
        }}
        onPageSelected={event => {
          pendingPageIndexRef.current = event.nativeEvent.position;
        }}
        onPageScrollStateChanged={event => {
          const scrollState = event.nativeEvent.pageScrollState;
          if (scrollState === 'dragging') {
            pendingPageIndexRef.current = undefined;
            return;
          }
          if (scrollState !== 'idle') return;

          const nextIndex = pendingPageIndexRef.current;
          pendingPageIndexRef.current = undefined;
          if (nextIndex == null) {
            progress.set(withTiming(selectedIndex, { duration: 120 }));
            return;
          }

          const nextTab = tabOrder[nextIndex];
          progress.set(nextIndex);
          lastPagerIndexRef.current = nextIndex;
          if (nextTab && nextTab !== activeTab) onSelect(nextTab);
        }}
        overdrag
        ref={pagerRef}
        style={{ height: activePageHeight, width: '100%' }}>
        {tabOrder.map((tab, index) => {
          const shouldRenderContent = Math.abs(index - selectedIndex) <= 1;

          return (
            <ThemedView backgroundColor='transparent' collapsable={false} key={tab}>
              {shouldRenderContent ? (
                <ThemedView backgroundColor='transparent' onLayout={event => rememberPageHeight(tab, event.nativeEvent.layout.height)}>
                  <UserProfilePagerPage messageQueries={messageQueries} tab={tab} transactions={transactions} user={user} />
                </ThemedView>
              ) : null}
            </ThemedView>
          );
        })}
      </PagerView>
    </ThemedView>
  );
}

function UserProfilePagerPage({
  messageQueries,
  tab,
  transactions,
  user,
}: {
  messageQueries: UserProfileMessageQueries;
  tab: ProfileTab;
  transactions: UserProfileTransactionsController;
  user: UserProfile;
}) {
  if (tab !== 'transactions') {
    return (
      <ThemedView backgroundColor='transparent' paddingTop={20}>
        <ProfileTabContent messageQueries={messageQueries} tab={tab} user={user} />
        <ThemedView backgroundColor='transparent' height={40} />
      </ThemedView>
    );
  }

  return (
    <ThemedView backgroundColor='transparent' paddingTop={20}>
      <UserProfileTransactionControls controller={transactions} />
      {transactions.items.length > 0 ? (
        transactions.items.map(record => (
          <UserProfileTransactionCard
            item={record}
            key={`transaction-${String(record.id || record.transactionId || record.invoiceId || JSON.stringify(record))}`}
          />
        ))
      ) : (
        <UserProfileTransactionEmpty controller={transactions} />
      )}
      <UserProfileTransactionFooter controller={transactions} />
    </ThemedView>
  );
}

function ProfileTabContent({
  messageQueries,
  tab,
  user,
}: {
  messageQueries: UserProfileMessageQueries;
  tab: Exclude<ProfileTab, 'transactions'>;
  user: UserProfile;
}) {
  if (tab === 'overview') return <UserProfileOverviewTab user={user} />;
  if (tab === 'activity') return <UserProfileActivityTab user={user} />;
  if (tab === 'payment') return <UserProfilePayment user={user} />;
  if (tab === 'promotions') return <UserProfilePromotions user={user} />;
  if (tab === 'sms-logs') return <UserProfileSmsLogsTab query={messageQueries.smsLogs} />;
  return <UserProfileNotificationMessagesTab query={messageQueries.notificationMessages} />;
}
