import { BlurView, type BlurViewProps } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText, ThemedView } from 'components/base';
import { Popup } from './popup';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type Palette = typeof colors;
type SizeMap = Record<string, { h: number; w: number } | undefined>;
type Measure = (view: string, width: number, height: number) => void;
type NavItem = {
  icon: (focused: boolean, color: string, size: number) => ReactNode;
  key: string;
  label: string;
  routeName: string;
};

const DURATION = 600;
const ICON_BOX = 50;
const LABEL_PAD = 14;
const LABEL_MARGIN = -6;
const PANEL_SLIDE = 65;
const TAB_HEIGHT = 48;
const EASING = Easing.bezier(0.22, 1, 0.36, 1);
const colors = {
  accent: 'rgba(0,0,0,0.06)',
  border: 'rgba(0,0,0,0.08)',
  foreground: '#0a0a0a',
  hover: 'rgba(0,0,0,0.04)',
  muted: '#71717a',
  surface: 'rgba(255,255,255,0.98)',
} as const;

const AnimatedBlurView = Animated.createAnimatedComponent<typeof BlurView>(BlurView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

function useMorphMotion(active: boolean, palette: Palette, labelWidth: number) {
  const progress = useSharedValue(active ? 1 : 0);
  const held = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: DURATION, easing: EASING });
  }, [active, progress]);

  const containerStyle = useAnimatedStyle<Pick<ViewStyle, 'backgroundColor' | 'width'>>(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(0,0,0,0)', palette.accent]),
    width: ICON_BOX + progress.value * (labelWidth + LABEL_PAD + LABEL_MARGIN),
  }));
  const holdCircleStyle = useAnimatedStyle<Pick<ViewStyle, 'opacity' | 'transform'>>(() => ({
    opacity: interpolate(held.value, [0, 1], [0, active ? 0.35 : 1]),
    transform: [{ scale: interpolate(held.value, [0, 1], [0.68, 1]) }],
  }));
  const labelStyle = useAnimatedStyle<Pick<ViewStyle, 'opacity' | 'transform' | 'width'>>(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0, 1]),
    transform: [{ translateX: -8 * (1 - progress.value) }],
    width: progress.value * (labelWidth + LABEL_PAD + LABEL_MARGIN),
  }));
  const iconActiveStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const iconInactiveStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const iconSqueezeStyle = useAnimatedStyle<Pick<ViewStyle, 'transform'>>(() => ({
    transform: [
      { translateY: withSpring(interpolate(held.value, [0, 1], [0, 1.5])) },
      { scaleX: withSpring(interpolate(held.value, [0, 1], [1, 1.08])) },
      { scaleY: withSpring(interpolate(held.value, [0, 1], [1, 0.76], Extrapolation.CLAMP)) },
    ],
  }));

  return {
    containerStyle,
    hold: () => {
      // eslint-disable-next-line react-hooks/immutability
      held.value = withTiming(1, { duration: 140, easing: EASING });
    },
    holdCircleStyle,
    iconActiveStyle,
    iconInactiveStyle,
    iconSqueezeStyle,
    labelStyle,
    release: () => {
      // eslint-disable-next-line react-hooks/immutability
      held.value = withTiming(0, { duration: 220, easing: EASING });
    },
  };
}

function MorphTab({ active, item, onPress }: { active: boolean; item: NavItem; onPress: () => void }) {
  const [labelWidth, setLabelWidth] = useState(0);
  const motion = useMorphMotion(active, colors, labelWidth);

  return (
    <Pressable accessibilityRole='button' onPress={onPress} onPressIn={motion.hold} onPressOut={motion.release}>
      <ThemedText
        allowFontScaling={false}
        fontSize={15}
        fontWeight='600'
        includeFontPadding
        left={-10000}
        lineHeight={24}
        numberOfLines={1}
        onLayout={event => {
          const width = Math.ceil(event.nativeEvent.layout.width);
          if (width > 0 && width !== labelWidth) setLabelWidth(width);
        }}
        opacity={0}
        position='absolute'
        top={-10000}>
        {item.label}
      </ThemedText>
      <AnimatedThemedView
        alignItems='center'
        borderRadius={TAB_HEIGHT / 2}
        flexDirection='row'
        height={TAB_HEIGHT}
        overflow='visible'
        style={motion.containerStyle}>
        <AnimatedThemedView
          backgroundColor={colors.accent}
          borderRadius={18}
          height={36}
          left={(ICON_BOX - 36) / 2}
          position='absolute'
          style={motion.holdCircleStyle}
          top={(TAB_HEIGHT - 36) / 2}
          width={36}
        />
        <ThemedView height={TAB_HEIGHT} width={ICON_BOX}>
          <AnimatedThemedView absoluteFillObject alignItems='center' justifyContent='center' style={[motion.iconInactiveStyle, motion.iconSqueezeStyle]}>
            {item.icon(false, colors.muted, 22)}
          </AnimatedThemedView>
          <AnimatedThemedView absoluteFillObject alignItems='center' justifyContent='center' style={[motion.iconActiveStyle, motion.iconSqueezeStyle]}>
            {item.icon(true, colors.foreground, 22)}
          </AnimatedThemedView>
        </ThemedView>
        <AnimatedThemedView
          height={TAB_HEIGHT}
          justifyContent='center'
          marginLeft={LABEL_MARGIN}
          overflow='visible'
          paddingRight={LABEL_PAD}
          style={motion.labelStyle}>
          <AnimatedThemedText
            allowFontScaling={false}
            color={colors.foreground}
            flexShrink={0}
            fontSize={15}
            fontWeight='600'
            includeFontPadding
            lineHeight={24}
            style={{ width: labelWidth }}>
            {item.label}
          </AnimatedThemedText>
        </AnimatedThemedView>
      </AnimatedThemedView>
    </Pressable>
  );
}

function usePanelMotion(active: boolean, direction: number) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: DURATION - 80, easing: EASING });
  }, [active, progress]);

  const style = useAnimatedStyle<Pick<ViewStyle, 'opacity' | 'transform'>>(() => {
    const travel = direction === 0 ? 0 : direction * PANEL_SLIDE;
    return {
      opacity: progress.value,
      transform: [{ translateX: active ? travel * (1 - progress.value) : -travel * (1 - progress.value) }, { scale: withSpring(0.97 + 0.03 * progress.value) }],
    };
  }, [active, direction]);
  const blurProps = useAnimatedProps<Pick<BlurViewProps, 'intensity'>>(() => ({
    intensity: withSpring(interpolate(progress.value, [0, 0.5, 1], [0, 15, 0], Extrapolation.CLAMP)),
  }));
  const androidBlurStyle = useAnimatedStyle<Pick<ViewStyle, 'filter'>>(() => ({
    filter: [{ blur: withSpring(interpolate(progress.value, [0, 0.5, 1], [0, 10, 0], Extrapolation.CLAMP)) }],
  }));

  return { androidBlurStyle, blurProps, style };
}

function Panel({
  active,
  direction,
  item,
  onClose,
  onMeasure,
}: {
  active: boolean;
  direction: number;
  item: NavItem;
  onClose: () => void;
  onMeasure: Measure;
}) {
  const motion = usePanelMotion(active, direction);

  return (
    <AnimatedThemedView left={0} pointerEvents={active ? 'auto' : 'none'} position='absolute' style={motion.style} top={0} width='100%'>
      <AnimatedThemedView
        onLayout={event => {
          const { height, width } = event.nativeEvent.layout;
          onMeasure(item.key, Math.ceil(width), Math.ceil(height));
        }}
        style={Platform.OS === 'android' ? motion.androidBlurStyle : undefined}>
        <Popup colors={colors} onClose={onClose} routeName={item.routeName} />
      </AnimatedThemedView>
      {Platform.OS === 'ios' && (
        <AnimatedBlurView animatedProps={motion.blurProps} pointerEvents='none' style={StyleSheet.absoluteFill} tint='systemUltraThinMaterialDark' />
      )}
    </AnimatedThemedView>
  );
}

function MeasurementLayer({ items, onMeasure }: { items: NavItem[]; onMeasure: Measure }) {
  return (
    <ThemedView left={-10000} opacity={0} pointerEvents='none' position='absolute' top={-10000}>
      {items.map(item => (
        <ThemedView
          key={item.key}
          onLayout={event => {
            const { height, width } = event.nativeEvent.layout;
            onMeasure(item.key, Math.ceil(width), Math.ceil(height));
          }}>
          <Popup colors={colors} onClose={() => undefined} routeName={item.routeName} />
        </ThemedView>
      ))}
    </ThemedView>
  );
}

function Toolbar({
  activeKey,
  items,
  onLayout,
  onPress,
  view,
}: {
  activeKey?: string;
  items: NavItem[];
  onLayout: (event: LayoutChangeEvent) => void;
  onPress: (item: NavItem) => void;
  view: string;
}) {
  return (
    <ThemedView alignItems='center' alignSelf='center' flexDirection='row' gap={2} onLayout={onLayout} padding={6}>
      {items.map(item => (
        <MorphTab key={item.key} active={activeKey === item.key || view === item.key} item={item} onPress={() => onPress(item)} />
      ))}
    </ThemedView>
  );
}

function useCardMotion(sizes: SizeMap, toolbar: { h: number; minW: number; w: number }, view: string) {
  const open = useSharedValue(0);
  const cardWidth = useSharedValue(0);
  const cardHeight = useSharedValue(0);

  useEffect(() => {
    if (toolbar.minW === 0 || toolbar.h === 0) return;
    const firstRender = cardWidth.value === 0;
    if (view === 'default') {
      cardWidth.value = firstRender ? toolbar.w : withTiming(toolbar.w, { duration: DURATION, easing: EASING });
      cardHeight.value = firstRender ? toolbar.h : withTiming(toolbar.h, { duration: DURATION, easing: EASING });
      open.value = firstRender ? 0 : withTiming(0, { duration: DURATION - 80, easing: EASING });
      return;
    }
    const target = sizes[view];
    if (target) {
      const width = Math.max(toolbar.minW, toolbar.w, target.w);
      cardWidth.value = firstRender ? width : withTiming(width, { duration: DURATION, easing: EASING });
      cardHeight.value = firstRender ? toolbar.h + target.h : withTiming(toolbar.h + target.h, { duration: DURATION, easing: EASING });
    }
    open.value = withTiming(1, { duration: DURATION, easing: EASING });
  }, [cardHeight, cardWidth, open, sizes, toolbar.h, toolbar.minW, toolbar.w, view]);

  return {
    cardStyle: useAnimatedStyle(() => (cardWidth.value === 0 || cardHeight.value === 0 ? {} : { height: cardHeight.value, width: cardWidth.value })),
    dividerStyle: useAnimatedStyle(() => ({ opacity: open.value })),
  };
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
        icon: (focused: boolean, color: string, size: number) => options.tabBarIcon?.({ focused, color, size }) ?? null,
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
  const activeToolbarKey = view === 'default' ? activeKey : view;
  const activeItem = items.find(item => item.key === activeToolbarKey);
  const estimatedWidth =
    items.length * ICON_BOX +
    (activeItem ? Math.ceil(activeItem.label.length * 8.5 + 4) + LABEL_PAD + LABEL_MARGIN : 0) +
    Math.max(items.length - 1, 0) * 2 +
    12;
  const motion = useCardMotion(sizes, { ...toolbar, w: toolbar.w || estimatedWidth }, view);

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
      <MeasurementLayer items={items} onMeasure={onMeasure} />
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
        <AnimatedThemedView
          borderRadius={28}
          elevation={8}
          shadowColor='#000'
          shadowOffset={{ height: 10, width: 0 }}
          shadowOpacity={0.18}
          shadowRadius={20}
          style={motion.cardStyle}>
          <GlassView
            glassEffectStyle='regular'
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 28,
              borderWidth: StyleSheet.hairlineWidth,
              flex: 1,
              justifyContent: 'flex-end',
              overflow: 'hidden',
            }}>
            <ThemedView flex={1} overflow='hidden' width='100%'>
              {items.map(item => (
                <Panel key={item.key} active={view === item.key} direction={panelDirection} item={item} onClose={close} onMeasure={onMeasure} />
              ))}
            </ThemedView>
            <AnimatedThemedView
              backgroundColor={colors.border}
              height={StyleSheet.hairlineWidth}
              pointerEvents='none'
              style={motion.dividerStyle}
              width='100%'
            />
            <Toolbar
              activeKey={activeKey}
              items={items}
              onLayout={event => {
                const h = Math.ceil(event.nativeEvent.layout.height);
                const w = Math.ceil(event.nativeEvent.layout.width);
                setToolbar(current => (current.h === h && current.w === w ? current : { h: h || current.h, minW: current.minW || w, w: w || current.w }));
              }}
              onPress={onPress}
              view={view}
            />
          </GlassView>
        </AnimatedThemedView>
      </ThemedView>
    </ThemedView>
  );
}
