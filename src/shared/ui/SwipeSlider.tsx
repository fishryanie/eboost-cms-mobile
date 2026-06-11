import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { StyleProp, StyleSheet, TextStyle, useWindowDimensions, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ThemedView } from 'components/base';

const DEFAULT_TRACK_WIDTH_RATIO = 0.8;
const DEFAULT_SLIDER_SIZE = 50;
const DEFAULT_TRACK_PADDING = 5;
const DEFAULT_BORDER_RADIUS = 16;
const DEFAULT_COMPLETION_THRESHOLD = 0.98;
const INITIAL_LEFT = DEFAULT_TRACK_PADDING;

type ReducedMotionPreference = 'always' | 'never' | 'system';

export type SwipeSliderProps = {
  borderRadius?: number;
  completeText: string;
  completeTrackColor: string;
  enableHaptics?: boolean;
  endIcon: ReactElement;
  handleStyle?: StyleProp<ViewStyle>;
  initialText: string;
  initialTrackColor: string;
  onSwipeComplete: () => void;
  reduceMotion?: ReducedMotionPreference;
  sliderBackgroundColor: string;
  sliderSize?: number;
  sliderTrackHeight?: number;
  sliderTrackWidth?: number;
  startIcon: ReactElement;
  textColor: string;
  textStyle?: StyleProp<TextStyle>;
  trackStyle?: StyleProp<ViewStyle>;
};

function getReduceMotion(preference: ReducedMotionPreference) {
  if (preference === 'always') {
    return ReduceMotion.Always;
  }

  if (preference === 'never') {
    return ReduceMotion.Never;
  }

  return ReduceMotion.System;
}

function triggerSuccessHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function SwipeSlider({
  borderRadius = DEFAULT_BORDER_RADIUS,
  completeText,
  completeTrackColor,
  enableHaptics = true,
  endIcon,
  handleStyle,
  initialText,
  initialTrackColor,
  onSwipeComplete,
  reduceMotion = 'system',
  sliderBackgroundColor,
  sliderSize = DEFAULT_SLIDER_SIZE,
  sliderTrackHeight,
  sliderTrackWidth,
  startIcon,
  textColor,
  textStyle,
  trackStyle,
}: SwipeSliderProps) {
  const { width } = useWindowDimensions();
  const trackWidth = sliderTrackWidth ?? width * DEFAULT_TRACK_WIDTH_RATIO;
  const trackHeight = sliderTrackHeight ?? sliderSize + DEFAULT_TRACK_PADDING * 2;
  const maxOffset = Math.max(0, trackWidth - sliderSize - DEFAULT_TRACK_PADDING - INITIAL_LEFT);
  const completionOffset = maxOffset * DEFAULT_COMPLETION_THRESHOLD;
  const motion = getReduceMotion(reduceMotion);
  const timingConfig = {
    duration: 350,
    easing: Easing.in(Easing.linear),
    reduceMotion: motion,
  };

  const completed = useSharedValue(false);
  const completionProgress = useSharedValue(0);
  const offset = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange(event => {
      if (completed.value) {
        return;
      }

      const nextOffset = offset.value + event.changeX;
      offset.value = Math.max(0, Math.min(nextOffset, maxOffset));
    })
    .onEnd(() => {
      if (completed.value) {
        return;
      }

      if (offset.value >= completionOffset) {
        completed.value = true;
        offset.value = withTiming(maxOffset, timingConfig);
        completionProgress.value = withTiming(1, timingConfig);
        runOnJS(onSwipeComplete)();

        if (enableHaptics) {
          runOnJS(triggerSuccessHaptic)();
        }

        return;
      }

      completionProgress.value = withTiming(0, timingConfig);
      offset.value = withTiming(0, timingConfig);
    });

  const sliderHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const sliderTrackAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(offset.value, [0, maxOffset || 1], [initialTrackColor, completeTrackColor]),
  }));

  const initialContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(completionProgress.value, [0, 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  const completeContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(completionProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      accessibilityRole='adjustable'
      style={[
        styles.sliderTrack,
        sliderTrackAnimatedStyle,
        {
          borderRadius,
          height: trackHeight,
          width: trackWidth,
        },
        trackStyle,
      ]}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.sliderHandle,
            sliderHandleStyle,
            {
              backgroundColor: sliderBackgroundColor,
              borderRadius,
              height: sliderSize,
              width: sliderSize,
            },
            handleStyle,
          ]}>
          <Animated.View style={[styles.iconContainer, initialContentAnimatedStyle]}>{startIcon}</Animated.View>
          <Animated.View style={[styles.iconContainer, completeContentAnimatedStyle]}>{endIcon}</Animated.View>
        </Animated.View>
      </GestureDetector>

      <ThemedView pointerEvents='none' alignItems='center' bottom={0} justifyContent='center' left={0} position='absolute' right={0} top={0}>
        <Animated.Text numberOfLines={1} style={[styles.sliderTextBase, { color: textColor }, initialContentAnimatedStyle, textStyle]}>
          {initialText}
        </Animated.Text>
        <Animated.Text numberOfLines={1} style={[styles.sliderTextBase, { color: textColor }, completeContentAnimatedStyle, textStyle]}>
          {completeText}
        </Animated.Text>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  sliderHandle: {
    alignItems: 'center',
    justifyContent: 'center',
    left: INITIAL_LEFT,
    position: 'absolute',
    zIndex: 1,
  },
  sliderTextBase: {
    fontSize: 16,
    fontWeight: '500',
    maxWidth: '70%',
    position: 'absolute',
    textAlign: 'center',
  },
  sliderTrack: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DEFAULT_TRACK_PADDING,
  },
});
