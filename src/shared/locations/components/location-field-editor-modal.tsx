import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, TextInput, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';

import { BottomButton, Switch, ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import type { LocationEditorField, LocationEditorOption, LocationEditorValue } from '../location-edit-fields';

export function LocationFieldEditorModal({
  error,
  field,
  loadingOptions,
  onClose,
  onSave,
  onValueChange,
  options,
  saving,
  value,
}: {
  error?: string;
  field?: LocationEditorField;
  loadingOptions?: boolean;
  onClose: () => void;
  onSave: () => void;
  onValueChange: (value: LocationEditorValue) => void;
  options: LocationEditorOption[];
  saving?: boolean;
  value: LocationEditorValue;
}) {
  const [search, setSearch] = useState('');
  const { height } = useWindowDimensions();
  const filteredOptions = search.trim() ? options.filter(option => option.label.toLowerCase().includes(search.trim().toLowerCase())) : options;
  const isSelect = field?.input === 'select';
  const isBoolean = field?.input === 'boolean';
  const isMultiline = field?.input === 'multiline';
  const inputValue = value === null || value === undefined ? '' : String(value);

  return (
    <Modal
      avoidKeyboard
      isVisible={Boolean(field)}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      propagateSwipe
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
            padding={'three'}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={18}>
              Edit {field?.label.toLowerCase()}
            </ThemedText>
            <Pressable disabled={saving} onPress={onClose}>
              <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={13}>
                Close
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView backgroundColor='transparent' flexShrink={1} gap={12} padding={12} paddingBottom={112}>
            <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
              {isSelect
                ? 'Choose a value, then save your change.'
                : isBoolean
                  ? 'Update this setting, then save your change.'
                  : 'Update the value below, then save your change.'}
            </ThemedText>
            {isSelect ? (
              <>
                <TextInput
                  accessibilityLabel={`Search ${field?.label || 'options'}`}
                  autoCapitalize='none'
                  autoCorrect={false}
                  onChangeText={setSearch}
                  placeholder='Search'
                  placeholderTextColor={Palette.textTertiary}
                  style={{
                    backgroundColor: Palette.surfaceMuted,
                    borderColor: Palette.border,
                    borderCurve: 'continuous',
                    borderRadius: 14,
                    borderWidth: 1,
                    color: Palette.textPrimary,
                    fontFamily: FontFamily.regular,
                    fontSize: 15,
                    minHeight: 46,
                    paddingHorizontal: 14,
                  }}
                  value={search}
                />
                <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={14} flexShrink={1} maxHeight={360} overflow='hidden'>
                  {loadingOptions ? (
                    <ThemedView alignItems='center' backgroundColor='transparent' gap={8} padding={24}>
                      <ActivityIndicator color={Palette.accent} size='small' />
                      <ThemedText color={Palette.textSecondary} fontSize={13}>
                        Loading options...
                      </ThemedText>
                    </ThemedView>
                  ) : (
                    <FlatList
                      contentContainerStyle={{ flexGrow: 1 }}
                      data={filteredOptions}
                      keyboardShouldPersistTaps='handled'
                      keyExtractor={option => option.value}
                      ListEmptyComponent={
                        <ThemedView alignItems='center' backgroundColor='transparent' padding={24}>
                          <ThemedText color={Palette.textSecondary} fontSize={13}>
                            No options found
                          </ThemedText>
                        </ThemedView>
                      }
                      renderItem={({ item, index }) => {
                        const selected = String(value ?? '') === item.value;
                        return (
                          <Pressable accessibilityRole='button' onPress={() => onValueChange(item.value)}>
                            <ThemedView
                              alignItems='center'
                              backgroundColor={selected ? '#EAF8EF' : 'transparent'}
                              borderBottomColor={Palette.borderSubtle}
                              borderBottomWidth={index < filteredOptions.length - 1 ? 1 : 0}
                              flexDirection='row'
                              gap={12}
                              minHeight={48}
                              paddingHorizontal={14}>
                              <ThemedText color={Palette.textPrimary} flex={1} fontSize={14} lineHeight={19}>
                                {item.label}
                              </ThemedText>
                              {selected ? <Check color={Palette.accent} size={18} strokeWidth={2.4} /> : null}
                            </ThemedView>
                          </Pressable>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                    />
                  )}
                </ThemedView>
              </>
            ) : isBoolean ? (
              <ThemedView
                alignItems='center'
                backgroundColor={Palette.surfaceMuted}
                borderColor={Palette.border}
                borderCurve='continuous'
                borderRadius={14}
                borderWidth={1}
                flexDirection='row'
                justifyContent='space-between'
                minHeight={56}
                paddingHorizontal={14}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={15}>
                  {field?.label}
                </ThemedText>
                <Switch accessibilityLabel={field?.label} disabled={saving} onValueChange={onValueChange} value={value !== false} />
              </ThemedView>
            ) : (
              <TextInput
                accessibilityLabel={field ? `${field.label} input` : 'Location field input'}
                autoCapitalize={field?.input === 'number' ? 'none' : 'sentences'}
                autoCorrect={field?.input !== 'number'}
                autoFocus
                editable={!saving}
                keyboardType={field?.input === 'number' ? 'decimal-pad' : 'default'}
                multiline={isMultiline}
                onChangeText={onValueChange}
                onSubmitEditing={isMultiline ? undefined : onSave}
                placeholder={field?.input === 'date' ? 'YYYY-MM-DD' : `Enter ${field?.label.toLowerCase() || 'value'}`}
                placeholderTextColor={Palette.textTertiary}
                returnKeyType={isMultiline ? 'default' : 'done'}
                selectionColor={Palette.accent}
                style={{
                  backgroundColor: Palette.surfaceMuted,
                  borderColor: error ? Palette.danger : Palette.border,
                  borderCurve: 'continuous',
                  borderRadius: 14,
                  borderWidth: 1,
                  color: Palette.textPrimary,
                  fontFamily: FontFamily.regular,
                  fontSize: 16,
                  minHeight: isMultiline ? 112 : 50,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  textAlignVertical: isMultiline ? 'top' : 'center',
                }}
                value={inputValue}
              />
            )}

            {error ? (
              <ThemedText color={Palette.danger} fontSize={12} lineHeight={17} selectable>
                {error}
              </ThemedText>
            ) : null}
          </ThemedView>

          <BottomButton disabled={saving || (isSelect && !value)} loading={saving} onPress={onSave} title='Save changes' />
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
