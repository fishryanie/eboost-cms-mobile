import { useLocalSearchParams } from 'expo-router';

import { BlankTabScreen } from 'shared/ui/blank-tab-screen';

const screenNames: Record<string, string> = {
  administrators: 'Administrators',
  appearance: 'Appearance screen',
  'adjust-balance': 'Adjust balance',
  dashboard: 'Dashboard',
  help: 'Help & Feedback screen',
  history: 'History screen',
  marketing: 'Marketing',
  operations: 'Operations',
  partnerships: 'Partnerships',
  'personal-details': 'Personal Details screen',
  'pick-lat-lng': 'Pick lat lng',
  powertrack: 'PowerTrack',
  technical: 'Technical',
  'transfer-funds': 'Transfer funds',
};

export default function MenuScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const key = Array.isArray(slug) ? slug[0] : slug;

  return <BlankTabScreen name={screenNames[key || ''] || 'Menu screen'} />;
}
