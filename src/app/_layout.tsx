import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from 'components/animated-icon';
import { AppDrawer } from 'shared/drawer/app-drawer';
import { AppQueryProvider } from 'shared/query/query-provider';
import { bootstrapSession } from 'shared/session/bootstrap';

bootstrapSession();

export default function TabLayout() {
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
                  <Stack.Screen name='login' />
                  <Stack.Screen name='(tabs)' />
                  <Stack.Screen name='menu/[slug]' />
                  <Stack.Screen name='drawer/profile' />
                  <Stack.Screen name='drawer/settings' />
                  <Stack.Screen name='location/[id]' />
                  <Stack.Screen name='marketing/[panel]' />
                  <Stack.Screen name='operation/[panel]' />
                  <Stack.Screen name='technical/network-issues' />
                  <Stack.Screen name='technical/[panel]' />
                </Stack>
              </AppDrawer>
            </BottomSheetModalProvider>
          </AppQueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
