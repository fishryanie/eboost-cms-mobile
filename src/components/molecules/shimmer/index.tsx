import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState, useRef, memo } from 'react';
import { Animated, Easing, LayoutChangeEvent, LayoutRectangle, StyleProp, ViewStyle } from 'react-native';
import { ThemedView, ThemedText } from 'components/base';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);

export interface IShimmerEffect {
  isLoading?: boolean;
  shimmerColors?: string[];
  duration?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  variant?: 'shimmer' | 'pulse';
  direction?: 'leftToRight' | 'rightToLeft' | 'topToBottom' | 'bottomToTop';
  preset?: 'dark' | 'light' | 'custom';
  opacity?: number;
  children?: React.ReactNode;
}

const SHIMMER_PRESETS = {
  dark: { backgroundColor: '#333' },
  light: { backgroundColor: '#eee' },
  custom: { backgroundColor: undefined },
};

export const ShimmerEffect: React.FC<IShimmerEffect> = memo<IShimmerEffect>(
  ({
    isLoading = true,
    shimmerColors,
    duration = 1500,
    className,
    style,
    variant = 'shimmer',
    direction = 'leftToRight',
    preset = 'dark',
    opacity = 1,
    children,
  }: IShimmerEffect) => {
    const [layout, setLayout] = useState<LayoutRectangle | null>(null);
    const shimmerAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
    const pulseAnim = useRef<Animated.Value>(new Animated.Value(0.3)).current;
    const fadeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;

    const themeColors = shimmerColors || ['#333', '#444', '#333'];
    const backgroundColor = preset !== 'custom' ? SHIMMER_PRESETS[preset].backgroundColor : undefined;

    const onLayout = useCallback((e: LayoutChangeEvent) => {
      setLayout(e.nativeEvent.layout);
    }, []);

    useEffect(() => {
      if (!layout) return;
      if (isLoading) {
        fadeAnim.setValue(0);
        if (variant === 'shimmer') {
          shimmerAnim.setValue(0);
          Animated.loop(
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ).start();
        } else {
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: duration / 2,
                easing: Easing.ease,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 0.3,
                duration: duration / 2,
                easing: Easing.ease,
                useNativeDriver: true,
              }),
            ]),
          ).start();
        }
      } else {
        shimmerAnim.stopAnimation();
        pulseAnim.stopAnimation();
        shimmerAnim.setValue(0);
        pulseAnim.setValue(0.3);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }

      return () => {
        shimmerAnim.stopAnimation();
        pulseAnim.stopAnimation();
      };
    }, [layout, isLoading, duration, variant, shimmerAnim, pulseAnim, fadeAnim]);

    const getWaveWidth = () => {
      if (!layout) return 0;
      if (direction === 'leftToRight' || direction === 'rightToLeft') {
        return layout.width * 0.5;
      }
      return layout.height * 0.5;
    };

    const waveWidth = getWaveWidth();

    const getTransform = () => {
      if (!layout) return {};
      if (variant !== 'shimmer') return {};

      switch (direction) {
        case 'leftToRight':
          return {
            transform: [
              {
                translateX: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-waveWidth, layout.width + waveWidth],
                }),
              },
            ],
          };
        case 'rightToLeft':
          return {
            transform: [
              {
                translateX: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layout.width + waveWidth, -waveWidth],
                }),
              },
            ],
          };
        case 'topToBottom':
          return {
            transform: [
              {
                translateY: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-waveWidth, layout.height + waveWidth],
                }),
              },
            ],
          };
        case 'bottomToTop':
          return {
            transform: [
              {
                translateY: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layout.height + waveWidth, -waveWidth],
                }),
              },
            ],
          };
        default:
          return {};
      }
    };

    return (
      <ThemedView
        onLayout={onLayout}
        className={className}
        style={[
          style,
          {
            backgroundColor: isLoading ? backgroundColor : 'transparent',
            opacity,
          },
        ]}
        overflow='hidden'
      >
        {!isLoading && (
          <AnimatedThemedView
            style={{
              opacity: fadeAnim,
            }}>
            {children}
          </AnimatedThemedView>
        )}
        {isLoading && layout && (
          <ThemedView
            position='absolute'
            top={0}
            left={0}
            right={0}
            bottom={0}
            overflow='hidden'
            pointerEvents="none">
            <AnimatedThemedView
              style={[
                {
                  width: variant === 'shimmer' && (direction === 'leftToRight' || direction === 'rightToLeft') ? waveWidth : layout.width,
                  height: variant === 'shimmer' && (direction === 'topToBottom' || direction === 'bottomToTop') ? waveWidth : layout.height,
                  opacity: variant === 'pulse' ? pulseAnim : 1,
                },
                getTransform(),
              ]}>
              {variant === 'shimmer' ? (
                <LinearGradient
                  colors={themeColors as [string, string, ...string[]]}
                  start={direction === 'leftToRight' || direction === 'rightToLeft' ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }}
                  end={direction === 'leftToRight' || direction === 'rightToLeft' ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
                  style={{ flex: 1 }}
                />
              ) : (
                <ThemedView
                  flex={1}
                  backgroundColor={themeColors[1]}
                />
              )}
            </AnimatedThemedView>
          </ThemedView>
        )}
      </ThemedView>
    );
  }
);

export interface IShimmerGroup {
  children: React.ReactNode;
  isLoading?: boolean;
  preset?: 'dark' | 'light' | 'custom';
  duration?: number;
  direction?: 'leftToRight' | 'rightToLeft' | 'topToBottom' | 'bottomToTop';
  opacity?: number;
}

export const ShimmerGroup: React.FC<IShimmerGroup> = memo<IShimmerGroup>(
  ({
    children,
    isLoading = true,
    preset = 'dark',
    duration = 1500,
    direction = 'leftToRight',
    opacity = 1,
  }: IShimmerGroup) => {
    const propagateProps = (children: React.ReactNode): React.ReactNode => {
      return React.Children.map(children, child => {
        if (!React.isValidElement(child)) {
          return child;
        }

        const element = child as React.ReactElement<any>;
        if (element.type === Shimmer || element.type === ShimmerEffect) {
          return React.cloneElement(element, {
            isLoading: element.props.isLoading !== undefined ? element.props.isLoading : isLoading,
            preset: element.props.preset || preset,
            duration: element.props.duration || duration,
            direction: element.props.direction || direction,
            opacity: element.props.opacity !== undefined ? element.props.opacity : opacity,
          });
        }

        if (element.props && element.props.children) {
          return React.cloneElement(element, {
            children: propagateProps(element.props.children),
          });
        }

        return child;
      });
    };

    return <>{propagateProps(children)}</>;
  }
);

export const Shimmer: React.FC<IShimmerEffect> = memo<IShimmerEffect>(
  (props: IShimmerEffect) => {
    return <ShimmerEffect {...props} />;
  }
);