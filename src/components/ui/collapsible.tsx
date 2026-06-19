import { mhs } from 'themes/scaling';
import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemedView, ThemedText } from 'components/base';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);

import { useTheme } from 'hooks/use-theme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <ThemedView>
      <Pressable style={({ pressed }) => [styles.heading, pressed && styles.pressedHeading]} onPress={() => setIsOpen(value => !value)}>
        <ThemedView type='backgroundElement' width={16} height={16} borderRadius={12} justifyContent='center' alignItems='center'>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            weight='bold'
            tintColor={theme.text}
            style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}
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
    gap: mhs(8) },
  pressedHeading: {
    opacity: 0.7 } });
