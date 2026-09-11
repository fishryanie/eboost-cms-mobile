import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { BellRing, Check, CircleCheck, Trash2, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';

import { HeaderTitle, ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import {
  adminNotificationKeys,
  deleteAdminNotification,
  getNotificationCategory,
  getNotificationTypeLabel,
  readAdminNotification,
  useAdminNotifications,
  type AdminNotification,
  type AdminNotificationCategory,
  type AdminNotificationId,
} from './admin-notification-service';

const notificationFilters = [
  { days: 1, label: 'Today' },
  { days: 3, label: '3 days' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
] as const;
const emptyNotifications: AdminNotification[] = [];

export type NotificationDays = (typeof notificationFilters)[number]['days'];
export type NotificationTypeFilter = 'ALL' | 'BOX_ISSUE' | 'BOX_RECOVERY' | 'OTHER';

export function AdminNotificationsScreen() {
  const [notificationDays, setNotificationDays] = useState<NotificationDays>(1);
  const [selectedType, setSelectedType] = useState<NotificationTypeFilter>('ALL');
  const queryClient = useQueryClient();
  const notificationsQuery = useAdminNotifications(notificationDays);
  const notifications = notificationsQuery.data || emptyNotifications;
  const unreadCount = notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0);

  const typeCounts = useMemo(() => {
    const counts = { ALL: notifications.length, BOX_ISSUE: 0, BOX_RECOVERY: 0, OTHER: 0 };
    for (const notification of notifications) {
      const category = getNotificationCategory(notification.type);
      if (category === 'BOX_ISSUE') counts.BOX_ISSUE += 1;
      else if (category === 'BOX_RECOVERY') counts.BOX_RECOVERY += 1;
      else counts.OTHER += 1;
    }
    return counts;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (selectedType === 'ALL') return notifications;
    if (selectedType === 'BOX_ISSUE') return notifications.filter(n => getNotificationCategory(n.type) === 'BOX_ISSUE');
    if (selectedType === 'BOX_RECOVERY') return notifications.filter(n => getNotificationCategory(n.type) === 'BOX_RECOVERY');
    return notifications.filter(n => {
      const category = getNotificationCategory(n.type);
      return category !== 'BOX_ISSUE' && category !== 'BOX_RECOVERY';
    });
  }, [notifications, selectedType]);

  const readMutation = useMutation({
    mutationFn: readAdminNotification,
    onMutate: async notificationId => {
      const strId = String(notificationId);
      await queryClient.cancelQueries({ queryKey: adminNotificationKeys.all });
      const previousQueries = queryClient.getQueriesData<AdminNotification[]>({ queryKey: adminNotificationKeys.all });

      queryClient.setQueriesData<AdminNotification[]>({ queryKey: adminNotificationKeys.all }, current =>
        current?.map(notification => (String(notification.id) === strId ? { ...notification, isRead: true } : notification)),
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
      const queryKey = adminNotificationKeys.list(notificationDays);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<AdminNotification[]>(queryKey);
      queryClient.setQueryData<AdminNotification[]>(queryKey, current => current?.filter(notification => String(notification.id) !== String(notificationId)));
      return { previous };
    },
    onSuccess: () => Toast.show({ text1: 'Notification deleted', type: 'success' }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminNotificationKeys.all });
    },
    onError: (error: Error, _notificationId, context) => {
      if (context?.previous) queryClient.setQueryData(adminNotificationKeys.list(notificationDays), context.previous);
      Toast.show({ text1: 'Could not delete notification', text2: error.message, type: 'error' });
    },
  });

  const confirmDelete = (notification: AdminNotification) => {
    Alert.alert('Delete notification?', `“${notification.title}” will be removed permanently.`, [
      { style: 'cancel', text: 'Cancel' },
      { onPress: () => deleteMutation.mutate(notification.id), style: 'destructive', text: 'Delete' },
    ]);
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        contentInsetAdjustmentBehavior='automatic'
        data={filteredNotifications}
        ItemSeparatorComponent={() => <ThemedView backgroundColor='transparent' height={10} />}
        keyExtractor={notification => String(notification.id)}
        ListEmptyComponent={
          <NotificationListState
            days={notificationDays}
            error={notificationsQuery.error}
            filterType={selectedType}
            isLoading={notificationsQuery.isLoading}
            onRetry={() => notificationsQuery.refetch()}
          />
        }
        ListHeaderComponent={
          <NotificationFilterHeader
            days={notificationDays}
            onChangeDays={setNotificationDays}
            onChangeType={setSelectedType}
            selectedType={selectedType}
            typeCounts={typeCounts}
          />
        }
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

function NotificationFilterHeader({
  days,
  onChangeDays,
  onChangeType,
  selectedType,
  typeCounts,
}: {
  days: NotificationDays;
  onChangeDays: (days: NotificationDays) => void;
  onChangeType: (type: NotificationTypeFilter) => void;
  selectedType: NotificationTypeFilter;
  typeCounts: { ALL: number; BOX_ISSUE: number; BOX_RECOVERY: number; OTHER: number };
}) {
  const selectedIndex = notificationFilters.findIndex(filter => filter.days === days);

  const filterOptions: { count: number; Icon?: LucideIcon; id: NotificationTypeFilter; label: string }[] = [
    { count: typeCounts.ALL, id: 'ALL', label: 'All' },
    { count: typeCounts.BOX_ISSUE, Icon: TriangleAlert, id: 'BOX_ISSUE', label: 'Box Issue' },
    { count: typeCounts.BOX_RECOVERY, Icon: CircleCheck, id: 'BOX_RECOVERY', label: 'Box Recovery' },
  ];

  if (typeCounts.OTHER > 0) {
    filterOptions.push({ count: typeCounts.OTHER, Icon: BellRing, id: 'OTHER', label: 'Other' });
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceMuted} gap={10} paddingBottom={10} paddingTop={12}>
      <ThemedView paddingHorizontal={12}>
        <SegmentedControl
          onChange={event => {
            const nextDays = notificationFilters[event.nativeEvent.selectedSegmentIndex]?.days;
            if (nextDays) onChangeDays(nextDays);
          }}
          selectedIndex={selectedIndex}
          style={{ height: 36 }}
          tintColor={Palette.accent}
          values={notificationFilters.map(filter => filter.label)}
        />
      </ThemedView>

      <ScrollView contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }} horizontal showsHorizontalScrollIndicator={false}>
        {filterOptions.map(option => (
          <TypeFilterChip
            key={option.id}
            count={option.count}
            Icon={option.Icon}
            label={option.label}
            onPress={() => onChangeType(selectedType === option.id && option.id !== 'ALL' ? 'ALL' : option.id)}
            selected={selectedType === option.id}
            type={option.id}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

function TypeFilterChip({
  count,
  Icon,
  label,
  onPress,
  selected,
  type,
}: {
  count: number;
  Icon?: LucideIcon;
  label: string;
  onPress: () => void;
  selected: boolean;
  type: NotificationTypeFilter;
}) {
  const visual = getTypeChipVisual(type, selected);

  return (
    <Pressable
      accessibilityLabel={`Filter ${label}, ${count} notifications`}
      accessibilityRole='button'
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <ThemedView
        alignItems='center'
        backgroundColor={visual.backgroundColor}
        borderColor={visual.borderColor}
        borderRadius={'pill'}
        borderWidth={1.5}
        flexDirection='row'
        gap={6}
        height={36}
        paddingHorizontal={12}>
        {Icon ? <Icon color={visual.iconColor} size={14} strokeWidth={2.4} /> : null}
        <ThemedText color={visual.textColor} fontFamily={FontFamily.bold} fontSize={13} lineHeight={17}>
          {label}
        </ThemedText>
        <ThemedView
          alignItems='center'
          backgroundColor={visual.countBg}
          borderRadius={'pill'}
          justifyContent='center'
          minWidth={20}
          paddingHorizontal={6}
          paddingVertical={2}>
          <ThemedText color={visual.countText} fontFamily={FontFamily.bold} fontSize={11} lineHeight={14}>
            {count}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

function getTypeChipVisual(type: NotificationTypeFilter, selected: boolean) {
  if (type === 'BOX_ISSUE') {
    if (selected) {
      return {
        backgroundColor: '#D92D20',
        borderColor: '#D92D20',
        countBg: 'rgba(255,255,255,0.25)',
        countText: '#FFFFFF',
        iconColor: '#FFFFFF',
        textColor: '#FFFFFF',
      };
    }
    return {
      backgroundColor: '#FEF3F2',
      borderColor: '#FECDCA',
      countBg: '#FEE4E2',
      countText: '#912018',
      iconColor: '#D92D20',
      textColor: '#B42318',
    };
  }

  if (type === 'BOX_RECOVERY') {
    if (selected) {
      return {
        backgroundColor: '#079455',
        borderColor: '#079455',
        countBg: 'rgba(255,255,255,0.25)',
        countText: '#FFFFFF',
        iconColor: '#FFFFFF',
        textColor: '#FFFFFF',
      };
    }
    return {
      backgroundColor: '#ECFDF3',
      borderColor: '#A6F4C5',
      countBg: '#D1FADF',
      countText: '#05603A',
      iconColor: '#12B76A',
      textColor: '#027A48',
    };
  }

  if (type === 'OTHER') {
    if (selected) {
      return {
        backgroundColor: '#175CD3',
        borderColor: '#175CD3',
        countBg: 'rgba(255,255,255,0.25)',
        countText: '#FFFFFF',
        iconColor: '#FFFFFF',
        textColor: '#FFFFFF',
      };
    }
    return {
      backgroundColor: '#EFF8FF',
      borderColor: '#B2DDFF',
      countBg: '#D1E9FF',
      countText: '#175CD3',
      iconColor: '#2E90FA',
      textColor: '#175CD3',
    };
  }

  // ALL
  if (selected) {
    return {
      backgroundColor: '#1D2939',
      borderColor: '#1D2939',
      countBg: 'rgba(255,255,255,0.2)',
      countText: '#FFFFFF',
      iconColor: '#FFFFFF',
      textColor: '#FFFFFF',
    };
  }
  return {
    backgroundColor: Palette.surfaceBase,
    borderColor: Palette.borderSubtle,
    countBg: Palette.surfaceMuted,
    countText: Palette.textSecondary,
    iconColor: Palette.textPrimary,
    textColor: Palette.textPrimary,
  };
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

function NotificationListState({
  days,
  error,
  filterType,
  isLoading,
  onRetry,
}: {
  days: NotificationDays;
  error: Error | null;
  filterType: NotificationTypeFilter;
  isLoading: boolean;
  onRetry: () => void;
}) {
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

  let title = 'No notifications';
  let message = days === 1 ? 'Admin notifications from today will appear here.' : `Admin notifications from the last ${days} days will appear here.`;

  if (filterType === 'BOX_ISSUE') {
    title = 'No box issues';
    message = days === 1 ? 'No box issue notifications from today.' : `No box issue notifications from the last ${days} days.`;
  } else if (filterType === 'BOX_RECOVERY') {
    title = 'No box recoveries';
    message = days === 1 ? 'No box recovery notifications from today.' : `No box recovery notifications from the last ${days} days.`;
  } else if (filterType === 'OTHER') {
    title = 'No other notifications';
    message = days === 1 ? 'No other notifications from today.' : `No other notifications from the last ${days} days.`;
  }

  return (
    <ThemedView padding={12}>
      <EmptyState message={message} title={title} />
    </ThemedView>
  );
}

function formatNotificationDate(value: string | null) {
  if (!value) return null;
  const date = dayjs(value);
  if (!date.isValid()) return null;
  return date.format('DD MMM YYYY, HH:mm');
}
