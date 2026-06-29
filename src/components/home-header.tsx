import { useState } from 'react';
import { ScrollableSearch, ThemedText, ThemedView, type IScrollableSearchItem } from 'components/base';

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
import { type Href, useRouter, useSegments } from 'expo-router';
import { useScrollStore } from 'utils/scroll-store';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { tabs } from 'components/animated-tab-bar/constants';
import { Bell, QrCode, Search, type LucideIcon } from 'lucide-react-native';

const colors = {
  primary: '#24294A',
};

type HeaderSearchItem = IScrollableSearchItem & {
  readonly href: Href;
};

const sectionAccent = {
  marketing: '#D64A7F',
  operation: '#E46B2C',
  technical: Palette.accent,
} as const;

const headerSearchItems = getHeaderSearchItems();

export function HomeHeader() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
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

  const handleSelectSearchItem = (item: HeaderSearchItem) => {
    setSearchOpen(false);
    router.push(item.href);
  };

  return (
    <>
      <ThemedView style={[styles.container, { paddingTop: top + 12 }]}>
        <Animated.View style={[backgroundStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: -40, zIndex: -1 }]}>
          <MaskedView
            maskElement={<LinearGradient colors={mask.colors as any} locations={mask.locations as any} style={StyleSheet.absoluteFill} />}
            style={StyleSheet.absoluteFill}>
            <LinearGradient colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.92)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
            <BlurView blurMethod='dimezisBlurViewSdk31Plus' intensity={80} tint='light' style={StyleSheet.absoluteFill} />
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
            contentFit='cover'
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
          <HeaderIcon accessibilityLabel='Search' icon={Search} onPress={() => setSearchOpen(true)} />
          <HeaderIcon accessibilityLabel='Notifications' icon={Bell} />
          <HeaderIcon accessibilityLabel='Scan QR code' icon={QrCode} onPress={() => router.push('/scan-qr-code' as Href)} />
        </ThemedView>
      </ThemedView>

      {searchOpen ? (
        <ScrollableSearch.SearchPanel
          items={headerSearchItems}
          onClose={() => setSearchOpen(false)}
          onSelect={item => handleSelectSearchItem(item as HeaderSearchItem)}
          placeholder='Search menu, service, dashboard'
          title='Search CMS'
          visible={searchOpen}
        />
      ) : null}
    </>
  );
}

function HeaderIcon({ accessibilityLabel, icon: Icon, onPress }: { accessibilityLabel: string; icon: LucideIcon; onPress?: () => void }) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole='button' onPress={onPress} style={styles.iconButton}>
      <Icon color={colors.primary} size={22} />
    </Pressable>
  );
}

function getHeaderSearchItems(): HeaderSearchItem[] {
  return tabs.flatMap(tab =>
    tab.panels.map(panel => ({
      accentColor: sectionAccent[tab.key],
      description: panel.description,
      href:
        tab.key === 'technical'
          ? (`/technical/${panel.key}` as Href)
          : ({
              pathname: `/${tab.key}/[panel]`,
              params: { panel: panel.key },
            } as Href),
      id: `${tab.key}-${panel.key}`,
      section: tab.label,
      title: panel.title,
    })),
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
