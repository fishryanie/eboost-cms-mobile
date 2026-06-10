import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';

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
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {items.map(item => (
          <Pressable
            disabled={item.disabled}
            key={item.key}
            onPress={() => {
              ref.current?.dismiss();
              item.onPress();
            }}
            style={({ pressed }) => [styles.item, item.disabled && styles.disabled, pressed && styles.pressed]}>
            <Text style={[styles.itemLabel, item.danger && styles.danger]}>{item.label}</Text>
            {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}
          </Pressable>
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  danger: {
    color: Palette.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  header: {
    paddingBottom: 8,
  },
  item: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  itemLabel: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
  },
});
