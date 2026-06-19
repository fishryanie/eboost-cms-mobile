import { mhs } from 'themes/scaling';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';

export type ActionSheetItem = {
  danger?: boolean;
  disabled?: boolean;
  key: string;
  label: string;
  meta?: string;
  onPress: () => void;
};

export function ActionSheet({ items, onClose, open, title }: { items: ActionSheetItem[]; onClose: () => void; open: boolean; title: ReactNode }) {
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['42%', '72%'], []);

  useEffect(() => {
    if (open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [open]);

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      enableDynamicSizing
      onDismiss={onClose}
      ref={ref}
      snapPoints={snapPoints}>
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <ThemedView paddingBottom={8}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={24}>
            {title}
          </ThemedText>
        </ThemedView>
        {items.map(item => (
          <Pressable
            disabled={item.disabled}
            key={item.key}
            onPress={() => {
              ref.current?.dismiss();
              item.onPress();
            }}
            style={({ pressed }) => [styles.item, item.disabled && styles.disabled, pressed && styles.pressed]}>
            <ThemedText style={[styles.itemLabel, item.danger && styles.danger]}>{item.label}</ThemedText>
            {item.meta ? (
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} marginTop={3}>
                {item.meta}
              </ThemedText>
            ) : null}
          </Pressable>
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: mhs(8),
    padding: mhs(16),
    paddingBottom: mhs(32) },
  danger: {
    color: Palette.danger },
  disabled: {
    opacity: 0.45 },
  item: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(21),
    paddingHorizontal: mhs(16),
    paddingVertical: mhs(16) },
  itemLabel: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22 },
  pressed: {
    opacity: 0.7 } });
