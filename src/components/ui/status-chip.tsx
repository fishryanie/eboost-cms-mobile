import { StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';

type StatusTone = 'danger' | 'muted' | 'success' | 'warning';

const toneStyles = {
  danger: { backgroundColor: '#FEE4E2', color: '#B42318' },
  muted: { backgroundColor: Palette.surfaceMuted, color: Palette.textSecondary },
  success: { backgroundColor: '#D1FADF', color: '#027A48' },
  warning: { backgroundColor: '#FEF0C7', color: '#B54708' } };

export function StatusChip({ label, tone = 'muted' }: { label: string; tone?: StatusTone }) {
  const colors = toneStyles[tone];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
      <ThemedText numberOfLines={1} style={[styles.label, { color: colors.color }]}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5 },
  label: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 16 } });
