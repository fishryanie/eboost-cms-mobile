import { mhs } from 'themes/scaling';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Fragment, ReactNode, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SymbolView, SFSymbol } from 'expo-symbols';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';

export type ActionSheetItem = {
  danger?: boolean;
  disabled?: boolean;
  icon?: SFSymbol;
  key: string;
  label: string;
  meta?: string;
  onPress: () => void;
};

export function ActionSheet({ 
  items, 
  primaryActions,
  onClose, 
  open, 
  title,
  description,
  avatar
}: { 
  items: ActionSheetItem[]; 
  primaryActions?: ActionSheetItem[];
  onClose: () => void; 
  open: boolean; 
  title?: ReactNode;
  description?: ReactNode;
  avatar?: ReactNode;
}) {
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%'], []);

  const isPresented = useRef(false);

  useEffect(() => {
    if (open) {
      ref.current?.present();
      isPresented.current = true;
    } else if (isPresented.current) {
      ref.current?.dismiss();
      isPresented.current = false;
    }
  }, [open]);

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      enableDynamicSizing={false}
      onDismiss={() => {
        isPresented.current = false;
        onClose();
      }}
      ref={ref}
      snapPoints={snapPoints}>
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        {(title || avatar || description) && (
          <ThemedView alignItems='center' marginBottom={'six'}>
            {avatar && (
              <ThemedView marginBottom={'three'}>
                {avatar}
              </ThemedView>
            )}
            {title && (
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                {title}
              </ThemedText>
            )}
            {description && (
               typeof description === 'string' ? (
                 <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={14} lineHeight={20} marginTop={4}>
                   {description}
                 </ThemedText>
               ) : (
                 <ThemedView marginTop={4}>
                   {description}
                 </ThemedView>
               )
            )}
          </ThemedView>
        )}

        {/* Primary Action Row */}
        {primaryActions && primaryActions.length > 0 && (
          <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={'large'} flexDirection='row' marginBottom={'six'}>
            {primaryActions.map((action, index) => (
              <Fragment key={action.key}>
                <Pressable
                  disabled={action.disabled}
                  onPress={() => {
                    ref.current?.dismiss();
                    action.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.primaryRowItem,
                    action.disabled && styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  {action.icon && (
                    <SymbolView
                      name={action.icon}
                      resizeMode='scaleAspectFit'
                      size={18}
                      tintColor={action.danger ? Palette.danger : Palette.accent}
                    />
                  )}
                  <ThemedText
                    color={action.danger ? Palette.danger : Palette.accent}
                    fontFamily={FontFamily.bold}
                    fontSize={15}
                    lineHeight={20}
                  >
                    {action.label}
                  </ThemedText>
                </Pressable>
                {index < primaryActions.length - 1 && (
                  <ThemedView backgroundColor={Palette.borderSubtle} width={1} />
                )}
              </Fragment>
            ))}
          </ThemedView>
        )}

        {/* List Section */}
        {items.length > 0 && (
          <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={'large'} overflow='hidden'>
            {items.map((item, index) => (
              <Fragment key={item.key}>
                <Pressable
                  disabled={item.disabled}
                  onPress={() => {
                    ref.current?.dismiss();
                    item.onPress();
                  }}
                  style={({ pressed }) => [styles.item, item.disabled && styles.disabled, pressed && styles.pressed]}>
                  {item.icon ? (
                    <SymbolView
                      name={item.icon}
                      resizeMode='scaleAspectFit'
                      size={20}
                      tintColor={item.danger ? Palette.danger : Palette.textPrimary}
                    />
                  ) : null}
                  <ThemedView flex={1}>
                    <ThemedText style={[styles.itemLabel, item.danger && styles.danger]}>{item.label}</ThemedText>
                    {item.meta ? (
                      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} marginTop={2}>
                        {item.meta}
                      </ThemedText>
                    ) : null}
                  </ThemedView>
                  <SymbolView name='chevron.right' resizeMode='scaleAspectFit' size={16} tintColor={Palette.textTertiary} />
                </Pressable>
                {index < items.length - 1 && (
                  <ThemedView backgroundColor={Palette.borderSubtle} height={StyleSheet.hairlineWidth} marginLeft={'four'} />
                )}
              </Fragment>
            ))}
          </ThemedView>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: mhs(16),
    paddingBottom: mhs(42),
  },
  danger: {
    color: Palette.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mhs(12),
    paddingHorizontal: mhs(16),
    paddingVertical: mhs(14),
  },
  itemLabel: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  pressed: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  primaryRowItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: mhs(8),
    justifyContent: 'center',
    paddingVertical: mhs(14),
  },
});
