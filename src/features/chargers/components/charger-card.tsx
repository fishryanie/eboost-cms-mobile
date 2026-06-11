import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { StatusChip } from 'shared/ui';

import { getWorkflowChargerIdentifier, getWorkflowChargerType } from '../charger-workflows';
import type { WorkflowChargerRecord } from '../types';

export function ChargerCard({ charger, onActions }: { charger: WorkflowChargerRecord; onActions?: () => void }) {
  const type = getWorkflowChargerType(charger);
  const identifier = getWorkflowChargerIdentifier(charger);
  const isOnline = charger.visible !== false && charger.enabled !== false;

  return (
    <Pressable onPress={onActions} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <ThemedView alignItems='flex-start' flexDirection='row' gap={Spacing.three} justifyContent='space-between'>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22}>
            {charger.name || identifier || `Box #${charger.id}`}
          </ThemedText>
          <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} marginTop={3}>
            {identifier || 'No identifier'}
          </ThemedText>
        </ThemedView>
        <StatusChip label={type.toUpperCase()} tone={type === 'car' ? 'warning' : 'muted'} />
      </ThemedView>
      <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
        <StatusChip label={isOnline ? 'Visible' : 'Hidden'} tone={isOnline ? 'success' : 'danger'} />
        <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13}>
          Actions
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.four,
    padding: Spacing.four,
  },
  pressed: {
    opacity: 0.72,
  },
});
