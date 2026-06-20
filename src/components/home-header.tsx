import { ThemedText, ThemedView } from 'components/base';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mhs } from 'themes/scaling';

import { FontFamily, Palette } from 'themes';
import { adminProfile } from 'utils/auth/admin-profile';
import { useDrawerStore } from 'utils/drawer-store';

const colors = {
  primary: '#24294A',
};

export function HomeHeader() {
  const { top } = useSafeAreaInsets();
  const openDrawer = useDrawerStore(state => state.openDrawer);

  return (
    <ThemedView style={[styles.container, { paddingTop: top + 12 }]}>
      <Pressable
        accessibilityLabel='Open drawer'
        accessibilityRole='button'
        onPress={openDrawer}
        style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
        <ThemedView alignItems='center' backgroundColor={colors.primary} borderRadius={'pill'} height={44} justifyContent='center' width={44}>
          <ThemedText color={Palette.surfaceBase} fontFamily={FontFamily.bold} fontSize={14} lineHeight={20}>
            {adminProfile.initials}
          </ThemedText>
        </ThemedView>
        <ThemedView gap={'one'} minWidth={0}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={14}>
            Wellcome 👋
          </ThemedText>
          <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={16} lineHeight={22}>
            {adminProfile.name}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <ThemedView alignItems='center' flex={1} flexDirection='row' gap={'four'} justifyContent='flex-end'>
        <HeaderIcon accessibilityLabel='Search' name='magnifyingglass' />
        <HeaderIcon accessibilityLabel='Notifications' name='bell' />
        <HeaderIcon accessibilityLabel='Scan QR code' name='qrcode.viewfinder' />
      </ThemedView>
    </ThemedView>
  );
}

function HeaderIcon({ accessibilityLabel, name }: { accessibilityLabel: string; name: string }) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole='button' style={styles.iconButton}>
      <SymbolView name={name as never} resizeMode='scaleAspectFit' size={22} tintColor={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceBase,
    flexDirection: 'row',
    gap: mhs(24),
    marginBottom: mhs(24),
    paddingBottom: mhs(4),
    paddingHorizontal: mhs(12),
  },
  iconButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pressed: {
    opacity: 0.7,
  },
  profileButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mhs(12),
    maxWidth: '62%',
  },
});
