import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, type TextInput as TextInputRef, type ViewStyle } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ThemedText, ThemedView } from 'components/base';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);

import { FontFamily, Palette } from 'themes';
import { fs, mhs, rv } from 'themes/scaling';

const inputHeight = rv({ compact: 42, medium: 42, expanded: 42 });
const inputHorizontalPadding = mhs(12);
const inputFontSize = fs(13);
const inputLineHeight = fs(18);
const labelFontSize = fs(12);
const floatingLabelFontSize = fs(11);
const labelRestingTop = (inputHeight - inputLineHeight) / 2;

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
    if (isFloating && !isFocused) {
      animation.value = 1;
    } else {
      animation.value = withTiming(isFloating ? 1 : 0, {
        duration: 160 });
    }
  }, [animation, isFloating, isFocused]);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      color: error ? '#B42318' : interpolateColor(animation.value, [0, 1], [Palette.textTertiary, Palette.accent]),
      fontSize: interpolate(animation.value, [0, 1], [labelFontSize, floatingLabelFontSize]),
      top: interpolate(animation.value, [0, 1], [labelRestingTop, -8]) };
  });

  return (
    <ThemedView style={[styles.container, style]}>
      <Pressable onPress={() => inputRef.current?.focus()} style={[styles.inputFrame, isFocused && styles.focusedFrame, Boolean(error) && styles.errorFrame]}>
        <AnimatedThemedText pointerEvents='none' style={[styles.label, labelAnimatedStyle]}>
          {label}
        </AnimatedThemedText>
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
          style={styles.input}
          value={value}
        />
      </Pressable>
      {error ? (
        <ThemedText color='#B42318' fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: mhs(8) },
  errorFrame: {
    borderColor: '#FDA29B' },
  focusedFrame: {
    borderColor: Palette.accent,
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18 },
  input: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: inputFontSize,
    lineHeight: inputLineHeight,
    paddingBottom: 0,
    paddingHorizontal: inputHorizontalPadding,
    paddingTop: 0,
    textAlignVertical: 'center' },
  inputFrame: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(16),
    borderWidth: 1,
    height: inputHeight,
    justifyContent: 'center' },
  label: {
    backgroundColor: Palette.surfaceRaised,
    fontFamily: FontFamily.medium,
    left: inputHorizontalPadding,
    paddingHorizontal: mhs(4),
    position: 'absolute',
    zIndex: 1 } });
