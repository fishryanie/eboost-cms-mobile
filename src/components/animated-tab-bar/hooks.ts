import { BlurViewProps } from 'expo-blur';
import { useEffect, useRef } from 'react';
import { ViewStyle } from 'react-native';
import { Extrapolation, interpolate, interpolateColor, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, DURATION, EASING, ICON_BOX, LABEL_MARGIN, LABEL_PAD, PANEL_SLIDE } from './constants';

export function useCardMotion(sizes: SizeMap, toolbar: { h: number; minW: number; w: number }, view: string) {
  const open = useSharedValue(0);
  const cardWidth = useSharedValue(toolbar.w);
  const cardHeight = useSharedValue(toolbar.h);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (toolbar.minW === 0 || toolbar.h === 0) return;
    const firstRender = isFirstRender.current;
    if (firstRender) {
      isFirstRender.current = false;
    }
    if (view === 'default') {
      cardWidth.value = firstRender ? toolbar.w : withTiming(toolbar.w, { duration: DURATION, easing: EASING });
      cardHeight.value = firstRender ? toolbar.h : withTiming(toolbar.h, { duration: DURATION, easing: EASING });
      open.value = firstRender ? 0 : withTiming(0, { duration: DURATION - 80, easing: EASING });
      return;
    }
    const target = sizes[view];
    if (target) {
      const width = toolbar.w;
      cardWidth.value = firstRender ? width : withTiming(width, { duration: DURATION, easing: EASING });
      cardHeight.value = firstRender ? toolbar.h + target.h : withTiming(toolbar.h + target.h, { duration: DURATION, easing: EASING });
    }
    open.value = withTiming(1, { duration: DURATION, easing: EASING });
  }, [cardHeight, cardWidth, open, sizes, toolbar.h, toolbar.minW, toolbar.w, view]);

  return {
    cardStyle: useAnimatedStyle(() => (cardWidth.value === 0 || cardHeight.value === 0 ? {} : { height: cardHeight.value, width: cardWidth.value })),
    dividerStyle: useAnimatedStyle(() => ({ opacity: open.value })),
  };
}

export function usePanelMotion(active: boolean, direction: number) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: DURATION - 80, easing: EASING });
  }, [active, progress]);

  const style = useAnimatedStyle<Pick<ViewStyle, 'opacity' | 'transform'>>(() => {
    const travel = direction === 0 ? 0 : direction * PANEL_SLIDE;
    return {
      opacity: progress.value,
      transform: [{ translateX: active ? travel * (1 - progress.value) : -travel * (1 - progress.value) }, { scale: 0.97 + 0.03 * progress.value }],
    };
  }, [active, direction]);
  const blurProps = useAnimatedProps<Pick<BlurViewProps, 'intensity'>>(() => ({
    intensity: interpolate(progress.value, [0, 0.5, 1], [0, 15, 0], Extrapolation.CLAMP),
  }));
  const androidBlurStyle = useAnimatedStyle<Pick<ViewStyle, 'filter'>>(() => ({
    filter: [{ blur: interpolate(progress.value, [0, 0.5, 1], [0, 10, 0], Extrapolation.CLAMP) }],
  }));

  return { androidBlurStyle, blurProps, style };
}

export function useMorphMotion(active: boolean, labelWidth: number) {
  const progress = useSharedValue(active ? 1 : 0);
  const held = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: DURATION, easing: EASING });
  }, [active, progress]);

  const containerStyle = useAnimatedStyle<Pick<ViewStyle, 'backgroundColor' | 'width'>>(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(0,0,0,0)', colors.accent]),
    width: ICON_BOX + progress.value * (labelWidth + LABEL_PAD + LABEL_MARGIN),
  }));
  const holdCircleStyle = useAnimatedStyle<Pick<ViewStyle, 'opacity' | 'transform'>>(() => ({
    opacity: interpolate(held.value, [0, 1], [0, active ? 0.35 : 1]),
    transform: [{ scale: interpolate(held.value, [0, 1], [0.68, 1]) }],
  }));
  const labelStyle = useAnimatedStyle<Pick<ViewStyle, 'opacity' | 'transform' | 'width'>>(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0, 1]),
    transform: [{ translateX: -8 * (1 - progress.value) }],
    width: progress.value * (labelWidth + LABEL_PAD + LABEL_MARGIN),
  }));
  const iconActiveStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const iconInactiveStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const iconSqueezeStyle = useAnimatedStyle<Pick<ViewStyle, 'transform'>>(() => ({
    transform: [
      { translateY: interpolate(held.value, [0, 1], [0, 1.5]) },
      { scaleX: interpolate(held.value, [0, 1], [1, 1.08]) },
      { scaleY: interpolate(held.value, [0, 1], [1, 0.76], Extrapolation.CLAMP) },
    ],
  }));

  return {
    containerStyle,
    hold: () => {
      // eslint-disable-next-line react-hooks/immutability
      held.value = withTiming(1, { duration: 140, easing: EASING });
    },
    holdCircleStyle,
    iconActiveStyle,
    iconInactiveStyle,
    iconSqueezeStyle,
    labelStyle,
    release: () => {
      // eslint-disable-next-line react-hooks/immutability
      held.value = withTiming(0, { duration: 220, easing: EASING });
    },
  };
}
