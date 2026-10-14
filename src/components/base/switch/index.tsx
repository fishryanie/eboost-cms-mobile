import { Check, X } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  clamp,
  interpolate,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Rect } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedView } from '../ThemedView';
import { DEFAULT_ICON_COLOR, DEFAULT_OFF_COLOR, DEFAULT_ON_COLOR, DEFAULT_SIZE, DEFAULT_THRESHOLD, DEFAULT_TRACK_COLOR } from './const';
import type { AnimatedOvalProps, ShadowOvalProps, SwitchProps } from './types';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

function AnimatedOval({ centerX, centerY, radiusX, radiusY, isOn, onColor, offColor }: AnimatedOvalProps) {
  const offProps = useAnimatedProps(() => ({ cx: centerX.get(), rx: radiusX.get(), ry: radiusY.get() }));
  const onProps = useAnimatedProps(() => ({
    cx: centerX.get(),
    rx: radiusX.get(),
    ry: radiusY.get(),
    opacity: isOn.get() ? 1 : 0,
  }));

  return (
    <G>
      <AnimatedEllipse cy={centerY} fill={offColor} animatedProps={offProps} />
      <AnimatedEllipse cy={centerY} fill={onColor} animatedProps={onProps} />
    </G>
  );
}

function ShadowOval({ centerX, centerY, radiusX, radiusY, color }: ShadowOvalProps) {
  const animatedProps = useAnimatedProps(() => ({ cx: centerX.get(), rx: radiusX.get(), ry: radiusY.get() }));

  return <AnimatedEllipse cy={centerY} fill={color} animatedProps={animatedProps} />;
}

export const Switch = memo(function Switch({
  value = false,
  onValueChange,
  disabled = false,
  size = DEFAULT_SIZE,
  inactiveColor = DEFAULT_OFF_COLOR,
  activeColor = DEFAULT_ON_COLOR,
  trackColor = DEFAULT_TRACK_COLOR,
  iconColor = DEFAULT_ICON_COLOR,
  showIcons = true,
  toggleThreshold = DEFAULT_THRESHOLD,
  animation,
  deformation,
  connector,
  blur: _blur,
  gooey: _gooey,
  renderActiveIcon,
  renderInactiveIcon,
  onDragBegin,
  onDragFinish,
  accessibilityLabel,
  accessibilityHint,
  style,
  ...viewProps
}: SwitchProps) {
  const stretchX = deformation?.stretchX ?? 1.18;
  const squishY = deformation?.squishY ?? 0.88;
  const sideBlobScale = deformation?.sideBlobScale ?? 0.82;
  const connectorVisible = connector?.show ?? true;
  const connectorHeight = connector?.height ?? 0.35;
  const connectorOffset = connector?.offset ?? 0;

  const switchWidth = size;
  const switchHeight = size * 0.6;
  const blobRadius = size * 0.22;
  const sideBlobRadius = blobRadius * sideBlobScale;
  const iconSize = size * 0.28;
  const bridgeHeight = switchHeight * connectorHeight;
  const leftX = switchWidth * 0.28;
  const rightX = switchWidth * 0.72;
  const spring = useMemo(
    () => ({
      damping: animation?.damping ?? 15,
      mass: animation?.mass ?? 0.8,
      stiffness: animation?.stiffness ?? 120,
      reduceMotion: animation?.reduceMotion ?? ReduceMotion.System,
    }),
    [animation?.damping, animation?.mass, animation?.reduceMotion, animation?.stiffness],
  );

  const progress = useSharedValue(value ? 1 : 0);
  const isDragging = useSharedValue(false);
  const isOn = useSharedValue(value);
  const dragStartProgress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    if (!isDragging.get()) {
      progress.set(withSpring(value ? 1 : 0, spring));
      isOn.set(value);
    }
  }, [isDragging, isOn, progress, spring, value]);

  const commitValue = useCallback(
    (nextValue: boolean) => {
      onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  const finishDrag = useCallback(
    (nextValue: boolean) => {
      onDragFinish?.(nextValue);
    },
    [onDragFinish],
  );

  const mainX = useDerivedValue(() => interpolate(progress.get(), [0, 1], [leftX, rightX]));
  const mainRadiusX = useDerivedValue(
    () => blobRadius * interpolate(progress.get(), [0, 0.2, 0.5, 0.8, 1], [1, 1 + (stretchX - 1) * 0.6, stretchX, 1 + (stretchX - 1) * 0.6, 1]),
  );
  const mainRadiusY = useDerivedValue(
    () => blobRadius * interpolate(progress.get(), [0, 0.2, 0.5, 0.8, 1], [1, 1 - (1 - squishY) * 0.6, squishY, 1 - (1 - squishY) * 0.6, 1]),
  );
  const innerRadiusX = useDerivedValue(() => mainRadiusX.get() - 1);
  const innerRadiusY = useDerivedValue(() => mainRadiusY.get() - 1);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      cancelAnimation(progress);
      dragStartProgress.set(clamp(progress.get(), 0, 1));
      isDragging.set(true);
      if (onDragBegin) scheduleOnRN(onDragBegin);
    })
    .onUpdate(event => {
      const nextProgress = clamp(dragStartProgress.get() + event.translationX / (rightX - leftX), 0, 1);
      progress.set(nextProgress);
      isOn.set(nextProgress >= toggleThreshold);
    })
    .onEnd(event => {
      isDragging.set(false);
      const nextValue = Math.abs(event.velocityX) > 500 ? event.velocityX > 0 : progress.get() > toggleThreshold;

      progress.set(
        withSpring(nextValue ? 1 : 0, {
          ...spring,
          velocity: event.velocityX / (rightX - leftX),
        }),
      );
      isOn.set(nextValue);

      if (nextValue !== value) scheduleOnRN(commitValue, nextValue);
      if (onDragFinish) scheduleOnRN(finishDrag, nextValue);
    })
    .onFinalize((_event, success) => {
      if (!success && isDragging.get()) {
        isDragging.set(false);
        progress.set(withSpring(value ? 1 : 0, spring));
        isOn.set(value);
        if (onDragFinish) scheduleOnRN(finishDrag, value);
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onEnd((_event, success) => {
      if (!success) return;
      const nextValue = !value;
      progress.set(withSpring(nextValue ? 1 : 0, spring));
      isOn.set(nextValue);
      scheduleOnRN(commitValue, nextValue);
    });

  const iconPositionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.get(), [0, 1], [-switchWidth * 0.22, switchWidth * 0.22]) },
      { scaleX: interpolate(progress.get(), [0, 0.2, 0.5, 0.8, 1], [1, 1.08, 1.12, 1.08, 1]) },
      { scaleY: interpolate(progress.get(), [0, 0.2, 0.5, 0.8, 1], [1, 0.94, 0.9, 0.94, 1]) },
    ],
  }));
  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.6, 1], [0, 1]),
    transform: [{ scale: interpolate(progress.get(), [0.6, 1], [0.5, 1]) }],
  }));
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.4], [1, 0]),
    transform: [{ scale: interpolate(progress.get(), [0, 0.4], [1, 0.5]) }],
  }));

  const toggleFromAccessibility = () => {
    if (!disabled) commitValue(!value);
  };

  return (
    <GestureDetector gesture={Gesture.Race(panGesture, tapGesture)}>
      <ThemedView
        {...viewProps}
        accessibilityActions={[{ name: 'activate' }]}
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole='switch'
        accessibilityState={{ checked: value, disabled }}
        accessible
        alignItems='center'
        backgroundColor='transparent'
        height={switchHeight}
        hitSlop={12}
        justifyContent='center'
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'activate') toggleFromAccessibility();
        }}
        onAccessibilityTap={toggleFromAccessibility}
        opacity={disabled ? 0.5 : 1}
        style={style}
        width={switchWidth}>
        <ThemedView position='absolute' pointerEvents='none' backgroundColor='transparent'>
          <Svg height={switchHeight} width={switchWidth} viewBox={`0 0 ${switchWidth} ${switchHeight}`}>
            <G>
              <Circle fill={trackColor} cx={leftX} cy={switchHeight / 2} r={sideBlobRadius} />
              <Circle fill={trackColor} cx={rightX} cy={switchHeight / 2} r={sideBlobRadius} />
              {connectorVisible ? (
                <Rect
                  x={leftX}
                  y={switchHeight / 2 + connectorOffset - bridgeHeight / 2}
                  width={rightX - leftX}
                  height={bridgeHeight}
                  rx={bridgeHeight / 2}
                  fill={trackColor}
                />
              ) : null}
              <ShadowOval centerX={mainX} centerY={switchHeight / 2} color={trackColor} radiusX={mainRadiusX} radiusY={mainRadiusY} />
            </G>
            <AnimatedOval
              centerX={mainX}
              centerY={switchHeight / 2}
              isOn={isOn}
              offColor={inactiveColor}
              onColor={activeColor}
              radiusX={innerRadiusX}
              radiusY={innerRadiusY}
            />
          </Svg>
        </ThemedView>

        {showIcons ? (
          <AnimatedThemedView
            alignItems='center'
            backgroundColor='transparent'
            height={blobRadius * 2}
            justifyContent='center'
            pointerEvents='none'
            style={iconPositionStyle}
            width={blobRadius * 2}>
            <AnimatedThemedView absoluteFillObject alignItems='center' backgroundColor='transparent' justifyContent='center' style={activeIconStyle}>
              {renderActiveIcon?.({ color: iconColor, size: iconSize }) ?? <Check color={iconColor} size={iconSize} strokeWidth={3} />}
            </AnimatedThemedView>
            <AnimatedThemedView absoluteFillObject alignItems='center' backgroundColor='transparent' justifyContent='center' style={inactiveIconStyle}>
              {renderInactiveIcon?.({ color: iconColor, size: iconSize }) ?? <X color={iconColor} size={iconSize} strokeWidth={3} />}
            </AnimatedThemedView>
          </AnimatedThemedView>
        ) : null}
      </ThemedView>
    </GestureDetector>
  );
});

export const GooeySwitch = Switch;
export default Switch;
export type { SwitchProps } from './types';
