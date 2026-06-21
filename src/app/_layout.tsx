import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Inter_100Thin, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black, useFonts } from '@expo-google-fonts/inter';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from 'components/animated-icon';
import { AppDrawer } from 'components/app-drawer';
import { AutoUpdateModal } from 'components/auto-update-modal';
import { AppQueryProvider } from 'utils/query-provider';
import { bootstrapSession } from 'utils/session/bootstrap';

bootstrapSession();

export default function TabLayout() {
  useFonts({
    Inter_100Thin,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });
  const theme = DefaultTheme as ReactNavigation.Theme;

  return (
    <ThemeProvider value={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppQueryProvider>
            <BottomSheetModalProvider>
              <AppDrawer>
                <AnimatedSplashOverlay />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name='login/index' />
                  <Stack.Screen name='(tabs)' />
                  <Stack.Screen name='menu/[slug]/index' />
                  <Stack.Screen name='drawer/profile/index' />
                  <Stack.Screen name='drawer/staff-managements/index' />
                  <Stack.Screen name='drawer/settings/index' />
                  <Stack.Screen name='location/[id]/index' />
                  <Stack.Screen name='marketing/package-list/index' />
                  <Stack.Screen name='marketing/[panel]/index' />
                  <Stack.Screen name='operation/[panel]/index' />
                  <Stack.Screen name='technical/network-issues/index' />
                </Stack>
                <AutoUpdateModal />
              </AppDrawer>
            </BottomSheetModalProvider>
          </AppQueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
