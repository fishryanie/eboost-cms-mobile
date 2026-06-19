import { Redirect } from 'expo-router';

import AppTabs from 'components/app-tabs';
import { BiometricOptInPrompt } from 'utils/auth/components/biometric-opt-in-prompt';
import { View } from 'react-native';
import { useSessionToken } from 'utils/session/use-session-token';
import { AppScreen } from 'components/ui';

export default function TabsLayout() {
  const tokenQuery = useSessionToken();

  if (tokenQuery.isLoading) {
    return <AppScreen scroll={false} />;
  }

  if (!tokenQuery.data) {
    return <Redirect href='/login' />;
  }

  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <BiometricOptInPrompt />
    </View>
  );
}
