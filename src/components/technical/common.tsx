import { mhs } from 'themes/scaling';
import { StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

export const screenHorizontalPadding = 18;

export const shortDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
});

export function formatShortTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return shortDateTimeFormatter.format(date);
}

export function formatRelativeTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 365) return '>1y ago';
  return `${diffDays}d ago`;
}

export function hexToRgba(hex: string, opacity: number) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})` : `rgba(0,0,0,${opacity})`;
}

export function StatusPill({ label, tone, customColor }: { label: string; tone: 'danger' | 'neutral' | 'success'; customColor?: string }) {
  return (
    <ThemedView
      style={[
        styles.statusPill,
        tone === 'success' && !customColor ? styles.statusPillSuccess : undefined,
        tone === 'danger' && !customColor ? styles.statusPillDanger : undefined,
        customColor ? { backgroundColor: hexToRgba(customColor, 0.15) } : undefined,
      ]}>
      <ThemedText
        color={customColor ? customColor : tone === 'success' ? Palette.accent : tone === 'danger' ? Palette.danger : Palette.textSecondary}
        fontFamily={FontFamily.bold}
        fontSize={11}
        lineHeight={15}
        numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: mhs(12),
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statusPillDanger: {
    backgroundColor: Palette.dangerSurface,
    borderColor: '#FEE2E2',
  },
  statusPillSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
});
