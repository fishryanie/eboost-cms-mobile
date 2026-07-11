import { KeyboardAvoidingView, Pressable, ScrollView, Switch, TextInput, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText, ThemedView } from 'components/base';
import { AppButton } from 'components/ui';
import { FontFamily, Palette } from 'themes';

export type ResourceField = {
  key: string;
  keyboard?: 'default' | 'numeric';
  label: string;
  multiline?: boolean;
  type?: 'switch' | 'text';
};

export function ResourceFormSheet({
  fields,
  initialValues,
  loading,
  onClose,
  onSubmit,
  open,
  title,
}: {
  fields: ResourceField[];
  initialValues?: Record<string, unknown>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
  open: boolean;
  title: string;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues || {});
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal
      avoidKeyboard
      isVisible={open}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      onModalShow={() => setValues(initialValues || {})}
      style={{ justifyContent: 'flex-end', margin: 0 }}>
      <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ justifyContent: 'flex-end' }}>
        <ThemedView
          backgroundColor={Palette.surfaceBase}
          borderTopLeftRadius={'large'}
          borderTopRightRadius={'large'}
          maxHeight={height * 0.9}
          overflow='hidden'>
          <ThemedView
            alignItems='center'
            borderBottomColor={Palette.borderSubtle}
            borderBottomWidth={1}
            flexDirection='row'
            justifyContent='space-between'
            padding={'four'}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20}>
              {title}
            </ThemedText>
            <Pressable disabled={loading} onPress={onClose}>
              <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={14}>
                Close
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ScrollView
            contentContainerStyle={{ gap: 16, padding: 16 }}
            contentInsetAdjustmentBehavior='automatic'
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={{ flexShrink: 1 }}>
            {fields.map(field =>
              field.type === 'switch' ? (
                <ThemedView key={field.key} alignItems='center' flexDirection='row' justifyContent='space-between' minHeight={46}>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15}>
                    {field.label}
                  </ThemedText>
                  <Switch onValueChange={value => setValues(current => ({ ...current, [field.key]: value }))} value={Boolean(values[field.key])} />
                </ThemedView>
              ) : (
                <ThemedView key={field.key} gap={'two'}>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13}>
                    {field.label}
                  </ThemedText>
                  <TextInput
                    keyboardType={field.keyboard === 'numeric' ? 'decimal-pad' : 'default'}
                    multiline={field.multiline}
                    onChangeText={value =>
                      setValues(current => ({ ...current, [field.key]: field.keyboard === 'numeric' ? (value ? Number(value) : undefined) : value }))
                    }
                    placeholder={field.label}
                    placeholderTextColor={Palette.textTertiary}
                    style={{
                      backgroundColor: Palette.surfaceMuted,
                      borderColor: Palette.borderSubtle,
                      borderRadius: 14,
                      borderWidth: 1,
                      color: Palette.textPrimary,
                      fontSize: 15,
                      minHeight: field.multiline ? 96 : 48,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      textAlignVertical: field.multiline ? 'top' : 'center',
                    }}
                    value={values[field.key] == null ? '' : String(values[field.key])}
                  />
                </ThemedView>
              ),
            )}
          </ScrollView>
          <ThemedView
            backgroundColor={Palette.surfaceBase}
            borderTopColor={Palette.borderSubtle}
            borderTopWidth={1}
            paddingBottom={Math.max(insets.bottom, 34)}
            paddingHorizontal={'four'}
            paddingTop={'three'}>
            <AppButton block label='Save changes' loading={loading} onPress={() => onSubmit(values)} />
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
