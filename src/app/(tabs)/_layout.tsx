import { Redirect } from 'expo-router';

import { AppTabs } from 'components/animated-tab-bar';
import { BiometricOptInPrompt } from 'utils/auth/components/biometric-opt-in-prompt';
import { useSessionToken } from 'utils/session/use-session-token';
import { HomeHeader } from 'components/home-header';
import { AppScreen } from 'components/ui';
import { ThemedView } from 'components/base';

export default function TabsLayout() {
  const tokenQuery = useSessionToken();

  if (tokenQuery.isLoading) {
    return <AppScreen scroll={false} />;
  }

  if (!tokenQuery.data) {
    return <Redirect href='/login' />;
  }

  return (
    <ThemedView backgroundColor='#FFFFFF' flex={1}>
      <HomeHeader />
      <ThemedView flex={1}>
        <AppTabs />
      </ThemedView>
      <BiometricOptInPrompt />
    </ThemedView>
  );
}
