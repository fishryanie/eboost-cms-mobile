import { GlassView } from 'expo-glass-effect';
import { memo, useMemo, type ComponentProps, type FC, type FunctionComponent, type JSX, type ReactElement, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, useColorScheme } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeasurementLayer } from './components/measurement-layer';
import { PanelStack } from './components/panel-stack';
import { TabToolbar } from './components/tab-toolbar';
import { useCardMorph } from './hooks/use-card-morph';
import { useDynamicLayout } from './hooks/use-dynamic-layout';
import { useNavItems } from './hooks/use-nav-items';
import { usePopupRenderer } from './hooks/use-popup-renderer';
import { useViewTransition } from './hooks/use-view-transition';
import type { IAnimatedTabBarProps, INavItem, IPalette } from './typings/motion-tabs';
import { layoutStyles as styles } from './utils/layout-styles';
import { palette } from './utils/palette';
import { estimateToolbarWidth } from './utils/toolbar-width';

const AnimatedTabBar: FC<IAnimatedTabBarProps> & FunctionComponent<IAnimatedTabBarProps> = memo<IAnimatedTabBarProps & ComponentProps<typeof AnimatedTabBar>>(
  (props: IAnimatedTabBarProps & ComponentProps<typeof AnimatedTabBar>): (ReactNode & ReactElement & JSX.Element) | null => {
    const { descriptors, navigation, popupDisabledRouteNames = [], popupEnabled = true, renderPopupBody, state } = props;
    const insets = useSafeAreaInsets();
    const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const colors = useMemo<IPalette>(() => palette(scheme), [scheme]);
    const popupRenderer = usePopupRenderer(renderPopupBody);
    const items = useNavItems({ descriptors, state });
    const activeRouteKey = state.routes[state.index]?.key;
    const layout = useDynamicLayout();
    const transition = useViewTransition(items);
    const activeToolbarKey = transition.view === 'default' ? activeRouteKey : transition.view;
    const toolbarTargetW = Math.max(layout.toolbarW, estimateToolbarWidth(items, activeToolbarKey));
    const motion = useCardMorph({
      sizes: layout.sizes,
      toolbarH: layout.toolbarH,
      toolbarMinW: layout.toolbarMinW,
      toolbarW: toolbarTargetW,
      view: transition.view,
    });

    const handlePress = (item: INavItem): void => {
      const isFocused = activeRouteKey === item.key;
      if (!isFocused) navigation.navigate(item.routeName);
      if (!popupEnabled || popupDisabledRouteNames.includes(item.routeName)) {
        transition.close();
        return;
      }
      transition.setNextView(item);
    };

    return (
      <View pointerEvents='box-none' style={[StyleSheet.absoluteFill, styles.root]}>
        {popupEnabled && <MeasurementLayer colors={colors} items={items} onMeasure={layout.handleMeasure} renderPopupBody={popupRenderer} />}
        {transition.view !== 'default' && (
          <Pressable accessibilityLabel='Close menu' accessibilityRole='button' onPress={transition.close} style={StyleSheet.absoluteFill} />
        )}
        <View pointerEvents='box-none' style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Animated.View style={[styles.cardShadow, motion.cardStyle]}>
            <GlassView
              // intensity={60}
              glassEffectStyle={'regular'}
              style={[styles.card, { borderColor: colors.border, ...Platform.select({ android: { backgroundColor: colors.surface } }) }]}>
              {popupEnabled && (
                <PanelStack
                  items={items}
                  colors={colors}
                  view={transition.view}
                  direction={transition.panelDirection}
                  onMeasure={layout.handleMeasure}
                  renderPopupBody={popupRenderer}
                />
              )}
              <Animated.View pointerEvents='none' style={[styles.divider, motion.dividerStyle, { backgroundColor: colors.border }]} />
              <TabToolbar
                activeKey={activeRouteKey}
                colors={colors}
                items={items}
                onLayout={layout.handleToolbarLayout}
                onPress={handlePress}
                view={transition.view}
              />
            </GlassView>
          </Animated.View>
        </View>
      </View>
    );
  },
);

AnimatedTabBar.displayName = 'AnimatedTabBar';

export { AnimatedTabBar };
