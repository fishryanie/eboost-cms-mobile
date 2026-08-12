import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { easeGradient } from 'react-native-easing-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText, ThemedView } from 'components/base';

import { useRouter } from 'expo-router';
import { Palette } from 'themes';
import { Colors, HEADER_HEIGHT, MAX_BLUR_INTENSITY, spacing } from './conf';

import type { AnimatedHeaderProps } from './types';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);

const AnimatedHeaderScrollViewComponent: React.FC<AnimatedHeaderProps> = ({
  largeTitle,
  subtitle,
  children,
  rightComponent,
  refreshControl,
  showsVerticalScrollIndicator,
  contentContainerStyle,
  canGoBack,
  onBack,
  largeHeaderTitleStyle,
  largeHeaderSubtitleStyle,
  smallHeaderTitleStyle,
  smallHeaderSubtitleStyle,
}) => {
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.set(event.contentOffset.y);
    },
  });

  const animatedLargeTitleStyle = useAnimatedStyle(() => {
    // Fallback to 40 if not provided
    const fontSizeStyle = (largeHeaderTitleStyle as any)?.fontSize;
    const fontSize = typeof fontSizeStyle === 'number' ? fontSizeStyle : 40;

    const animatedFontSize = interpolate(-scrollY.get(), [0, 100], [fontSize, fontSize * 2], Extrapolation.CLAMP);
    return { fontSize: animatedFontSize, lineHeight: animatedFontSize * 1.18 };
  });

  const largeTitleOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, 60], [1, 0], Extrapolation.CLAMP),
  }));

  const smallHeaderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(interpolate(scrollY.get(), [40, 80], [0, 1], Extrapolation.CLAMP), { duration: 300 }),
    transform: [
      {
        translateY: withTiming(interpolate(scrollY.get(), [40, 80], [20, 0], Extrapolation.CLAMP), { duration: 300 }),
      },
    ],
  }));

  const headerBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, 80], [0, 1], Extrapolation.CLAMP),
  }));

  const headerBlurAnimatedProps = useAnimatedProps(() => ({
    intensity: interpolate(scrollY.get(), [0, 100], [0, MAX_BLUR_INTENSITY], Extrapolation.CLAMP),
  }));

  const mask = easeGradient({
    colorStops: {
      0: { color: 'rgba(255,255,255,1)' },
      0.5: { color: 'rgba(255,255,255,0.99)' },
      1: { color: 'rgba(255,255,255,0)' },
    },
    extraColorStopsPerTransition: 20,
  });

  return (
    <ThemedView flex={1} backgroundColor={Colors.white}>
      <Animated.View
        style={[
          styles.headerBackground,
          {
            height: HEADER_HEIGHT + insets.top,
          },
          headerBackgroundStyle,
        ]}>
        <MaskedView
          maskElement={<LinearGradient colors={mask.colors as any} locations={mask.locations as any} style={StyleSheet.absoluteFill} />}
          style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.94)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />

          <AnimatedBlurView
            animatedProps={headerBlurAnimatedProps as any}
            blurMethod='dimezisBlurViewSdk31Plus'
            intensity={10}
            tint='light'
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </Animated.View>

      <Animated.View
        pointerEvents='none'
        style={[
          styles.fixedHeader,
          {
            paddingTop: insets.top,
            height: HEADER_HEIGHT + insets.top,
          },
          smallHeaderStyle,
        ]}>
        <ThemedView alignItems='center' backgroundColor='transparent' height={HEADER_HEIGHT} justifyContent='center' paddingHorizontal={68}>
          <AnimatedThemedText numberOfLines={1} style={[styles.smallHeaderTitle, smallHeaderTitleStyle]}>
            {largeTitle}
          </AnimatedThemedText>

          {!!subtitle && (
            <AnimatedThemedText numberOfLines={1} style={[styles.smallHeaderSubtitle, smallHeaderSubtitleStyle]}>
              {subtitle}
            </AnimatedThemedText>
          )}
        </ThemedView>
      </Animated.View>

      <ThemedView
        pointerEvents='box-none'
        style={[
          styles.fixedHeader,
          {
            paddingTop: insets.top,
            height: HEADER_HEIGHT + insets.top,
            zIndex: 12,
          },
        ]}>
        <ThemedView
          pointerEvents='box-none'
          flexDirection='row'
          alignItems='center'
          justifyContent='space-between'
          paddingHorizontal={spacing.md}
          height={HEADER_HEIGHT}>
          {canGoBack ? (
            <Pressable
              accessibilityLabel='Go back'
              accessibilityRole='button'
              hitSlop={8}
              onPress={() => (onBack ? onBack() : router.back())}
              style={{ alignItems: 'center', height: 40, justifyContent: 'center', width: 40, zIndex: 1 }}>
              <ChevronLeft color={Palette.textPrimary} size={28} />
            </Pressable>
          ) : (
            <ThemedView backgroundColor='transparent' height={40} width={40} />
          )}

          <ThemedView alignItems='flex-end' backgroundColor='transparent' height={40} justifyContent='center' width={40}>
            {rightComponent}
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <Animated.ScrollView
        onScroll={onScroll}
        refreshControl={refreshControl}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[
          contentContainerStyle,
          {
            paddingTop: Math.max(insets.top, 40) + HEADER_HEIGHT,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}>
        <Animated.View style={[styles.largeTitleContainer, largeTitleOpacityStyle]}>
          <AnimatedThemedText style={[styles.largeTitle, largeHeaderTitleStyle, animatedLargeTitleStyle]}>{largeTitle}</AnimatedThemedText>

          {!!subtitle && (
            <ThemedText color={Colors.gray[400]} fontSize={18} marginTop={spacing.xs} style={largeHeaderSubtitleStyle as any}>
              {subtitle}
            </ThemedText>
          )}
        </Animated.View>

        {children}
      </Animated.ScrollView>
    </ThemedView>
  );
};

export default AnimatedHeaderScrollViewComponent;

const styles = StyleSheet.create({
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
  },

  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    justifyContent: 'flex-end',
  },

  smallHeaderTitle: {
    color: Palette.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 21,
  },

  smallHeaderSubtitle: {
    color: Palette.textSecondary,
    fontSize: 12,
    lineHeight: 15,
  },

  largeTitleContainer: {
    marginBottom: spacing.md,
  },

  largeTitle: {
    fontSize: 40,
    color: Palette.textPrimary,
  },
});
