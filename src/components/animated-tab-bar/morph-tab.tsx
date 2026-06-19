import { ThemedText, ThemedView } from 'components/base';
import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, ICON_BOX, LABEL_CLIP_BUFFER, LABEL_MARGIN, LABEL_PAD, TAB_HEIGHT } from './constants';
import { useMorphMotion } from './hooks';

const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export function MorphTab({ active, item, onPress }: { active: boolean; item: NavItem; onPress: () => void }) {
  const [labelWidth, setLabelWidth] = useState(0);
  const motion = useMorphMotion(active, labelWidth);

  return (
    <Pressable accessibilityRole='button' onPress={onPress} onPressIn={motion.hold} onPressOut={motion.release}>
      <ThemedText
        allowFontScaling={false}
        fontSize={15}
        fontWeight='600'
        includeFontPadding={false}
        left={-10000}
        lineHeight={24}
        numberOfLines={1}
        onLayout={event => {
          const width = Math.ceil(event.nativeEvent.layout.width) + LABEL_CLIP_BUFFER;
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
            height={TAB_HEIGHT}
            includeFontPadding={false}
            lineHeight={TAB_HEIGHT}
            style={{ width: labelWidth }}>
            {item.label}
          </AnimatedThemedText>
        </AnimatedThemedView>
      </AnimatedThemedView>
    </Pressable>
  );
}
