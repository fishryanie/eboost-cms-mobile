import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, type TextInput as TextInputRef, View, type ViewStyle } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';

type FloatingTextInputProps = Omit<TextInputProps, 'style'> & {
  error?: string;
  label: string;
  style?: ViewStyle;
};

export default function FloatingTextInput({ error, label, onBlur, onFocus, style, value, ...inputProps }: FloatingTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInputRef>(null);
  const animation = useSharedValue(value ? 1 : 0);
  const isFloating = isFocused || Boolean(value);

  useEffect(() => {
    animation.value = withTiming(isFloating ? 1 : 0, {
      duration: 160,
    });
  }, [animation, isFloating]);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      color: error ? '#B42318' : interpolateColor(animation.value, [0, 1], [Palette.textTertiary, Palette.accent]),
      fontSize: interpolate(animation.value, [0, 1], [16, 12]),
      top: interpolate(animation.value, [0, 1], [20, -8]),
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={() => inputRef.current?.focus()} style={[styles.inputFrame, isFocused && styles.focusedFrame, Boolean(error) && styles.errorFrame]}>
        <Animated.Text pointerEvents='none' style={[styles.label, labelAnimatedStyle]}>
          {label}
        </Animated.Text>
        <TextInput
          {...inputProps}
          ref={inputRef}
          onBlur={event => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={isFloating ? '#8A948E' : 'transparent'}
          selectionColor={Palette.accent}
          style={[styles.input, isFloating && styles.floatingInput]}
          value={value}
        />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  errorFrame: {
    borderColor: '#FDA29B',
  },
  errorText: {
    color: '#B42318',
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  focusedFrame: {
    borderColor: Palette.accent,
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  input: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    paddingBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 0,
    textAlignVertical: 'center',
  },
  inputFrame: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: Radius.large,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
  },
  floatingInput: {
    paddingTop: 10,
  },
  label: {
    backgroundColor: Palette.surfaceRaised,
    fontFamily: FontFamily.semibold,
    left: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    zIndex: 1,
  },
});
