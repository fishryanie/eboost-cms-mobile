import * as Haptics from 'expo-haptics';
import { PropsWithChildren, type ReactElement } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { interpolate, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FontFamily, Palette, Radius, Spacing } from 'themes';

type AppButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';

const DURATION = 300;

const variantColors: Record<AppButtonVariant, { buttonColor: string; textColor: string }> = {
  danger: {
    buttonColor: Palette.danger,
    textColor: '#FFFFFF',
  },
  ghost: {
    buttonColor: 'transparent',
    textColor: Palette.accent,
  },
  primary: {
    buttonColor: Palette.accent,
    textColor: '#FFFFFF',
  },
  secondary: {
    buttonColor: Palette.textPrimary,
    textColor: '#FFFFFF',
  },
};

export type ScaleAnimatedButtonProps = Omit<PressableProps, 'children' | 'disabled' | 'style'> & {
  Icon?: ReactElement;
  buttonColor: string;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  onPress: NonNullable<PressableProps['onPress']>;
  reduceMotion?: 'always' | 'never' | 'system';
  scale?: number;
  style?: StyleProp<ViewStyle>;
  textColor: string;
  textStyle?: StyleProp<TextStyle>;
  title?: string;
};

export type AppButtonProps = Omit<
  ScaleAnimatedButtonProps,
  'Icon' | 'buttonColor' | 'containerStyle' | 'isDisabled' | 'isLoading' | 'onPress' | 'textColor' | 'title'
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
        scale: interpolate(transition.value, [0, 1], [1, scale]),
      },
    ],
  }));
  const disabled = isDisabled || isLoading || props.disabled;
  const renderedTitle = isLoading ? loadingLabel : title;

  return (
    <Pressable
      {...props}
      accessibilityState={{
        ...props.accessibilityState,
        busy: isLoading,
        disabled,
      }}
      accessibilityRole='button'
      disabled={disabled}
      onPress={onPress}
      onPressIn={event => {
        props.onPressIn?.(event);
        isActive.value = true;
        // eslint-disable-next-line react-hooks/immutability
        transition.value = withTiming(1, { duration: DURATION, reduceMotion: motion }, () => {
          if (!isActive.value) {
            transition.value = withTiming(0, {
              duration: DURATION,
              reduceMotion: motion,
            });
          }
        });
      }}
      onPressOut={event => {
        props.onPressOut?.(event);
        if (transition.value === 1) {
          // eslint-disable-next-line react-hooks/immutability
          transition.value = withTiming(0, {
            duration: DURATION,
            reduceMotion: motion,
          });
        }
        isActive.value = false;
      }}>
      <Animated.View
        style={[
          styles.base,
          animatedStyle,
          {
            backgroundColor: buttonColor,
            opacity: isDisabled ? 0.45 : 1,
          },
          containerStyle,
          style,
        ]}>
        {isLoading ? (
          <ActivityIndicator color={textColor} size={18} />
        ) : (
          <>
            {Icon}
            {renderedTitle ? (
              <Text numberOfLines={1} style={[styles.label, { color: textColor }, textStyle]}>
                {renderedTitle}
              </Text>
            ) : null}
          </>
        )}
      </Animated.View>
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
    borderRadius: Radius.large,
    flexDirection: 'row',
    gap: Spacing.two,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  block: {
    alignSelf: 'stretch',
  },
  label: {
    flexShrink: 1,
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
});
