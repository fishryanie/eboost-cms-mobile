import { mhs } from 'themes/scaling';
import { PropsWithChildren, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { LogOut, Settings, UserCircle, UserCog, type LucideIcon } from 'lucide-react-native';
import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';
import { useAdminProfile } from 'utils/auth/admin-profile';
import { sessionKeys } from 'utils/session/use-session-token';
import { sessionStore } from 'utils/session/session-store';
import { useDrawerStore } from 'utils/drawer-store';
import { VERSION_APP } from 'constants/shared';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

const colors = {
  backgroundGreen: Palette.accent,
  contentBackplate: '#1D2733',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.68)',
  itemPressed: 'rgba(255,255,255,0.12)',
};

const drawerItems: {
  icon: LucideIcon;
  name: string;
  route?: '/drawer/profile' | '/drawer/settings' | '/drawer/staff-managements' | '/home' | '/marketing' | '/operation';
}[] = [
  { icon: UserCircle, name: 'My profile', route: '/drawer/profile' },
  { icon: UserCog, name: 'Staff management', route: '/drawer/staff-managements' },
  { icon: Settings, name: 'Setting', route: '/drawer/settings' },
  { icon: LogOut, name: 'Logout' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function closeDrawer() {
  useDrawerStore.getState().closeDrawer();
}

export function AppDrawer({ children }: PropsWithChildren) {
  const progress = useSharedValue(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const adminProfile = useAdminProfile();

  useEffect(() => {
    const unsubscribe = useDrawerStore.subscribe((state, previousState) => {
      if (state.isOpen === previousState.isOpen) {
        return;
      }

      progress.set(
        withTiming(state.isOpen ? 1 : 0, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        }),
      );
    });

    return unsubscribe;
  }, [progress]);

  useEffect(() => {
    useDrawerStore.getState().closeDrawer();
  }, [pathname]);

  const appStyle = useAnimatedStyle(() => {
    const drawerProgress = progress.get();
    const borderRadius = interpolate(drawerProgress, [0, 1], [0, 28], Extrapolation.CLAMP);
    const scale = interpolate(drawerProgress, [0, 1], [1, 0.78], Extrapolation.CLAMP);
    const translateX = interpolate(drawerProgress, [0, 1], [0, Math.min(width * 0.68, 270)], Extrapolation.CLAMP);

    return {
      backgroundColor: colors.contentBackplate,
      borderRadius,
      flex: 1,
      overflow: 'hidden',
      transform: [{ scale }, { translateX }],
    };
  });

  const drawerStyle = useAnimatedStyle(() => ({
    bottom: 0,
    backgroundColor: colors.backgroundGreen,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  }));

  const hazeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.35, 1], [0, 0.45, 1], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(progress.get(), [0, 1], [Math.min(width * 0.12, 48), 0], Extrapolation.CLAMP) },
      { scale: interpolate(progress.get(), [0, 1], [0.92, 1], Extrapolation.CLAMP) },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    display: progress.get() > 0.02 ? 'flex' : 'none',
  }));

  const drawerTextColor = colors.text;
  const drawerMutedColor = colors.textMuted;

  const handlePressItem = async (item: (typeof drawerItems)[number]) => {
    closeDrawer();

    if (item.name === 'Logout') {
      await sessionStore.clearTokens();
      queryClient.setQueryData(sessionKeys.token, null);
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      router.replace('/login');
      return;
    }

    if (item.route) {
      router.push(item.route as never);
    }
  };

  return (
    <ThemedView backgroundColor={colors.backgroundGreen} flex={1}>
      <AnimatedThemedView style={drawerStyle}>
        <AnimatedThemedView
          pointerEvents='none'
          style={[
            styles.hazeLayer,
            {
              bottom: Math.max(insets.bottom + 76, 86),
              left: width * 0.56,
              top: Math.max(insets.top + 76, 86),
              width: width * 0.52,
            },
            hazeStyle,
          ]}
        />
        <ThemedView style={[styles.drawerContent, { paddingTop: Math.max(insets.top + 96, 120) }]}>
          <ThemedView style={[styles.drawerHeader, { borderBottomColor: drawerMutedColor }]}>
            <ThemedView alignItems='center' backgroundColor={colors.text} borderRadius={'pill'} height={48} justifyContent='center' width={48}>
              <ThemedText color={colors.backgroundGreen} fontFamily={FontFamily.bold} fontSize={14}>
                {adminProfile.initials}
              </ThemedText>
            </ThemedView>
            <ThemedView flex={1} gap={'one'}>
              <ThemedText numberOfLines={2} style={[styles.drawerName, { color: drawerTextColor }]}>
                {adminProfile.name}
              </ThemedText>
              <ThemedText style={[styles.drawerRole, { color: drawerMutedColor }]}>{adminProfile.role}</ThemedText>
            </ThemedView>
          </ThemedView>

          {drawerItems.map(item => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.name}
                onPress={() => void handlePressItem(item)}
                style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}>
                <Icon color={colors.text} size={20} />
                <ThemedText style={[styles.drawerItemText, { color: colors.text }]}>{item.name}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        <ThemedText style={[styles.version, { bottom: insets.bottom + 12, color: drawerMutedColor }]}>
          v{Constants.expoConfig?.version ?? '1.0.0'}EAS{VERSION_APP}
        </ThemedText>
      </AnimatedThemedView>

      <AnimatedThemedView needsOffscreenAlphaCompositing renderToHardwareTextureAndroid style={appStyle}>
        {children}
        <AnimatedPressable accessibilityLabel='Close drawer' accessibilityRole='button' onPress={closeDrawer} style={[StyleSheet.absoluteFill, overlayStyle]} />
      </AnimatedThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    gap: mhs(4),
    maxWidth: 224,
    paddingHorizontal: mhs(24),
  },
  drawerHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    marginBottom: mhs(12),
    paddingBottom: mhs(24),
  },
  drawerItem: {
    alignItems: 'center',
    borderRadius: mhs(16),
    flexDirection: 'row',
    gap: mhs(12),
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(12),
  },
  drawerItemPressed: {
    backgroundColor: colors.itemPressed,
  },
  drawerItemText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  drawerName: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  drawerRole: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  hazeLayer: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 34,
    position: 'absolute',
  },
  version: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    position: 'absolute',
    right: 30,
  },
});
