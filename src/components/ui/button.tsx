import * as Haptics from 'expo-haptics';
import { PropsWithChildren, type ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { interpolate, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ThemedView, ThemedText } from 'components/base';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

import { fs, mhs, mvs, rv } from 'themes/scaling';
import { FontFamily, Palette } from 'themes';

type AppButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';

const DURATION = 300;

const variantColors: Record<AppButtonVariant, { buttonColor: string; textColor: string }> = {
  danger: {
    buttonColor: Palette.danger,
    textColor: '#FFFFFF' },
  ghost: {
    buttonColor: 'transparent',
    textColor: Palette.accent },
  primary: {
    buttonColor: Palette.accent,
    textColor: '#FFFFFF' },
  secondary: {
    buttonColor: Palette.textPrimary,
    textColor: '#FFFFFF' } };

export type ScaleAnimatedButtonProps = Omit<PressableProps, 'children' | 'disabled' | 'style'> & {
  Icon?: ReactElement;
  buttonColor: string;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  onPress: NonNullable<PressableProps['onPress']>;
  pressableStyle?: StyleProp<ViewStyle>;
  reduceMotion?: 'always' | 'never' | 'system';
  scale?: number;
  style?: StyleProp<ViewStyle>;
  textColor: string;
  textStyle?: StyleProp<TextStyle>;
  title?: string;
};

export type AppButtonProps = Omit<
  ScaleAnimatedButtonProps,
  'Icon' | 'buttonColor' | 'containerStyle' | 'isDisabled' | 'isLoading' | 'onPress' | 'pressableStyle' | 'textColor' | 'title'
> &
  PropsWithChildren<{
    block?: boolean;
    buttonColor?: string;
    disabled?: boolean;
    icon?: ReactElement;
    label?: string;
    loading?: boolean;
    onPress: NonNullable<PressableProps['onPress']>;
    textColor?: string;
    variant?: AppButtonVariant;
  }>;

export function ScaleAnimatedButton({
  Icon,
  buttonColor,
  containerStyle,
  isDisabled = false,
  isLoading = false,
  loadingLabel,
  onPress,
  pressableStyle,
  reduceMotion = 'system',
  scale = 0.95,
  style,
  textColor,
  textStyle,
  title,
  ...props
}: ScaleAnimatedButtonProps) {
  const transition = useSharedValue(0);
  const isActive = useSharedValue(false);
  const motion = reduceMotion === 'never' ? ReduceMotion.Never : reduceMotion === 'always' ? ReduceMotion.Always : ReduceMotion.System;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(transition.get(), [0, 1], [1, scale]) },
    ] }));
  const disabled = isDisabled || isLoading || props.disabled;
  const renderedTitle = isLoading ? loadingLabel : title;
  const resolvedStyle = StyleSheet.flatten(style);
  const hasExplicitWidth = resolvedStyle?.width !== undefined;

  return (
    <Pressable
      {...props}
      accessibilityState={{
        ...props.accessibilityState,
        busy: isLoading,
        disabled }}
      accessibilityRole='button'
      disabled={disabled}
      onPress={onPress}
      onPressIn={event => {
        props.onPressIn?.(event);
        isActive.set(true);
        transition.set(
          withTiming(1, { duration: DURATION, reduceMotion: motion }, () => {
            if (!isActive.get()) {
              transition.set(
                withTiming(0, {
                  duration: DURATION,
                  reduceMotion: motion }),
              );
            }
          }),
        );
      }}
      onPressOut={event => {
        props.onPressOut?.(event);
        if (transition.get() === 1) {
          transition.set(
            withTiming(0, {
              duration: DURATION,
              reduceMotion: motion }),
          );
        }
        isActive.set(false);
      }}
      style={[hasExplicitWidth ? { width: resolvedStyle.width } : styles.defaultPressable, pressableStyle]}>
      <AnimatedThemedView
        style={[
          styles.base,
          animatedStyle,
          {
            backgroundColor: buttonColor,
            opacity: isDisabled ? 0.45 : 1 },
          containerStyle,
          style,
        ]}>
        {isLoading ? (
          <ActivityIndicator color={textColor} size={mhs(18)} />
        ) : (
          <>
            {Icon}
            {renderedTitle ? (
              <ThemedText numberOfLines={1} style={[styles.label, { color: textColor }, textStyle]}>
                {renderedTitle}
              </ThemedText>
            ) : null}
          </>
        )}
      </AnimatedThemedView>
    </Pressable>
  );
}

export function AppButton({
  block,
  buttonColor,
  children,
  disabled,
  icon,
  label,
  loading,
  onPress,
  style,
  textColor,
  variant = 'primary',
  ...props
}: AppButtonProps) {
  const colors = variantColors[variant];
  const title = label ?? (typeof children === 'string' ? children : undefined);

  return (
    <ScaleAnimatedButton
      buttonColor={buttonColor ?? colors.buttonColor}
      Icon={icon}
      isDisabled={disabled}
      isLoading={loading}
      loadingLabel='Loading...'
      onPress={event => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress(event);
      }}
      style={[block && styles.block, style]}
      textColor={textColor ?? colors.textColor}
      title={title}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: mhs(21),
    flexDirection: 'row',
    gap: mhs(8),
    height: rv({ compact: 44, medium: 48 }),
    justifyContent: 'center',
    paddingHorizontal: mhs(24),
    paddingVertical: mhs(12) },
  block: { alignSelf: 'stretch' },
  defaultPressable: {
    alignSelf: 'stretch',
    flexGrow: 1,
    flexShrink: 1 },
  label: {
    flexShrink: 1,
    fontFamily: FontFamily.bold,
    fontSize: fs(14),
    lineHeight: mvs(20) } });
