import type { ReactNode } from 'react';
import { ThemedText, ThemedView } from 'components/base';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <ThemedView flexDirection='row' justifyContent='space-between'>
      <ThemedText type='small'>{title}</ThemedText>
      <ThemedView type='backgroundSelected' borderRadius={8} paddingVertical={'half'} paddingHorizontal={'two'}>
        <ThemedText themeColor='textSecondary'>{hint}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
