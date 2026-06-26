import { ChevronLeft } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, StyleSheet, TextStyle, View } from 'react-native';

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

const AnimatedHeaderScrollViewComponent: React.FC<AnimatedHeaderProps> = ({
  largeTitle,
  subtitle,
  children,
  rightComponent,
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
      scrollY.value = event.contentOffset.y;
    },
  });

  const animatedLargeTitleStyle = useAnimatedStyle(() => {
    // Fallback to 40 if not provided
    const fontSizeStyle = (largeHeaderTitleStyle as any)?.fontSize;
    const fontSize = typeof fontSizeStyle === 'number' ? fontSizeStyle : 40;

    return {
      fontSize: interpolate(-scrollY.value, [0, 100], [fontSize, fontSize * 2], Extrapolation.CLAMP),
    };
  });

  const largeTitleOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
  }));

  const smallHeaderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(interpolate(scrollY.value, [40, 80], [0, 1], Extrapolation.CLAMP), { duration: 300 }),
    transform: [
      {
        translateY: withTiming(interpolate(scrollY.value, [40, 80], [20, 0], Extrapolation.CLAMP), { duration: 300 }),
      },
    ],
  }));

  const smallSubtitleStyle = useAnimatedStyle(() => ({
    opacity: withSpring(scrollY.value > 100 ? 0.5 : 0),
  }));

  const headerBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
  }));

  const headerBlurAnimatedProps = useAnimatedProps(() => ({
    intensity: interpolate(scrollY.value, [0, 100], [0, MAX_BLUR_INTENSITY], Extrapolation.CLAMP),
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
            height: HEADER_HEIGHT + insets.top + 50,
          },
          headerBackgroundStyle,
        ]}>
        <MaskedView
          maskElement={<LinearGradient colors={mask.colors as any} locations={mask.locations as any} style={StyleSheet.absoluteFill} />}
          style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />

          <AnimatedBlurView animatedProps={headerBlurAnimatedProps as any} intensity={10} tint='light' style={StyleSheet.absoluteFill} />
        </MaskedView>
      </Animated.View>

      <Animated.View
        style={[
          styles.fixedHeader,
          {
            paddingTop: insets.top,
            height: HEADER_HEIGHT + insets.top,
          },
          smallHeaderStyle,
        ]}>
        <ThemedView rowCenter justifyContent='space-between' paddingHorizontal={spacing.lg} height={HEADER_HEIGHT}>
          <ThemedView flex={1} alignItems='center'>
            <Animated.Text style={[styles.smallHeaderTitle, smallHeaderTitleStyle]}>{largeTitle}</Animated.Text>

            {!!subtitle && <Animated.Text style={[styles.smallHeaderSubtitle, smallHeaderSubtitleStyle, smallSubtitleStyle]}>{subtitle}</Animated.Text>}
          </ThemedView>

          {rightComponent}
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
            <Pressable onPress={() => (onBack ? onBack() : router.back())} hitSlop={8} style={{ zIndex: 1 }}>
              <ChevronLeft color={Palette.textPrimary} size={28} />
            </Pressable>
          ) : (
            <ThemedView />
          )}
        </ThemedView>
      </ThemedView>

      <Animated.ScrollView
        onScroll={onScroll}
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
          <Animated.Text style={[styles.largeTitle, largeHeaderTitleStyle, animatedLargeTitleStyle]}>{largeTitle}</Animated.Text>

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

export default memo(AnimatedHeaderScrollViewComponent);

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
  },

  smallHeaderSubtitle: {
    color: Palette.textSecondary,
    fontSize: 12,
  },

  largeTitleContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  largeTitle: {
    fontSize: 40,
    color: Palette.textPrimary,
  },
});
