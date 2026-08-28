import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BellRing, Check, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SectionList } from 'react-native';
import Toast from 'react-native-toast-message';

import { HeaderTitle, ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import {
  adminNotificationKeys,
  deleteAdminNotification,
  readAdminNotification,
  useAdminNotifications,
  type AdminNotification,
  type AdminNotificationId,
} from './admin-notification-service';

const notificationDays = 30;
const emptyNotifications: AdminNotification[] = [];

type NotificationSection = {
  data: AdminNotification[];
  title: 'Read' | 'Unread';
};

export function AdminNotificationsScreen() {
  const queryClient = useQueryClient();
  const notificationsQuery = useAdminNotifications(notificationDays);
  const notifications = notificationsQuery.data || emptyNotifications;
  const unreadCount = notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0);
  const sections = getNotificationSections(notifications);

  const readMutation = useMutation({
    mutationFn: readAdminNotification,
    onMutate: async notificationId => {
      const queryKey = adminNotificationKeys.list(notificationDays);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<AdminNotification[]>(queryKey);
      queryClient.setQueryData<AdminNotification[]>(queryKey, current =>
        current?.map(notification => (String(notification.id) === String(notificationId) ? { ...notification, isRead: true } : notification)),
      );
      return { previous };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminNotificationKeys.list(notificationDays) }),
    onError: (error: Error, _notificationId, context) => {
      if (context?.previous) queryClient.setQueryData(adminNotificationKeys.list(notificationDays), context.previous);
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminNotificationKeys.list(notificationDays) }),
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
      <HeaderTitle showBorderBottom={false} title='Notifications' />
      <SectionList
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        contentInsetAdjustmentBehavior='automatic'
        ItemSeparatorComponent={() => <ThemedView backgroundColor='transparent' height={10} />}
        keyExtractor={notification => String(notification.id)}
        ListEmptyComponent={
          <NotificationListState error={notificationsQuery.error} isLoading={notificationsQuery.isLoading} onRetry={() => notificationsQuery.refetch()} />
        }
        ListHeaderComponent={
          notificationsQuery.isLoading || notificationsQuery.isError ? null : <NotificationSummary total={notifications.length} unread={unreadCount} />
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
            reading={readMutation.isPending && String(readMutation.variables) === String(item.id)}
          />
        )}
        renderSectionHeader={({ section }) => <NotificationSectionHeader count={section.data.length} title={section.title} />}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </ThemedView>
  );
}

function NotificationRow({
  deleting,
  notification,
  onDelete,
  onRead,
  reading,
}: {
  deleting: boolean;
  notification: AdminNotification;
  onDelete: (notification: AdminNotification) => void;
  onRead: (notificationId: AdminNotificationId) => void;
  reading: boolean;
}) {
  const isUnread = !notification.isRead;
  const meta = [notification.type, formatNotificationDate(notification.createdAt)].filter(Boolean).join(' • ');

  return (
    <ThemedView
      backgroundColor={isUnread ? '#F1FBF5' : Palette.surfaceRaised}
      borderColor={isUnread ? '#B7E5CA' : Palette.borderSubtle}
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
        disabled={!isUnread || reading}
        onPress={() => onRead(notification.id)}
        style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.72 : 1 })}>
        <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={12} padding={14}>
          <ThemedView
            alignItems='center'
            backgroundColor={isUnread ? Palette.accent : Palette.surfaceMuted}
            borderCurve='continuous'
            borderRadius={14}
            height={44}
            justifyContent='center'
            width={44}>
            {reading ? (
              <ActivityIndicator color='#FFFFFF' size='small' />
            ) : isUnread ? (
              <BellRing color='#FFFFFF' size={21} strokeWidth={2} />
            ) : (
              <Check color={Palette.textTertiary} size={21} strokeWidth={2.2} />
            )}
          </ThemedView>

          <ThemedView backgroundColor='transparent' flex={1} gap={5} minWidth={0}>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={8}>
              <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} numberOfLines={2}>
                {notification.title}
              </ThemedText>
              {isUnread ? (
                <ThemedView backgroundColor='#DDF5E7' borderRadius={'pill'} paddingHorizontal={8} paddingVertical={3}>
                  <ThemedText color='#08773A' fontFamily={FontFamily.bold} fontSize={9} letterSpacing={0.5} lineHeight={12} textTransform='uppercase'>
                    New
                  </ThemedText>
                </ThemedView>
              ) : null}
            </ThemedView>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18}>
              {notification.message}
            </ThemedText>
            {notification.content && notification.content !== notification.message ? (
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} numberOfLines={3}>
                {notification.content}
              </ThemedText>
            ) : null}
            {meta ? (
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} marginTop={2}>
                {meta}
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

function getNotificationSections(notifications: AdminNotification[]): NotificationSection[] {
  const unread: AdminNotification[] = [];
  const read: AdminNotification[] = [];

  notifications.forEach(notification => {
    (notification.isRead ? read : unread).push(notification);
  });

  return [
    { data: unread, title: 'Unread' },
    { data: read, title: 'Read' },
  ].filter(section => section.data.length > 0) as NotificationSection[];
}

function NotificationSectionHeader({ count, title }: { count: number; title: NotificationSection['title'] }) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor={Palette.surfaceMuted}
      flexDirection='row'
      gap={8}
      paddingBottom={10}
      paddingHorizontal={14}
      paddingTop={18}>
      <ThemedText
        color={title === 'Unread' ? Palette.accent : Palette.textSecondary}
        fontFamily={FontFamily.bold}
        fontSize={12}
        letterSpacing={0.9}
        lineHeight={16}
        textTransform='uppercase'>
        {title}
      </ThemedText>
      <ThemedView backgroundColor={title === 'Unread' ? '#DDF5E7' : '#E9EDF1'} borderRadius={'pill'} minWidth={23} paddingHorizontal={7} paddingVertical={2}>
        <ThemedText
          color={title === 'Unread' ? '#08773A' : Palette.textSecondary}
          fontFamily={FontFamily.bold}
          fontSize={10}
          lineHeight={14}
          textAlign='center'>
          {count}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function NotificationSummary({ total, unread }: { total: number; unread: number }) {
  return (
    <ThemedView
      backgroundColor='#162033'
      borderCurve='continuous'
      borderRadius={22}
      gap={16}
      marginBottom={2}
      marginHorizontal={12}
      marginTop={12}
      padding={18}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={12}>
        <ThemedView alignItems='center' backgroundColor='rgba(255,255,255,0.12)' borderRadius={15} height={48} justifyContent='center' width={48}>
          <BellRing color='#FFFFFF' size={23} strokeWidth={2} />
        </ThemedView>
        <ThemedView backgroundColor='transparent' flex={1} gap={2}>
          <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={18} lineHeight={24}>
            30-day inbox
          </ThemedText>
          <ThemedText color='rgba(255,255,255,0.68)' fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
            Tap a new notification to mark it as read.
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView backgroundColor='rgba(255,255,255,0.08)' borderRadius={14} flexDirection='row' overflow='hidden'>
        <SummaryStat label='Unread' value={unread} />
        <ThemedView backgroundColor='rgba(255,255,255,0.12)' width={1} />
        <SummaryStat label='Read' value={Math.max(total - unread, 0)} />
        <ThemedView backgroundColor='rgba(255,255,255,0.12)' width={1} />
        <SummaryStat label='Total' value={total} />
      </ThemedView>
    </ThemedView>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flex={1} gap={2} paddingVertical={10}>
      <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={16} lineHeight={21}>
        {value}
      </ThemedText>
      <ThemedText color='rgba(255,255,255,0.62)' fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function NotificationListState({ error, isLoading, onRetry }: { error: Error | null; isLoading: boolean; onRetry: () => void }) {
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

  return (
    <ThemedView padding={12}>
      <EmptyState message='New admin notifications from the last 30 days will appear here.' title='No notifications' />
    </ThemedView>
  );
}

function formatNotificationDate(value: string | null) {
  if (!value) return null;
  const date = dayjs(value);
  if (!date.isValid()) return null;
  return date.format('DD MMM YYYY, HH:mm');
}
