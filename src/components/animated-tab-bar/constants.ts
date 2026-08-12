import type { TabIconName } from 'components/tab-icon';
import { Easing } from 'react-native-reanimated';

export const DURATION = 600;
export const ICON_BOX = 50;
export const LABEL_PAD = 14;
export const LABEL_MARGIN = -6;
export const PANEL_SLIDE = 65;
export const TAB_HEIGHT = 48;
export const LABEL_CLIP_BUFFER = 2;
export const EASING = Easing.bezier(0.22, 1, 0.36, 1);
export const colors = {
  accent: 'rgba(0,0,0,0.06)',
  border: 'rgba(0,0,0,0.08)',
  foreground: '#0a0a0a',
  hover: 'rgba(0,0,0,0.04)',
  muted: '#71717a',
  surface: 'rgba(255,255,255,0.98)',
} as const;

export type CmsSectionKey = 'marketing' | 'operation';
type TabKey = CmsSectionKey | 'technical';

export type CmsMobilePage = {
  description: string;
  icon: TabIconName;
  key: string;
  title: string;
};

type TabConfig = {
  accentColor?: string;
  description?: string;
  icon: TabIconName;
  key: TabKey;
  label: string;
  name: string;
  pages: CmsMobilePage[];
  title?: string;
};

export type CmsMobileSection = TabConfig & {
  accentColor: string;
  description: string;
  key: CmsSectionKey;
  title: string;
};

export const tabs: TabConfig[] = [
  {
    icon: 'technical',
    key: 'technical',
    label: 'Technical',
    name: 'technical/index',
    pages: [
      { description: 'Charger inventory and status.', icon: 'technical', key: 'chargers', title: 'Chargers' },
      { description: 'Hourly meter readings.', icon: 'technical', key: 'meter-hourly', title: 'Meter Hourly' },
      { description: 'Charger status history.', icon: 'technical', key: 'status-logs', title: 'Status Logs' },
      { description: 'Energy reconciliation differences.', icon: 'technical', key: 'energy-differ', title: 'Energy Differ' },
    ],
  },
  {
    title: 'Marketing',
    accentColor: '#D64A7F',
    description: 'Promotions, bonus top-up, referrals, notifications, ads, and subscriptions.',
    icon: 'marketing',
    key: 'marketing',
    label: 'Marketing',
    name: 'marketing/index',
    pages: [
      { description: 'Campaign setup, discount rules, and promo performance.', icon: 'promotion', key: 'promotions', title: 'Promotions' },
      { description: 'Bonus credit packages and top-up incentives.', icon: 'gift', key: 'bonus-topup', title: 'Bonus Topup' },
      { description: 'Referral programs, rewards, and invite activity.', icon: 'gift', key: 'referral-gift', title: 'Referral Gift' },
      { description: 'Push campaigns, message templates, and send history.', icon: 'notification', key: 'notifications', title: 'Notifications' },
      {
        description: 'Create notification templates and scheduled notification jobs.',
        icon: 'content',
        key: 'notification-message-templates',
        title: 'Notification Templates',
      },
      { description: 'In-app advertising placements and campaign inventory.', icon: 'advertisement', key: 'advertisements', title: 'Advertisements' },
      { description: 'Large-format popup banners shown inside the app.', icon: 'advertisement', key: 'pop-up-ads', title: 'Popup Ads' },
      { description: 'Subscription plans, benefits, events, and renewal behavior.', icon: 'subscription', key: 'subscriptions', title: 'Subscriptions' },
    ],
  },
  {
    title: 'Operation',
    accentColor: '#E46B2C',
    description: 'Accounts, tariffs, locations, reservations, payments, transactions, and content.',
    icon: 'operation',
    key: 'operation',
    label: 'Operation',
    name: 'operation/index',
    pages: [
      { description: 'Customer accounts, wallet state, and account lifecycle.', icon: 'users', key: 'users', title: 'Users' },
      { description: 'Station records, address data, and operating information.', icon: 'location', key: 'locations', title: 'Locations' },
      { description: 'Charging sessions, wallet movements, and transaction logs.', icon: 'transfer', key: 'transactions', title: 'Transactions' },
      { description: 'Payment activity, methods, and reconciliation details.', icon: 'balance', key: 'payments', title: 'Payments' },
      { description: 'Charging prices, plan rules, and tariff assignments.', icon: 'tariff', key: 'tariff', title: 'Tariff' },
      { description: 'Opening schedule definitions for sites and stations.', icon: 'reservation', key: 'opening-hours', title: 'Opening Hours' },
      { description: 'Reservation windows, usage, and booking history.', icon: 'reservation', key: 'reservations', title: 'Reservations' },
      { description: 'CMS banners, pages, and app-facing content.', icon: 'content', key: 'contents', title: 'Contents' },
      { description: 'Vehicle brands, models, and compatibility records.', icon: 'vehicle', key: 'brands', title: 'Brands & Models' },
    ],
  },
];

export function getMenuSection(key: CmsSectionKey) {
  return tabs.find((tab): tab is CmsMobileSection => tab.key === key)!;
}
