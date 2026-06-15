import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { Search } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { SearchBarProps } from './SearchBar.types';
import { ThemedView, ThemedText } from 'components/base';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const { width: screenWidth } = Dimensions.get('window');

export const SearchBar = ({
  placeholder = 'Search',
  onSearch,
  onClear,
  style,
  renderLeadingIcons,
  renderTrailingIcons,
  onSearchDone = () => {},
  onSearchMount = () => {},
  containerWidth,
  focusedWidth,
  cancelButtonWidth = 68,
  enableWidthAnimation = true,
  centerWhenUnfocused = true,
  ...props
}: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0 });
  const inputRef = useRef<TextInput>(null);

  const focusProgress = useSharedValue(0);
  const clearButtonScale = useSharedValue(0);
  const clearButtonOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(1);
  const textScale = useSharedValue(1);
  const textTranslateY = useSharedValue(0);
  const currentWidth = useSharedValue(containerWidth || screenWidth - 32);

  useEffect(() => {
    if (containerWidth) {
      currentWidth.value = containerWidth;
    } else if (containerDimensions.width > 0) {
      currentWidth.value = containerDimensions.width;
    }
  }, [containerWidth, containerDimensions.width]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    if (!enableWidthAnimation) {
      return { flex: 1 };
    }

    const searchBarWidth = interpolate(focusProgress.value, [0, 1], [currentWidth.value, focusedWidth || currentWidth.value - cancelButtonWidth]);
    return { width: searchBarWidth };
  });

  const animatedCancelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusProgress.value, [0, 0.5, 1], [0, 0, 1]);
    const translateX = interpolate(focusProgress.value, [0, 1], [20, 0]);
    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  const animatedBlurViewProps = useAnimatedProps(() => {
    const blurAmount = withSpring(interpolate(focusProgress.value, [0, 0.3, 0.5, 1], [0, 20, 30, 0]));
    return {
      intensity: blurAmount,
    };
  });

  const animatedSearchContentStyle = useAnimatedStyle(() => {
    const justifyContent = focusProgress.value === 0 && centerWhenUnfocused ? 'center' : 'flex-start';
    if (!centerWhenUnfocused) {
      return { justifyContent };
    }

    const paddingLeft = interpolate(focusProgress.value, [0, 1], [0, 12]);
    return { justifyContent, paddingLeft };
  });

  const animatedInputWrapperStyle = useAnimatedStyle(() => {
    if (!centerWhenUnfocused) {
      return { transform: [{ translateX: 0 }] };
    }

    const iconAndPadding = 40;
    const _centerOffSetValue = props?.textCenterOffset ?? 2.5;
    const centerOffset = (currentWidth.value - iconAndPadding * _centerOffSetValue) / 2 - 10;

    const translateX = interpolate(focusProgress.value, [0, 1], [centerOffset, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return {
      transform: [{ translateX }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    if (!centerWhenUnfocused) {
      return { transform: [{ translateX: 0 }] };
    }
    const _iconCenterValue = props?.iconCenterOffset ?? 2.5;
    const centerOffset = (currentWidth.value - 36 * _iconCenterValue) / 2 - 10;
    const translateX = interpolate(focusProgress.value, [0, 1], [centerOffset, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return {
      transform: [{ translateX }],
    };
  });

  const animatedClearButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clearButtonScale.value }],
    opacity: clearButtonOpacity.value,
  }));

  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ scale: textScale.value }, { translateY: textTranslateY.value }],
    };
  });

  const handleFocus = () => {
    onSearchMount();
    setIsFocused(true);
    focusProgress.value = withSpring(1, {
      damping: 20,
      stiffness: 200,
      mass: 0.8,
      velocity: 0.5,
      duration: 550 as any,
    });
  };

  const handleCancel = () => {
    inputRef.current?.blur();
    setIsFocused(false);
    setQuery('');
    onSearchDone();
    onClear?.();
    focusProgress.value = withTiming(0);
    clearButtonScale.value = withTiming(0);
    clearButtonOpacity.value = withTiming(0, { duration: 200 });
  };

  const handleBlur = () => {
    if (!query) handleCancel();
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (text.length > 0) {
      clearButtonScale.value = withSpring(1);
      clearButtonOpacity.value = withTiming(1, { duration: 200 });
      textOpacity.value = withTiming(1, { duration: 150 });
    } else {
      clearButtonScale.value = withSpring(0);
      clearButtonOpacity.value = withTiming(0, { duration: 200 });
    }

    onSearch?.(text);
  };

  const handleClear = () => {
    textOpacity.value = withTiming(0, { duration: 150 }, () => {
      scheduleOnRN(setQuery, '');
      textOpacity.value = withTiming(1, { duration: 150 });
    });

    clearButtonScale.value = withTiming(0);
    clearButtonOpacity.value = withTiming(0, { duration: 200 });
    onClear?.();
    inputRef.current?.focus();
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerDimensions({ width });
  };

  const animatedAndroidBlurStylez = useAnimatedStyle(() => ({
    filter: [
      {
        blur: withSpring(interpolate(focusProgress.value, [0, 0.3, 0.5, 1], [0, 10, 20, 0])),
      },
    ],
  }));

  return (
    <ThemedView width="100%" paddingHorizontal={0} style={style} onLayout={handleLayout}>
      <ThemedView flexDirection="row" alignItems="center" width="100%">
        <AnimatedView style={[animatedContainerStyle, Platform.OS === 'android' && animatedAndroidBlurStylez]}>
          <ThemedView backgroundColor="rgba(118, 118, 128, 0.12)" borderRadius={999} minHeight={42} justifyContent="center" style={styles.blurContainer}>
            <AnimatedView style={[styles.searchContent, animatedSearchContentStyle]}>
              <AnimatedView style={[styles.searchIconContainer, animatedIconStyle, props?.iconStyle]}>
                {renderLeadingIcons ? (
                  renderLeadingIcons()
                ) : (
                  <Search size={18} color='#98A2B3' />
                )}
              </AnimatedView>

              <AnimatedView style={[{ flex: 1 }, animatedInputWrapperStyle]}>
                <AnimatedTextInput
                  ref={inputRef}
                  style={[styles.input, animatedInputStyle, props?.inputStyle]}
                  cursorColor={props?.tint ?? '#007AFF'}
                  placeholder={placeholder}
                  placeholderTextColor='#98A2B3'
                  value={query}
                  onChangeText={handleChangeText}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  returnKeyType='search'
                  autoCorrect={false}
                  autoCapitalize='none'
                  selectionColor={props?.tint ?? '#007AFF'}
                  {...props}
                />
              </AnimatedView>

              {query.length > 0 && (
                <AnimatedTouchable
                  onPress={handleClear}
                  style={[styles.clearButton, animatedClearButtonStyle]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {renderTrailingIcons ? renderTrailingIcons() : <SymbolView name='xmark.circle.fill' size={18} tintColor='#98A2B3' fallback={<Search size={18} color='#98A2B3' />} />}
                </AnimatedTouchable>
              )}
            </AnimatedView>
          </ThemedView>
        </AnimatedView>

        {enableWidthAnimation && (
          <AnimatedView style={[styles.cancelButtonContainer, animatedCancelStyle]}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton} activeOpacity={0.6} hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}>
              <ThemedText
                fontSize={17}
                fontFamily="System"
                fontWeight="400"
                color={props?.tint ?? '#007AFF'}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </AnimatedView>
        )}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 18,
    paddingVertical: Platform.OS === 'ios' ? 10 : 5,
  },
  searchIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 12,
  },
  input: {
    width: '100%',
    color: '#1F2933',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 24,
    textAlign: 'left',
  },
  clearButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  cancelButtonContainer: {
    paddingLeft: 12,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
});
