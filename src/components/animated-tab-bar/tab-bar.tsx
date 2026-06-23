import { ThemedView } from 'components/base';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, ICON_BOX, LABEL_MARGIN, LABEL_PAD, TAB_HEIGHT } from './constants';
import { useCardMotion } from './hooks';
import { MorphTab } from './morph-tab';
import { MeasurementLayer, Panel } from './panel';

function TabBarSurface({ children }: { children: ReactNode }) {
  const commonStyle = {
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'flex-end' as const,
    overflow: 'hidden' as const,
  };

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView glassEffectStyle='regular' style={commonStyle}>
        {children}
      </GlassView>
    );
  }

  return (
    <ThemedView
      backgroundColor='#FFFFFF'
      borderColor={colors.border}
      borderRadius={28}
      borderWidth={StyleSheet.hairlineWidth}
      flex={1}
      justifyContent='flex-end'
      overflow='hidden'>
      {children}
    </ThemedView>
  );
}

export function AnimatedTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [sizes, setSizes] = useState<SizeMap>({});
  const [toolbar, setToolbar] = useState({ h: 0, minW: 0, w: 0 });
  const [view, setView] = useState('default');
  const [panelDirection, setPanelDirection] = useState(0);
  const items: NavItem[] = state.routes.flatMap(route => {
    const options = descriptors[route.key]?.options;
    if ((options as { href?: unknown })?.href === null || !options?.tabBarIcon) return [];
    return [
      {
        icon: (focused, color, size) => options.tabBarIcon?.({ focused, color, size }) ?? null,
        key: route.key,
        label: typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name),
        routeName: route.name,
      },
    ];
  });
  const activeKey = state.routes[state.index]?.key;
  const close = () => {
    setPanelDirection(0);
    setView('default');
  };
  const onMeasure: Measure = (key, width, height) => {
    if (width <= 0 || height <= 0) return;
    setSizes(current => (current[key]?.w === width && current[key]?.h === height ? current : { ...current, [key]: { h: height, w: width } }));
  };
  const activeItem = items.find(item => item.key === (view === 'default' ? activeKey : view));
  const estimatedWidth =
    items.length * ICON_BOX +
    (activeItem ? Math.ceil(activeItem.label.length * 8.5 + 4) + LABEL_PAD + LABEL_MARGIN : 0) +
    Math.max(items.length - 1, 0) * 2 +
    12;
  const motion = useCardMotion(sizes, { ...toolbar, w: toolbar.w || estimatedWidth, h: toolbar.h || TAB_HEIGHT + 12 }, view);

  const onPress = (item: NavItem) => {
    if (activeKey !== item.key) {
      navigation.navigate(item.routeName);
      close();
      return;
    }
    const nextView = view === item.key ? 'default' : item.key;
    const currentIndex = items.findIndex(candidate => candidate.key === view);
    const nextIndex = items.findIndex(candidate => candidate.key === nextView);
    setPanelDirection(view !== 'default' && nextView !== 'default' ? Math.sign(nextIndex - currentIndex) : 0);
    setView(nextView);
  };

  return (
    <ThemedView absoluteFillObject backgroundColor='transparent' overflow='visible' pointerEvents='box-none'>
      <MeasurementLayer items={items} onMeasure={onMeasure} width={toolbar.w || estimatedWidth} />
      {view !== 'default' && <Pressable accessibilityLabel='Close menu' accessibilityRole='button' onPress={close} style={StyleSheet.absoluteFill} />}
      <ThemedView
        alignItems='center'
        backgroundColor='transparent'
        bottom={0}
        left={0}
        paddingBottom={Math.max(insets.bottom, 12)}
        paddingTop={8}
        pointerEvents='box-none'
        position='absolute'
        right={0}>
        <Animated.View
          style={[
            {
              borderRadius: 28,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { height: 10, width: 0 },
              shadowOpacity: 0.18,
              shadowRadius: 20,
            },
            motion.cardStyle,
          ]}>
          <TabBarSurface>
            <ThemedView flex={1} overflow='hidden' width='100%'>
              {items.map(item => (
                <Panel key={item.key} active={view === item.key} direction={panelDirection} item={item} onClose={close} />
              ))}
            </ThemedView>
            <Animated.View
              pointerEvents='none'
              style={[
                {
                  backgroundColor: colors.border,
                  height: StyleSheet.hairlineWidth,
                  width: '100%',
                },
                motion.dividerStyle,
              ]}
            />
            <ThemedView
              alignItems='center'
              alignSelf='center'
              flexDirection='row'
              gap={2}
              onLayout={event => {
                const h = Math.ceil(event.nativeEvent.layout.height);
                const w = Math.ceil(event.nativeEvent.layout.width);
                setToolbar(current => (current.h === h && current.w === w ? current : { h: h || current.h, minW: current.minW || w, w: w || current.w }));
              }}
              padding={6}>
              {items.map(item => (
                <MorphTab key={item.key} active={activeKey === item.key || view === item.key} item={item} onPress={() => onPress(item)} />
              ))}
            </ThemedView>
          </TabBarSurface>
        </Animated.View>
      </ThemedView>
    </ThemedView>
  );
}
