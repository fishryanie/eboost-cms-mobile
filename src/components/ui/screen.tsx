import { mhs } from 'themes/scaling';
import { PropsWithChildren } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, FlatList } from 'react-native';

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
  disableSafeAreaTop,
  ...props 
}: PropsWithChildren<ScrollViewProps & { scroll?: boolean; title?: string; subtitle?: string; rightComponent?: React.ReactNode; isFlatList?: boolean; flatListProps?: import('react-native').FlatListProps<any>; canGoBack?: boolean; onBack?: () => void; searchBar?: React.ReactNode; disableSafeAreaTop?: boolean; }>) {
  if (!scroll) {
    return (
      <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingBottom safePaddingTop={!disableSafeAreaTop}>
        <ThemedView flex={1} padding={'four'}>
          {children}
        </ThemedView>
      </ThemedView>
    );
  }

  if (title) {
    return (
      <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
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
      </ThemedView>
    );
  }

  if (isFlatList) {
    return (
      <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingBottom safePaddingTop={!disableSafeAreaTop}>
        <FlatList
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={styles.content}
          style={styles.scroll}
          {...(flatListProps as any)}
          {...(props as any)}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingBottom safePaddingTop={!disableSafeAreaTop}>
      <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={styles.content} style={styles.scroll} {...props}>
        {children}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: mhs(16),
    padding: mhs(16),
    paddingBottom: 120 },

  scroll: {
    flex: 1 } });
