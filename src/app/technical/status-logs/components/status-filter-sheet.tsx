import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { CheckCircle2 } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import type { StatusOption } from 'app/technical/status-logs/status-options';
import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

type StatusFilterSheetProps = {
  onClose: () => void;
  onSelect: (status: string) => void;
  options: StatusOption[];
  selectedStatus: string;
  visible: boolean;
};

export function StatusFilterSheet({ onClose, onSelect, options, selectedStatus, visible }: StatusFilterSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      const frame = requestAnimationFrame(() => ref.current?.present());
      return () => cancelAnimationFrame(frame);
    }

    if (isPresentedRef.current) ref.current?.dismiss();
    return undefined;
  }, [visible]);

  function handleDismiss() {
    if (!isPresentedRef.current) return;
    isPresentedRef.current = false;
    onClose();
  }

  function handleSelect(status: string) {
    onSelect(status);
    ref.current?.dismiss();
  }

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      onDismiss={handleDismiss}
      ref={ref}
      snapPoints={['64%']}>
      <BottomSheetFlatList
        contentContainerStyle={{ paddingBottom: 28 }}
        data={options}
        ItemSeparatorComponent={() => <ThemedView backgroundColor={Palette.borderSubtle} height={StyleSheet.hairlineWidth} marginLeft={'four'} />}
        keyExtractor={item => item.value || 'all'}
        ListHeaderComponent={
          <ThemedView backgroundColor={Palette.surfaceRaised} gap={'one'} paddingBottom={'three'} paddingHorizontal={'four'} paddingTop={'two'}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
              Filter by status
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18}>
              Show logs matching one charging status.
            </ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = selectedStatus === item.value;

          return (
            <Pressable
              accessibilityRole='button'
              accessibilityState={{ selected }}
              onPress={() => handleSelect(item.value)}
              style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
              <ThemedView alignItems='center' flexDirection='row' gap={'three'} minHeight={48} paddingHorizontal={'four'} paddingVertical={'three'}>
                <ThemedText color={Palette.textPrimary} flex={1} fontFamily={selected ? FontFamily.bold : FontFamily.medium} fontSize={14}>
                  {item.label}
                </ThemedText>
                {selected ? (
                  <CheckCircle2 color={Palette.accent} size={22} />
                ) : (
                  <ThemedView borderColor={Palette.border} borderRadius={'pill'} borderWidth={1.5} height={22} width={22} />
                )}
              </ThemedView>
            </Pressable>
          );
        }}
      />
    </BottomSheetModal>
  );
}
