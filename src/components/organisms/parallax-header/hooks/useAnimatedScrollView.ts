import { useMemo } from 'react';
import { Animated, ScrollViewProps } from 'react-native';

export const useAnimateScrollView = (imageHeight: number, disableScale?: boolean, listener?: ScrollViewProps['onScroll']) => {
  const scroll = useMemo(() => new Animated.Value(0), []);

  const scale = scroll.interpolate({
    inputRange: [-imageHeight, 0, imageHeight],
    outputRange: [2.5, 1, 1],
    extrapolate: 'clamp',
  });

  const translateYDown = scroll.interpolate({
    inputRange: [-imageHeight, 0, imageHeight],
    outputRange: [-imageHeight * 0.6, 0, imageHeight * 0.5],
    extrapolate: 'clamp',
  });

  const translateYUp = scroll.interpolate({
    inputRange: [-imageHeight, 0, imageHeight],
    outputRange: [imageHeight * 0.3, 0, 0],
    extrapolate: 'clamp',
  });

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scroll } } }], { listener, useNativeDriver: true });

  return [scroll, onScroll, disableScale ? 1 : scale, translateYDown, translateYUp] as const;
};
