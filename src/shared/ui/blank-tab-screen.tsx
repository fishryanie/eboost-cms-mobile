import { StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette } from 'themes';

export function BlankTabScreen({ name }: { name: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceBase,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
  },
});
