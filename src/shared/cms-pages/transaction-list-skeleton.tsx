import { ThemedView } from 'components/base';
import { Palette } from 'themes';

const skeletonCards = [0, 1, 2];
const metricPills = [0, 1, 2, 3];

export function TransactionListSkeleton() {
  return (
    <ThemedView gap={16} paddingTop={'two'}>
      {skeletonCards.map(card => (
        <ThemedView
          key={card}
          backgroundColor={Palette.surfaceBase}
          borderColor={Palette.borderSubtle}
          borderRadius={16}
          borderWidth={1}
          gap={'three'}
          padding={'three'}>
          <ThemedView flexDirection='row' justifyContent='space-between'>
            <ThemedView borderRadius={'pill'} height={16} loading width='48%' />
            <ThemedView borderRadius={'pill'} height={14} loading width='24%' />
          </ThemedView>

          <ThemedView gap={'two'}>
            <ThemedView borderRadius={'pill'} height={12} loading width='72%' />
            <ThemedView borderRadius={'pill'} height={10} loading width='44%' />
          </ThemedView>

          <ThemedView flexDirection='row' justifyContent='space-between'>
            {metricPills.map(metric => (
              <ThemedView key={metric} borderRadius={'small'} height={28} loading width='23%' />
            ))}
          </ThemedView>

          <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={'medium'} gap={'two'} padding={'three'}>
            <ThemedView borderRadius={'pill'} height={12} loading width='58%' />
            <ThemedView flexDirection='row' justifyContent='space-between'>
              <ThemedView borderRadius={'pill'} height={10} loading width='38%' />
              <ThemedView borderRadius={'pill'} height={10} loading width='28%' />
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ))}
    </ThemedView>
  );
}
