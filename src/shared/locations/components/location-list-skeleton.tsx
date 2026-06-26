import { StyleSheet } from 'react-native';
import { ThemedView } from 'components/base';

import { Palette } from 'themes';

const rows = Array.from({ length: 7 }, (_, index) => index);

export function LocationListSkeleton() {
  return (
    <ThemedView>
      {rows.map(row => (
        <ThemedView
          key={row}
          alignItems='center'
          borderBottomColor={Palette.borderSubtle}
          borderBottomWidth={StyleSheet.hairlineWidth}
          flexDirection='row'
          gap={'two'}
          minHeight={82}
          paddingHorizontal={'three'}
          paddingVertical={'two'}>
          <ThemedView borderRadius={16} height={50} loading width={50} />
          <ThemedView flex={1} gap={6}>
            <ThemedView flexDirection='row' gap={'two'}>
              <ThemedView borderRadius={12} height={9} loading width={44} />
              <ThemedView borderRadius={12} height={9} loading width={44} />
              <ThemedView borderRadius={12} height={9} loading width={44} />
            </ThemedView>
            <ThemedView borderRadius={12} height={12} loading width={'58%'} />
            <ThemedView borderRadius={12} height={10} loading width={'78%'} />
          </ThemedView>
          <ThemedView alignItems='flex-end' alignSelf='stretch' justifyContent='space-between' paddingVertical={3} width={76}>
            <ThemedView borderRadius={12} height={17} loading width={62} />
            <ThemedView borderRadius={'pill'} height={20} loading width={38} />
          </ThemedView>
        </ThemedView>
      ))}
    </ThemedView>
  );
}
