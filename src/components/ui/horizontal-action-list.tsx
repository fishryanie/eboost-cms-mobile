import type { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

export type HorizontalActionItem = {
  danger?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  key: string;
  label: string;
  onPress: () => void;
};

export function HorizontalActionList({ actions, bleed = 16, edgePadding = 16 }: { actions: HorizontalActionItem[]; bleed?: number; edgePadding?: number }) {
  return (
    <ScrollView
      contentContainerStyle={{ gap: 8, paddingBottom: 16, paddingHorizontal: edgePadding }}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -bleed }}>
      {actions.map(action => (
        <HorizontalActionButton action={action} key={action.key} />
      ))}
    </ScrollView>
  );
}

function HorizontalActionButton({ action }: { action: HorizontalActionItem }) {
  const color = action.danger ? Palette.danger : Palette.accent;
  const backgroundColor = action.danger ? '#FEF2F2' : '#F4F6F6';
  const Icon = action.icon;

  return (
    <Pressable
      accessibilityLabel={action.label}
      accessibilityRole='button'
      accessibilityState={{ disabled: action.disabled }}
      disabled={action.disabled}
      onPress={action.onPress}
      style={({ pressed }) => ({ opacity: action.disabled ? 0.38 : pressed ? 0.7 : 1 })}>
      <ThemedView alignItems='center' backgroundColor={backgroundColor} borderRadius={16} gap={6} justifyContent='center' paddingHorizontal={'two'} square={76}>
        <Icon color={color} size={22} strokeWidth={2} />
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14} numberOfLines={2} textAlign='center'>
          {action.label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}
