import type { UseQueryResult } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BellRing, CheckCircle2, MessageSquareText, XCircle } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import type { UserNotificationMessage, UserSmsLog } from '../user-service';
import { MiniBadge, SectionHeading, SurfaceCard } from './user-profile-common';
import { profileColors } from './user-profile-helpers';

type MessageQuery<T> = Pick<UseQueryResult<T[], Error>, 'data' | 'error' | 'isError' | 'isLoading' | 'isPending' | 'refetch'>;

type SmsResponse = {
  CodeResult?: string;
  ErrorMessage?: string;
};

function formatLabel(value?: string | null) {
  if (!value) return 'General';

  return value
    .replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatPhone(value?: string | null) {
  if (!value) return 'Unknown phone';
  return value.startsWith('84') ? `+${value}` : value;
}

function formatTimestamp(value?: string | null) {
  if (!value) return 'Time unavailable';
  const timestamp = dayjs(value);
  return timestamp.isValid() ? timestamp.format('DD MMM YYYY · HH:mm') : value;
}

function stripMarkup(value?: string | null) {
  if (!value) return '';

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replaceAll('&nbsp;', ' ')
    .trim();
}

function parseSmsResponse(value?: string | null): SmsResponse {
  if (!value) return {};

  try {
    return JSON.parse(value) as SmsResponse;
  } catch {
    return {};
  }
}

function MessageListSkeleton() {
  return (
    <ThemedView backgroundColor='transparent' gap={'two'}>
      <ThemedView borderCurve='continuous' borderRadius={12} height={132} loading />
      <ThemedView borderCurve='continuous' borderRadius={12} height={132} loading />
      <ThemedView borderCurve='continuous' borderRadius={12} height={132} loading />
    </ThemedView>
  );
}

function MessageListError({ message, onRetry, title }: { message: string; onRetry: () => void; title: string }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <EmptyState message={message} title={title} />
      <AppButton block label='Retry' onPress={onRetry} />
    </ThemedView>
  );
}

function NotificationMessageCard({ item }: { item: UserNotificationMessage }) {
  const title = item.titleEn || item.titleVn || `Notification #${item.id}`;
  const message = item.messageEn || item.messageVn || '';
  const detail = stripMarkup(item.contentEn || item.contentVn);

  return (
    <SurfaceCard>
      <ThemedView backgroundColor='transparent' gap={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
          <ThemedView alignItems='center' backgroundColor={profileColors.purpleSurface} borderRadius={12} height={40} justifyContent='center' width={40}>
            <BellRing color={profileColors.purple} size={19} strokeWidth={2.1} />
          </ThemedView>
          <ThemedView backgroundColor='transparent' flex={1} gap={3} minWidth={0}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={2} selectable>
              {title}
            </ThemedText>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} numberOfLines={1}>
              #{item.id} · {formatLabel(item.messageType)}
            </ThemedText>
          </ThemedView>
          <MiniBadge
            color={item.isSaw ? profileColors.accent : profileColors.purple}
            label={item.isSaw ? 'Seen' : 'Unread'}
            surface={item.isSaw ? profileColors.accentSurface : profileColors.purpleSurface}
          />
        </ThemedView>

        {message ? (
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={18} selectable>
            {message}
          </ThemedText>
        ) : null}
        {detail && detail !== message ? (
          <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={10} padding={'two'}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={17} selectable>
              {detail}
            </ThemedText>
          </ThemedView>
        ) : null}
        {item.invoiceId ? (
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={15} numberOfLines={1} selectable>
            Invoice · {item.invoiceId}
          </ThemedText>
        ) : null}
      </ThemedView>
    </SurfaceCard>
  );
}

function SmsLogCard({ item }: { item: UserSmsLog }) {
  const response = parseSmsResponse(item.response);
  const failed = Boolean(response.CodeResult && response.CodeResult !== '100');
  const statusLabel = response.CodeResult ? (failed ? `Failed · ${response.CodeResult}` : 'Sent') : 'Logged';

  return (
    <SurfaceCard>
      <ThemedView backgroundColor='transparent' gap={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
          <ThemedView
            alignItems='center'
            backgroundColor={failed ? profileColors.dangerSurface : profileColors.infoSurface}
            borderRadius={12}
            height={40}
            justifyContent='center'
            width={40}>
            <MessageSquareText color={failed ? profileColors.danger : profileColors.info} size={19} strokeWidth={2.1} />
          </ThemedView>
          <ThemedView backgroundColor='transparent' flex={1} gap={3} minWidth={0}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} selectable>
              {formatPhone(item.phone)}
            </ThemedText>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} numberOfLines={1}>
              #{item.id} · {item.brandName || 'SMS'} · {formatTimestamp(item.createdAt || item.sendDate)}
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={5}>
            {failed ? <XCircle color={profileColors.danger} size={15} /> : <CheckCircle2 color={profileColors.accent} size={15} />}
            <MiniBadge
              color={failed ? profileColors.danger : profileColors.accent}
              label={statusLabel}
              surface={failed ? profileColors.dangerSurface : profileColors.accentSurface}
            />
          </ThemedView>
        </ThemedView>

        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={18} selectable>
          {item.content || 'No SMS content was returned.'}
        </ThemedText>
        {response.ErrorMessage ? (
          <ThemedView backgroundColor={profileColors.dangerSurface} borderCurve='continuous' borderRadius={10} padding={'two'}>
            <ThemedText color={profileColors.danger} fontFamily={FontFamily.medium} fontSize={11} lineHeight={17} selectable>
              {response.ErrorMessage}
            </ThemedText>
          </ThemedView>
        ) : null}
      </ThemedView>
    </SurfaceCard>
  );
}

export function UserProfileNotificationMessagesTab({ query }: { query: MessageQuery<UserNotificationMessage> }) {
  if (query.isLoading || (query.isPending && !query.data)) return <MessageListSkeleton />;
  if (query.isError && !query.data?.length) {
    return (
      <MessageListError
        message={query.error?.message || 'Notification messages could not be loaded.'}
        onRetry={() => void query.refetch()}
        title='Notifications unavailable'
      />
    );
  }
  if (!query.data?.length) return <EmptyState message='No notification messages were found for this user.' title='No notifications' />;

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading count={query.data.length} eyebrow='Communication' subtitle='Push messages sent to this account.' title='Notification messages' />
      <ThemedView backgroundColor='transparent' gap={'two'}>
        {query.data.map(item => (
          <NotificationMessageCard item={item} key={item['@id'] || `notification-${item.id}`} />
        ))}
      </ThemedView>
    </ThemedView>
  );
}

export function UserProfileSmsLogsTab({ query }: { query: MessageQuery<UserSmsLog> }) {
  if (query.isLoading || (query.isPending && !query.data)) return <MessageListSkeleton />;
  if (query.isError && !query.data?.length) {
    return (
      <MessageListError message={query.error?.message || 'SMS logs could not be loaded.'} onRetry={() => void query.refetch()} title='SMS logs unavailable' />
    );
  }
  if (!query.data?.length) return <EmptyState message='No SMS logs were found for this user.' title='No SMS logs' />;

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading count={query.data.length} eyebrow='Communication' subtitle='Delivery attempts and provider responses.' title='SMS logs' />
      <ThemedView backgroundColor='transparent' gap={'two'}>
        {query.data.map(item => (
          <SmsLogCard item={item} key={item.iriId || item['@id'] || `sms-${item.id}`} />
        ))}
      </ThemedView>
    </ThemedView>
  );
}
