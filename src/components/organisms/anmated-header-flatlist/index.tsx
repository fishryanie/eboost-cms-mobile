import { ChevronLeft } from 'lucide-react-native';
import React, { memo } from 'react';
import { FlatList, FlatListProps, ListRenderItem, Pressable, StyleSheet, TextStyle } from 'react-native';

import Animated, { Extrapolation, interpolate, useAnimatedProps, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { easeGradient } from 'react-native-easing-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText, ThemedView } from 'components/base';

import { useRouter } from 'expo-router';
import { Palette } from 'themes';
import { Colors, HEADER_HEIGHT, MAX_BLUR_INTENSITY, spacing } from './conf';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as <T>(
  props: FlatListProps<T> & { ref?: any; animatedProps?: any },
) => React.ReactElement;

export interface AnimatedHeaderFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  largeTitle: string;
  subtitle?: string;
  renderItem?: ListRenderItem<T>;
  rightComponent?: React.ReactNode;
  topRightComponent?: React.ReactNode;
  largeRightComponent?: React.ReactNode;
  searchBar?: React.ReactNode;
  canGoBack?: boolean;
  onBack?: () => void;
  largeTitleContainerStyle?: any;
  largeTitleStretchEnabled?: boolean;

  largeHeaderTitleStyle?: TextStyle;
  largeHeaderSubtitleStyle?: TextStyle;

  smallHeaderTitleStyle?: TextStyle;
  smallHeaderSubtitleStyle?: TextStyle;
}

function AnimatedHeaderFlatListComponent<T>({
  largeTitle,
  subtitle,
  renderItem,
  rightComponent,
  topRightComponent,
  largeRightComponent,
  searchBar,
  canGoBack,
  onBack,
  largeTitleContainerStyle,
  largeTitleStretchEnabled = true,
  largeHeaderTitleStyle,
  largeHeaderSubtitleStyle,
  smallHeaderTitleStyle,
  smallHeaderSubtitleStyle,
  ...flatListProps
}: AnimatedHeaderFlatListProps<T>) {
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flattenedContentStyle = StyleSheet.flatten(flatListProps.contentContainerStyle) || {};
  const contentPaddingLeft = getNumericStyleValue(
    flattenedContentStyle.paddingLeft ?? flattenedContentStyle.paddingHorizontal ?? flattenedContentStyle.padding,
  );
  const contentPaddingRight = getNumericStyleValue(
    flattenedContentStyle.paddingRight ?? flattenedContentStyle.paddingHorizontal ?? flattenedContentStyle.padding,
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.set(event.contentOffset.y);
    },
  });

  const animatedLargeTitleStyle = useAnimatedStyle(() => {
    const fontSize = typeof largeHeaderTitleStyle?.fontSize === 'number' ? largeHeaderTitleStyle.fontSize : 40;

    if (!largeTitleStretchEnabled) return { fontSize };

    return {
      fontSize: interpolate(-scrollY.value, [0, 100], [fontSize, fontSize * 2], Extrapolation.CLAMP),
    };
  });

  const largeTitleOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
  }));

  const smallHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [40, 80], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [40, 80], [12, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const smallSubtitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [80, 100], [0, 0.5], Extrapolation.CLAMP),
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
        style={[
          styles.fixedHeader,
          {
            paddingTop: insets.top,
            height: HEADER_HEIGHT + insets.top,
          },
          smallHeaderStyle,
        ]}>
        <ThemedView pointerEvents='box-none' height={HEADER_HEIGHT}>
          <ThemedView
            pointerEvents='none'
            position='absolute'
            top={0}
            right={0}
            bottom={0}
            left={0}
            alignItems='center'
            justifyContent='center'
            paddingHorizontal={64}>
            <Animated.Text style={[styles.smallHeaderTitle, smallHeaderTitleStyle]}>{largeTitle}</Animated.Text>

            {!!subtitle && <Animated.Text style={[styles.smallHeaderSubtitle, smallHeaderSubtitleStyle, smallSubtitleStyle]}>{subtitle}</Animated.Text>}
          </ThemedView>

          <ThemedView pointerEvents='box-none' flex={1} alignItems='flex-end' justifyContent='center' paddingHorizontal={12}>
            {rightComponent}
          </ThemedView>
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
          paddingHorizontal={12}
          height={HEADER_HEIGHT}>
          {canGoBack ? (
            <Pressable onPress={() => (onBack ? onBack() : router.back())} hitSlop={8} style={{ zIndex: 1 }}>
              <ChevronLeft color={Palette.textPrimary} size={28} />
            </Pressable>
          ) : (
            <ThemedView />
          )}
          {topRightComponent}
        </ThemedView>
      </ThemedView>

      <AnimatedFlatList
        {...flatListProps}
        renderItem={renderItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          flatListProps.contentContainerStyle,
          {
            paddingTop: Math.max(insets.top, 40) + HEADER_HEIGHT,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        ListHeaderComponent={
          <>
            <Animated.View
              style={[
                styles.largeTitleContainer,
                { marginLeft: -contentPaddingLeft, marginRight: -contentPaddingRight },
                largeTitleContainerStyle,
                largeTitleOpacityStyle,
              ]}>
              <ThemedView alignItems='center' flexDirection='row' gap={'three'} justifyContent='space-between'>
                <ThemedView flex={1} minWidth={0}>
                  <Animated.Text style={[styles.largeTitle, largeHeaderTitleStyle, animatedLargeTitleStyle]}>{largeTitle}</Animated.Text>

                  {!!subtitle && (
                    <ThemedText color={Colors.gray[400]} fontSize={18} marginTop={spacing.xs} style={largeHeaderSubtitleStyle}>
                      {subtitle}
                    </ThemedText>
                  )}
                </ThemedView>
                {largeRightComponent}
              </ThemedView>
              {searchBar && (
                <ThemedView marginTop={spacing.sm} width='100%'>
                  {searchBar}
                </ThemedView>
              )}
            </Animated.View>
            {flatListProps.ListHeaderComponent}
          </>
        }
      />
    </ThemedView>
  );
}

function getNumericStyleValue(value: unknown) {
  return typeof value === 'number' ? value : 0;
}

export const AnimatedHeaderFlatList = memo(AnimatedHeaderFlatListComponent) as typeof AnimatedHeaderFlatListComponent;

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
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },

  largeTitle: {
    fontSize: 40,
    color: Palette.textPrimary,
  },
});
