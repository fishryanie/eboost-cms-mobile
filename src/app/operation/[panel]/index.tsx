import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { CmsPlaceholderPanelScreen } from 'components/cms-placeholder-panel-screen';
import { getMenuPanel, getMenuSection } from 'components/animated-tab-bar/constants';
import LocationsScreen from 'app/operation/[panel]/components/locations-screen';
import UsersScreen from 'app/operation/[panel]/components/users-screen';

export default function OperationPanelRoute() {
  const router = useRouter();
  const { panel: panelParam } = useLocalSearchParams<{ panel?: string | string[] }>();
  const section = getMenuSection('operation');
  const panel = getMenuPanel('operation', panelParam);

  if (!panel) {
    return <Redirect href='/(tabs)/operation' />;
  }

  if (panel.key === 'users') {
    return <UsersScreen onBack={() => router.back()} />;
  }

  if (panel.key === 'locations') {
    return <LocationsScreen onBack={() => router.back()} />;
  }

  return <CmsPlaceholderPanelScreen accentColor={section.accentColor} panel={panel} onBack={() => router.back()} />;
}
