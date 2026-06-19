import type { TabIconName } from 'components/tab-icon';

export type CmsSectionKey = 'marketing' | 'operation';

export type CmsMobilePanel = {
  description: string;
  icon: TabIconName;
  key: string;
  title: string;
};

export type CmsMobileSection = {
  accentColor: string;
  description: string;
  icon: TabIconName;
  key: CmsSectionKey;
  panels: CmsMobilePanel[];
  title: string;
};

export const cmsMobileSections: Record<CmsSectionKey, CmsMobileSection> = {
  operation: {
    accentColor: '#E46B2C',
    description: 'Accounts, tariffs, locations, reservations, payments, transactions, and content.',
    icon: 'operation',
    key: 'operation',
    panels: [
      {
        description: 'Customer accounts, wallet state, and account lifecycle.',
        icon: 'users',
        key: 'users',
        title: 'Users',
      },
      {
        description: 'Charging prices, plan rules, and tariff assignments.',
        icon: 'tariff',
        key: 'tariff',
        title: 'Tariff',
      },
      {
        description: 'Station records, address data, and operating information.',
        icon: 'location',
        key: 'locations',
        title: 'Locations',
      },
      {
        description: 'Reservation windows, usage, and booking history.',
        icon: 'reservation',
        key: 'reservations',
        title: 'Reservations',
      },
      {
        description: 'Payment activity, methods, and reconciliation details.',
        icon: 'balance',
        key: 'payments',
        title: 'Payments',
      },
      {
        description: 'Charging sessions, wallet movements, and transaction logs.',
        icon: 'transfer',
        key: 'transactions',
        title: 'Transactions',
      },
      {
        description: 'CMS banners, pages, and app-facing content.',
        icon: 'content',
        key: 'contents',
        title: 'Contents',
      },
      {
        description: 'Vehicle brands, models, and compatibility records.',
        icon: 'vehicle',
        key: 'brands',
        title: 'Brands & Models',
      },
      {
        description: 'Opening schedule definitions for sites and stations.',
        icon: 'reservation',
        key: 'opening-hours',
        title: 'Opening Hours',
      },
    ],
    title: 'Operation',
  },
  marketing: {
    accentColor: '#D64A7F',
    description: 'Promotions, bonus top-up, referrals, notifications, ads, and subscriptions.',
    icon: 'marketing',
    key: 'marketing',
    panels: [
      {
        description: 'Campaign setup, discount rules, and promo performance.',
        icon: 'promotion',
        key: 'promotions',
        title: 'Promotions',
      },
      {
        description: 'Bonus credit packages and top-up incentives.',
        icon: 'gift',
        key: 'bonus-topup',
        title: 'Bonus Topup',
      },
      {
        description: 'Referral programs, rewards, and invite activity.',
        icon: 'gift',
        key: 'referral-gift',
        title: 'Referral Gift',
      },
      {
        description: 'Push campaigns, message templates, and send history.',
        icon: 'notification',
        key: 'notifications',
        title: 'Notifications',
      },
      {
        description: 'Create notification templates and scheduled notification jobs.',
        icon: 'content',
        key: 'notification-message-templates',
        title: 'Notification Templates',
      },
      {
        description: 'In-app advertising placements and campaign inventory.',
        icon: 'advertisement',
        key: 'advertisements',
        title: 'Advertisements',
      },
      {
        description: 'Large-format popup banners shown inside the app.',
        icon: 'advertisement',
        key: 'pop-up-ads',
        title: 'Popup Ads',
      },
      {
        description: 'Subscription plans, benefits, events, and renewal behavior.',
        icon: 'subscription',
        key: 'subscriptions',
        title: 'Subscriptions',
      },
    ],
    title: 'Marketing',
  },
};

export function getCmsMobileSection(key: CmsSectionKey) {
  return cmsMobileSections[key];
}

export function getCmsMobilePanel(sectionKey: CmsSectionKey, panelKey?: string | string[]) {
  const key = Array.isArray(panelKey) ? panelKey[0] : panelKey;

  return cmsMobileSections[sectionKey].panels.find(panel => panel.key === key);
}
