// @ts-check
import React, { createContext, useContext, useRef, useState, useMemo, useEffect, useEffectEvent } from 'react';
import { BlurView } from 'expo-blur';
import { BackHandler, Keyboard, Platform, Pressable, ScrollView, SectionList, StyleSheet, TextInput, TouchableOpacity, type ViewStyle } from 'react-native';
import { ChevronRight, Search, SearchX, XCircle } from 'lucide-react-native';
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
import { FontFamily, Palette, Spacing } from 'themes';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import type {
  IAnimatedComponent,
  IFocusedScreen,
  IOverlay,
  ISearchPanel,
  IScrollableSearch,
  IScrollableSearchContext,
  IScrollableSearchItem,
  IScrollContent,
} from './types';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView as React.ComponentType<any>);
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
  const [activeSection, setActiveSection] = useState('');
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<SectionList<IScrollableSearchItem>>(null);

  useEffect(() => {
    listRef.current?.getScrollResponder()?.scrollTo({ animated: false, y: 0 });
  }, [activeSection, query]);

  useEffect(() => {
    if (!visible) return;
    const focusTimeout = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(focusTimeout);
  }, [visible]);

  const closeOnBack = useEffectEvent(() => {
    Keyboard.dismiss();
    onClose();
  });

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeOnBack();
      return true;
    });
    return () => subscription.remove();
  }, [visible]);

  const sectionNames = useMemo(() => [...new Set(items.map(item => item.section).filter((section): section is string => Boolean(section)))], [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter(item => {
      if (activeSection && item.section !== activeSection) return false;
      return !normalizedQuery || [item.title, item.description, item.section].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    });
  }, [activeSection, items, query]);

  const sections = useMemo(() => {
    const grouped = new Map<string, IScrollableSearchItem[]>();
    for (const item of filteredItems) {
      const section = item.section || 'Tools';
      const group = grouped.get(section) || [];
      group.push(item);
      grouped.set(section, group);
    }
    return [...grouped].map(([sectionTitle, data]) => ({ title: sectionTitle, data }));
  }, [filteredItems]);

  if (!visible) return null;

  return (
    <ThemedView
      accessibilityViewIsModal
      safePaddingTop
      safePaddingBottom
      backgroundColor={Palette.surfaceBase}
      bottom={0}
      left={0}
      position='absolute'
      right={0}
      top={0}
      zIndex={200}>
      <ThemedView gap={'four'} paddingHorizontal={'five'} paddingTop={'three'}>
        <ThemedView alignItems='center' flexDirection='row' gap={'four'} justifyContent='space-between'>
          <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.bold} fontSize={30} lineHeight={38}>
            {title}
          </ThemedText>
          <Pressable
            accessibilityLabel='Close search'
            accessibilityRole='button'
            hitSlop={8}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}>
            {({ pressed }) => (
              <ThemedView justifyContent='center' minHeight={44} opacity={pressed ? 0.55 : 1}>
                <ThemedText color={Palette.accentPressed} fontFamily={FontFamily.medium} fontSize={15} lineHeight={22}>
                  Cancel
                </ThemedText>
              </ThemedView>
            )}
          </Pressable>
        </ThemedView>

        <ThemedView
          alignItems='center'
          backgroundColor={Palette.surfaceMuted}
          borderCurve='continuous'
          borderRadius={'medium'}
          flexDirection='row'
          gap={'three'}
          minHeight={50}
          paddingHorizontal={'four'}
          paddingVertical={'three'}>
          <Search color={Palette.textSecondary} size={20} strokeWidth={1.8} />
          <SearchInput
            ref={inputRef}
            accessibilityLabel={title}
            autoCapitalize='none'
            autoCorrect={false}
            cursorColor={Palette.accent}
            onChangeText={setQuery}
            placeholder={placeholder}
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholderTextColor={Palette.textSecondary}
            returnKeyType='search'
            selectionColor={Palette.accent}
            style={{ color: Palette.textPrimary, flex: 1, fontFamily: FontFamily.regular, fontSize: 16, minWidth: 0, padding: 0 }}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityLabel='Clear search'
              accessibilityRole='button'
              hitSlop={14}
              onPress={() => {
                setQuery('');
                inputRef.current?.focus();
              }}>
              <XCircle color={Palette.textSecondary} size={20} strokeWidth={1.8} />
            </Pressable>
          ) : null}
        </ThemedView>
      </ThemedView>

      <ThemedView borderBottomColor={Palette.borderSubtle} borderBottomWidth={StyleSheet.hairlineWidth} marginTop={'three'}>
        <ScrollView
          horizontal
          contentContainerStyle={{ gap: Spacing.five, paddingHorizontal: Spacing.five }}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'>
          {['', ...sectionNames].map(section => {
            const selected = activeSection === section;
            return (
              <Pressable
                accessibilityLabel={section || 'All tools'}
                accessibilityRole='tab'
                accessibilityState={{ selected }}
                key={section || 'all'}
                onPress={() => setActiveSection(section)}>
                {({ pressed }) => (
                  <ThemedView justifyContent='center' minHeight={44} opacity={pressed ? 0.55 : 1} paddingVertical={'three'}>
                    <ThemedText
                      color={selected ? Palette.accentPressed : Palette.textSecondary}
                      fontFamily={selected ? FontFamily.semibold : FontFamily.medium}
                      fontSize={13}
                      lineHeight={20}>
                      {section || 'All'}
                    </ThemedText>
                    {selected ? (
                      <ThemedView backgroundColor={Palette.accent} borderRadius={'pill'} bottom={0} height={2} left={0} position='absolute' right={0} />
                    ) : null}
                  </ThemedView>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </ThemedView>

      <SectionList
        ref={listRef}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: Spacing.five, paddingHorizontal: Spacing.five }}
        contentInsetAdjustmentBehavior='never'
        ItemSeparatorComponent={() => <ThemedView backgroundColor={Palette.borderSubtle} height={StyleSheet.hairlineWidth} marginLeft={56} />}
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <ThemedView alignItems='center' gap={'three'} paddingHorizontal={'five'} paddingTop={'seven'}>
            <SearchX color={Palette.textTertiary} size={32} strokeWidth={1.5} />
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={18} lineHeight={26} textAlign='center'>
              No results found
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} lineHeight={21} textAlign='center'>
              Try a different keyword or search all tools.
            </ThemedText>
            <Pressable
              accessibilityLabel='Reset search'
              accessibilityRole='button'
              onPress={() => {
                setQuery('');
                setActiveSection('');
                inputRef.current?.focus();
              }}>
              {({ pressed }) => (
                <ThemedView justifyContent='center' minHeight={44} opacity={pressed ? 0.55 : 1}>
                  <ThemedText color={Palette.accentPressed} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={21}>
                    Reset search
                  </ThemedText>
                </ThemedView>
              )}
            </Pressable>
          </ThemedView>
        }
        ListHeaderComponent={
          query.trim() ? (
            <ThemedView paddingTop={'five'}>
              <ThemedText accessibilityLiveRegion='polite' color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={18}>
                {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
              </ThemedText>
            </ThemedView>
          ) : null
        }
        renderItem={({ item }) => <SearchResultRow item={item} onSelect={onSelect} />}
        renderSectionHeader={({ section }) => (
          <ThemedView alignItems='center' flexDirection='row' gap={'two'} paddingBottom={'one'} paddingTop={'five'}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={21}>
              {section.title}
            </ThemedText>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={18}>
              {section.data.length}
            </ThemedText>
          </ThemedView>
        )}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        style={{ flex: 1 }}
      />
    </ThemedView>
  );
}

function SearchResultRow({ item, onSelect }: { item: IScrollableSearchItem; onSelect: ISearchPanel['onSelect'] }) {
  return (
    <Pressable
      accessibilityHint={item.description}
      accessibilityLabel={`Open ${item.title}`}
      accessibilityRole='button'
      onPress={() => {
        Keyboard.dismiss();
        onSelect(item);
      }}>
      {({ pressed }) => (
        <ThemedView
          alignItems='center'
          backgroundColor={pressed ? Palette.surfaceMuted : 'transparent'}
          borderCurve='continuous'
          borderRadius={'small'}
          flexDirection='row'
          gap={'four'}
          minHeight={80}
          paddingVertical={'four'}>
          <ThemedView
            alignItems='center'
            backgroundColor={Palette.surfaceMuted}
            borderCurve='continuous'
            borderRadius={'small'}
            justifyContent='center'
            square={40}>
            {item.icon || <Search color={Palette.textSecondary} size={20} strokeWidth={1.8} />}
          </ThemedView>
          <ThemedView flex={1} gap={'one'} minWidth={0}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={16} lineHeight={23} numberOfLines={2}>
              {item.title}
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={19} numberOfLines={2}>
              {item.description}
            </ThemedText>
          </ThemedView>
          <ChevronRight color={Palette.textTertiary} size={16} strokeWidth={1.6} />
        </ThemedView>
      )}
    </Pressable>
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
});
