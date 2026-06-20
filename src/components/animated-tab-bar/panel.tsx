import { ThemedView } from 'components/base';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors } from './constants';
import { usePanelMotion } from './hooks';
import { Popup } from './popup';

const AnimatedBlurView = Animated.createAnimatedComponent<typeof BlurView>(BlurView);
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

function measure(event: LayoutChangeEvent, key: string, onMeasure: Measure) {
  const { height, width } = event.nativeEvent.layout;
  onMeasure(key, Math.ceil(width), Math.ceil(height));
}

export function Panel({ active, direction, item, onClose }: PanelProps) {
  const motion = usePanelMotion(active, direction);
  return (
    <AnimatedThemedView left={0} pointerEvents={active ? 'auto' : 'none'} position='absolute' style={motion.style} top={0} width='100%'>
      <AnimatedThemedView style={Platform.OS === 'android' ? motion.androidBlurStyle : undefined}>
        <Popup colors={colors} onClose={onClose} routeName={item.routeName} />
      </AnimatedThemedView>
      {Platform.OS === 'ios' && (
        <AnimatedBlurView animatedProps={motion.blurProps} pointerEvents='none' style={StyleSheet.absoluteFill} tint='systemUltraThinMaterialDark' />
      )}
    </AnimatedThemedView>
  );
}

export function MeasurementLayer({ items, onMeasure }: { items: NavItem[]; onMeasure: Measure }) {
  return (
    <ThemedView left={-10000} opacity={0} pointerEvents='none' position='absolute' top={-10000}>
      {items.map(item => (
        <ThemedView key={item.key} onLayout={event => measure(event, item.key, onMeasure)}>
          <Popup colors={colors} onClose={() => undefined} routeName={item.routeName} />
        </ThemedView>
      ))}
    </ThemedView>
  );
}
