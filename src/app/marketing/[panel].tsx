import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { CmsPlaceholderPanelScreen } from 'features/cms-menu/cms-section-screen';
import { getCmsMobilePanel, getCmsMobileSection } from 'features/cms-menu/mobile-cms-menu';
import MarketingScreen from 'features/marketing/marketing-screen';

export default function MarketingPanelRoute() {
  const router = useRouter();
  const { panel: panelParam } = useLocalSearchParams<{ panel?: string | string[] }>();
  const section = getCmsMobileSection('marketing');
  const panel = getCmsMobilePanel('marketing', panelParam);

  if (!panel) {
    return <Redirect href='/(tabs)/marketing' />;
  }

  if (panel.key === 'subscriptions') {
    return <MarketingScreen focusStats onBack={() => router.back()} />;
  }

  return <CmsPlaceholderPanelScreen accentColor={section.accentColor} panel={panel} onBack={() => router.back()} />;
}
