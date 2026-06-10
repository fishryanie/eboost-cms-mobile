import { Redirect } from 'expo-router';

import AppTabs from 'components/app-tabs';
import { useSessionToken } from 'shared/session/use-session-token';
import { AppScreen } from 'shared/ui';

export default function TabsLayout() {
  const tokenQuery = useSessionToken();

  if (tokenQuery.isLoading) {
    return <AppScreen scroll={false} />;
  }

  if (!tokenQuery.data) {
    return <Redirect href='/login' />;
  }

  return <AppTabs />;
}
