import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { TabIcon, type TabIconName } from 'components/tab-icon';
import type { IPalette, IPopupRenderContext } from '../types';

type PopupAction = {
  icon: TabIconName;
  key: string;
  label: string;
  onPress: () => void;
};

function DefaultPopupBody({ colors, route }: IPopupRenderContext) {
  const router = useRouter();
  const actions = getRouteActions(route.name, router);

  if (actions.length === 0) return null;

  return (
    <ThemedView gap={3} minWidth={260} padding={10}>
      {actions.map(action => (
        <ActionRow action={action} colors={colors} key={action.key} />
      ))}
    </ThemedView>
  );
}

function getRouteActions(routeName: string, router: ReturnType<typeof useRouter>): PopupAction[] {
  if (routeName === 'location') {
    return [
      {
        icon: 'location',
        key: 'create-location',
        label: 'Create location',
        onPress: () =>
          router.push({
            pathname: '/location',
            params: { action: 'create' },
          } as never),
      },
      {
        icon: 'map',
        key: 'pick-lat-lng',
        label: 'Pick lat lng',
        onPress: () =>
          router.push({
            pathname: '/menu/[slug]',
            params: { slug: 'pick-lat-lng' },
          } as never),
      },
    ];
  }

  if (routeName === 'users') {
    return [
      {
        icon: 'balance',
        key: 'adjust-balance',
        label: 'Adjust balance',
        onPress: () =>
          router.push({
            pathname: '/menu/[slug]',
            params: { slug: 'adjust-balance' },
          } as never),
      },
      {
        icon: 'transfer',
        key: 'transfer-funds',
        label: 'Transfer funds',
        onPress: () =>
          router.push({
            pathname: '/menu/[slug]',
            params: { slug: 'transfer-funds' },
          } as never),
      },
    ];
  }

  return [];
}

function ActionRow({ action, colors }: { action: PopupAction; colors: IPalette }) {
  return (
    <Pressable onPress={action.onPress} style={({ pressed }) => [styles.actionRow, { backgroundColor: pressed ? colors.hover : 'transparent' }]}>
      <ThemedView alignItems='center' height={24} justifyContent='center' width={24}>
        <TabIcon color={colors.foreground} name={action.icon} size={18} />
      </ThemedView>
      <ThemedText numberOfLines={1} style={[styles.label, { color: colors.foreground }]}>
        {action.label}
      </ThemedText>
      <ThemedText style={[styles.chevron, { color: colors.muted }]}>›</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 20,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});

export { DefaultPopupBody };
