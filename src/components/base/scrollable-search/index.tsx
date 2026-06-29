// @ts-check
import React, { createContext, useContext, useRef, useState, useMemo, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, TouchableOpacity, type ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { FontFamily, Palette } from 'themes';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import type { IAnimatedComponent, IFocusedScreen, IOverlay, ISearchPanel, IScrollableSearch, IScrollableSearchContext, IScrollContent } from './types';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView as React.ComponentType<any>);
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const SearchInput = TextInput;

const ScrollableSearchContext = createContext<IScrollableSearchContext | null>(null);

const useScrollableSearch = () => {
  const context = useContext<IScrollableSearchContext | null>(ScrollableSearchContext);
  if (!context) {
    throw new Error('ScrollableSearch compound components must be rendered within <ScrollableSearch>');
  }
  return context;
};

function ScrollableSearchRoot({ children }: IScrollableSearch): React.ReactNode & React.JSX.Element & React.ReactNode {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollY = useSharedValue<number>(0);
  const pullDistance = useSharedValue<number>(0);
  const shouldAutoFocus = useSharedValue<boolean>(false);
  const onPullToFocusCallbackRef = useRef<(() => void) | null>(null);

  const setIsFocusedWithDelay = <T extends boolean>(focused: T) => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    if (!focused) {
      dismissTimeoutRef.current = setTimeout(() => {
        Keyboard.dismiss();
      }, 450);
    }

    setIsFocused(focused);
  };

  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo<IScrollableSearchContext>(
    () => ({
      isFocused,
      setIsFocused: setIsFocusedWithDelay,
      scrollY,
      pullDistance,
      shouldAutoFocus,
      onPullToFocusCallbackRef,
    }),
    [isFocused, scrollY, pullDistance, shouldAutoFocus],
  );

  return (
    <ScrollableSearchContext.Provider value={value}>
      <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
        {children}
      </ThemedView>
    </ScrollableSearchContext.Provider>
  );
}

function ScrollContent({ children, pullThreshold = 80 }: IScrollContent): React.ReactNode & React.JSX.Element & React.ReactNode {
  const { isFocused, scrollY, pullDistance, shouldAutoFocus, onPullToFocusCallbackRef } = useScrollableSearch();

  const triggerFocus = () => {
    if (onPullToFocusCallbackRef.current) {
      onPullToFocusCallbackRef.current();
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const offsetY = event.contentOffset.y;
      scrollY.set(offsetY);

      if (offsetY < 0) {
        pullDistance.set(Math.abs(offsetY));

        if (pullDistance.get() > pullThreshold && !shouldAutoFocus.get()) {
          shouldAutoFocus.set(true);
          scheduleOnRN(triggerFocus);
        }
      } else {
        pullDistance.set(0);
      }
    },
    onEndDrag: () => {
      'worklet';
      shouldAutoFocus.set(false);
    },
  });

  const animatedStyle = useAnimatedStyle<Pick<ViewStyle, 'opacity'>>(() => {
    return {
      opacity: 1,
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents={isFocused ? 'none' : 'auto'}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={8}
        bounces={true}>
        {children}
      </Animated.ScrollView>
    </Animated.View>
  );
}

function AnimatedComponent({
  children,
  focusedOffset = -90,
  unfocusedOffset = 30,
  enablePullEffect = true,
  onPullToFocus,
  springConfig = {
    damping: 18,
    stiffness: 120,
    mass: 0.6,
  },
}: IAnimatedComponent): React.ReactNode & React.JSX.Element & React.ReactNode {
  const { isFocused, scrollY, pullDistance, onPullToFocusCallbackRef } = useScrollableSearch();

  useEffect(() => {
    if (onPullToFocus) {
      onPullToFocusCallbackRef.current = onPullToFocus;
    }
    return () => {
      onPullToFocusCallbackRef.current = null;
    };
  }, [onPullToFocus, onPullToFocusCallbackRef]);

  const animatedSearchStylez = useAnimatedStyle<Pick<ViewStyle, 'transform' | 'shadowOpacity'>>(() => {
    const pullDistanceValue = pullDistance.get();
    const scrollYValue = scrollY.get();
    const scale = enablePullEffect ? interpolate(pullDistanceValue, [0, 60, 120], [1, 1.02, 1.05], Extrapolation.CLAMP) : 1;

    const shadowOpacity = enablePullEffect ? interpolate(pullDistanceValue, [0, 60], [0.05, 0.2], Extrapolation.CLAMP) : 0.05;

    const translateY = interpolate(scrollYValue, [0, scrollYValue], [0, -scrollYValue], Extrapolation.CLAMP);

    return {
      transform: [{ scale }, { translateY }],
      shadowOpacity,
    };
  });

  const animatedContainerStylez = useAnimatedStyle<Pick<ViewStyle, 'opacity' | 'transform'>>(() => {
    const baseOffset = isFocused ? focusedOffset : unfocusedOffset;

    const opacity = interpolate(scrollY.get(), [0, 100], [1, 0], Extrapolation.CLAMP);

    const translateY = withSpring(baseOffset, springConfig);

    return {
      transform: [{ translateY }],
      opacity,
    };
  }, [isFocused]);

  return (
    <Animated.View style={[styles.animatedContainer, animatedContainerStylez]}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[animatedSearchStylez]}>{children}</Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

function Overlay({
  children,
  onPress,
  enableBlur = true,
  blurTint = 'dark',
  maxBlurIntensity = 80,
}: IOverlay): React.ReactNode & React.JSX.Element & React.ReactNode {
  const { isFocused, pullDistance, setIsFocused } = useScrollableSearch();

  const animatedBlurProps = useAnimatedProps(() => {
    if (isFocused) {
      return {
        intensity: maxBlurIntensity,
      };
    }

    const intensity = interpolate(pullDistance.get(), [0, 20, 80], [0, 30, maxBlurIntensity], Extrapolation.CLAMP);
    return {
      intensity,
    };
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    if (isFocused) {
      return {
        opacity: withTiming(1, { duration: 350 }),
      };
    }
    const pullDistanceValue = pullDistance.get();
    const opacity = interpolate(pullDistanceValue, [0, 10], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: pullDistanceValue > 0 ? opacity : withTiming(0, { duration: 400 }),
    };
  }, [isFocused]);

  const handlePress = () => {
    if (isFocused) {
      setIsFocused(false);
    }
    onPress?.();
  };

  return (
    <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents={isFocused ? 'auto' : 'none'}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handlePress}>
        {enableBlur ? (
          Platform.OS === 'ios' ? (
            <AnimatedBlurView style={StyleSheet.absoluteFill} tint={blurTint} animatedProps={animatedBlurProps}>
              {children}
            </AnimatedBlurView>
          ) : (
            <ThemedView
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(255,255,255,0.96)',
                },
              ]}>
              {children}
            </ThemedView>
          )
        ) : (
          <Animated.View style={StyleSheet.absoluteFill}>{children}</Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
function FocusedScreen({ children }: IFocusedScreen): React.ReactNode & React.JSX.Element & React.ReactNode {
  const { isFocused } = useScrollableSearch();

  const animatedStylez = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0, {
        duration: isFocused ? 350 : 400,
      }),
    };
  }, [isFocused]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStylez]} pointerEvents={isFocused ? 'box-none' : 'none'}>
      {children}
    </Animated.View>
  );
}

function SearchPanel({ items, onClose, onSelect, placeholder = 'Search CMS', title = 'Search', visible }: ISearchPanel): React.ReactNode {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    const focusTimeout = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(focusTimeout);
  }, [visible]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter(item => [item.title, item.description, item.section].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery));
  }, [items, query]);

  const panelStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(visible ? 1 : 0, { duration: visible ? 160 : 120 }),
      transform: [{ translateY: withTiming(visible ? 0 : 14, { duration: 180 }) }],
    }),
    [visible],
  );

  if (!visible) return null;

  return (
    <AnimatedThemedView
      safePaddingTop
      safePaddingBottom
      backgroundColor='rgba(255,255,255,0.97)'
      bottom={0}
      left={0}
      position='absolute'
      right={0}
      top={0}
      zIndex={200}
      style={panelStyle}>
      <ThemedView flex={1} paddingHorizontal={16} paddingTop={10}>
        <ThemedView alignItems='center' flexDirection='row' gap={10}>
          <ThemedView
            alignItems='center'
            backgroundColor={Palette.surfaceMuted}
            borderColor={Palette.borderSubtle}
            borderRadius={14}
            borderWidth={1}
            flex={1}
            flexDirection='row'
            gap={8}
            height={44}
            paddingHorizontal={12}>
            <Search color={Palette.textTertiary} size={18} />
            <SearchInput
              ref={inputRef}
              accessibilityLabel={title}
              autoCapitalize='none'
              autoCorrect={false}
              cursorColor={Palette.accent}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={Palette.textTertiary}
              returnKeyType='search'
              selectionColor={Palette.accent}
              style={styles.searchInput}
              value={query}
            />
            {query ? (
              <Pressable accessibilityLabel='Clear search' accessibilityRole='button' hitSlop={8} onPress={() => setQuery('')}>
                <X color={Palette.textTertiary} size={18} />
              </Pressable>
            ) : null}
          </ThemedView>
          <Pressable accessibilityLabel='Close search' accessibilityRole='button' hitSlop={8} onPress={onClose}>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
              Cancel
            </ThemedText>
          </Pressable>
        </ThemedView>

        <Animated.ScrollView contentContainerStyle={styles.resultContent} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
          <ThemedView gap={6} paddingTop={18}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={30}>
              {title}
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} lineHeight={20}>
              {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
            </ThemedText>
          </ThemedView>

          {filteredItems.length ? (
            <ThemedView gap={10} paddingTop={16}>
              {filteredItems.map(item => (
                <Pressable
                  accessibilityLabel={`Open ${item.title}`}
                  accessibilityRole='button'
                  key={item.id}
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [styles.resultButton, pressed && styles.resultButtonPressed]}>
                  <ThemedView
                    backgroundColor={Palette.surfaceRaised}
                    borderColor={Palette.borderSubtle}
                    borderRadius={12}
                    borderWidth={1}
                    flexDirection='row'
                    gap={12}
                    padding={14}>
                    <ThemedView backgroundColor={item.accentColor || Palette.accent} borderRadius={10} height={42} opacity={0.14} width={42} />
                    <ThemedView flex={1} gap={4} minWidth={0}>
                      <ThemedView alignItems='center' flexDirection='row' gap={8}>
                        {item.section ? (
                          <ThemedText
                            color={item.accentColor || Palette.accent}
                            fontFamily={FontFamily.bold}
                            fontSize={11}
                            lineHeight={14}
                            textTransform='uppercase'>
                            {item.section}
                          </ThemedText>
                        ) : null}
                      </ThemedView>
                      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={16} lineHeight={22} numberOfLines={1}>
                        {item.title}
                      </ThemedText>
                      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18} numberOfLines={2}>
                        {item.description}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </Pressable>
              ))}
            </ThemedView>
          ) : (
            <ThemedView alignItems='center' gap={8} paddingHorizontal={24} paddingTop={82}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={17} lineHeight={24}>
                No results found
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} lineHeight={20} textAlign='center'>
                Try another menu, service, or dashboard keyword.
              </ThemedText>
            </ThemedView>
          )}
        </Animated.ScrollView>
      </ThemedView>
    </AnimatedThemedView>
  );
}

const ScrollableSearch = Object.assign(ScrollableSearchRoot, {
  ScrollContent,
  AnimatedComponent,
  Overlay,
  FocusedScreen,
  SearchPanel,
});

export { useScrollableSearch, ScrollableSearch };
export type { IScrollableSearchItem } from './types';

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 20,
  },
  animatedContainer: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  resultButton: {
    borderRadius: 12,
  },
  resultButtonPressed: {
    opacity: 0.72,
  },
  resultContent: {
    paddingBottom: 28,
  },
  searchInput: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 24,
    padding: 0,
  },
});
