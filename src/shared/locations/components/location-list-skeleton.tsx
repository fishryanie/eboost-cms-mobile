import { StyleSheet } from 'react-native';
import { ThemedView } from 'components/base';

const rows = Array.from({ length: 6 }, (_, index) => index);

export function LocationListSkeleton() {
  return (
    <ThemedView>
      {rows.map(row => (
        <ThemedView key={row} alignItems='center' flexDirection='row' gap={12} minHeight={104} paddingLeft={12}>
          <ThemedView borderRadius={16} height={64} loading width={64} />
          <ThemedView
            borderBottomColor='#E6EAE8'
            borderBottomWidth={StyleSheet.hairlineWidth}
            flex={1}
            gap={6}
            justifyContent='center'
            minHeight={104}
            paddingRight={12}
            paddingVertical={10}>
            <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
              <ThemedView alignItems='center' flexDirection='row' gap={6}>
                <ThemedView borderRadius={12} height={8} loading width={48} />
                <ThemedView borderRadius={12} height={8} loading width={72} />
              </ThemedView>
              <ThemedView borderRadius={'pill'} height={22} loading width={62} />
            </ThemedView>
            <ThemedView borderRadius={12} height={13} loading width={'84%'} />
            <ThemedView borderRadius={12} height={9} loading width={'82%'} />
            <ThemedView borderRadius={12} height={9} loading width={'58%'} />
          </ThemedView>
        </ThemedView>
      ))}
    </ThemedView>
  );
}
