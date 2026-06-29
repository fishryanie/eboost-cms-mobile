import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText, ThemedView } from 'components/base';
import { EmptyState } from 'components/ui/empty-state';
import { useStaffActivities, type StaffMember } from './staff-data';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

export function StaffLogsSheet({ member, onClose, visible }: { member: StaffMember | null; onClose: () => void; visible: boolean }) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresented = useRef(false);
  const { bottom } = useSafeAreaInsets();
  const logsQuery = useStaffActivities(member?.id);
  const logs = logsQuery.data ?? [];

  useEffect(() => {
    if (visible) {
      ref.current?.present();
      isPresented.current = true;
      return;
    }
    if (isPresented.current) {
      ref.current?.dismiss();
      isPresented.current = false;
    }
  }, [visible]);

  const snapPoints = useMemo(() => ['80%', '90%'], []);
  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />, []);

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      onDismiss={() => {
        isPresented.current = false;
        onClose();
      }}
      ref={ref}
      snapPoints={snapPoints}>
      <ThemedView gap={'three'} paddingHorizontal={'four'} paddingBottom={'three'}>
        <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16} textTransform='uppercase'>
          Activity Logs
        </ThemedText>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={22} lineHeight={28} numberOfLines={1}>
          {member?.name || member?.username || 'Administrator'}
        </ThemedText>
      </ThemedView>
      <BottomSheetFlatList
        contentContainerStyle={[styles.logList, { paddingBottom: bottom + mhs(24) }]}
        data={logs}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          logsQuery.isLoading ? (
            <ThemedView gap={'three'} paddingVertical={'four'}>
              <ThemedView borderRadius={'large'} height={62} loading />
              <ThemedView borderRadius={'large'} height={62} loading />
              <ThemedView borderRadius={'large'} height={62} loading />
            </ThemedView>
          ) : (
            <EmptyState message='No recent administrator activities were returned.' title='No activity' />
          )
        }
        renderItem={({ item, index }) => <StaffLogRow isLast={index === logs.length - 1} log={item} />}
      />
    </BottomSheetModal>
  );
}

function StaffLogRow({ isLast, log }: { isLast: boolean; log: { action: string; createdAt: string; ipAddress: string; userAgent: string } }) {
  const [method, ...urlParts] = log.action.split(' ');
  const color = method === 'POST' ? Palette.accent : method === 'DELETE' ? Palette.danger : method === 'PATCH' || method === 'PUT' ? '#B45309' : '#2563EB';

  return (
    <ThemedView flexDirection='row'>
      <ThemedView alignItems='center' width={mhs(40)}>
        <ThemedView backgroundColor={color} borderRadius={'pill'} height={mhs(10)} marginTop={mhs(6)} width={mhs(10)} />
        {!isLast && <ThemedView backgroundColor={Palette.borderSubtle} flex={1} marginBottom={-mhs(8)} marginTop={mhs(4)} width={StyleSheet.hairlineWidth} />}
      </ThemedView>

      <ThemedView flex={1} paddingBottom={'four'} paddingRight={'four'}>
        <ThemedView alignItems='flex-start' flexDirection='row' justifyContent='space-between' marginBottom={'one'}>
          <ThemedText color={color} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
            {method || 'LOG'}
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
            {new Date(log.createdAt).toLocaleString()}
          </ThemedText>
        </ThemedView>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20} marginBottom={'one'} selectable>
          {urlParts.join(' ') || log.action}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18} selectable>
          IP: {log.ipAddress || '-'} · {log.userAgent || '-'}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  logList: {
    paddingHorizontal: mhs(16),
  },
});
