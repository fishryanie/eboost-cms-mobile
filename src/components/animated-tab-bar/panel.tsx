import { ThemedView } from 'components/base';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors } from './constants';
import { usePanelMotion } from './hooks';
import { Popup } from './popup';

const AnimatedBlurView = Animated.createAnimatedComponent<typeof BlurView>(BlurView);
function measure(event: LayoutChangeEvent, key: string, onMeasure: Measure) {
  const { height, width } = event.nativeEvent.layout;
  onMeasure(key, Math.ceil(width), Math.ceil(height));
}

export function Panel({ active, direction, item, onClose }: PanelProps) {
  const motion = usePanelMotion(active, direction);
  return (
    <Animated.View pointerEvents={active ? 'auto' : 'none'} style={[{ left: 0, position: 'absolute', top: 0, width: '100%' }, motion.style]}>
      <Animated.View style={Platform.OS === 'android' ? motion.androidBlurStyle : undefined}>
        <Popup colors={colors} onClose={onClose} routeName={item.routeName} />
      </Animated.View>
      {Platform.OS === 'ios' && (
        <AnimatedBlurView animatedProps={motion.blurProps} pointerEvents='none' style={StyleSheet.absoluteFill} tint='systemUltraThinMaterialDark' />
      )}
    </Animated.View>
  );
}

export function MeasurementLayer({ items, onMeasure, width }: { items: NavItem[]; onMeasure: Measure; width: number }) {
  return (
    <ThemedView left={-10000} opacity={0} pointerEvents='none' position='absolute' top={-10000} width={width}>
      {items.map(item => (
        <ThemedView key={item.key} onLayout={event => measure(event, item.key, onMeasure)} width={width}>
          <Popup colors={colors} onClose={() => undefined} routeName={item.routeName} />
        </ThemedView>
      ))}
    </ThemedView>
  );
}
