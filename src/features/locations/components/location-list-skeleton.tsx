import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Palette, Radius, Spacing } from 'constants/theme';

const rows = Array.from({ length: 7 }, (_, index) => index);

export function LocationListSkeleton() {
  const opacity = useSharedValue(0.42);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.9, { duration: 720 }), -1, true));
  }, [opacity]);

  const shimmerStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <View>
      {rows.map(row => (
        <View key={row} style={styles.row}>
          <Animated.View style={[styles.thumbnail, shimmerStyle]} />
          <View style={styles.main}>
            <View style={styles.stats}>
              <Animated.View style={[styles.stat, shimmerStyle]} />
              <Animated.View style={[styles.stat, shimmerStyle]} />
              <Animated.View style={[styles.stat, shimmerStyle]} />
            </View>
            <Animated.View style={[styles.title, shimmerStyle]} />
            <Animated.View style={[styles.address, shimmerStyle]} />
          </View>
          <View style={styles.trailing}>
            <Animated.View style={[styles.status, shimmerStyle]} />
            <Animated.View style={[styles.toggle, shimmerStyle]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  address: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.small,
    height: 10,
    width: '78%',
  },
  main: {
    flex: 1,
    gap: 6,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 82,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  stat: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.small,
    height: 9,
    width: 44,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  trailing: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 3,
    width: 76,
  },
});
