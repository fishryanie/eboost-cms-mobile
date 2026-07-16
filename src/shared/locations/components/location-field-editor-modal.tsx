import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Switch, TextInput } from 'react-native';
import Modal from 'react-native-modal';

import { ThemedText, ThemedView } from 'components/base';
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
  const filteredOptions = search.trim() ? options.filter(option => option.label.toLowerCase().includes(search.trim().toLowerCase())) : options;
  const isSelect = field?.input === 'select';
  const isBoolean = field?.input === 'boolean';
  const isMultiline = field?.input === 'multiline';
  const inputValue = value === null || value === undefined ? '' : String(value);

  return (
    <Modal
      avoidKeyboard
      backdropColor='#000000'
      backdropOpacity={0.28}
      isVisible={Boolean(field)}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      propagateSwipe
      style={{ justifyContent: 'center', margin: 20 }}>
      <ThemedView
        alignSelf='center'
        backgroundColor={Palette.surfaceBase}
        borderCurve='continuous'
        borderRadius={22}
        boxShadow='0 14px 36px rgba(0, 0, 0, 0.18)'
        maxHeight='88%'
        maxWidth={440}
        overflow='hidden'
        width='100%'>
        <ThemedView backgroundColor='transparent' gap={6} paddingHorizontal={20} paddingTop={20} paddingBottom={17}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={19} lineHeight={24}>
            Edit {field?.label.toLowerCase()}
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
            {isSelect ? 'Choose a value, then tap Save.' : isBoolean ? 'Update this setting, then tap Save.' : 'Update the value below, then tap Save.'}
          </ThemedText>
        </ThemedView>

        <ThemedView backgroundColor='transparent' gap={10} paddingHorizontal={20} paddingBottom={22}>
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
              <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={14} maxHeight={320} overflow='hidden'>
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
              <Switch disabled={saving} onValueChange={onValueChange} value={value !== false} />
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

        <ThemedView backgroundColor={Palette.borderSubtle} height={1} />
        <ThemedView backgroundColor='transparent' flexDirection='row'>
          <Pressable accessibilityRole='button' disabled={saving} onPress={onClose} style={{ flex: 1 }}>
            <ThemedView alignItems='center' backgroundColor='transparent' justifyContent='center' minHeight={54} opacity={saving ? 0.5 : 1}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={16}>
                Cancel
              </ThemedText>
            </ThemedView>
          </Pressable>
          <ThemedView backgroundColor={Palette.borderSubtle} width={1} />
          <Pressable accessibilityRole='button' disabled={saving || (isSelect && !value)} onPress={onSave} style={{ flex: 1 }}>
            <ThemedView
              alignItems='center'
              backgroundColor='transparent'
              justifyContent='center'
              minHeight={54}
              opacity={saving || (isSelect && !value) ? 0.5 : 1}>
              {saving ? (
                <ActivityIndicator color={Palette.accent} size='small' />
              ) : (
                <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={16}>
                  Save
                </ThemedText>
              )}
            </ThemedView>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}
