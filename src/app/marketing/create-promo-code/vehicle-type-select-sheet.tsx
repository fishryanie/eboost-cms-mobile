import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { CheckCircle2 } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import type { CreatePromoCodeValues } from './types';

type VehicleType = CreatePromoCodeValues['vehicleType'];

type VehicleTypeOption = {
  label: string;
  subtitle: string;
  value: VehicleType;
};

type VehicleTypeSelectSheetProps = {
  onClose: () => void;
  onSelect: (value: VehicleType) => void;
  selectedValue: VehicleType;
  visible: boolean;
};

const options: VehicleTypeOption[] = [
  { label: 'All vehicles', subtitle: 'Applies to both bike and car chargers', value: '0' },
  { label: 'Bike', subtitle: 'Bike charging only', value: 'bike' },
  { label: 'Car', subtitle: 'Car charging only', value: 'car' },
];

export function VehicleTypeSelectSheet({ onClose, onSelect, selectedValue, visible }: VehicleTypeSelectSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      const frame = requestAnimationFrame(() => ref.current?.present());
      return () => cancelAnimationFrame(frame);
    }

    ref.current?.dismiss();
    return undefined;
  }, [visible]);

  function handleDismiss() {
    if (!isPresentedRef.current) return;
    isPresentedRef.current = false;
    onClose();
  }

  function selectOption(value: VehicleType) {
    onSelect(value);
    ref.current?.dismiss();
  }

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      onDismiss={handleDismiss}
      ref={ref}
      snapPoints={['42%']}>
      <BottomSheetFlatList
        contentContainerStyle={styles.content}
        data={options}
        ItemSeparatorComponent={() => <ThemedView backgroundColor={Palette.borderSubtle} height={StyleSheet.hairlineWidth} marginLeft={'four'} />}
        keyExtractor={item => item.value}
        ListHeaderComponent={
          <ThemedView backgroundColor={Palette.surfaceRaised} gap={'one'} paddingBottom={'three'} paddingHorizontal={'four'} paddingTop={'two'}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
              Select vehicle type
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
              Choose where this promo can be used.
            </ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => {
          const selected = selectedValue === item.value;
          return (
            <Pressable onPress={() => selectOption(item.value)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14}>
                  {item.label}
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontSize={12}>
                  {item.subtitle}
                </ThemedText>
              </ThemedView>
              {selected ? (
                <CheckCircle2 color={Palette.accent} size={22} />
              ) : (
                <ThemedView borderColor={Palette.border} borderRadius={'pill'} borderWidth={1.5} height={22} width={22} />
              )}
            </Pressable>
          );
        }}
      />
    </BottomSheetModal>
  );
}

export function getVehicleTypeLabel(value: VehicleType) {
  return options.find(item => item.value === value)?.label || 'All vehicles';
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: mhs(28),
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mhs(12),
    paddingHorizontal: mhs(16),
    paddingVertical: mhs(12),
  },
  pressed: {
    opacity: 0.72,
  },
});
