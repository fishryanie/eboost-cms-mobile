import { useLocalSearchParams } from 'expo-router';

import { BlankTabScreen } from 'shared/ui/blank-tab-screen';

const screenNames: Record<string, string> = {
  administrators: 'Administrators',
  appearance: 'Appearance screen',
  'adjust-balance': 'Adjust balance',
  advertisements: 'Advertisements',
  'bonus-topup': 'Bonus Topup',
  brands: 'Brands & Models',
  contents: 'Contents',
  dashboard: 'Dashboard',
  help: 'Help & Feedback screen',
  marketing: 'Marketing',
  notifications: 'Notifications',
  'notification-message-templates': 'Notification Templates',
  'opening-hours': 'Opening Hours',
  operations: 'Operations',
  partnerships: 'Partnerships',
  'personal-details': 'Personal Details screen',
  'pick-lat-lng': 'Pick lat lng',
  'pop-up-ads': 'Popup Ads',
  powertrack: 'PowerTrack',
  promotions: 'Promotions',
  'referral-gift': 'Referral Gift',
  reservations: 'Reservations',
  subscriptions: 'Subscriptions',
  tariff: 'Tariff',
  technical: 'Technical',
  'transfer-funds': 'Transfer funds',
  transactions: 'Transactions',
};

export default function MenuScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const key = Array.isArray(slug) ? slug[0] : slug;

  return <BlankTabScreen name={screenNames[key || ''] || 'Menu screen'} />;
}
