import { Search, XCircle } from 'lucide-react-native';
import { Pressable, TextInput, type TextInputProps } from 'react-native';

import { ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

export type TechnicalSearchFieldProps = {
  accessibilityLabel: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  clearAccessibilityLabel: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export function TechnicalSearchField({
  accessibilityLabel,
  autoCapitalize = 'none',
  clearAccessibilityLabel,
  onChange,
  placeholder,
  value,
}: TechnicalSearchFieldProps) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor={Palette.surfaceMuted}
      borderColor={Palette.borderSubtle}
      borderCurve='continuous'
      borderRadius={'pill'}
      borderWidth={1}
      flex={1}
      flexDirection='row'
      gap={'two'}
      height={40}
      minWidth={0}
      paddingHorizontal={'three'}>
      <Search color={Palette.textTertiary} size={18} strokeWidth={2} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        cursorColor={Palette.accent}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Palette.textTertiary}
        returnKeyType='search'
        selectionColor={Palette.accent}
        style={{ color: Palette.textPrimary, flex: 1, fontFamily: FontFamily.medium, fontSize: 14, height: '100%', paddingVertical: 0 }}
        value={value}
      />
      {value ? (
        <Pressable accessibilityLabel={clearAccessibilityLabel} accessibilityRole='button' hitSlop={10} onPress={() => onChange('')}>
          {({ pressed }) => <XCircle color={Palette.textTertiary} opacity={pressed ? 0.55 : 1} size={18} />}
        </Pressable>
      ) : null}
    </ThemedView>
  );
}
