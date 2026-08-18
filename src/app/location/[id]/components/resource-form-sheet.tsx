import { Check, ChevronDown } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';

import { BottomButton, Switch, ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

export type ResourceOption = {
  label: string;
  value: string;
};

export type ResourceField = {
  clearOnChange?: string[];
  key: string;
  keyboard?: 'default' | 'numeric';
  label: string;
  loadingOptions?: boolean;
  multiline?: boolean;
  options?: ResourceOption[] | ((values: Record<string, unknown>) => ResourceOption[]);
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  section?: string;
  sectionDescription?: string;
  type?: 'select' | 'switch' | 'text';
};

export function ResourceFormSheet({
  fields,
  initialValues,
  loading,
  onClose,
  onSubmit,
  open,
  preparing,
  resetKey,
  title,
}: {
  fields: ResourceField[];
  initialValues?: Record<string, unknown>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
  open: boolean;
  preparing?: boolean;
  resetKey?: number | string;
  title: string;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues || {});
  const [selectingFieldKey, setSelectingFieldKey] = useState<string>();
  const [selectSearch, setSelectSearch] = useState('');
  const initialValuesRef = useRef(initialValues);
  const { height } = useWindowDimensions();
  const selectingField = fields.find(field => field.key === selectingFieldKey);
  const selectingOptions = useMemo(() => resolveOptions(selectingField, values), [selectingField, values]);
  const filteredSelectingOptions = useMemo(() => {
    const query = selectSearch.trim().toLowerCase();
    return query ? selectingOptions.filter(option => option.label.toLowerCase().includes(query)) : selectingOptions;
  }, [selectSearch, selectingOptions]);

  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSelectingFieldKey(undefined);
      setSelectSearch('');
      if (open && !preparing) setValues(initialValuesRef.current || {});
    });

    return () => cancelAnimationFrame(frame);
  }, [open, preparing, resetKey]);

  function updateValue(field: ResourceField, value: unknown) {
    setValues(current => {
      const next = { ...current, [field.key]: value };
      field.clearOnChange?.forEach(key => {
        next[key] = undefined;
      });
      return next;
    });
  }

  function openSelector(field: ResourceField) {
    if (field.readOnly || field.loadingOptions) return;
    setSelectSearch('');
    setSelectingFieldKey(field.key);
  }

  function submit() {
    const normalizedValues = { ...values };
    fields.forEach(field => {
      if (field.keyboard !== 'numeric') return;
      const value = normalizedValues[field.key];
      normalizedValues[field.key] = value === '' || value === null || value === undefined ? undefined : Number(value);
    });
    onSubmit(normalizedValues);
  }

  return (
    <>
      <Modal avoidKeyboard isVisible={open} onBackButtonPress={onClose} onBackdropPress={onClose} style={{ justifyContent: 'flex-end', margin: 0 }}>
        <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ justifyContent: 'flex-end' }}>
          <ThemedView
            backgroundColor={Palette.surfaceBase}
            borderTopLeftRadius={'large'}
            borderTopRightRadius={'large'}
            maxHeight={height * 0.92}
            overflow='hidden'>
            <ThemedView
              alignItems='center'
              borderBottomColor={Palette.borderSubtle}
              borderBottomWidth={1}
              flexDirection='row'
              justifyContent='space-between'
              padding={'three'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={18}>
                {title}
              </ThemedText>
              <Pressable accessibilityRole='button' disabled={loading} onPress={onClose}>
                <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={13}>
                  Close
                </ThemedText>
              </Pressable>
            </ThemedView>

            {preparing ? (
              <ThemedView alignItems='center' backgroundColor='transparent' gap={'three'} justifyContent='center' minHeight={260} padding={'six'}>
                <ActivityIndicator color={Palette.accent} size='small' />
                <ThemedText color={Palette.textSecondary} fontSize={13}>
                  Loading location fields…
                </ThemedText>
              </ThemedView>
            ) : (
              <ScrollView
                contentContainerStyle={{ gap: 12, padding: 12, paddingBottom: 112 }}
                contentInsetAdjustmentBehavior='automatic'
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
                style={{ flexShrink: 1 }}>
                {fields.map((field, index) => {
                  const showSection = Boolean(field.section && field.section !== fields[index - 1]?.section);
                  const options = resolveOptions(field, values);
                  const selectedOption = options.find(option => sameOptionValue(option.value, values[field.key]));

                  return (
                    <ThemedView backgroundColor='transparent' gap={'two'} key={field.key} paddingTop={showSection && index > 0 ? 'three' : undefined}>
                      {showSection ? (
                        <ThemedView backgroundColor='transparent' gap={'one'} paddingHorizontal={'one'}>
                          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={16}>
                            {field.section}
                          </ThemedText>
                          {field.sectionDescription ? (
                            <ThemedText color={Palette.textTertiary} fontSize={12} lineHeight={17}>
                              {field.sectionDescription}
                            </ThemedText>
                          ) : null}
                        </ThemedView>
                      ) : null}

                      {field.type === 'switch' ? (
                        <ThemedView
                          alignItems='center'
                          backgroundColor={Palette.surfaceMuted}
                          borderColor={Palette.borderSubtle}
                          borderRadius={14}
                          borderWidth={1}
                          flexDirection='row'
                          justifyContent='space-between'
                          minHeight={52}
                          opacity={field.readOnly ? 0.55 : 1}
                          paddingHorizontal={'three'}>
                          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14}>
                            {field.label}
                          </ThemedText>
                          <Switch
                            accessibilityLabel={field.label}
                            disabled={field.readOnly || loading}
                            onValueChange={value => updateValue(field, value)}
                            value={Boolean(values[field.key])}
                          />
                        </ThemedView>
                      ) : field.type === 'select' ? (
                        <ThemedView backgroundColor='transparent' gap={'two'}>
                          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13}>
                            {field.required ? '* ' : ''}
                            {field.label}
                          </ThemedText>
                          <Pressable
                            accessibilityRole='button'
                            disabled={field.readOnly || field.loadingOptions || loading}
                            onPress={() => openSelector(field)}>
                            <ThemedView
                              alignItems='center'
                              backgroundColor={Palette.surfaceMuted}
                              borderColor={Palette.borderSubtle}
                              borderRadius={14}
                              borderWidth={1}
                              flexDirection='row'
                              gap={'two'}
                              minHeight={48}
                              opacity={field.readOnly ? 0.55 : 1}
                              paddingHorizontal={'three'}>
                              {field.loadingOptions ? <ActivityIndicator color={Palette.accent} size='small' /> : null}
                              <ThemedText color={selectedOption ? Palette.textPrimary : Palette.textTertiary} flex={1} fontSize={14} numberOfLines={1}>
                                {field.loadingOptions ? 'Loading options…' : selectedOption?.label || 'Select a value'}
                              </ThemedText>
                              <ChevronDown color={Palette.textTertiary} size={17} />
                            </ThemedView>
                          </Pressable>
                        </ThemedView>
                      ) : (
                        <ThemedView backgroundColor='transparent' gap={'two'}>
                          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13}>
                            {field.required ? '* ' : ''}
                            {field.label}
                          </ThemedText>
                          <TextInput
                            editable={!field.readOnly && !loading}
                            keyboardType={field.keyboard === 'numeric' ? 'decimal-pad' : 'default'}
                            multiline={field.multiline}
                            onChangeText={value => updateValue(field, value)}
                            placeholder={field.placeholder || field.label}
                            placeholderTextColor={Palette.textTertiary}
                            style={{
                              backgroundColor: Palette.surfaceMuted,
                              borderColor: Palette.borderSubtle,
                              borderRadius: 14,
                              borderWidth: 1,
                              color: Palette.textPrimary,
                              fontSize: 14,
                              minHeight: field.multiline ? 88 : 46,
                              opacity: field.readOnly ? 0.55 : 1,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              textAlignVertical: field.multiline ? 'top' : 'center',
                            }}
                            value={values[field.key] == null ? '' : String(values[field.key])}
                          />
                        </ThemedView>
                      )}
                    </ThemedView>
                  );
                })}
              </ScrollView>
            )}
            <BottomButton disabled={preparing} loading={loading} onPress={submit} title='Save changes' />
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        avoidKeyboard
        isVisible={Boolean(selectingField)}
        onBackButtonPress={() => setSelectingFieldKey(undefined)}
        onBackdropPress={() => setSelectingFieldKey(undefined)}
        style={{ justifyContent: 'flex-end', margin: 0 }}>
        <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ justifyContent: 'flex-end' }}>
          <ThemedView
            backgroundColor={Palette.surfaceBase}
            borderTopLeftRadius={'large'}
            borderTopRightRadius={'large'}
            maxHeight={height * 0.78}
            overflow='hidden'>
            <ThemedView
              alignItems='center'
              borderBottomColor={Palette.borderSubtle}
              borderBottomWidth={1}
              flexDirection='row'
              justifyContent='space-between'
              padding={'three'}>
              <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={18} numberOfLines={1}>
                Select {selectingField?.label.toLowerCase()}
              </ThemedText>
              <Pressable accessibilityRole='button' onPress={() => setSelectingFieldKey(undefined)}>
                <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={13}>
                  Close
                </ThemedText>
              </Pressable>
            </ThemedView>
            <ThemedView backgroundColor='transparent' flexShrink={1} gap={'three'} padding={'three'}>
              <TextInput
                autoCapitalize='none'
                autoCorrect={false}
                onChangeText={setSelectSearch}
                placeholder='Search options'
                placeholderTextColor={Palette.textTertiary}
                style={{
                  backgroundColor: Palette.surfaceMuted,
                  borderColor: Palette.borderSubtle,
                  borderRadius: 14,
                  borderWidth: 1,
                  color: Palette.textPrimary,
                  fontSize: 14,
                  minHeight: 46,
                  paddingHorizontal: 12,
                }}
                value={selectSearch}
              />
              <FlatList
                data={filteredSelectingOptions}
                keyboardShouldPersistTaps='handled'
                keyExtractor={option => option.value}
                ListEmptyComponent={
                  <ThemedView alignItems='center' backgroundColor='transparent' padding={'six'}>
                    <ThemedText color={Palette.textSecondary} fontSize={13}>
                      No options found
                    </ThemedText>
                  </ThemedView>
                }
                renderItem={({ item, index }) => {
                  const selected = sameOptionValue(item.value, selectingField ? values[selectingField.key] : undefined);
                  return (
                    <Pressable
                      accessibilityRole='button'
                      onPress={() => {
                        if (selectingField) updateValue(selectingField, item.value);
                        setSelectingFieldKey(undefined);
                      }}>
                      <ThemedView
                        alignItems='center'
                        backgroundColor={selected ? Palette.surfaceMuted : 'transparent'}
                        borderBottomColor={Palette.borderSubtle}
                        borderBottomWidth={index < filteredSelectingOptions.length - 1 ? 1 : 0}
                        flexDirection='row'
                        gap={'three'}
                        minHeight={50}
                        paddingHorizontal={'three'}>
                        <ThemedText color={Palette.textPrimary} flex={1} fontSize={14}>
                          {item.label}
                        </ThemedText>
                        {selected ? <Check color={Palette.accent} size={18} strokeWidth={2.5} /> : null}
                      </ThemedView>
                    </Pressable>
                  );
                }}
                showsVerticalScrollIndicator={false}
                style={{ flexShrink: 1 }}
              />
            </ThemedView>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function resolveOptions(field: ResourceField | undefined, values: Record<string, unknown>): ResourceOption[] {
  if (!field?.options) return [];
  return typeof field.options === 'function' ? field.options(values) : field.options;
}

function sameOptionValue(optionValue: string, value: unknown) {
  if (value === null || value === undefined) return false;
  const optionId = optionValue.split('/').filter(Boolean).pop();
  const valueId = String(value).split('/').filter(Boolean).pop();
  return optionId === valueId;
}
