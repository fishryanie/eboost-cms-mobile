import { memo, type ComponentProps, type FC, type FunctionComponent, type JSX, type ReactElement, type ReactNode } from 'react';
import { Platform, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { ThemedView, ThemedText } from 'components/base';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);
import { usePanelMotion } from '../hooks/use-panel-motion';
import type { IPanelLayerProps } from '../types';
import { layoutStyles as styles } from '../styles';

const PanelLayer: FC<IPanelLayerProps> & FunctionComponent<IPanelLayerProps> = memo<IPanelLayerProps & ComponentProps<typeof PanelLayer>>(
  ({
    active,
    colors,
    direction,
    onClose,
    onLayout,
    renderPopupBody,
    route,
    view,
  }: IPanelLayerProps & ComponentProps<typeof PanelLayer>): (ReactNode & ReactElement & JSX.Element) | null => {
    const motion = usePanelMotion(active, direction);
    const PopupBody = renderPopupBody;

    return (
      <AnimatedThemedView pointerEvents={active ? 'auto' : 'none'} style={[styles.panelLayer, motion.style]}>
        <AnimatedThemedView
          onLayout={(event: LayoutChangeEvent) => {
            const { width, height } = event.nativeEvent.layout;
            onLayout(view, Math.ceil(width), Math.ceil(height));
          }}
          style={Platform.OS === 'android' && motion.androidBlurStyle}>
          <PopupBody colors={colors} onClose={onClose} route={route} view={view} />
        </AnimatedThemedView>
        {Platform.OS === 'ios' && (
          <motion.AnimatedBlurView animatedProps={motion.blurProps} pointerEvents='none' tint={'systemUltraThinMaterialDark'} style={StyleSheet.absoluteFill} />
        )}
      </AnimatedThemedView>
    );
  },
);

PanelLayer.displayName = 'PanelLayer';

export { PanelLayer };
