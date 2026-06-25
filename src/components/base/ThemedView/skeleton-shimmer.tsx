import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type SkeletonReduceMotion = 'always' | 'never' | 'system';

type SkeletonShimmerProps = {
  baseColor: string;
  shimmerColor: string;
  duration: number;
  reduceMotion: SkeletonReduceMotion;
};

const GRADIENT_WIDTH_PERCENTAGE = 1;

export function SkeletonShimmer({ baseColor, shimmerColor, duration, reduceMotion }: SkeletonShimmerProps) {
  const sharedValue = useSharedValue(0);
  const componentWidth = useSharedValue(0);
  const motion = reduceMotion === 'never' ? ReduceMotion.Never : reduceMotion === 'always' ? ReduceMotion.Always : ReduceMotion.System;

  useEffect(() => {
    sharedValue.set(0);
    sharedValue.set(
      withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.linear,
          reduceMotion: motion,
        }),
        -1,
        false,
        undefined,
        motion,
      ),
    );

    return () => cancelAnimation(sharedValue);
  }, [duration, motion, sharedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const measuredWidth = componentWidth.get();
    const gradientWidth = measuredWidth * GRADIENT_WIDTH_PERCENTAGE;
    const translateX = interpolate(sharedValue.get(), [0, 1], [-gradientWidth, measuredWidth]);

    return {
      opacity: measuredWidth > 0 ? 1 : 0,
      transform: [{ translateX }],
      width: gradientWidth,
    };
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    componentWidth.set(event.nativeEvent.layout.width);
  };

  return (
    <View pointerEvents='none' style={StyleSheet.absoluteFill} onLayout={handleLayout}>
      <Animated.View style={[styles.gradientContainer, animatedStyle]}>
        <LinearGradient colors={['#E6E6E6', '#f5f5f5', '#f5f5f5', '#E6E6E6']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradient} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  gradientContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
});
