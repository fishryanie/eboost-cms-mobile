import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { TechnicalPanelScreen, technicalDetailPanels } from 'features/technical/technical-screen';
import type { TechnicalPanel } from 'features/technical/types';

function getTechnicalPanel(value?: string | string[]): TechnicalPanel | undefined {
  const panel = Array.isArray(value) ? value[0] : value;
  return technicalDetailPanels.includes(panel as TechnicalPanel) ? (panel as TechnicalPanel) : undefined;
}

export default function TechnicalPanelRoute() {
  const router = useRouter();
  const { panel: panelParam } = useLocalSearchParams<{ panel?: string | string[] }>();
  const panel = getTechnicalPanel(panelParam);

  if (!panel) {
    return <Redirect href='/(tabs)/technical' />;
  }

  return <TechnicalPanelScreen panel={panel} onBack={() => router.back()} />;
}
