import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { FontFamily, Palette } from 'themes';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface HeaderTitleProps {
  showBorderBottom?: boolean;
  title: string;
}

export function HeaderTitle({ showBorderBottom = true, title }: HeaderTitleProps) {
  const router = useRouter();

  return (
    <ThemedView
      rowCenter
      safePaddingTop
      backgroundColor={Palette.surfaceBase}
      borderBottomColor={showBorderBottom ? Palette.borderSubtle : 'transparent'}
      borderBottomWidth={showBorderBottom ? 1 : 0}
      paddingBottom={'three'}
      paddingHorizontal={12}>
      <Pressable hitSlop={8} onPress={() => router.back()} style={{ alignItems: 'center', height: 38, justifyContent: 'center', marginRight: 12, width: 38 }}>
        <ChevronLeft color={Palette.textPrimary} size={26} strokeWidth={2.4} />
      </Pressable>

      <ThemedText color={Palette.textPrimary} flex fontFamily={FontFamily.medium} fontSize={18} lineHeight={24} numberOfLines={1}>
        {title}
      </ThemedText>

      <ThemedView height={38} width={12} />
    </ThemedView>
  );
}
