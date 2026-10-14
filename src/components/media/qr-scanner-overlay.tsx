import { ThemedView } from 'components/base/ThemedView';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Palette } from 'themes';
import { rhs, rvs } from 'themes/scaling';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const guidePath = 'M2 52V24Q2 2 24 2H52 M228 2H256Q278 2 278 24V52 M278 228V256Q278 278 256 278H228 M52 278H24Q2 278 2 256V228';

export function QrScannerOverlay({ active, children, size }: { active: boolean; children?: ReactNode; size: number }) {
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const gradientId = `scanner-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    cancelAnimation(progress);
    if (active && foreground && !reduceMotion) {
      progress.set(0);
      progress.set(withRepeat(withTiming(1, { duration: 2400, easing: Easing.bezier(0.77, 0, 0.175, 1) }), -1, true));
    } else {
      progress.set(0.5);
    }
    return () => cancelAnimation(progress);
  }, [active, foreground, progress, reduceMotion]);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [size * 0.12, size * 0.78]) }],
  }));

  return (
    <ThemedView
      backgroundColor={active ? 'transparent' : 'rgba(255,255,255,0.02)'}
      height={rvs(size)}
      width={rhs(size)}
      borderRadius={24}
      borderCurve='continuous'
      overflow='hidden'>
      <ThemedView absoluteFillObject pointerEvents='none' accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>
        <Svg width={size} height={size} viewBox='0 0 280 280'>
          <Rect x={2} y={2} width={276} height={276} rx={22} fill='none' stroke='#FFFFFF' strokeOpacity={0.2} />
          <Path d={guidePath} fill='none' stroke={Palette.accent} strokeWidth={3} strokeLinecap='round' />
        </Svg>
      </ThemedView>
      {active && !reduceMotion ? (
        <AnimatedThemedView
          position='absolute'
          left={0}
          right={0}
          pointerEvents='none'
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
          backgroundColor='transparent'
          style={scanStyle}>
          <Svg width={size} height={size * 0.16} viewBox='0 0 280 45'>
            <Defs>
              <LinearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
                <Stop offset='0' stopColor={Palette.accent} stopOpacity={0.12} />
                <Stop offset='1' stopColor={Palette.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x={16} width={248} height={45} fill={`url(#${gradientId})`} />
            <Rect x={16} width={248} height={1.5} rx={0.75} fill={Palette.accent} />
          </Svg>
        </AnimatedThemedView>
      ) : null}
      {children ? (
        <ThemedView absoluteFillObject contentCenter>
          {children}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}
