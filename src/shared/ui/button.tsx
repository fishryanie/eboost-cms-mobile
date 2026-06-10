import * as Haptics from 'expo-haptics';
import { PropsWithChildren } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native';

import { FontFamily, Palette, Radius, Spacing } from 'themes';

type AppButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';

export type AppButtonProps = PressableProps &
  PropsWithChildren<{
    block?: boolean;
    label?: string;
    loading?: boolean;
    style?: ViewStyle;
    variant?: AppButtonVariant;
  }>;

export function AppButton({ block, children, disabled, label, loading, onPress, style, variant = 'primary', ...props }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole='button'
      disabled={disabled || loading}
      onPress={event => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress?.(event);
      }}
      style={({ pressed }) => [styles.base, styles[variant], block && styles.block, (disabled || loading) && styles.disabled, pressed && styles.pressed, style]}
      {...props}>
      <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{loading ? 'Loading...' : label || children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.large,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  block: {
    alignSelf: 'stretch',
  },
  danger: {
    backgroundColor: Palette.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostLabel: {
    color: Palette.accent,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  primary: {
    backgroundColor: Palette.accent,
  },
  secondary: {
    backgroundColor: Palette.textPrimary,
  },
});
