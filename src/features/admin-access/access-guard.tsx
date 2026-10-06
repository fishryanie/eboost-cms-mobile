import { Redirect, useRouter } from 'expo-router';
import { LockKeyhole, RefreshCw } from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import type { AccessMethod } from 'features/administrator-access/types';
import { Palette } from 'themes';
import { useSessionToken } from 'utils/session/use-session-token';

import { useCurrentAdminAccess } from './hooks';
import { getRouteAccessRequirement, meetsScreenRequirement, type ScreenAccessRequirement } from './model';

export function AccessMessage({
  compact = false,
  loading = false,
  error = false,
  onRetry,
}: {
  compact?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const router = useRouter();
  return (
    <ThemedView
      accessibilityLiveRegion='polite'
      alignItems='center'
      backgroundColor={compact ? Palette.surfaceMuted : Palette.surfaceBase}
      borderRadius={compact ? 'large' : 0}
      flex={compact ? undefined : 1}
      gap={16}
      justifyContent='center'
      padding={24}
      safePaddingBottom={!compact}
      safePaddingTop={!compact}>
      {loading ? (
        <ThemedView borderRadius='large' height={56} loading width={56} />
      ) : (
        <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={20} height={64} justifyContent='center' width={64}>
          {error ? <RefreshCw color={Palette.textSecondary} size={28} /> : <LockKeyhole color={Palette.textSecondary} size={28} />}
        </ThemedView>
      )}
      <ThemedView alignItems='center' gap={8} maxWidth={340}>
        <ThemedText fontFamily='semibold' fontSize={compact ? 16 : 21} lineHeight={28} textAlign='center'>
          {loading ? 'Đang kiểm tra quyền truy cập' : error ? 'Chưa thể kiểm tra quyền truy cập' : 'Bạn không có quyền thao tác với màn hình này'}
        </ThemedText>
        {!loading ? (
          <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={21} selectable textAlign='center'>
            {error ? 'Vui lòng kiểm tra kết nối và thử lại.' : 'Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.'}
          </ThemedText>
        ) : null}
      </ThemedView>
      {!loading && (onRetry || !compact) ? (
        <ThemedView flexDirection='row' gap={12}>
          {onRetry ? <AccessButton label='Thử lại' onPress={onRetry} /> : null}
          {!compact ? <AccessButton label='Quay lại' onPress={() => (router.canGoBack() ? router.back() : router.replace('/technical'))} /> : null}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

function AccessButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole='button' onPress={onPress}>
      <ThemedView backgroundColor={Palette.accent} borderRadius={14} minHeight={44} paddingHorizontal={20} paddingVertical={12}>
        <ThemedText color='#FFFFFF' fontFamily='semibold' fontSize={14}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function RequiredAccessGuard({ children, requirement, compact }: PropsWithChildren<{ requirement: ScreenAccessRequirement; compact?: boolean }>) {
  const access = useCurrentAdminAccess(!compact);
  if (access.session.isPending) return <AccessMessage compact={compact} loading />;
  if (!access.session.data) return <Redirect href='/login' />;
  if (access.isError || access.fetchStatus === 'paused') return <AccessMessage compact={compact} error onRetry={() => void access.refetch()} />;
  if (!access.data) return <AccessMessage compact={compact} loading />;
  if (!meetsScreenRequirement(access.data, requirement)) return <AccessMessage compact={compact} onRetry={() => void access.refetch()} />;
  return <>{children}</>;
}

export function AdminAccessBoundary({
  children,
  screen,
  screens,
  methods = ['READ'],
  compact = true,
}: PropsWithChildren<{ screen?: string; screens?: string[]; methods?: AccessMethod[]; compact?: boolean }>) {
  return (
    <RequiredAccessGuard compact={compact} requirement={{ screens: screens || [screen || ''], methods }}>
      {children}
    </RequiredAccessGuard>
  );
}

function SessionGuard({ children }: PropsWithChildren) {
  const session = useSessionToken();
  if (session.isPending) return <AccessMessage loading />;
  if (!session.data) return <Redirect href='/login' />;
  return <>{children}</>;
}

export function AdminRouteGuard({ children, routeName, params }: PropsWithChildren<{ routeName: string; params?: Readonly<object> }>) {
  if (routeName === 'login/index') return <>{children}</>;
  const requirement = getRouteAccessRequirement(routeName, params as Record<string, unknown>);
  return requirement ? <RequiredAccessGuard requirement={requirement}>{children}</RequiredAccessGuard> : <SessionGuard>{children}</SessionGuard>;
}
