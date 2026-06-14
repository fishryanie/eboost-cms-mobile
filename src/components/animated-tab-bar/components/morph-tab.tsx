import { JSX, memo, useState, type ComponentProps, type FC, type FunctionComponent, type ReactElement, type ReactNode } from 'react';
import { Pressable, View, Text, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';

import { useMorphTabMotion } from '../hooks/use-morph-tab-motion';
import { ICON_BOX, TAB_HEIGHT } from '../motion';
import type { IMorphTabProps } from '../types';
import { tabStyles as styles } from '../styles';

const MorphTab: FC<IMorphTabProps> & FunctionComponent<IMorphTabProps> = memo<IMorphTabProps & ComponentProps<typeof MorphTab>>(
  ({ active, colors, item, onPress }: IMorphTabProps & ComponentProps<typeof MorphTab>): (ReactNode & ReactElement & JSX.Element) | null => {
    const [labelW, setLabelW] = useState(0);
    const motion = useMorphTabMotion(active, colors, labelW);

    return (
      <Pressable accessibilityRole='button' onPress={onPress} onPressIn={motion.hold} onPressOut={motion.release}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          onLayout={(event: LayoutChangeEvent) => {
            const width = Math.ceil(event.nativeEvent.layout.width);
            if (width > 0 && width !== labelW) setLabelW(width);
          }}
          style={[styles.tabLabel, styles.measureLabel]}>
          {item.label}
        </Text>

        <Animated.View style={[styles.tabMorph, motion.containerStyle]}>
          <Animated.View pointerEvents='none' style={[styles.holdCircle, { backgroundColor: colors.accent }, motion.holdCircleStyle]} />
          <View style={{ height: TAB_HEIGHT, width: ICON_BOX }}>
            <Animated.View style={[styles.iconLayer, motion.iconInactiveStyle, motion.iconSqueezeStyle]}>{item.icon(false, colors.muted, 22)}</Animated.View>
            <Animated.View style={[styles.iconLayer, motion.iconActiveStyle, motion.iconSqueezeStyle]}>{item.icon(true, colors.foreground, 22)}</Animated.View>
          </View>
          <Animated.View style={[styles.tabLabelWrap, motion.labelStyle]}>
            <Animated.Text
              allowFontScaling={false}
              style={[styles.tabLabel, styles.fixedLabel, { color: colors.foreground, width: labelW }]}>
              {item.label}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  },
);

MorphTab.displayName = 'MorphTab';

export { MorphTab };
