import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { CmsPlaceholderPanelScreen } from 'features/cms-menu/cms-section-screen';
import { getCmsMobilePanel, getCmsMobileSection } from 'features/cms-menu/mobile-cms-menu';
import LocationsScreen from 'features/operations/locations-screen';
import UsersScreen from 'features/operations/users-screen';

export default function OperationPanelRoute() {
  const router = useRouter();
  const { panel: panelParam } = useLocalSearchParams<{ panel?: string | string[] }>();
  const section = getCmsMobileSection('operation');
  const panel = getCmsMobilePanel('operation', panelParam);

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
