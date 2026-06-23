import { ThemedText, ThemedView } from 'components/base';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, ICON_BOX, LABEL_CLIP_BUFFER, LABEL_MARGIN, LABEL_PAD, TAB_HEIGHT } from './constants';
import { useMorphMotion } from './hooks';

export function MorphTab({ active, item, onPress }: { active: boolean; item: NavItem; onPress: () => void }) {
  const [labelWidth, setLabelWidth] = useState(Math.ceil(item.label.length * 8.5 + 4) + LABEL_CLIP_BUFFER);
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
      <Animated.View
        style={[
          {
            alignItems: 'center',
            borderRadius: TAB_HEIGHT / 2,
            flexDirection: 'row',
            height: TAB_HEIGHT,
            overflow: 'visible',
          },
          motion.containerStyle,
        ]}>
        <Animated.View
          style={[
            {
              backgroundColor: colors.accent,
              borderRadius: 18,
              height: 36,
              left: (ICON_BOX - 36) / 2,
              position: 'absolute',
              top: (TAB_HEIGHT - 36) / 2,
              width: 36,
            },
            motion.holdCircleStyle,
          ]}
        />
        <ThemedView height={TAB_HEIGHT} width={ICON_BOX}>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, motion.iconInactiveStyle, motion.iconSqueezeStyle]}>
            {item.icon(false, colors.muted, 22)}
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, motion.iconActiveStyle, motion.iconSqueezeStyle]}>
            {item.icon(true, colors.foreground, 22)}
          </Animated.View>
        </ThemedView>
        <Animated.View
          style={[
            {
              height: TAB_HEIGHT,
              justifyContent: 'center',
              marginLeft: LABEL_MARGIN,
              overflow: 'visible',
              paddingRight: LABEL_PAD,
            },
            motion.labelStyle,
          ]}>
          <Animated.Text
            allowFontScaling={false}
            style={{
              color: colors.foreground,
              flexShrink: 0,
              fontSize: 15,
              fontWeight: '600',
              height: TAB_HEIGHT,
              includeFontPadding: false,
              lineHeight: TAB_HEIGHT,
              width: labelWidth,
            }}>
            {item.label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
