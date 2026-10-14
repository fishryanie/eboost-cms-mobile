import { useEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import Animated, { Easing, interpolateColor, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

type AppSegmentProps<Value extends string | number> = {
  onChange: (value: Value) => void;
  options: readonly { label: string; value: Value }[];
  value: Value;
  width?: number | `${number}%`;
};

const indicatorAnimation = {
  duration: 180,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export function AppSegment<Value extends string | number>({ onChange, options, value, width = '100%' }: AppSegmentProps<Value>) {
  const initialIndex = options.findIndex(option => option.value === value);
  const selectionProgress = useSharedValue(initialIndex);
  const optionWidth = useSharedValue(0);
  const targetValueRef = useRef(value);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectionProgress.get() * optionWidth.get() }],
  }));

  useEffect(() => {
    targetValueRef.current = value;
    const nextIndex = options.findIndex(option => option.value === value);
    selectionProgress.set(withTiming(nextIndex, indicatorAnimation));
  }, [options, selectionProgress, value]);

  function selectOption(nextValue: Value, nextIndex: number) {
    if (targetValueRef.current === nextValue) return;

    targetValueRef.current = nextValue;
    selectionProgress.set(withTiming(nextIndex, indicatorAnimation));
    onChange(nextValue);
  }

  return (
    <ThemedView
      backgroundColor={Palette.surfaceMuted}
      borderColor={Palette.borderSubtle}
      borderRadius={'pill'}
      borderWidth={1}
      height={40}
      overflow='hidden'
      padding={2}
      width={width}>
      <ThemedView
        backgroundColor='transparent'
        flex={1}
        flexDirection='row'
        onLayout={event => optionWidth.set(event.nativeEvent.layout.width / options.length)}
        position='relative'>
        <AnimatedThemedView
          backgroundColor={Palette.accent}
          borderRadius={'pill'}
          bottom={0}
          boxShadow='0 1px 3px rgba(15, 23, 42, 0.12)'
          left={0}
          pointerEvents='none'
          position='absolute'
          style={indicatorStyle}
          top={0}
          width={`${100 / options.length}%`}
        />

        {options.map((option, index) => (
          <ThemedView backgroundColor='transparent' flex={1} key={option.value} zIndex={1}>
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole='tab'
              accessibilityState={{ selected: option.value === value }}
              onPress={() => selectOption(option.value, index)}>
              {({ pressed }) => (
                <ThemedView
                  alignItems='center'
                  backgroundColor='transparent'
                  borderRadius={'pill'}
                  height='100%'
                  justifyContent='center'
                  opacity={pressed ? 0.68 : 1}>
                  <SegmentLabel index={index} label={option.label} selectionProgress={selectionProgress} />
                </ThemedView>
              )}
            </Pressable>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function SegmentLabel({ index, label, selectionProgress }: { index: number; label: string; selectionProgress: SharedValue<number> }) {
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(Math.max(0, 1 - Math.abs(selectionProgress.get() - index)), [0, 1], [Palette.textSecondary, Palette.surfaceBase]),
  }));

  return (
    <AnimatedThemedText fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17} numberOfLines={1} style={labelStyle}>
      {label}
    </AnimatedThemedText>
  );
}
