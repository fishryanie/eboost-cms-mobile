import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { width } from 'themes/scaling';

const SLIDER_TRACK_WIDTH = width * 0.8;
const SLIDER_SIZE = 50;
const TRACK_HEIGHT = SLIDER_SIZE + 10; //ideally you want the slider container slightly bigger than the handle
const BORDER_RADIUS = 16; //same for both the slider and the track
const TRACK_PADDING = 5;
const SLIDER_INITIAL_LEFT = 5; // The handle moves from its initial `left` position.
const COMPLETION_THRESHOLD_PERCENTAGE = 0.98; //if handle is moved 98% it is considered done
export const SPRING_CONFIG = {
  damping: 20,
  stiffness: 240,
  mass: 0.4,
};

type SwipeSliderProps = {
  onSwipeComplete: () => void;
  enableHaptics?: boolean;
  sliderSize?: number;
  sliderTrackWidth?: number;
  sliderTrackHeight?: number;
  borderRadius?: number;
  initialTrackColor: string;
  completeTrackColor: string;
  sliderBackgroundColor: string;
  textColor: string;
  initialText: string;
  completeText: string;
  startIcon: React.ReactElement;
  endIcon: React.ReactElement;
  trackStyle?: StyleProp<ViewStyle>;
  handleStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  reduceMotion?: 'never' | 'always' | 'system';
};

const SwipeSlider: React.FC<SwipeSliderProps> = ({
  onSwipeComplete,
  enableHaptics = true,
  sliderSize = SLIDER_SIZE,
  sliderTrackWidth = SLIDER_TRACK_WIDTH,
  sliderTrackHeight = TRACK_HEIGHT,
  borderRadius = BORDER_RADIUS,
  initialTrackColor,
  completeTrackColor,
  sliderBackgroundColor,
  textColor,
  initialText,
  completeText,
  startIcon,
  endIcon,
  textStyle,
  reduceMotion = 'system',
}) => {
  const offset = useSharedValue(0);
  const completionProgress = useSharedValue(0);
  const MaxOffset = sliderTrackWidth - sliderSize - TRACK_PADDING - SLIDER_INITIAL_LEFT; // Calculate the maximum translation offset for the handle
  const CompletionOffset = MaxOffset * COMPLETION_THRESHOLD_PERCENTAGE; // how much offset until complete

  const motion = reduceMotion === 'never' ? ReduceMotion.Never : reduceMotion === 'always' ? ReduceMotion.Always : ReduceMotion.System;

  const TIMING_CONFIG = {
    duration: 350,
    easing: Easing.in(Easing.linear),
    reduceMotion: motion,
  };
  const handleHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const pan = Gesture.Pan()
    .onChange(event => {
      const newOffset = offset.value + event.changeX;
      // Clamp the new offset value between 0 and MaxOffset
      offset.value = Math.max(0, Math.min(newOffset, MaxOffset));
    })
    .onEnd(() => {
      if (offset.value >= CompletionOffset) {
        completionProgress.value = withTiming(1, TIMING_CONFIG);
        runOnJS(onSwipeComplete)();
        enableHaptics && runOnJS(handleHaptic)();
      } else {
        // If not pulled far enough, snap back to the beginning
        completionProgress.value = withTiming(0, TIMING_CONFIG);
        offset.value = withTiming(0, TIMING_CONFIG);
      }
    });

  const sliderHandleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const sliderTrackAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(offset.value, [0, MaxOffset], [initialTrackColor, completeTrackColor]),
      zIndex: 1,
    };
  });

  const slideToPayTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        completionProgress.value,
        [0, 0.5], // Fade out as completionProgress goes from 0 to 0.5
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  // Animated style for "Success!" text
  const successTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        completionProgress.value,
        [0.5, 1], // Fade in as completionProgress goes from 0.5 to 1
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    // GestureHandlerRootView is essential for gestures to work.
    // Ideally, this should be at the root of your app, but for a standalone
    // component example, it's included here.
    <GestureHandlerRootView style={styles.container}>
      <Animated.View
        style={[
          styles.sliderTrack,
          sliderTrackAnimatedStyle,
          {
            width: sliderTrackWidth,
            height: sliderTrackHeight,
            borderRadius: borderRadius,
          },
        ]}>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sliderHandle,
              sliderHandleStyle,
              {
                backgroundColor: sliderBackgroundColor,
                width: sliderSize,
                height: sliderSize,
                borderRadius: borderRadius,
              },
            ]}>
            <Animated.View style={[slideToPayTextAnimatedStyle, styles.iconContainer]}>{startIcon}</Animated.View>
            <Animated.View style={[successTextAnimatedStyle, styles.iconContainer]}>{endIcon}</Animated.View>
          </Animated.View>
        </GestureDetector>
        <View style={styles.textContainer} pointerEvents='none'>
          <Animated.Text style={[styles.sliderTextBase, { color: textColor }, slideToPayTextAnimatedStyle, textStyle]}>{initialText}</Animated.Text>
          <Animated.Text
            style={[
              styles.sliderTextBase,
              { color: textColor }, // Assuming success text also uses Neutral0 or specify another color
              successTextAnimatedStyle,
              textStyle,
            ]}>
            {completeText}
          </Animated.Text>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sliderTrack: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: TRACK_PADDING,
  },
  sliderHandle: {
    position: 'absolute',
    left: SLIDER_INITIAL_LEFT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    ...StyleSheet.absoluteFill, // Makes this view fill its parent (sliderTrack)
    justifyContent: 'center',
    alignItems: 'center',
    // No zIndex needed here, or zIndex: 0, to be behind the handle
  },
  sliderTextBase: {
    // Base style for both texts
    fontSize: 16,
    fontWeight: '500',
    position: 'absolute', // Critical for texts to overlap for the cross-fade effect
  },
});

export default SwipeSlider;
