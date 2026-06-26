import { ThemedText, ThemedView } from 'components/base';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mhs } from 'themes/scaling';
import { FontFamily, Palette } from 'themes';
import { useAdminProfile } from 'utils/auth/admin-profile';
import { useDrawerStore } from 'utils/drawer-store';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { easeGradient } from 'react-native-easing-gradient';
import { useSegments } from 'expo-router';
import { useScrollStore } from 'utils/scroll-store';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

const colors = {
  primary: '#24294A',
};

export function HomeHeader() {
  const { top } = useSafeAreaInsets();
  const adminProfile = useAdminProfile();
  const openDrawer = useDrawerStore(state => state.openDrawer);
  const segments = useSegments();
  const currentTab = segments[segments.length - 1] || 'technical';
  const isScrolled = useScrollStore(state => state.scrolledTabs[currentTab]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isScrolled ? 1 : 0, { duration: 100 }),
  }));

  const mask = easeGradient({
    colorStops: {
      0: { color: 'rgba(255,255,255,1)' },
      0.75: { color: 'rgba(255,255,255,1)' },
      1: { color: 'rgba(255,255,255,0)' },
    },
    extraColorStopsPerTransition: 16,
  });

  return (
    <ThemedView style={[styles.container, { paddingTop: top + 12 }]}>
      <Animated.View style={[backgroundStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: -40, zIndex: -1 }]}>
        <MaskedView
          maskElement={<LinearGradient colors={mask.colors as any} locations={mask.locations as any} style={StyleSheet.absoluteFill} />}
          style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
          <BlurView intensity={80} tint='light' style={StyleSheet.absoluteFill} />
        </MaskedView>
      </Animated.View>

      <Pressable
        accessibilityLabel='Open drawer'
        accessibilityRole='button'
        onPress={openDrawer}
        style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/128/149/149071.png' }}
          style={{ width: 40, height: 40, borderRadius: 22 }}
          contentFit="cover"
        />
        <ThemedView gap={2} minWidth={0}>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={16}>
            Welcome 👋
          </ThemedText>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={16} lineHeight={22}>
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
    flexDirection: 'row',
    gap: mhs(24),
    paddingBottom: mhs(4),
    paddingHorizontal: mhs(12),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
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
