import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';
import { StatusChip } from 'shared/ui';

import { getWorkflowChargerIdentifier, getWorkflowChargerType } from '../charger-workflows';
import type { WorkflowChargerRecord } from '../types';

export function ChargerCard({ charger, onActions }: { charger: WorkflowChargerRecord; onActions?: () => void }) {
  const type = getWorkflowChargerType(charger);
  const identifier = getWorkflowChargerIdentifier(charger);
  const isOnline = charger.visible !== false && charger.enabled !== false;

  return (
    <Pressable onPress={onActions} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.name}>
            {charger.name || identifier || `Box #${charger.id}`}
          </Text>
          <Text numberOfLines={1} style={styles.identifier}>
            {identifier || 'No identifier'}
          </Text>
        </View>
        <StatusChip label={type.toUpperCase()} tone={type === 'car' ? 'warning' : 'muted'} />
      </View>
      <View style={styles.footer}>
        <StatusChip label={isOnline ? 'Visible' : 'Hidden'} tone={isOnline ? 'success' : 'danger'} />
        <Text style={styles.action}>Actions</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
  card: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.four,
    padding: Spacing.four,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  identifier: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginTop: 3,
  },
  name: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.72,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
