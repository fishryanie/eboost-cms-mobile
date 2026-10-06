import { Host, Switch } from '@expo/ui';
import { Check, ChevronDown, ChevronRight, Eye, Minus, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { accessMethods, getMethodState, getNodePaths } from './model';
import type { AccessMethod, PermissionMap, PermissionNode } from './types';

const permissionIcons = { READ: Eye, UPDATE: Pencil, CREATE: Plus, DELETE: Trash2, APPROVE: Check };
const pendingColor = '#C66A12';
const pendingBackground = '#FFF0DE';

export function PermissionLegend() {
  return (
    <ThemedView flexDirection='row' gap={8} justifyContent='space-between' paddingVertical={4}>
      {accessMethods.map(method => {
        const Icon = permissionIcons[method];
        return (
          <ThemedView alignItems='center' flexDirection='row' gap={4} key={method}>
            <Icon color={Palette.textSecondary} size={12} />
            <ThemedText color={Palette.textSecondary} fontSize={10} lineHeight={16}>
              {method.charAt(0) + method.slice(1).toLowerCase()}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

function PermissionIcon({
  checked,
  disabled,
  method,
  onPress,
  pending,
  screenName,
}: {
  checked: boolean | 'mixed';
  disabled: boolean;
  method: AccessMethod;
  onPress: () => void;
  pending: boolean;
  screenName: string;
}) {
  const Icon = permissionIcons[method];
  const activeColor = pending ? pendingColor : Palette.accent;
  return (
    <Pressable
      accessibilityLabel={`${screenName}: ${method.charAt(0) + method.slice(1).toLowerCase()}`}
      accessibilityHint={pending ? 'New selection, not saved yet.' : undefined}
      accessibilityRole='checkbox'
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}>
      <ThemedView alignItems='center' height={44} justifyContent='center' opacity={disabled ? 0.5 : 1} width={32}>
        <ThemedView
          alignItems='center'
          backgroundColor={checked ? (pending ? pendingBackground : '#E8F4EF') : 'transparent'}
          borderColor={checked === 'mixed' ? activeColor : 'transparent'}
          borderRadius={8}
          borderWidth={1}
          height={28}
          justifyContent='center'
          width={28}>
          <Icon color={checked ? activeColor : Palette.textTertiary} size={17} strokeWidth={checked === true ? 2.5 : 1.8} />
          {checked === 'mixed' ? <ThemedView backgroundColor={activeColor} borderRadius={1} bottom={2} height={2} position='absolute' width={8} /> : null}
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

export function PermissionCheckbox({
  checked,
  disabled,
  label,
  onPress,
}: {
  checked: boolean | 'mixed';
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole='checkbox' accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress}>
      <ThemedView
        alignItems='center'
        backgroundColor={checked ? '#E8F4EF' : Palette.surfaceMuted}
        borderColor={checked ? Palette.accent : Palette.borderSubtle}
        borderRadius={10}
        borderWidth={1}
        flexDirection='row'
        gap={6}
        minHeight={44}
        opacity={disabled ? 0.5 : 1}
        paddingHorizontal={10}>
        <ThemedView
          alignItems='center'
          backgroundColor={checked ? Palette.accent : 'transparent'}
          borderColor={checked ? Palette.accent : Palette.textTertiary}
          borderRadius={4}
          borderWidth={1}
          height={16}
          justifyContent='center'
          width={16}>
          {checked === 'mixed' ? <Minus color='#FFFFFF' size={12} /> : checked ? <Check color='#FFFFFF' size={12} strokeWidth={3} /> : null}
        </ThemedView>
        <ThemedText color={checked ? Palette.accent : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function MenuVisibilitySwitch({ disabled, onChange, value }: { disabled: boolean; onChange: (value: boolean) => void; value: boolean }) {
  return (
    <ThemedView alignItems='center' flexDirection='row' gap={'three'} minHeight={56}>
      <ThemedView flex={1} gap={4}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
          Show menus without access
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={18}>
          Keep restricted menus visible in the web CMS.
        </ThemedText>
      </ThemedView>
      <Host accessibilityLabel='Show menus without access' colorScheme='light' matchContents seedColor={Palette.accent}>
        <Switch disabled={disabled} onValueChange={onChange} testID='show-menus-without-access' value={value} />
      </Host>
    </ThemedView>
  );
}

export function PermissionScreenNode({
  disabled,
  forceExpanded = false,
  depth = 0,
  node,
  onToggle,
  permissions,
  savedPermissions,
}: {
  disabled: boolean;
  forceExpanded?: boolean;
  depth?: number;
  node: PermissionNode;
  onToggle: (node: PermissionNode, method: AccessMethod, checked: boolean) => void;
  permissions: PermissionMap;
  savedPermissions: PermissionMap;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = forceExpanded || expanded;
  const paths = getNodePaths(node);
  const proficiency = permissions[node.path]?.find(method => method.startsWith('PROFICIENCY:'))?.slice('PROFICIENCY:'.length);

  return (
    <ThemedView backgroundColor={Palette.surfaceBase}>
      <ThemedView alignItems='center' flexDirection='row' gap={4} minHeight={48} paddingLeft={12 + Math.min(depth, 2) * 10} paddingRight={8}>
        <ThemedView flex={1} minWidth={0} paddingVertical={6}>
          <Pressable
            accessibilityLabel={hasChildren ? `${isExpanded ? 'Collapse' : 'Expand'} ${node.name}` : node.name}
            accessibilityRole={hasChildren ? 'button' : undefined}
            accessibilityState={hasChildren ? { expanded: isExpanded } : undefined}
            disabled={!hasChildren || forceExpanded}
            onPress={() => setExpanded(value => !value)}>
            <ThemedView alignItems='center' flexDirection='row' gap={4} minHeight={36}>
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown color={Palette.textTertiary} size={12} />
                ) : (
                  <ChevronRight color={Palette.textTertiary} size={12} />
                )
              ) : null}
              <ThemedText
                color={Palette.textPrimary}
                flex={1}
                fontFamily={hasChildren ? FontFamily.semibold : FontFamily.regular}
                fontSize={13}
                lineHeight={18}>
                {node.name}
              </ThemedText>
            </ThemedView>
          </Pressable>
          {proficiency ? (
            <ThemedText color={Palette.textSecondary} fontSize={10} lineHeight={14} selectable>
              Proficiency: {proficiency}
            </ThemedText>
          ) : null}
        </ThemedView>
        <ThemedView flexDirection='row'>
          {accessMethods.map(method => {
            const checked = getMethodState(node, permissions, method);
            return (
              <PermissionIcon
                checked={checked}
                disabled={disabled}
                key={method}
                method={method}
                onPress={() => onToggle(node, method, checked !== true)}
                pending={paths.some(path => permissions[path]?.includes(method) && !savedPermissions[path]?.includes(method))}
                screenName={node.name}
              />
            );
          })}
        </ThemedView>
      </ThemedView>
      <ThemedView backgroundColor={Palette.borderSubtle} height={0.5} marginLeft={12 + Math.min(depth, 2) * 10} />
      {hasChildren && isExpanded ? (
        <ThemedView>
          {node.children?.map(child => (
            <PermissionScreenNode
              disabled={disabled}
              forceExpanded={forceExpanded}
              key={child.path}
              depth={depth + 1}
              node={child}
              onToggle={onToggle}
              permissions={permissions}
              savedPermissions={savedPermissions}
            />
          ))}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}
