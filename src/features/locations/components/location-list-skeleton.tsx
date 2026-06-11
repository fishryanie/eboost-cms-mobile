import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ThemedView } from 'components/base';

import { Palette, Radius, Spacing } from 'themes';

const rows = Array.from({ length: 7 }, (_, index) => index);

export function LocationListSkeleton() {
  const opacity = useSharedValue(0.42);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.9, { duration: 720 }), -1, true));
  }, [opacity]);

  const shimmerStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <ThemedView>
      {rows.map(row => (
        <ThemedView
          key={row}
          alignItems='center'
          borderBottomColor={Palette.borderSubtle}
          borderBottomWidth={StyleSheet.hairlineWidth}
          flexDirection='row'
          gap={Spacing.two}
          minHeight={82}
          paddingHorizontal={Spacing.three}
          paddingVertical={Spacing.two}>
          <Animated.View style={[styles.thumbnail, shimmerStyle]} />
          <ThemedView flex={1} gap={6}>
            <ThemedView flexDirection='row' gap={Spacing.two}>
              <Animated.View style={[styles.stat, shimmerStyle]} />
              <Animated.View style={[styles.stat, shimmerStyle]} />
              <Animated.View style={[styles.stat, shimmerStyle]} />
            </ThemedView>
            <Animated.View style={[styles.title, shimmerStyle]} />
            <Animated.View style={[styles.address, shimmerStyle]} />
          </ThemedView>
          <ThemedView alignItems='flex-end' alignSelf='stretch' justifyContent='space-between' paddingVertical={3} width={76}>
            <Animated.View style={[styles.status, shimmerStyle]} />
            <Animated.View style={[styles.toggle, shimmerStyle]} />
          </ThemedView>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  address: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.small,
    height: 10,
    width: '78%',
  },
  stat: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.small,
    height: 9,
    width: 44,
  },
  status: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.small,
    height: 17,
    width: 62,
  },
  thumbnail: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.medium,
    height: 50,
    width: 50,
  },
  title: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.small,
    height: 12,
    width: '58%',
  },
  toggle: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    height: 20,
    width: 38,
  },
});
