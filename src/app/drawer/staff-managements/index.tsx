import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, TextInput } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { ActionSheet, AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { staffKeys, useInfiniteStaff } from 'shared/staff/hooks';
import {
  archiveStaffMember,
  createStaffMember,
  formatStaffRole,
  formatStaffRoleSummary,
  resetStaffPassword,
  restoreStaffMember,
  staffRoles,
  updateStaffMember,
} from 'shared/staff/staff-service';
import type { StaffCreateInput, StaffListFilters, StaffMember, StaffRole } from 'shared/staff/types';

import { ChangePasswordSheet } from './change-password-sheet';
import { StaffLogsSheet } from './staff-logs';

type SheetMode = 'create' | 'logs' | 'password' | 'roles';

const emptyStaff: StaffMember[] = [];
const allRoles = [...staffRoles];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed. Please try again.';
}

function getInitials(member: Pick<StaffMember, 'email' | 'name' | 'username'>) {
  const label = member.name || member.username || member.email;
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

function StaffStatusPill({ deletedAt, enabled }: Pick<StaffMember, 'deletedAt' | 'enabled'>) {
  const label = deletedAt ? 'Archived' : enabled ? 'Enabled' : 'Disabled';
  const color = deletedAt ? Palette.textTertiary : enabled ? Palette.accent : Palette.danger;
  const backgroundColor = deletedAt ? Palette.surfaceMuted : enabled ? '#E8F4EF' : Palette.dangerSurface;

  return (
    <ThemedView backgroundColor={backgroundColor} borderRadius={'pill'} paddingHorizontal={9} paddingVertical={5}>
      <ThemedText color={color} fontFamily={FontFamily.bold} fontSize={11} lineHeight={14}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function getRoleStyle(roles?: string[]) {
  if (roles?.includes('ROLE_DEVELOPER')) return { color: '#7C3AED' }; // Violet 600
  if (roles?.includes('ROLE_SUPER_ADMIN')) return { color: '#EA580C' }; // Orange 600
  if (roles?.includes('ROLE_ADMIN')) return { color: '#2563EB' }; // Blue 600
  if (roles?.includes('ROLE_EDITOR')) return { color: '#059669' }; // Emerald 600
  return { color: Palette.textTertiary };
}

function StaffRow({ member, onPress }: { member: StaffMember; onPress: (member: StaffMember) => void }) {
  const roleStyle = getRoleStyle(member.roles);

  return (
    <Pressable accessibilityRole='button' onPress={() => onPress(member)} style={({ pressed }) => [styles.rowPressable, pressed && styles.pressed]}>
      <ThemedView alignItems='center' flexDirection='row' gap={'three'} paddingHorizontal={'four'} paddingVertical={'three'}>
        <ThemedView alignItems='center' gap={'half'}>
          <ThemedView alignItems='center' backgroundColor='#E8F4EF' borderRadius={'pill'} height={46} justifyContent='center' width={46}>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
              {getInitials(member) || '#'}
            </ThemedText>
          </ThemedView>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={10} lineHeight={12}>
            #{member.id}
          </ThemedText>
        </ThemedView>

        <ThemedView flex={1} gap={'half'} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={21} numberOfLines={1}>
            {member.name || member.username}
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={1}>
            {member.email}
          </ThemedText>
          <ThemedText color={roleStyle.color} fontFamily={FontFamily.bold} fontSize={11} lineHeight={16} letterSpacing={0.5} numberOfLines={1}>
            {formatStaffRoleSummary(member.roles).toUpperCase()}
          </ThemedText>
        </ThemedView>

        <ThemedView alignItems='flex-end' gap={'two'}>
          <StaffStatusPill deletedAt={member.deletedAt} enabled={member.enabled} />
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

function StaffRowSkeleton() {
  return (
    <ThemedView style={styles.rowPressable}>
      <ThemedView alignItems='center' flexDirection='row' gap={'three'} paddingHorizontal={'four'} paddingVertical={'three'}>
        <ThemedView alignItems='center' gap={'half'}>
          <ThemedView borderRadius={'pill'} height={46} loading width={46} />
          <ThemedView borderRadius={4} height={12} loading width={24} />
        </ThemedView>

        <ThemedView flex={1} gap={'half'} minWidth={0} justifyContent='center'>
          <ThemedView borderRadius={4} height={18} loading width={'60%'} />
          <ThemedView borderRadius={4} height={14} loading width={'40%'} />
          <ThemedView borderRadius={4} height={12} loading width={'30%'} />
        </ThemedView>

        <ThemedView alignItems='flex-end' gap={'two'}>
          <ThemedView borderRadius={'pill'} height={24} loading width={60} />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

function FilterStrip({ setFilters }: { setFilters: (update: (prev: StaffListFilters) => StaffListFilters) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [enabledStatus, setEnabledStatus] = useState<'0' | '1' | undefined>();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const term = searchQuery.trim();
      setFilters(prev => {
        let username: string | undefined = undefined;
        let email: string | undefined = undefined;
        let id: string | undefined = undefined;
        if (term) {
          if (/^\d+$/.test(term)) {
            id = term;
          } else if (term.includes('@')) {
            email = term;
          } else {
            username = term;
          }
        }
        return { ...prev, username, email, id, enabled: enabledStatus };
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, enabledStatus, setFilters]);
  return (
    <ThemedView gap={'three'} paddingHorizontal={'four'} paddingBottom={'three'}>
      <ThemedView flexDirection='row' gap={'two'}>
        <TextInput
          autoCapitalize='none'
          onChangeText={setSearchQuery}
          placeholder='Search ID, username, or email'
          placeholderTextColor={Palette.textTertiary}
          returnKeyType='search'
          style={styles.searchInput}
          value={searchQuery}
        />
      </ThemedView>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
        {[
          { label: 'All', value: undefined },
          { label: 'Enabled', value: '1' as const },
          { label: 'Disabled', value: '0' as const },
        ].map(option => {
          const selected = enabledStatus === option.value;
          return (
            <Pressable
              key={option.label}
              accessibilityRole='button'
              onPress={() => setEnabledStatus(selected ? undefined : option.value)}
              style={({ pressed }) => [styles.filterChip, selected && styles.filterChipActive, pressed && styles.pressed]}>
              <ThemedText color={selected ? '#FFFFFF' : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

function RoleSelector({ roles, setRoles }: { roles: StaffRole[]; setRoles: (roles: StaffRole[]) => void }) {
  return (
    <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
      {allRoles.map(role => {
        const selected = roles.includes(role);
        return (
          <Pressable
            key={role}
            accessibilityRole='button'
            onPress={() => setRoles(selected ? roles.filter(item => item !== role) : [...roles, role])}
            style={({ pressed }) => [styles.roleChip, selected && styles.roleChipActive, pressed && styles.pressed]}>
            <ThemedText color={selected ? '#FFFFFF' : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
              {formatStaffRole(role)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

function StaffFormSheet({
  member,
  mode,
  onClose,
  visible,
}: {
  member: StaffMember | null;
  mode: Extract<SheetMode, 'create' | 'roles'>;
  onClose: () => void;
  visible: boolean;
}) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresented = useRef(false);
  const queryClient = useQueryClient();
  const [name, setName] = useState(member?.name ?? '');
  const [username, setUsername] = useState(member?.username ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [password, setPassword] = useState('');
  const [enabled, setEnabled] = useState(member?.enabled ?? true);
  const [roles, setRoles] = useState<StaffRole[]>(member?.roles?.length ? member.roles : ['ROLE_STAFF']);
  const isCreate = mode === 'create';
  const title = isCreate ? 'Add New Staff' : 'Staff Modify';

  useEffect(() => {
    if (visible) {
      setName(member?.name ?? '');
      setUsername(member?.username ?? '');
      setEmail(member?.email ?? '');
      setPassword('');
      setEnabled(member?.enabled ?? true);
      setRoles(member?.roles?.length ? member.roles : ['ROLE_STAFF']);
      ref.current?.present();
      isPresented.current = true;
      return;
    }
    if (isPresented.current) {
      ref.current?.dismiss();
      isPresented.current = false;
    }
  }, [member, visible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required.');
      if (!roles.length) throw new Error('Select at least one role.');

      if (isCreate) {
        if (!username.trim()) throw new Error('Username is required.');
        if (!email.trim()) throw new Error('Email is required.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const input: StaffCreateInput = {
          email: email.trim(),
          enabled,
          name: name.trim(),
          password,
          roles,
          username: username.trim(),
        };

        return createStaffMember(input);
      }

      if (!member) throw new Error('Missing staff account.');
      return updateStaffMember(member.id, { name: name.trim(), roles });
    },
    onError: error => Alert.alert(title, getErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffKeys.all });
      onClose();
    },
  });

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />, []);

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      enableDynamicSizing
      keyboardBehavior='interactive'
      keyboardBlurBehavior='restore'
      onDismiss={() => {
        isPresented.current = false;
        onClose();
      }}
      ref={ref}>
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps='handled'>
        <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
          <ThemedView flex={1} gap={'half'}>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16} textTransform='uppercase'>
              Staff managements
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={22} lineHeight={28}>
              {title}
            </ThemedText>
          </ThemedView>
          {isCreate ? (
            <Pressable accessibilityRole='switch' accessibilityState={{ checked: enabled }} onPress={() => setEnabled(current => !current)}>
              <StaffStatusPill deletedAt={null} enabled={enabled} />
            </Pressable>
          ) : null}
        </ThemedView>

        <>
          <BottomSheetTextInput onChangeText={setName} placeholder='Name' placeholderTextColor={Palette.textTertiary} style={styles.input} value={name} />
          <BottomSheetTextInput
            autoCapitalize='none'
            editable={isCreate}
            onChangeText={setUsername}
            placeholder='Username'
            placeholderTextColor={Palette.textTertiary}
            style={[styles.input, !isCreate && styles.inputDisabled]}
            value={username}
          />
          <BottomSheetTextInput
            autoCapitalize='none'
            editable={isCreate}
            keyboardType='email-address'
            onChangeText={setEmail}
            placeholder='Email'
            placeholderTextColor={Palette.textTertiary}
            style={[styles.input, !isCreate && styles.inputDisabled]}
            value={email}
          />
          {isCreate ? (
            <BottomSheetTextInput
              onChangeText={setPassword}
              placeholder='Temporary password'
              placeholderTextColor={Palette.textTertiary}
              secureTextEntry
              style={styles.input}
              value={password}
            />
          ) : null}
          <RoleSelector roles={roles} setRoles={setRoles} />
        </>

        <AppButton block label='Save' loading={mutation.isPending} onPress={() => mutation.mutate()} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export default function StaffManagementsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<StaffListFilters>({});
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const staffQuery = useInfiniteStaff(filters);
  const staff = useMemo(() => staffQuery.data?.pages.flatMap(page => page.items) ?? emptyStaff, [staffQuery.data]);

  const loadMore = useCallback(() => {
    if (staffQuery.hasNextPage && !staffQuery.isFetchingNextPage) {
      void staffQuery.fetchNextPage();
    }
  }, [staffQuery]);

  const resetPasswordMutation = useMutation({
    mutationFn: (member: StaffMember) => resetStaffPassword(member.id),
    onError: error => Alert.alert('Send Reset Email', getErrorMessage(error)),
    onSuccess: () => Alert.alert('Send Reset Email', 'Reset password email sent successfully.'),
  });

  const archiveMutation = useMutation({
    mutationFn: (member: StaffMember) => (member.deletedAt ? restoreStaffMember(member) : archiveStaffMember(member)),
    onError: error => Alert.alert('Archive', getErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: (member: StaffMember) => updateStaffMember(member.id, { enabled: !member.enabled }),
    onError: error => Alert.alert('Status Update', getErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });

  const openSheet = (mode: SheetMode, member?: StaffMember | null) => {
    setSelectedMember(member ?? null);
    if (actionsOpen) {
      setActionsOpen(false);
      setTimeout(() => setSheetMode(mode), 150);
    } else {
      setSheetMode(mode);
    }
  };

  const searchBarElement = useMemo(() => <FilterStrip setFilters={setFilters} />, [setFilters]);

  return (
    <>
      <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingTop>
        <FlatList
          {...{
            contentContainerStyle: styles.listContent,
            data: staff,
            keyExtractor: (item: StaffMember) => String(item.id),
            ListHeaderComponent: (
              <ThemedView gap={'three'} paddingHorizontal={'four'} paddingTop={'three'}>
                <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
                  <Pressable
                    hitSlop={12}
                    accessibilityRole='button'
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
                    <SymbolView name='chevron.left' resizeMode='scaleAspectFit' size={20} tintColor={Palette.textPrimary} />
                  </Pressable>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={30}>
                    Staff List
                  </ThemedText>
                  <Pressable
                    hitSlop={12}
                    accessibilityRole='button'
                    onPress={() => openSheet('create')}
                    style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
                    <SymbolView name='person.badge.plus' resizeMode='scaleAspectFit' size={20} tintColor='#FFFFFF' />
                  </Pressable>
                </ThemedView>
                {searchBarElement}
              </ThemedView>
            ),
            ListEmptyComponent: staffQuery.isLoading ? (
              <ThemedView>
                {[1, 2, 3, 4, 5, 6, 7].map(key => (
                  <StaffRowSkeleton key={key} />
                ))}
              </ThemedView>
            ) : staffQuery.isError ? (
              <EmptyState message='The administrators list could not be loaded.' title='Staff unavailable' />
            ) : (
              <EmptyState message='Try a different name, email, or status filter.' title='No administrators found' />
            ),
            ListFooterComponent: staffQuery.isFetchingNextPage ? (
              <ThemedView alignSelf='center' borderRadius={'pill'} height={18} loading marginVertical={24} width={132} />
            ) : null,
            onEndReached: loadMore,
            onEndReachedThreshold: 0.55,
            refreshControl: <RefreshControl onRefresh={() => staffQuery.refetch()} refreshing={staffQuery.isRefetching} tintColor={Palette.accent} />,
            renderItem: ({ item }: { item: StaffMember }) => (
              <StaffRow
                member={item}
                onPress={member => {
                  setSelectedMember(member);
                  setActionsOpen(true);
                }}
              />
            ),
            showsVerticalScrollIndicator: false,
          }}
        />
      </ThemedView>

      <ActionSheet
        avatar={
          <ThemedView alignItems='center' backgroundColor='#E8F4EF' borderRadius={'pill'} height={72} justifyContent='center' width={72}>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={24} lineHeight={30}>
              {selectedMember ? getInitials(selectedMember) || '#' : '#'}
            </ThemedText>
          </ThemedView>
        }
        description={
          <ThemedView alignItems='center' gap={'one'}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={14} lineHeight={20}>
              {selectedMember?.email}
            </ThemedText>
            {selectedMember?.roles && (
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16}>
                {formatStaffRoleSummary(selectedMember.roles).toUpperCase()}
              </ThemedText>
            )}
          </ThemedView>
        }
        items={[
          {
            key: 'logs',
            label: 'Activity Logs',
            meta: 'View recent activities',
            icon: 'clock.arrow.circlepath',
            onPress: () => openSheet('logs', selectedMember),
          },
          {
            disabled: Boolean(selectedMember?.deletedAt),
            key: 'password',
            label: 'Change Password',
            meta: 'Set a new password for this admin',
            icon: 'lock',
            onPress: () => openSheet('password', selectedMember),
          },
          {
            disabled: !selectedMember || resetPasswordMutation.isPending || Boolean(selectedMember?.deletedAt),
            key: 'reset',
            label: 'Send Reset Email',
            meta: 'Email a password reset link',
            icon: 'envelope',
            onPress: () => selectedMember && resetPasswordMutation.mutate(selectedMember),
          },
          {
            danger: !selectedMember?.deletedAt,
            disabled: !selectedMember || archiveMutation.isPending,
            key: 'archive',
            label: selectedMember?.deletedAt ? 'Restore' : 'Archive',
            meta: selectedMember?.deletedAt ? 'Bring this admin back' : 'Soft-delete this administrator',
            icon: selectedMember?.deletedAt ? 'arrow.uturn.left' : 'archivebox',
            onPress: () => selectedMember && archiveMutation.mutate(selectedMember),
          },
        ]}
        onClose={() => setActionsOpen(false)}
        open={actionsOpen}
        primaryActions={[
          {
            key: 'edit',
            label: 'Edit',
            icon: 'pencil',
            onPress: () => openSheet('roles', selectedMember),
          },
          {
            danger: selectedMember?.enabled,
            disabled: !selectedMember || toggleEnabledMutation.isPending || Boolean(selectedMember?.deletedAt),
            key: 'status',
            label: selectedMember?.enabled ? 'Disable' : 'Enable',
            icon: selectedMember?.enabled ? 'nosign' : 'checkmark.circle',
            onPress: () => selectedMember && toggleEnabledMutation.mutate(selectedMember),
          },
        ]}
        title={selectedMember?.name || selectedMember?.username || 'Staff actions'}
      />

      <StaffFormSheet
        member={selectedMember}
        mode={sheetMode === 'roles' ? 'roles' : 'create'}
        onClose={() => setSheetMode(null)}
        visible={sheetMode === 'create' || sheetMode === 'roles'}
      />
      <ChangePasswordSheet member={selectedMember} onClose={() => setSheetMode(null)} visible={sheetMode === 'password'} />
      <StaffLogsSheet member={selectedMember} onClose={() => setSheetMode(null)} visible={sheetMode === 'logs'} />
    </>
  );
}

const styles = StyleSheet.create({
  applyChip: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: mhs(16),
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: mhs(14),
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: mhs(12),
  },
  filterChipActive: {
    backgroundColor: Palette.accent,
  },
  footerLoader: {
    paddingVertical: mhs(18),
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  input: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: mhs(14),
  },
  inputDisabled: {
    color: Palette.textTertiary,
  },
  listContent: {
    paddingBottom: mhs(120),
  },
  navButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  logList: {
    paddingHorizontal: mhs(16),
  },
  pressed: {
    opacity: 0.72,
  },
  roleChip: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    paddingHorizontal: mhs(10),
    paddingVertical: mhs(7),
  },
  roleChipActive: {
    backgroundColor: Palette.accent,
  },
  rowPressable: {
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: mhs(12),
  },
  sheetContent: {
    gap: mhs(14),
    padding: mhs(16),
    paddingBottom: mhs(34),
  },
  textAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: mhs(8),
  },
});
