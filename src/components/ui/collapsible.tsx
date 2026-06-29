import { mhs } from 'themes/scaling';
import { ChevronRight } from 'lucide-react-native';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemedView, ThemedText } from 'components/base';

import { useTheme } from 'hooks/use-theme';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <ThemedView>
      <Pressable style={({ pressed }) => [styles.heading, pressed && styles.pressedHeading]} onPress={() => setIsOpen(value => !value)}>
        <ThemedView type='backgroundElement' width={16} height={16} borderRadius={12} justifyContent='center' alignItems='center'>
          <ChevronRight
            color={theme.text}
            size={14}
            strokeWidth={3}
            style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
          />
        </ThemedView>

        <ThemedText type='small'>{title}</ThemedText>
      </Pressable>
      {isOpen && (
        <AnimatedThemedView entering={FadeIn.duration(200)}>
          <ThemedView type='backgroundElement' marginTop={'three'} borderRadius={12} marginLeft={'four'} padding={'four'}>
            {children}
          </ThemedView>
        </AnimatedThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mhs(8),
  },
  pressedHeading: {
    opacity: 0.7,
  },
});
