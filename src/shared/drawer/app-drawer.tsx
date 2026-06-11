import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { adminProfile } from 'features/auth/admin-profile';
import { sessionKeys } from 'shared/session/use-session-token';
import { sessionStore } from 'shared/session/session-store';
import { useDrawerStore } from 'shared/drawer/drawer-store';

const colors = {
  backgroundGreen: Palette.accent,
  contentBackplate: '#1D2733',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.68)',
  itemPressed: 'rgba(255,255,255,0.12)',
};

const drawerItems: {
  icon: SymbolViewProps['name'];
  name: string;
  route?: '/drawer/profile' | '/drawer/settings' | '/history' | '/home' | '/users';
}[] = [
  { icon: 'house.fill', name: 'Home', route: '/home' },
  { icon: 'person.2.fill', name: 'Users', route: '/users' },
  { icon: 'clock.arrow.circlepath', name: 'Activity', route: '/history' },
  { icon: 'person.crop.circle', name: 'My Profile', route: '/drawer/profile' },
  { icon: 'gearshape.fill', name: 'Settings', route: '/drawer/settings' },
  { icon: 'rectangle.portrait.and.arrow.right', name: 'Logout' },
];

type ThemeOption = 'dark' | 'light' | 'system';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppDrawer({ children }: PropsWithChildren) {
  const progress = useSharedValue(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [theme, setTheme] = useState<ThemeOption>('system');
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = useDrawerStore.subscribe((state, previousState) => {
      if (state.isOpen === previousState.isOpen) {
        return;
      }

      progress.value = withTiming(state.isOpen ? 1 : 0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    });

    return unsubscribe;
  }, [progress]);

  const appStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(progress.value, [0, 1], [0, 28], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [0, 1], [1, 0.78], Extrapolation.CLAMP);
    const translateX = interpolate(progress.value, [0, 1], [0, Math.min(width * 0.68, 270)], Extrapolation.CLAMP);

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
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.45, 1], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [Math.min(width * 0.12, 48), 0], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP) },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    display: progress.value > 0.02 ? 'flex' : 'none',
  }));

  const drawerTextColor = colors.text;
  const drawerMutedColor = colors.textMuted;

  const handleClose = () => {
    useDrawerStore.getState().closeDrawer();
  };

  const handlePressItem = async (item: (typeof drawerItems)[number]) => {
    handleClose();

    if (item.name === 'Logout') {
      await sessionStore.clearToken();
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
      <Animated.View style={drawerStyle}>
        <Animated.View
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
            <ThemedView alignItems='center' backgroundColor={colors.text} borderRadius={Radius.pill} height={48} justifyContent='center' width={48}>
              <ThemedText color={colors.backgroundGreen} fontFamily={FontFamily.bold} fontSize={14}>
                {adminProfile.initials}
              </ThemedText>
            </ThemedView>
            <ThemedView flex={1} gap={Spacing.one}>
              <ThemedText numberOfLines={2} style={[styles.drawerName, { color: drawerTextColor }]}>
                {adminProfile.name}
              </ThemedText>
              <ThemedText style={[styles.drawerRole, { color: drawerMutedColor }]}>{adminProfile.role}</ThemedText>
            </ThemedView>
          </ThemedView>

          {drawerItems.map(item => (
            <Pressable
              key={item.name}
              onPress={() => void handlePressItem(item)}
              style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}>
              <SymbolView name={item.icon} resizeMode='scaleAspectFit' size={20} tintColor={colors.text} />
              <ThemedText style={[styles.drawerItemText, { color: colors.text }]}>{item.name}</ThemedText>
            </Pressable>
          ))}

          <ThemedView flexDirection='row' flexWrap='wrap' gap={Spacing.two} marginTop={Spacing.four}>
            {(['system', 'light', 'dark'] as const).map(option => {
              const selected = theme === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setTheme(option)}
                  style={[
                    styles.themePill,
                    {
                      backgroundColor: selected ? drawerTextColor : 'transparent',
                      borderColor: drawerMutedColor,
                    },
                  ]}>
                  <ThemedText
                    style={[
                      styles.themeText,
                      {
                        color: selected ? colors.backgroundGreen : drawerTextColor,
                      },
                    ]}>
                    {option}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        </ThemedView>

        <ThemedText style={[styles.version, { bottom: insets.bottom + 12, color: drawerMutedColor }]}>v1.0.0</ThemedText>
      </Animated.View>

      <Animated.View needsOffscreenAlphaCompositing renderToHardwareTextureAndroid style={appStyle}>
        {children}
        <AnimatedPressable accessibilityLabel='Close drawer' accessibilityRole='button' onPress={handleClose} style={[StyleSheet.absoluteFill, overlayStyle]} />
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    gap: Spacing.one,
    maxWidth: 224,
    paddingHorizontal: Spacing.five,
  },
  drawerHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
    paddingBottom: Spacing.five,
  },
  drawerItem: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
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
  themePill: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  themeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  version: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    position: 'absolute',
    right: 30,
  },
});
