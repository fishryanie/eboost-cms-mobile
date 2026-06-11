import { PropsWithChildren } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from 'components/base';

import { Palette, Spacing } from 'themes';

export function AppScreen({ children, scroll = true, ...props }: PropsWithChildren<ScrollViewProps & { scroll?: boolean }>) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView flex={1} padding={Spacing.four}>
          {children}
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={styles.content} style={styles.scroll} {...props}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: 120,
  },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
