import { useEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

export type VehicleSegmentValue = 'bike' | 'car';

type VehicleSegmentProps = {
  onChange: (vehicle: VehicleSegmentValue) => void;
  value: VehicleSegmentValue;
};

const vehicleOptions = [
  { label: 'Cars', value: 'car' },
  { label: 'Bikes', value: 'bike' },
] as const;
const segmentWidth = 126;
const segmentPadding = 2;
const segmentBorderWidth = 1;
const optionWidth = (segmentWidth - (segmentPadding + segmentBorderWidth) * 2) / vehicleOptions.length;
const optionTranslate = mhs(optionWidth);
const indicatorAnimation = {
  duration: 180,
  easing: Easing.out(Easing.cubic),
};
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export function VehicleSegment({ onChange, value }: VehicleSegmentProps) {
  const initialIndex = vehicleOptions.findIndex(option => option.value === value);
  const selectionProgress = useSharedValue(initialIndex);
  const targetVehicleRef = useRef(value);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectionProgress.value * optionTranslate }],
  }));

  useEffect(() => {
    targetVehicleRef.current = value;
    const nextIndex = vehicleOptions.findIndex(option => option.value === value);
    selectionProgress.set(withTiming(nextIndex, indicatorAnimation));
  }, [selectionProgress, value]);

  function selectVehicle(nextVehicle: VehicleSegmentValue, nextIndex: number) {
    if (targetVehicleRef.current === nextVehicle) return;

    targetVehicleRef.current = nextVehicle;
    selectionProgress.set(withTiming(nextIndex, indicatorAnimation));
    onChange(nextVehicle);
  }

  return (
    <ThemedView
      backgroundColor={Palette.surfaceMuted}
      borderColor={Palette.borderSubtle}
      borderRadius={'pill'}
      borderWidth={segmentBorderWidth}
      flexDirection='row'
      height={40}
      overflow='hidden'
      padding={segmentPadding}
      position='relative'
      width={segmentWidth}>
      <AnimatedThemedView
        backgroundColor={Palette.accent}
        borderRadius={'pill'}
        bottom={segmentPadding}
        boxShadow='0 1px 3px rgba(15, 23, 42, 0.12)'
        left={segmentPadding}
        pointerEvents='none'
        position='absolute'
        style={indicatorStyle}
        top={segmentPadding}
        width={optionWidth}
      />

      {vehicleOptions.map((option, index) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole='tab'
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => selectVehicle(option.value, index)}
            style={{ flex: 1, zIndex: 1 }}>
            {({ pressed }) => (
              <ThemedView alignItems='center' backgroundColor='transparent' borderRadius={'pill'} flex={1} justifyContent='center' opacity={pressed ? 0.68 : 1}>
                <VehicleSegmentLabel index={index} label={option.label} selectionProgress={selectionProgress} />
              </ThemedView>
            )}
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

function VehicleSegmentLabel({ index, label, selectionProgress }: { index: number; label: string; selectionProgress: SharedValue<number> }) {
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      selectionProgress.value,
      [0, 1],
      index === 0 ? [Palette.surfaceBase, Palette.textSecondary] : [Palette.textSecondary, Palette.surfaceBase],
    ),
  }));

  return (
    <AnimatedThemedText fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17} style={labelStyle}>
      {label}
    </AnimatedThemedText>
  );
}
