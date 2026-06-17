import { ThemedText, ThemedView } from 'components/base';
import React, { memo } from 'react';
import { StyleSheet, TextStyle, ViewStyle, Pressable } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, HEADER_HEIGHT, spacing } from './conf';
import type { AnimatedHeaderProps } from './types';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);

export const AnimatedHeaderScrollView: React.FC<AnimatedHeaderProps> & React.FunctionComponent<AnimatedHeaderProps> = memo<AnimatedHeaderProps>(
  ({
    largeTitle,
    subtitle,
    children,
    searchBar,
    rightComponent,
    canGoBack,
    onBack,
    showsVerticalScrollIndicator = false,
    contentContainerStyle,
    largeTitleContainerStyle,
    largeHeaderTitleStyle: _largeTitleStyle = { fontSize: 34 },
    largeHeaderSubtitleStyle,
    smallHeaderSubtitleStyle: _smallHeaderSubtitleStylez,
    smallHeaderTitleStyle,
    isFlatList,
    flatListProps,
    refreshControl,
  }: AnimatedHeaderProps): (React.ReactNode & React.JSX.Element & React.ReactElement) | null => {
    const router = useRouter();
    const scrollY = useSharedValue<number>(0);
    const insets = useSafeAreaInsets();
    const safeTop = Math.max(insets.top, 40); // ensure there's always space for notch
    const hasHeaderControls = canGoBack || Boolean(rightComponent);
    const paddingOffset = hasHeaderControls ? HEADER_HEIGHT : 24;
    const paddingTop = safeTop + paddingOffset;

    const onScroll = useAnimatedScrollHandler<Record<string, unknown>>({
      onScroll: event => {
        scrollY.value = event.contentOffset.y;
      },
    });

    const animatedLargeTitleStylez = useAnimatedStyle<Partial<Pick<TextStyle, 'fontSize'>>>(() => {
      const __largeTitleProps__: any = _largeTitleStyle || {};
      const fontSizeValue = __largeTitleProps__['fontSize'] || 34;
      const fontSize = interpolate(-scrollY.value, [0, 100], [fontSizeValue, fontSizeValue * 1.5], Extrapolation.CLAMP);
      return {
        fontSize,
      };
    });

    const largeTitleStyle = useAnimatedStyle<Partial<Pick<TextStyle, 'opacity'>>>(() => {
      const opacity = interpolate(scrollY.value, [0, paddingOffset], [1, 0], Extrapolation.CLAMP);
      return {
        opacity,
      };
    });

    const smallHeaderStyle = useAnimatedStyle<Partial<Pick<TextStyle, 'opacity' | 'transform'>>>(() => {
      const opacity = withTiming<number>(
        interpolate(scrollY.value, [paddingOffset, paddingOffset + 40], [0, 1], Extrapolation.CLAMP),
        { duration: 300 }
      );
      const translateY = withTiming<number>(
        interpolate(scrollY.value, [paddingOffset, paddingOffset + 40], [20, 0], Extrapolation.CLAMP),
        { duration: 300 }
      );
      return {
        opacity,
        transform: [{ translateY }],
      };
    });

    const smallHeaderSubtitleStyle = useAnimatedStyle<Partial<Pick<TextStyle, 'opacity' | 'transform'>>>(() => {
      const shouldShow = scrollY.value > 100;
      return {
        opacity: withSpring<number>(shouldShow ? 0.5 : 0, {
          damping: 18,
          stiffness: 120,
          mass: 1.2,
        }),
        transform: [
          {
            translateY: withTiming<number>(shouldShow ? 0 : 10, {
              duration: 400,
            }),
          },
        ],
      };
    });

    const headerBackgroundStylez = useAnimatedStyle<Partial<Pick<ViewStyle, 'opacity'>>>(() => {
      const opacity = interpolate(scrollY.value, [0, paddingOffset + 40], [0, 1], Extrapolation.CLAMP);
      return {
        opacity,
      };
    });

    const handleBack = () => {
      if (onBack) {
        onBack();
      } else if (router.canGoBack()) {
        router.back();
      }
    };

    return (
      <ThemedView flex={1} backgroundColor='transparent'>
        <AnimatedThemedView
          style={[
            styles.headerBackgroundContainer,
            {
              height: HEADER_HEIGHT + safeTop,
            },
            headerBackgroundStylez,
          ]}
        />
        <AnimatedThemedView
          style={[
            styles.fixedHeader,
            {
              paddingTop: safeTop,
              height: HEADER_HEIGHT + safeTop,
            },
            smallHeaderStyle,
          ]}>
          <ThemedView flexDirection='row' alignItems='center' justifyContent='center' paddingHorizontal={spacing.lg} height={HEADER_HEIGHT}>
            <AnimatedThemedText type="defaultSemiBold" style={[styles.smallHeaderTitle, smallHeaderTitleStyle]} numberOfLines={1}>
              {largeTitle}
            </AnimatedThemedText>
          </ThemedView>
        </AnimatedThemedView>

        <ThemedView
          pointerEvents='box-none'
          style={[
            styles.fixedHeader,
            {
              paddingTop: safeTop,
              height: HEADER_HEIGHT + safeTop,
              zIndex: 12,
            },
          ]}>
          <ThemedView pointerEvents='box-none' flexDirection='row' alignItems='center' justifyContent='space-between' paddingHorizontal={spacing.md} height={HEADER_HEIGHT}>
            {canGoBack ? (
              <Pressable onPress={handleBack} hitSlop={8} style={{ zIndex: 1 }}>
                <ChevronLeft color={Colors.black} size={28} />
              </Pressable>
            ) : <ThemedView />}
            {rightComponent && (
              <ThemedView zIndex={1}>
                {rightComponent}
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {isFlatList ? (
          <Animated.FlatList
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            {...(flatListProps as any)}
            contentContainerStyle={[
              {
                paddingTop: paddingTop,
                paddingBottom: insets.bottom + spacing.xl,
              },
              contentContainerStyle,
              flatListProps?.contentContainerStyle,
            ]}
            ListHeaderComponent={
              <>
                <AnimatedThemedView style={[styles.largeTitleContainer, largeTitleStyle, largeTitleContainerStyle]}>
                  <ThemedView width='100%'>
                    <AnimatedThemedText type="title" style={[styles.largeTitle, _largeTitleStyle, animatedLargeTitleStylez]}>{largeTitle}</AnimatedThemedText>
                    {subtitle && (
                      <ThemedText fontSize={16} color={Colors.gray[400]} marginTop={spacing.xs} paddingTop={5} style={largeHeaderSubtitleStyle}>
                        {subtitle}
                      </ThemedText>
                    )}
                    {searchBar && (
                      <ThemedView marginTop={spacing.sm} width='100%'>
                        {searchBar}
                      </ThemedView>
                    )}
                  </ThemedView>
                </AnimatedThemedView>
                {flatListProps?.ListHeaderComponent}
              </>
            }
          />
        ) : (
          <Animated.ScrollView
            refreshControl={refreshControl}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            contentContainerStyle={[
              {
                paddingTop: paddingTop,
                paddingBottom: insets.bottom + spacing.xl,
              },
              contentContainerStyle,
            ]}>
            <AnimatedThemedView style={[styles.largeTitleContainer, largeTitleStyle, largeTitleContainerStyle]}>
              <ThemedView width='100%'>
                <AnimatedThemedText type="title" style={[styles.largeTitle, _largeTitleStyle, animatedLargeTitleStylez]}>{largeTitle}</AnimatedThemedText>
                {subtitle && (
                  <ThemedText fontSize={16} color={Colors.gray[400]} marginTop={spacing.xs} paddingTop={5} style={largeHeaderSubtitleStyle}>
                    {subtitle}
                  </ThemedText>
                )}
                {searchBar && (
                  <ThemedView marginTop={spacing.sm} width='100%'>
                    {searchBar}
                  </ThemedView>
                )}
              </ThemedView>
            </AnimatedThemedView>
            <ThemedView>{children}</ThemedView>
          </Animated.ScrollView>
        )}
      </ThemedView>
    );
  },
);

export default memo<React.FC<AnimatedHeaderProps> & React.FunctionComponent<AnimatedHeaderProps>>(AnimatedHeaderScrollView);

const styles = StyleSheet.create({
  headerBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
  },
  smallHeaderSubtitle: {
    fontSize: 12,
    color: Colors.gray[400],
    textAlign: 'center',
  },
  largeTitleContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.5,
    paddingTop: 5,
  },
});
