import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';

export function EmptyState({ message, title }: { message?: string; title: string }) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor={Palette.surfaceRaised}
      borderColor={Palette.borderSubtle}
      borderRadius={'large'}
      borderWidth={1}
      gap={'two'}
      padding={'five'}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} lineHeight={20} textAlign='center'>
          {message}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}
