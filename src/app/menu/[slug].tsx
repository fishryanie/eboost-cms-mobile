import { useLocalSearchParams } from 'expo-router';

import { BlankTabScreen } from 'shared/ui/blank-tab-screen';

const screenNames: Record<string, string> = {
  administrators: 'Administrators',
  appearance: 'Appearance screen',
  bookmarks: 'Bookmarks screen',
  business: 'Business screen',
  dashboard: 'Dashboard',
  downloads: 'Downloads screen',
  fiction: 'Fiction screen',
  help: 'Help & Feedback screen',
  history: 'History screen',
  library: 'Library screen',
  marketing: 'Marketing',
  operations: 'Operations',
  partnerships: 'Partnerships',
  'personal-details': 'Personal Details screen',
  powertrack: 'PowerTrack',
  sleep: 'Sleep timer screen',
  'self-help': 'Self-help screen',
  'steve-jobs': 'Steve Jobs screen',
  'atomic-habits': 'Atomic Habits screen',
  'deep-work': 'Deep Work screen',
  'pick-lat-lng': 'Pick lat lng',
  technical: 'Technical',
};

export default function MenuScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const key = Array.isArray(slug) ? slug[0] : slug;

  return <BlankTabScreen name={screenNames[key || ''] || 'Menu screen'} />;
}
