import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { FontFamily, Palette } from 'themes';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface HeaderTitleProps {
  rightComponent?: ReactNode;
  showBorderBottom?: boolean;
  title: string;
  titleComponent?: ReactNode;
}

export function HeaderTitle({ rightComponent, showBorderBottom = true, title, titleComponent }: HeaderTitleProps) {
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

      {titleComponent ?? (
        <ThemedText color={Palette.textPrimary} flex fontFamily={FontFamily.medium} fontSize={18} lineHeight={24} numberOfLines={1}>
          {title}
        </ThemedText>
      )}

      {rightComponent ? (
        <ThemedView alignItems='center' backgroundColor='transparent' height={38} justifyContent='center' marginLeft={12} width={38}>
          {rightComponent}
        </ThemedView>
      ) : (
        <ThemedView backgroundColor='transparent' height={38} width={12} />
      )}
    </ThemedView>
  );
}
