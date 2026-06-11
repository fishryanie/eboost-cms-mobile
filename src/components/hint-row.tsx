import type { ReactNode } from 'react';
import { ThemedText, ThemedView } from 'components/base';

import { Spacing } from 'themes';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <ThemedView flexDirection='row' justifyContent='space-between'>
      <ThemedText type='small'>{title}</ThemedText>
      <ThemedView type='backgroundSelected' borderRadius={Spacing.two} paddingVertical={Spacing.half} paddingHorizontal={Spacing.two}>
        <ThemedText themeColor='textSecondary'>{hint}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
