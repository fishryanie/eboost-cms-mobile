import { administratorsScreen } from 'features/administrator-access/model';
import type { AccessMethod, PermissionMap } from 'features/administrator-access/types';

export type CurrentAdminAccess = { adminId: string; isDeveloper: boolean; permissions: PermissionMap };
export type ScreenAccessRequirement = { screens: string[]; methods: AccessMethod[] };

export function hasScreenAccess(access: CurrentAdminAccess | undefined, screen: string, methods: AccessMethod[] = ['READ']) {
  if (!access || !screen) return false;
  // The web CMS's developer exception applies only to Administrators.
  if (screen === administratorsScreen && access.isDeveloper) return true;
  return methods.every(method => access.permissions[screen]?.includes(method));
}

export function meetsScreenRequirement(access: CurrentAdminAccess | undefined, requirement: ScreenAccessRequirement) {
  return requirement.screens.some(screen => hasScreenAccess(access, screen, requirement.methods));
}

export const cmsSectionScreens: Record<string, Record<string, string>> = {
  tariff: { profiles: '/admin/operations/tariff/port' },
  'opening-hours': { profiles: '/admin/operations/opening-hours' },
  reservations: { histories: '/admin/operations/reservations/histories', policies: '/admin/operations/reservations/policies' },
  payments: { momo: '/admin/operations/payments/momo', alepay: '/admin/operations/payments/alepay' },
  transactions: { car: '/admin/operations/transactions', bike: '/admin/operations/transactions' },
  contents: {
    faqs: '/admin/marketing/contents/faqs',
    'privacy-policy': '/admin/marketing/contents/policy',
    'terms-conditions': '/admin/marketing/contents/terms-conditions',
  },
  brands: { brands: '/admin/operations/brands' },
  promotions: {
    charging: '/admin/marketing/promotions/charge',
    wallet: '/admin/marketing/promotions/money',
    'code-usage': '/admin/marketing/promotions/charge-used',
    'money-usage': '/admin/marketing/promotions/money-used',
  },
  'bonus-topup': { campaigns: '/admin/marketing/bonus-topup/events', usage: '/admin/marketing/bonus-topup/used' },
  'referral-gift': { gifts: '/admin/marketing/referral-gift' },
  'notification-message-templates': { templates: '/admin/marketing/notification-message-templates' },
  advertisements: { advertisements: '/admin/marketing/advertisements' },
  'pop-up-ads': { popups: '/admin/marketing/pop-up-ads' },
  subscriptions: {
    packages: '/admin/marketing/subscriptions/packages',
    events: '/admin/marketing/subscriptions/events',
    histories: '/admin/marketing/subscriptions/histories',
  },
};

export function getCmsSectionScreen(pageKey: string, sectionKey: string) {
  return cmsSectionScreens[pageKey]?.[sectionKey] || '';
}

const users = '/admin/operations/accounts/users';
const locations = '/admin/operations/locations';
const chargers = '/admin/technical/chargers';
export const technicalServiceRequirements: Record<string, ScreenAccessRequirement> = {
  'trigger-charger': { screens: [chargers], methods: ['READ', 'UPDATE'] },
  reset: { screens: [chargers], methods: ['READ', 'UPDATE'] },
  'unlock-charger': { screens: [chargers], methods: ['READ', 'UPDATE'] },
  'replace-meter': { screens: [chargers], methods: ['READ', 'UPDATE'] },
  'replace-charger': { screens: [chargers], methods: ['READ', 'UPDATE'] },
  'uninstall-charger': { screens: [chargers], methods: ['READ', 'UPDATE'] },
  'add-charger': { screens: [chargers], methods: ['READ', 'CREATE'] },
  'setup-location': { screens: [locations], methods: ['READ', 'CREATE'] },
};

const routeScreens: Record<string, string> = {
  'drawer/staff-managements': administratorsScreen,
  'operation/users': users,
  'user/[id]': users,
  'operation/locations': locations,
  'location/[id]': locations,
  'station/[stationId]': locations,
  'technical/chargers': chargers,
  'technical/status-logs': '/admin/technical/chargers-status-logs',
  'technical/meter-hourly': '/admin/technical/meter-hourly',
  'technical/energy-differ': '/admin/technical/differ',
  'technical/peak-usage-hours': '/admin/dashboard',
  'marketing/package-list': '/admin/marketing/subscriptions/packages',
  'marketing/at-risk-users': '/admin/operations/accounts/at-risk-users',
  'marketing/notifications': '/admin/marketing/notifications',
  'marketing/notice-drafts': '/admin/marketing/notification-message-templates',
};

const actionScreens: Record<string, { screen: string; method: AccessMethod }> = {
  'location/[id]/edit': { screen: locations, method: 'UPDATE' },
  'location/map-picker': { screen: locations, method: 'UPDATE' },
  'user/[id]/settings': { screen: users, method: 'UPDATE' },
  'operation/adjust-balance': { screen: users, method: 'UPDATE' },
  'operation/transfer-money': { screen: users, method: 'UPDATE' },
  'operation/modify-ranking': { screen: users, method: 'UPDATE' },
  'operation/change-email': { screen: users, method: 'UPDATE' },
  'operation/change-password': { screen: users, method: 'UPDATE' },
  'marketing/create-promo-code': { screen: '/admin/marketing/promotions/charge', method: 'CREATE' },
  'marketing/create-bonus-campaign': { screen: '/admin/marketing/bonus-topup/events', method: 'CREATE' },
  'marketing/push-notice': { screen: '/admin/marketing/notifications', method: 'CREATE' },
  'marketing/schedule-notice': { screen: '/admin/marketing/notifications', method: 'CREATE' },
  'marketing/extend-package': { screen: '/admin/marketing/subscriptions/packages', method: 'UPDATE' },
  'marketing/suspend-package': { screen: '/admin/marketing/subscriptions/packages', method: 'UPDATE' },
};

export function getRouteAccessRequirement(routeName: string, params: Record<string, unknown> = {}): ScreenAccessRequirement | null {
  const route = routeName.replace(/^\(tabs\)\//, '').replace(/\/index$/, '');
  // These routes contain navigation or personal session data, rather than CMS resources.
  if (['index', 'login', '(tabs)', 'drawer/profile', 'drawer/settings', 'notifications', 'scan-qr-code'].includes(route)) return null;
  if (['technical', 'operation', 'marketing'].includes(route)) return null;
  if (route === 'technical/network-issues')
    return { screens: ['/admin/dashboard', '/admin/realtime/outlets', '/admin/realtime/connectors'], methods: ['READ'] };
  if (route === 'technical/ongoing-sessions') return { screens: ['/admin/realtime/outlets', '/admin/realtime/connectors'], methods: ['READ'] };
  if (route === 'drawer/staff-managements/[id]/access') return { screens: [administratorsScreen], methods: ['READ', 'UPDATE'] };
  const action = actionScreens[route];
  if (action) return { screens: [action.screen], methods: ['READ', action.method] };
  if (route.startsWith('technical/') && technicalServiceRequirements[route.slice('technical/'.length)])
    return technicalServiceRequirements[route.slice('technical/'.length)];
  if (routeScreens[route]) return { screens: [routeScreens[route]], methods: ['READ'] };
  const parts = route.split('/');
  const pageKey = parts[1];
  if (['operation', 'marketing'].includes(parts[0]) && cmsSectionScreens[pageKey]) {
    if (parts[2] === 'editor') {
      const section = typeof params.section === 'string' ? params.section : '';
      return { screens: [getCmsSectionScreen(pageKey, section)], methods: ['READ', params.mode === 'update' ? 'UPDATE' : 'CREATE'] };
    }
    if (parts.length === 2) return { screens: Object.values(cmsSectionScreens[pageKey]), methods: ['READ'] };
  }
  if (route === 'menu/[slug]') {
    const slug = typeof params.slug === 'string' ? params.slug : '';
    if (['appearance', 'help', 'personal-details'].includes(slug)) return null;
    const screens: Record<string, string> = {
      administrators: administratorsScreen,
      dashboard: '/admin/dashboard',
      powertrack: '/admin/realtime',
      partnerships: '/admin/partnerships',
      marketing: '/admin/marketing',
      operations: '/admin/operations',
      technical: '/admin/technical',
    };
    if (screens[slug]) return { screens: [screens[slug]], methods: ['READ'] };
    return getRouteAccessRequirement(
      `${slug === 'contents' || ['promotions', 'bonus-topup', 'referral-gift', 'notifications', 'notification-message-templates', 'advertisements', 'pop-up-ads', 'subscriptions'].includes(slug) ? 'marketing' : 'operation'}/${slug}`,
    );
  }
  // New/unmapped screens must opt in explicitly instead of silently bypassing access.
  return { screens: [], methods: ['READ'] };
}
