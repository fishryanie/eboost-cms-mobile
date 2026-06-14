import { PropsWithChildren } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from 'components/base';
import { AnimatedHeaderScrollView } from 'components/organisms/animated-header-scrollview';

import { Palette, Spacing } from 'themes';

export function AppScreen({ 
  children, 
  scroll = true, 
  title,
  subtitle,
  rightComponent,
  isFlatList,
  flatListProps,
  ...props 
}: PropsWithChildren<ScrollViewProps & { scroll?: boolean; title?: string; subtitle?: string; rightComponent?: React.ReactNode; isFlatList?: boolean; flatListProps?: import('react-native').FlatListProps<any> }>) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView flex={1} padding={Spacing.four}>
          {children}
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (title) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <AnimatedHeaderScrollView
          largeTitle={title}
          subtitle={subtitle}
          rightComponent={rightComponent}
          contentContainerStyle={[!isFlatList && styles.content, props.contentContainerStyle]}
          isFlatList={isFlatList}
          flatListProps={flatListProps}
        >
          {children}
        </AnimatedHeaderScrollView>
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
