import { mhs } from 'themes/scaling';
import { PropsWithChildren } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from 'components/base';
import { AnimatedHeaderScrollView } from 'components/organisms/animated-header-scrollview';

import { Palette } from 'themes';

export function AppScreen({ 
  children, 
  scroll = true, 
  title,
  subtitle,
  rightComponent,
  isFlatList,
  flatListProps,
  canGoBack,
  onBack,
  searchBar,
  ...props 
}: PropsWithChildren<ScrollViewProps & { scroll?: boolean; title?: string; subtitle?: string; rightComponent?: React.ReactNode; isFlatList?: boolean; flatListProps?: import('react-native').FlatListProps<any>; canGoBack?: boolean; onBack?: () => void; searchBar?: React.ReactNode; }>) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView flex={1} padding={'four'}>
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
          canGoBack={canGoBack}
          onBack={onBack}
          searchBar={searchBar}
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
    gap: mhs(16),
    padding: mhs(16),
    paddingBottom: 120 },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1 },
  scroll: {
    flex: 1 } });
