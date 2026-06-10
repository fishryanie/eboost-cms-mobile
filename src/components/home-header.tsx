import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';
import { adminProfile } from 'features/auth/admin-profile';
import { useDrawerStore } from 'shared/drawer/drawer-store';

const colors = {
  primary: '#24294A',
};

export function HomeHeader() {
  const { top } = useSafeAreaInsets();
  const openDrawer = useDrawerStore(state => state.openDrawer);

  return (
    <View style={[styles.container, { paddingTop: top + 12 }]}>
      <Pressable
        accessibilityLabel='Open drawer'
        accessibilityRole='button'
        onPress={openDrawer}
        style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{adminProfile.initials}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.welcome}>Wellcome 👋</Text>
          <Text numberOfLines={1} style={styles.name}>
            {adminProfile.name}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <HeaderIcon accessibilityLabel='Search' name='magnifyingglass' />
        <HeaderIcon accessibilityLabel='Notifications' name='bell' />
        <HeaderIcon accessibilityLabel='Scan QR code' name='qrcode.viewfinder' />
      </View>
    </View>
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
  actions: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.four,
    justifyContent: 'flex-end',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: Palette.surfaceBase,
    fontFamily: FontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceBase,
    flexDirection: 'row',
    gap: Spacing.five,
    marginBottom: Spacing.five,
    paddingBottom: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  iconButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  name: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.7,
  },
  profileButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    maxWidth: '62%',
  },
  profileText: {
    gap: Spacing.one,
    minWidth: 0,
  },
  welcome: {
    color: Palette.textTertiary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
});
