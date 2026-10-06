import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useNavigation } from 'expo-router';
import { ChevronDown, ChevronUp, RotateCcw, Search, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Pressable, TextInput } from 'react-native';

import { HeaderTitle, ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { useStaffMember } from 'app/drawer/staff-managements/staff-data';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

import { administratorAccessKeys, useAdministratorAccesses, useAdministratorManagementAccess } from './hooks';
import {
  accessMethods,
  applyPermissionPreset,
  getNodePaths,
  hydratePermissions,
  permissionsEqual,
  resetPermissions,
  setAllMethods,
  setNodeMethod,
  showMenusWithoutAccessScreen,
} from './model';
import permissionCatalog from './permission-catalog.json';
import permissionPresets from './permission-presets.json';
import { MenuVisibilitySwitch, PermissionCheckbox, PermissionLegend, PermissionScreenNode } from './permission-controls';
import { saveAdminAccesses } from './service';
import type { AccessMethod, PermissionMap, PermissionNode } from './types';
import { currentAdminAccessKeys } from 'features/admin-access/hooks';

const screens: PermissionNode[] = permissionCatalog;
const screenPaths = screens.flatMap(getNodePaths);
const screenPathSet = new Set(screenPaths);
const listContentStyle = { padding: mhs(12), paddingBottom: mhs(16) };

function filterScreens(nodes: PermissionNode[], search: string): PermissionNode[] {
  return nodes.flatMap(node => {
    if (node.name.toLowerCase().includes(search) || node.path.toLowerCase().includes(search)) return [node];
    const children = node.children ? filterScreens(node.children, search) : [];
    return children.length ? [{ ...node, children }] : [];
  });
}

export function AdministratorAccessScreen({ adminId }: { adminId: string }) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const managementQuery = useAdministratorManagementAccess();
  const canUpdate = managementQuery.data?.canUpdate === true;
  const accessQuery = useAdministratorAccesses(adminId, canUpdate);
  const memberQuery = useStaffMember(canUpdate && /^\d+$/.test(adminId) ? adminId : undefined);
  const [draft, setDraft] = useState<PermissionMap>();
  const [search, setSearch] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>();
  const [showOptions, setShowOptions] = useState(false);
  const initialPermissions = useMemo(() => hydratePermissions(accessQuery.data || []), [accessQuery.data]);
  const permissions = draft || initialPermissions;
  const hasChanges = !permissionsEqual(permissions, initialPermissions);
  const [saved, setSaved] = useState(false);
  const saveMutation = useMutation({
    mutationFn: (next: PermissionMap) => saveAdminAccesses(adminId, next),
    onSuccess: records => {
      queryClient.setQueryData(administratorAccessKeys.records(adminId), records);
      setDraft(undefined);
      setSelectedPreset(undefined);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: [...administratorAccessKeys.all, 'management'] });
      void queryClient.invalidateQueries({ queryKey: currentAdminAccessKeys.all });
    },
  });
  usePreventRemove(hasChanges || saveMutation.isPending, ({ data }) => {
    if (saveMutation.isPending) return;
    Alert.alert('Discard changes?', 'Your administrator access changes have not been saved.', [
      { style: 'cancel', text: 'Keep editing' },
      { style: 'destructive', text: 'Discard', onPress: () => navigation.dispatch(data.action) },
    ]);
  });
  const searchTerm = search.trim().toLowerCase();
  const visibleScreens = useMemo(() => filterScreens(screens, searchTerm), [searchTerm]);
  // Search changes presentation only. Group actions always apply to the complete CMS group.
  const nodesByPath = useMemo(() => {
    const map = new Map<string, PermissionNode>();
    const collect = (nodes: PermissionNode[]) =>
      nodes.forEach(node => {
        map.set(node.path, node);
        if (node.children) collect(node.children);
      });
    collect(screens);
    return map;
  }, []);
  const allSelected = screenPaths.every(path => accessMethods.every(method => permissions[path]?.includes(method)));
  const someSelected = screenPaths.some(path => accessMethods.some(method => permissions[path]?.includes(method)));
  const selectedCount = screenPaths.filter(path => accessMethods.some(method => permissions[path]?.includes(method))).length;
  const unknownScreens = Object.keys(permissions).filter(path => !screenPathSet.has(path) && path !== showMenusWithoutAccessScreen && permissions[path].length);

  const changePermissions = (next: PermissionMap) => {
    setDraft(next);
    setSaved(false);
    setSelectedPreset(undefined);
    saveMutation.reset();
  };
  const toggleMethod = (node: PermissionNode, method: AccessMethod, checked: boolean) => {
    changePermissions(setNodeMethod(permissions, nodesByPath.get(node.path) || node, method, checked));
  };
  const reset = () =>
    Alert.alert('Reset permissions?', 'Clear screen access and the menu visibility setting. Proficiency scores are kept. Changes take effect when saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => changePermissions(resetPermissions(permissions)) },
    ]);

  let unavailable: { message: string; title: string } | undefined;
  const error = managementQuery.error || managementQuery.session.error || accessQuery.error || memberQuery.error;
  if (!/^\d+$/.test(adminId)) unavailable = { title: 'Administrator unavailable', message: 'A valid administrator ID is required.' };
  else if (error && (!accessQuery.data || !canUpdate || !memberQuery.data)) unavailable = { title: 'Access unavailable', message: error.message };
  else if (managementQuery.session.isSuccess && !managementQuery.session.data)
    unavailable = { title: 'Sign in required', message: 'Sign in to manage administrator access.' };
  else if (managementQuery.isSuccess && !canUpdate)
    unavailable = { title: 'Access restricted', message: 'You need Update access to Administrators to manage these permissions.' };
  const isReady = canUpdate && accessQuery.data !== undefined && memberQuery.data !== undefined;

  return (
    <ThemedView backgroundColor={Palette.surfaceMuted} flex={1}>
      <HeaderTitle title='Administrator Access' />
      {unavailable ? (
        <ThemedView gap={'four'} padding={'four'}>
          <EmptyState message={unavailable.message} title={unavailable.title} />
          {error ? (
            <AppButton
              block
              label='Retry'
              onPress={() => {
                void managementQuery.session.refetch();
                void managementQuery.refetch();
                if (canUpdate) {
                  void accessQuery.refetch();
                  void memberQuery.refetch();
                }
              }}
            />
          ) : null}
        </ThemedView>
      ) : !isReady ? (
        <ThemedView gap={'four'} padding={'four'}>
          <ThemedView borderRadius={12} height={120} loading />
          {[1, 2, 3, 4, 5, 6, 7, 8].map(key => (
            <ThemedView borderRadius={8} height={48} key={key} loading />
          ))}
          {accessQuery.fetchStatus === 'paused' || managementQuery.fetchStatus === 'paused' ? (
            <ThemedText color={Palette.textSecondary}>Waiting for a network connection.</ThemedText>
          ) : null}
        </ThemedView>
      ) : (
        <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <FlatList
            contentContainerStyle={listContentStyle}
            contentInsetAdjustmentBehavior='automatic'
            data={visibleScreens}
            keyboardShouldPersistTaps='handled'
            keyboardDismissMode='on-drag'
            keyExtractor={node => node.path}
            ListHeaderComponent={
              <ThemedView gap={8} paddingBottom={8}>
                <ThemedView alignItems='center' flexDirection='row' gap={8}>
                  <ThemedView alignItems='center' backgroundColor='#E8F4EF' borderRadius={10} height={36} justifyContent='center' width={36}>
                    <ShieldCheck color={Palette.accent} size={20} />
                  </ThemedView>
                  <ThemedView flex={1} gap={4}>
                    <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} selectable>
                      {memberQuery.data?.name || memberQuery.data?.username}
                    </ThemedText>
                    <ThemedText color={Palette.textSecondary} fontSize={11} lineHeight={16} numberOfLines={1} selectable>
                      #{adminId} · {memberQuery.data?.email}
                    </ThemedText>
                  </ThemedView>
                  <Pressable accessibilityRole='button' accessibilityState={{ expanded: showOptions }} onPress={() => setShowOptions(value => !value)}>
                    <ThemedView alignItems='center' flexDirection='row' gap={4} minHeight={44} paddingLeft={4}>
                      <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={12}>
                        Options
                      </ThemedText>
                      {showOptions ? <ChevronUp color={Palette.accent} size={14} /> : <ChevronDown color={Palette.accent} size={14} />}
                    </ThemedView>
                  </Pressable>
                </ThemedView>
                {showOptions ? (
                  <ThemedView backgroundColor={Palette.surfaceBase} borderRadius={12} gap={'two'} padding={'three'}>
                    <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                      Permission presets
                    </ThemedText>
                    <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
                      {permissionPresets.map(preset => (
                        <Pressable
                          accessibilityRole='radio'
                          accessibilityState={{ checked: selectedPreset === preset.name, disabled: saveMutation.isPending }}
                          disabled={saveMutation.isPending}
                          key={preset.name}
                          onPress={() => {
                            const deselect = selectedPreset === preset.name;
                            changePermissions(deselect ? resetPermissions(permissions, true) : applyPermissionPreset(permissions, screens, preset));
                            setSelectedPreset(deselect ? undefined : preset.name);
                          }}>
                          <ThemedView
                            backgroundColor={selectedPreset === preset.name ? Palette.accent : Palette.surfaceBase}
                            borderRadius={10}
                            justifyContent='center'
                            minHeight={44}
                            paddingHorizontal={'three'}>
                            <ThemedText
                              color={selectedPreset === preset.name ? '#FFFFFF' : Palette.textPrimary}
                              fontFamily={FontFamily.semibold}
                              fontSize={12}
                              lineHeight={18}>
                              {preset.name}
                            </ThemedText>
                          </ThemedView>
                        </Pressable>
                      ))}
                    </ThemedView>
                    <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={18}>
                      Presets replace screen permissions. Proficiency scores are kept.
                    </ThemedText>
                    <MenuVisibilitySwitch
                      disabled={saveMutation.isPending}
                      onChange={checked => changePermissions({ ...permissions, [showMenusWithoutAccessScreen]: checked ? ['READ'] : [] })}
                      value={permissions[showMenusWithoutAccessScreen]?.includes('READ') || false}
                    />
                  </ThemedView>
                ) : null}
                <ThemedView
                  alignItems='center'
                  backgroundColor={Palette.surfaceBase}
                  borderRadius={10}
                  flexDirection='row'
                  gap={'two'}
                  paddingHorizontal={'three'}>
                  <Search color={Palette.textTertiary} size={16} />
                  <TextInput
                    accessibilityLabel='Search permission screens'
                    autoCapitalize='none'
                    onChangeText={setSearch}
                    onSubmitEditing={Keyboard.dismiss}
                    placeholder='Search screens'
                    placeholderTextColor={Palette.textTertiary}
                    returnKeyType='search'
                    style={{ color: Palette.textPrimary, flex: 1, fontFamily: FontFamily.regular, fontSize: 14, minHeight: 40, paddingVertical: 8 }}
                    value={search}
                  />
                </ThemedView>
                <ThemedView alignItems='center' flexDirection='row' flexWrap='wrap' gap={'two'} justifyContent='space-between'>
                  <PermissionCheckbox
                    checked={allSelected ? true : someSelected ? 'mixed' : false}
                    disabled={saveMutation.isPending}
                    label='Select all'
                    onPress={() => changePermissions(setAllMethods(permissions, screens, !allSelected))}
                  />
                  <Pressable accessibilityLabel='Reset permissions' accessibilityRole='button' disabled={saveMutation.isPending} onPress={reset}>
                    <ThemedView alignItems='center' flexDirection='row' gap={6} minHeight={44} paddingHorizontal={'two'}>
                      <RotateCcw color={Palette.danger} size={16} />
                      <ThemedText color={Palette.danger} fontFamily={FontFamily.semibold} fontSize={12}>
                        Reset
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                  <ThemedText color={Palette.textSecondary} fontSize={11} lineHeight={16}>
                    {selectedCount}/{screenPaths.length} screens
                  </ThemedText>
                </ThemedView>
                <ThemedText color={Palette.textSecondary} fontSize={10} lineHeight={14}>
                  Orange: unsaved · Green: saved. Group changes apply to child screens.
                </ThemedText>
                <PermissionLegend />
                {saved ? (
                  <ThemedText accessibilityLiveRegion='polite' color={Palette.accent} fontFamily={FontFamily.semibold}>
                    Permissions saved successfully.
                  </ThemedText>
                ) : null}
                {error ? (
                  <ThemedText color={Palette.danger} selectable>
                    {error.message}
                  </ThemedText>
                ) : null}
              </ThemedView>
            }
            ListEmptyComponent={<EmptyState message='Try another screen name or clear the search.' title='No matching screens' />}
            ListFooterComponent={
              unknownScreens.length ? (
                <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={18} paddingTop={8}>
                  {unknownScreens.length} additional screen permissions are preserved when editing individual screens or selecting all.
                </ThemedText>
              ) : null
            }
            renderItem={({ item, index }) => (
              <ThemedView
                borderCurve='continuous'
                borderTopLeftRadius={index === 0 ? 12 : 0}
                borderTopRightRadius={index === 0 ? 12 : 0}
                borderBottomLeftRadius={index === visibleScreens.length - 1 ? 12 : 0}
                borderBottomRightRadius={index === visibleScreens.length - 1 ? 12 : 0}
                overflow='hidden'>
                <PermissionScreenNode
                  disabled={saveMutation.isPending}
                  forceExpanded={Boolean(searchTerm)}
                  node={item}
                  onToggle={toggleMethod}
                  permissions={permissions}
                  savedPermissions={initialPermissions}
                />
              </ThemedView>
            )}
          />
          <ThemedView
            backgroundColor={Palette.surfaceBase}
            borderTopColor={Palette.borderSubtle}
            borderTopWidth={1}
            gap={'two'}
            padding={'three'}
            safePaddingBottom={'two'}>
            {saveMutation.error ? (
              <ThemedText accessibilityLiveRegion='polite' color={Palette.danger} fontSize={12} lineHeight={18} selectable>
                {saveMutation.error.message} Your changes are kept. Retry saving to finish.
              </ThemedText>
            ) : null}
            <AppButton
              block
              disabled={!hasChanges || !canUpdate}
              label={hasChanges ? 'Save permissions' : 'No changes to save'}
              loading={saveMutation.isPending}
              onPress={() => {
                if (!saveMutation.isPending && hasChanges) saveMutation.mutate(permissions);
              }}
            />
          </ThemedView>
        </KeyboardAvoidingView>
      )}
    </ThemedView>
  );
}
