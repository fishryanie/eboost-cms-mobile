import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { TabIcon, type TabIconName } from 'components/tab-icon';
import { tabs } from './constants';

type PopupProps = {
  colors: { foreground: string; hover: string; muted: string };
  onClose: () => void;
  routeName: string;
};

type Action = {
  icon: TabIconName;
  key: string;
  label: string;
  panel: string;
  section: 'marketing' | 'operation' | 'technical';
};

export function Popup({ colors, onClose, routeName }: PopupProps) {
  const router = useRouter();
  const section = routeName.split('/')[0] as Action['section'];
  const actions: Action[] =
    tabs
      .find(tab => tab.key === section)
      ?.panels.map(panel => ({ icon: panel.icon, key: `${section}-${panel.key}`, label: panel.title, panel: panel.key, section })) ?? [];

  if (actions.length === 0) return null;

  return (
    <ThemedView alignSelf='center' minWidth={280} paddingHorizontal={12} paddingTop={12} width='100%'>
      <ThemedView gap={3} width='100%'>
        {actions.map(action => (
          <Pressable
            key={action.key}
            onPress={() => {
              router.push({ pathname: `/${action.section}/[panel]`, params: { panel: action.panel } } as never);
              onClose();
            }}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: pressed ? colors.hover : 'transparent',
              borderRadius: 12,
              flexDirection: 'row',
              gap: 12,
              minHeight: 44,
              paddingHorizontal: 12,
              paddingVertical: 8,
            })}>
            <ThemedView alignItems='center' height={24} justifyContent='center' width={24}>
              <TabIcon color={colors.foreground} name={action.icon} size={18} />
            </ThemedView>
            <ThemedText color={colors.foreground} flex={1} fontSize={15} fontWeight='500' numberOfLines={1}>
              {action.label}
            </ThemedText>
            <ThemedText color={colors.muted} fontSize={20} lineHeight={20} marginLeft='auto' textAlign='center' width={24}>
              ›
            </ThemedText>
          </Pressable>
        ))}
      </ThemedView>
    </ThemedView>
  );
}
