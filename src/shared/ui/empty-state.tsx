import { StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';

export function EmptyState({ message, title }: { message?: string; title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.five,
  },
  message: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
});
