import { ThemedText, ThemedView } from 'components/base';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, type TextInput as TextInputRef, type ViewStyle } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';

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
  isMoney?: boolean;
  isPassword?: boolean;
  label: string;
  labelBackgroundColor?: string;
  onClear?: () => void;
  style?: ViewStyle;
};

export default function FloatingTextInput({
  error,
  isMoney,
  isPassword,
  label,
  labelBackgroundColor = Palette.surfaceRaised,
  onBlur,
  onFocus,
  onClear,
  style,
  value,
  ...inputProps
}: FloatingTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInputRef>(null);
  const animation = useSharedValue(value ? 1 : 0);
  const isFloating = isFocused || Boolean(value);

  const handleTextChange = (text: string) => {
    if (isMoney) {
      const numericString = text.replace(/[^0-9]/g, '');
      if (!numericString) {
        inputProps.onChangeText?.('');
      } else {
        const formatted = new Intl.NumberFormat('en-US').format(Number(numericString));
        inputProps.onChangeText?.(formatted);
      }
    } else {
      inputProps.onChangeText?.(text);
    }
  };

  useEffect(() => {
    if (isFloating && !isFocused) {
      animation.value = 1;
    } else {
      animation.value = withTiming(isFloating ? 1 : 0, {
        duration: 160,
      });
    }
  }, [animation, isFloating, isFocused]);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      color: error ? '#B42318' : interpolateColor(animation.value, [0, 1], [Palette.textTertiary, Palette.accent]),
      fontSize: interpolate(animation.value, [0, 1], [labelFontSize, floatingLabelFontSize]),
      top: interpolate(animation.value, [0, 1], [labelRestingTop, -8]),
    };
  });

  return (
    <ThemedView style={[styles.container, style]}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          {
            backgroundColor: labelBackgroundColor,
            borderColor: Palette.border,
            borderRadius: mhs(16),
            borderWidth: 1,
            height: inputHeight,
            justifyContent: 'center',
          },
          isFocused && styles.focusedFrame,
          Boolean(error) && styles.errorFrame,
        ]}>
        <Animated.Text
          pointerEvents='none'
          style={[
            {
              backgroundColor: labelBackgroundColor,
              fontFamily: FontFamily.medium,
              left: inputHorizontalPadding,
              paddingHorizontal: mhs(4),
              position: 'absolute',
              includeFontPadding: false,
              zIndex: 1,
            },
            labelAnimatedStyle,
          ]}>
          {label}
        </Animated.Text>
        <TextInput
          {...inputProps}
          ref={inputRef}
          keyboardType={isMoney ? 'numeric' : inputProps.keyboardType}
          onChangeText={handleTextChange}
          onBlur={event => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={isFloating ? '#8A948E' : 'transparent'}
          secureTextEntry={isPassword && !showPassword}
          selectionColor={Palette.accent}
          style={[styles.input, (onClear || isPassword) && Boolean(value) && { paddingRight: mhs(40) }]}
          value={value}
        />
      </Pressable>
      {isPassword && Boolean(value) ? (
        <Pressable
          onPress={() => setShowPassword(p => !p)}
          style={styles.clearButton}>
          {showPassword ? <Eye color={Palette.textTertiary} size={18} /> : <EyeOff color={Palette.textTertiary} size={18} />}
        </Pressable>
      ) : onClear && Boolean(value) ? (
        <Pressable
          onPress={onClear}
          style={styles.clearButton}>
          <SymbolView name='xmark.circle.fill' resizeMode='scaleAspectFit' size={18} tintColor={Palette.textTertiary} />
        </Pressable>
      ) : null}
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
    gap: mhs(8),
  },
  errorFrame: {
    borderColor: '#FDA29B',
  },
  clearButton: {
    alignItems: 'center',
    height: inputHeight,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: mhs(40),
    zIndex: 2,
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
    fontFamily: FontFamily.medium,
    fontSize: inputFontSize,
    lineHeight: inputLineHeight,
    paddingHorizontal: inputHorizontalPadding,
  },
  inputFrame: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(16),
    borderWidth: 1,
    height: inputHeight,
    justifyContent: 'center',
  },
  label: {
    backgroundColor: Palette.surfaceRaised,
    fontFamily: FontFamily.medium,
    left: inputHorizontalPadding,
    paddingHorizontal: mhs(4),
    position: 'absolute',
    includeFontPadding: false,
    zIndex: 1,
  },
});
