import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { BellRing, Check, CircleCheck, Trash2, TriangleAlert } from 'lucide-react-native';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';

import { HeaderTitle, ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { AppSegment } from 'components/ui/app-segment';
import { FontFamily, Palette } from 'themes';

import {
  adminNotificationKeys,
  deleteAdminNotification,
  getAdminNotificationDateFilters,
  getNotificationCategory,
  getNotificationTypeLabel,
  mergeAdminNotificationPages,
  readAdminNotification,
  updateAdminNotificationCache,
  useInfiniteAdminNotifications,
  type AdminNotification,
  type AdminNotificationCache,
  type AdminNotificationCategory,
  type AdminNotificationId,
} from './admin-notification-service';

const notificationFilters = [
  { label: 'Today', value: 1 },
  { label: '3 days', value: 3 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
] as const;
const emptyNotifications: AdminNotification[] = [];

export type NotificationDays = (typeof notificationFilters)[number]['value'];

export function AdminNotificationsScreen() {
  const [notificationDays, setNotificationDays] = useState<NotificationDays>(1);
  const queryClient = useQueryClient();
  const notificationsQuery = useInfiniteAdminNotifications(getAdminNotificationDateFilters(notificationDays));
  const notifications = useMemo(
    () => (notificationsQuery.data ? mergeAdminNotificationPages(notificationsQuery.data.pages) : emptyNotifications),
    [notificationsQuery.data],
  );
  const unreadCount = notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0);

  const readMutation = useMutation({
    mutationFn: readAdminNotification,
    onMutate: async notificationId => {
      const strId = String(notificationId);
      await queryClient.cancelQueries({ queryKey: adminNotificationKeys.all });
      const previousQueries = queryClient.getQueriesData<AdminNotificationCache>({ queryKey: adminNotificationKeys.all });

      queryClient.setQueriesData<AdminNotificationCache>({ queryKey: adminNotificationKeys.all }, current =>
        updateAdminNotificationCache(current, items =>
          items.map(notification => (String(notification.id) === strId ? { ...notification, isRead: true } : notification)),
        ),
      );

      return { previousQueries };
    },
    onError: (error: Error, _notificationId, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      Toast.show({ text1: 'Could not mark notification as read', text2: error.message, type: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminNotification,
    onMutate: async notificationId => {
      await queryClient.cancelQueries({ queryKey: adminNotificationKeys.all });
      const previousQueries = queryClient.getQueriesData<AdminNotificationCache>({ queryKey: adminNotificationKeys.all });
      queryClient.setQueriesData<AdminNotificationCache>({ queryKey: adminNotificationKeys.all }, current =>
        updateAdminNotificationCache(current, items => items.filter(notification => String(notification.id) !== String(notificationId))),
      );
      return { previousQueries };
    },
    onSuccess: () => Toast.show({ text1: 'Notification deleted', type: 'success' }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminNotificationKeys.all });
    },
    onError: (error: Error, _notificationId, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      Toast.show({ text1: 'Could not delete notification', text2: error.message, type: 'error' });
    },
  });

  const confirmDelete = (notification: AdminNotification) => {
    Alert.alert('Delete notification?', `“${notification.title}” will be removed permanently.`, [
      { style: 'cancel', text: 'Cancel' },
      { onPress: () => deleteMutation.mutate(notification.id), style: 'destructive', text: 'Delete' },
    ]);
  };

  const loadMore = () => {
    if (notificationsQuery.hasNextPage && !notificationsQuery.isFetching && !notificationsQuery.isFetchNextPageError) {
      notificationsQuery.fetchNextPage({ cancelRefetch: false });
    }
  };

  return (
    <ThemedView backgroundColor={Palette.surfaceMuted} flex={1}>
      <HeaderTitle
        rightComponent={
          unreadCount > 0 ? (
            <ThemedView backgroundColor='#DDF5E7' borderRadius={'pill'} minWidth={24} paddingHorizontal={8} paddingVertical={3}>
              <ThemedText color='#08773A' fontFamily={FontFamily.bold} fontSize={11} lineHeight={15} textAlign='center'>
                {unreadCount}
              </ThemedText>
            </ThemedView>
          ) : null
        }
        showBorderBottom={false}
        title='Notifications'
      />
      <FlatList
        key={notificationDays}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        contentInsetAdjustmentBehavior='automatic'
        data={notifications}
        ItemSeparatorComponent={() => <ThemedView backgroundColor='transparent' height={10} />}
        keyExtractor={notification => String(notification.id)}
        ListEmptyComponent={
          <NotificationListState
            days={notificationDays}
            error={notificationsQuery.error}
            isLoading={notificationsQuery.isLoading}
            onRetry={() => notificationsQuery.refetch()}
          />
        }
        ListFooterComponent={
          notifications.length > 0 ? (
            <NotificationListFooter
              error={notificationsQuery.error}
              isLoading={notificationsQuery.isFetchingNextPage}
              onRetry={() =>
                notificationsQuery.isFetchNextPageError ? notificationsQuery.fetchNextPage({ cancelRefetch: false }) : notificationsQuery.refetch()
              }
            />
          ) : null
        }
        ListHeaderComponent={<NotificationFilterHeader days={notificationDays} onChangeDays={setNotificationDays} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl onRefresh={() => notificationsQuery.refetch()} refreshing={notificationsQuery.isRefetching} tintColor={Palette.accent} />
        }
        renderItem={({ item }) => (
          <NotificationRow
            deleting={deleteMutation.isPending && String(deleteMutation.variables) === String(item.id)}
            notification={item}
            onDelete={confirmDelete}
            onRead={(notificationId: AdminNotificationId) => readMutation.mutate(notificationId)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

function NotificationFilterHeader({ days, onChangeDays }: { days: NotificationDays; onChangeDays: (days: NotificationDays) => void }) {
  return (
    <ThemedView backgroundColor={Palette.surfaceMuted} paddingBottom={10} paddingHorizontal={12} paddingTop={12}>
      <AppSegment onChange={onChangeDays} options={notificationFilters} value={days} />
    </ThemedView>
  );
}

function NotificationListFooter({ error, isLoading, onRetry }: { error: Error | null; isLoading: boolean; onRetry: () => void }) {
  if (isLoading) {
    return (
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={8} justifyContent='center' paddingVertical={20}>
        <ActivityIndicator color={Palette.accent} size='small' />
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17}>
          Loading more notifications…
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView alignItems='center' backgroundColor='transparent' gap={10} paddingHorizontal={12} paddingVertical={16}>
        <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={17} textAlign='center'>
          {error.message}
        </ThemedText>
        <AppButton label='Retry' onPress={onRetry} />
      </ThemedView>
    );
  }

  return null;
}

function NotificationRow({
  deleting,
  notification,
  onDelete,
  onRead,
}: {
  deleting: boolean;
  notification: AdminNotification;
  onDelete: (notification: AdminNotification) => void;
  onRead: (notificationId: AdminNotificationId) => void;
}) {
  const isUnread = !notification.isRead;
  const category = getNotificationCategory(notification.type);
  const typeLabel = getNotificationTypeLabel(notification.type);
  const formattedDate = formatNotificationDate(notification.createdAt);

  const cardBg = isUnread ? (category === 'BOX_ISSUE' ? '#FFF9F8' : category === 'BOX_RECOVERY' ? '#F1FBF5' : '#F4FAF6') : Palette.surfaceRaised;

  const cardBorder = isUnread ? (category === 'BOX_ISSUE' ? '#FECDCA' : category === 'BOX_RECOVERY' ? '#B7E5CA' : '#B7E5CA') : Palette.borderSubtle;

  return (
    <ThemedView
      backgroundColor={cardBg}
      borderColor={cardBorder}
      borderCurve='continuous'
      borderRadius={18}
      borderWidth={1}
      flexDirection='row'
      marginHorizontal={12}
      overflow='hidden'>
      <Pressable
        accessibilityHint={isUnread ? 'Marks this notification as read' : undefined}
        accessibilityLabel={`${notification.title}, ${isUnread ? 'unread' : 'read'}`}
        accessibilityRole='button'
        disabled={!isUnread}
        onPress={() => onRead(notification.id)}
        style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.72 : 1 })}>
        <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={12} padding={14}>
          <NotificationAvatar category={category} isUnread={isUnread} />

          <ThemedView backgroundColor='transparent' flex={1} gap={6} minWidth={0}>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={6} justifyContent='space-between'>
              <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={6}>
                {typeLabel ? <NotificationTypeBadge category={category} label={typeLabel} /> : null}
                {isUnread ? (
                  <ThemedView
                    alignItems='center'
                    backgroundColor='#08773A'
                    borderRadius={'pill'}
                    justifyContent='center'
                    paddingHorizontal={8}
                    paddingVertical={2.5}>
                    <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={9.5} letterSpacing={0.6} lineHeight={13} textTransform='uppercase'>
                      New
                    </ThemedText>
                  </ThemedView>
                ) : null}
              </ThemedView>
              {formattedDate ? (
                <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
                  {formattedDate}
                </ThemedText>
              ) : null}
            </ThemedView>

            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20} numberOfLines={2}>
              {notification.title}
            </ThemedText>

            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18}>
              {notification.message}
            </ThemedText>

            {notification.content && notification.content !== notification.message ? (
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} numberOfLines={3}>
                {notification.content}
              </ThemedText>
            ) : null}
          </ThemedView>
        </ThemedView>
      </Pressable>

      <Pressable
        accessibilityLabel={`Delete ${notification.title}`}
        accessibilityRole='button'
        disabled={deleting}
        hitSlop={6}
        onPress={() => onDelete(notification)}
        style={({ pressed }) => ({ alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1, width: 48 })}>
        {deleting ? <ActivityIndicator color={Palette.danger} size='small' /> : <Trash2 color={Palette.textTertiary} size={19} strokeWidth={1.9} />}
      </Pressable>
    </ThemedView>
  );
}

function NotificationAvatar({ category, isUnread }: { category: AdminNotificationCategory | null; isUnread: boolean }) {
  if (category === 'BOX_ISSUE') {
    return (
      <ThemedView
        alignItems='center'
        backgroundColor={isUnread ? '#FEE4E2' : '#FEF3F2'}
        borderCurve='continuous'
        borderColor={isUnread ? '#FDA29B' : '#FECDCA'}
        borderRadius={14}
        borderWidth={1}
        height={44}
        justifyContent='center'
        width={44}>
        <TriangleAlert color={isUnread ? '#D92D20' : '#B42318'} size={21} strokeWidth={2.3} />
      </ThemedView>
    );
  }

  if (category === 'BOX_RECOVERY') {
    return (
      <ThemedView
        alignItems='center'
        backgroundColor={isUnread ? '#D1FADF' : '#ECFDF3'}
        borderCurve='continuous'
        borderColor={isUnread ? '#A6F4C5' : '#D1FADF'}
        borderRadius={14}
        borderWidth={1}
        height={44}
        justifyContent='center'
        width={44}>
        <CircleCheck color={isUnread ? '#079455' : '#027A48'} size={21} strokeWidth={2.3} />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      alignItems='center'
      backgroundColor={isUnread ? Palette.accent : Palette.surfaceMuted}
      borderCurve='continuous'
      borderRadius={14}
      height={44}
      justifyContent='center'
      width={44}>
      {isUnread ? <BellRing color='#FFFFFF' size={21} strokeWidth={2} /> : <Check color={Palette.textTertiary} size={21} strokeWidth={2.2} />}
    </ThemedView>
  );
}

function NotificationTypeBadge({ category, label }: { category: AdminNotificationCategory | null; label: string }) {
  if (category === 'BOX_ISSUE') {
    return (
      <ThemedView
        alignItems='center'
        backgroundColor='#FEE4E2'
        borderColor='#FDA29B'
        borderRadius={'pill'}
        borderWidth={1}
        flexDirection='row'
        gap={4}
        paddingHorizontal={8}
        paddingVertical={3}>
        <TriangleAlert color='#D92D20' size={12} strokeWidth={2.5} />
        <ThemedText color='#B42318' fontFamily={FontFamily.bold} fontSize={11} letterSpacing={0.2} lineHeight={15}>
          {label}
        </ThemedText>
      </ThemedView>
    );
  }

  if (category === 'BOX_RECOVERY') {
    return (
      <ThemedView
        alignItems='center'
        backgroundColor='#D1FADF'
        borderColor='#A6F4C5'
        borderRadius={'pill'}
        borderWidth={1}
        flexDirection='row'
        gap={4}
        paddingHorizontal={8}
        paddingVertical={3}>
        <CircleCheck color='#079455' size={12} strokeWidth={2.5} />
        <ThemedText color='#027A48' fontFamily={FontFamily.bold} fontSize={11} letterSpacing={0.2} lineHeight={15}>
          {label}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      alignItems='center'
      backgroundColor='#EFF8FF'
      borderColor='#B2DDFF'
      borderRadius={'pill'}
      borderWidth={1}
      flexDirection='row'
      gap={4}
      paddingHorizontal={8}
      paddingVertical={3}>
      <BellRing color='#175CD3' size={11} strokeWidth={2.2} />
      <ThemedText color='#175CD3' fontFamily={FontFamily.bold} fontSize={11} letterSpacing={0.2} lineHeight={15}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function NotificationListState({ days, error, isLoading, onRetry }: { days: NotificationDays; error: Error | null; isLoading: boolean; onRetry: () => void }) {
  if (isLoading) {
    return (
      <ThemedView gap={12} paddingHorizontal={12} paddingTop={18}>
        {Array.from({ length: 5 }, (_, index) => (
          <ThemedView key={index} alignItems='center' backgroundColor={Palette.surfaceRaised} borderRadius={18} flexDirection='row' gap={12} padding={14}>
            <ThemedView borderRadius={14} height={44} loading width={44} />
            <ThemedView flex={1} gap={7}>
              <ThemedView borderRadius={'pill'} height={13} loading width='58%' />
              <ThemedView borderRadius={'pill'} height={10} loading width='88%' />
              <ThemedView borderRadius={'pill'} height={10} loading width='42%' />
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView gap={14} padding={12}>
        <EmptyState message={error.message} title='Unable to load notifications' />
        <AppButton block label='Retry' onPress={onRetry} />
      </ThemedView>
    );
  }

  const message = days === 1 ? 'Admin notifications from today will appear here.' : `Admin notifications from the last ${days} days will appear here.`;

  return (
    <ThemedView padding={12}>
      <EmptyState message={message} title='No notifications' />
    </ThemedView>
  );
}

function formatNotificationDate(value: string | null) {
  if (!value) return null;
  const date = dayjs(value);
  if (!date.isValid()) return null;
  return date.format('DD MMM YYYY, HH:mm');
}
