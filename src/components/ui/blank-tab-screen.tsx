import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';

export function BlankTabScreen({ name }: { name: string }) {
  return (
    <ThemedView alignItems='center' backgroundColor={Palette.surfaceBase} flex={1} justifyContent='center'>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={22} lineHeight={28}>
        {name}
      </ThemedText>
    </ThemedView>
  );
}
