import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { TabIcon, type TabIconName } from 'components/tab-icon';
import { cmsMobileSections, type CmsSectionKey } from 'features/cms-menu/mobile-cms-menu';
import type { IPalette, IPopupRenderContext } from '../types';

type PopupAction = {
  icon: TabIconName;
  key: string;
  label: string;
  onPress: () => void;
};

function DefaultPopupBody({ colors, onClose, route }: IPopupRenderContext) {
  const router = useRouter();
  const actions = getRouteActions(route.name, router);

  if (actions.length === 0) return null;

  return (
    <ThemedView gap={3} minWidth={280} padding={10} width='100%'>
      {actions.map(action => (
        <ActionRow action={action} colors={colors} key={action.key} onClose={onClose} />
      ))}
    </ThemedView>
  );
}

function getRouteActions(routeName: string, router: ReturnType<typeof useRouter>): PopupAction[] {
  if (routeName === 'operation' || routeName === 'marketing') {
    const section = cmsMobileSections[routeName as CmsSectionKey];

    return section.panels.map(panel => ({
      icon: panel.icon,
      key: `${routeName}-${panel.key}`,
      label: panel.title,
      onPress: () =>
        router.push({
          pathname: `/${routeName}/[panel]`,
          params: { panel: panel.key },
        } as never),
    }));
  }

  if (routeName === 'technical') {
    return [
      {
        icon: 'technical',
        key: 'technical-chargers',
        label: 'Chargers',
        onPress: () =>
          router.push({
            pathname: '/technical/[panel]',
            params: { panel: 'chargers' },
          } as never),
      },
      {
        icon: 'technical',
        key: 'technical-meter-hourly',
        label: 'Meter Hourly',
        onPress: () =>
          router.push({
            pathname: '/technical/[panel]',
            params: { panel: 'meter-hourly' },
          } as never),
      },
      {
        icon: 'technical',
        key: 'technical-status-logs',
        label: 'Status Logs',
        onPress: () =>
          router.push({
            pathname: '/technical/[panel]',
            params: { panel: 'status-logs' },
          } as never),
      },
      {
        icon: 'technical',
        key: 'technical-energy-differ',
        label: 'Energy Differ',
        onPress: () =>
          router.push({
            pathname: '/technical/[panel]',
            params: { panel: 'energy-differ' },
          } as never),
      },
    ];
  }

  return [];
}

function ActionRow({ action, colors, onClose }: { action: PopupAction; colors: IPalette; onClose: () => void }) {
  return (
    <Pressable
      onPress={() => {
        action.onPress();
        onClose();
      }}
      style={({ pressed }) => [styles.actionRow, { backgroundColor: pressed ? colors.hover : 'transparent' }]}>
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
    marginLeft: 'auto',
    textAlign: 'center',
    width: 24,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});

export { DefaultPopupBody };
