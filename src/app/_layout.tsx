import { Inter_100Thin, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black, useFonts } from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastManager } from 'components/base';
import { AnimatedSplashOverlay } from 'components/animated-icon';
import { AppDrawer } from 'components/app-drawer';
import { AutoUpdateModal } from 'components/auto-update-modal';
import { AppQueryProvider } from 'utils/query-provider';
import { SessionExpiredModal } from 'utils/session/components/session-expired-modal';
import { bootstrapSession } from 'utils/session/bootstrap';
import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import { useNotifications } from 'hooks/use-notifications';
import { useAdminProfile } from 'utils/auth/admin-profile';
import { useEffect } from 'react';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  debug: __DEV__,
  environment: process.env.EXPO_PUBLIC_APP_ENV,
});

bootstrapSession();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function TabLayout() {
  useNotifications();
  useFonts({
    Inter_100Thin,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });
  const loadProfile = useAdminProfile(state => state.loadProfile);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
                  <Stack.Screen name='location/[id]/edit' />
                  <Stack.Screen
                    name='location/map-picker'
                    options={{
                      headerBackButtonDisplayMode: 'minimal',
                      headerShown: true,
                      headerShadowVisible: false,
                      headerTitle: 'Choose location',
                      headerTransparent: true,
                      headerTintColor: '#162033',
                    }}
                  />
                  <Stack.Screen name='station/[stationId]/index' />
                  <Stack.Screen name='marketing/package-list/index' />
                  <Stack.Screen name='scan-qr-code/index' />
                  <Stack.Screen name='scan-qr-code/result' />
                  <Stack.Screen name='technical/network-issues/index' />
                </Stack>
                <AutoUpdateModal />
                <SessionExpiredModal />
              </AppDrawer>
            </BottomSheetModalProvider>
          </AppQueryProvider>
          <ToastManager />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

export default Sentry.wrap(TabLayout);
