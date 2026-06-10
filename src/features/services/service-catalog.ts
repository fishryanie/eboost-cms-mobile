export type CmsServiceGroup = {
  accentColor: string;
  children: CmsServiceItem[];
  description: string;
  iconUrl: string;
  name: string;
  routeCount?: number;
  slug: string;
};

export type CmsServiceItem = {
  description: string;
  name: string;
  slug: string;
};

export const cmsServiceGroups: CmsServiceGroup[] = [
  {
    accentColor: '#2F6FED',
    children: [
      {
        description: 'Executive metrics, charging demand, and revenue snapshots.',
        name: 'Overview',
        slug: 'dashboard-overview',
      },
      {
        description: 'Connector utilization, session volume, and station performance.',
        name: 'Performance Metrics',
        slug: 'dashboard-performance-metrics',
      },
      {
        description: 'Customer activity, sign-ins, and recent account behavior.',
        name: 'User Activity',
        slug: 'dashboard-user-activity',
      },
      {
        description: 'Charging sessions, energy usage, and demand trends.',
        name: 'Charging Trends',
        slug: 'dashboard-charging-trends',
      },
    ],
    description: 'Overview, performance metrics, user activity, and charging trends.',
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/18536/18536031.png',
    name: 'Dashboard',
    routeCount: 4,
    slug: 'dashboard',
  },
  {
    accentColor: '#11A37F',
    children: [
      {
        description: 'Live connector availability and charger health by station.',
        name: 'Connector Monitoring',
        slug: 'powertrack-connectors',
      },
      {
        description: 'Outlet status, power delivery, and active charging state.',
        name: 'Outlet Monitoring',
        slug: 'powertrack-outlets',
      },
    ],
    description: 'Realtime connector and outlet monitoring across active charging stations.',
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/7822/7822741.png',
    name: 'PowerTrack',
    routeCount: 2,
    slug: 'powertrack',
  },
  {
    accentColor: '#E46B2C',
    children: [
      {
        description: 'Customer accounts, wallet state, and account lifecycle.',
        name: 'Accounts',
        slug: 'operations-accounts',
      },
      {
        description: 'Charging prices, plan rules, and tariff assignments.',
        name: 'Tariffs',
        slug: 'operations-tariffs',
      },
      {
        description: 'Station records, address data, and operating information.',
        name: 'Locations',
        slug: 'operations-locations',
      },
      {
        description: 'Reservation windows, usage, and booking history.',
        name: 'Reservations',
        slug: 'operations-reservations',
      },
      {
        description: 'Payment activity, methods, and reconciliation details.',
        name: 'Payments',
        slug: 'operations-payments',
      },
      {
        description: 'Charging sessions, wallet movements, and transaction logs.',
        name: 'Transactions',
        slug: 'operations-transactions',
      },
      {
        description: 'CMS banners, pages, and app-facing content.',
        name: 'Content',
        slug: 'operations-content',
      },
      {
        description: 'Vehicle brands, models, and compatibility records.',
        name: 'Vehicles',
        slug: 'operations-vehicles',
      },
      {
        description: 'Support cases, customer notes, and operational follow-up.',
        name: 'Support',
        slug: 'operations-support',
      },
      {
        description: 'Audit history and back-office operational logs.',
        name: 'Audit Logs',
        slug: 'operations-audit-logs',
      },
    ],
    description: 'Accounts, tariffs, locations, reservations, payments, transactions, and content.',
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/1349/1349386.png',
    name: 'Operations',
    routeCount: 10,
    slug: 'operations',
  },
  {
    accentColor: '#7B61FF',
    children: [
      {
        description: 'Employee accounts, assignments, and staff records.',
        name: 'Employees',
        slug: 'partnerships-employees',
      },
      {
        description: 'Partner-owned locations and collaboration details.',
        name: 'Partner Locations',
        slug: 'partnerships-locations',
      },
      {
        description: 'Partner pricing, tariff overrides, and commercial rules.',
        name: 'Partner Tariffs',
        slug: 'partnerships-tariffs',
      },
      {
        description: 'Outbound mail, delivery status, and notification records.',
        name: 'Mail Logs',
        slug: 'partnerships-mail-logs',
      },
      {
        description: 'Partner reporting spaces and exported summaries.',
        name: 'Reporting',
        slug: 'partnerships-reporting',
      },
    ],
    description: 'Employees, partner locations, tariffs, mail logs, and reporting workspaces.',
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/12134/12134500.png',
    name: 'Partnerships',
    routeCount: 5,
    slug: 'partnerships',
  },
  {
    accentColor: '#D64A7F',
    children: [
      {
        description: 'Campaign setup, discount rules, and promo performance.',
        name: 'Promotions',
        slug: 'marketing-promotions',
      },
      {
        description: 'Bonus credit packages and top-up incentives.',
        name: 'Bonus Top-up',
        slug: 'marketing-bonus-top-up',
      },
      {
        description: 'Referral programs, rewards, and invite activity.',
        name: 'Referrals',
        slug: 'marketing-referrals',
      },
      {
        description: 'Push campaigns, message templates, and send history.',
        name: 'Notifications',
        slug: 'marketing-notifications',
      },
      {
        description: 'In-app advertising placements and campaign inventory.',
        name: 'Ads',
        slug: 'marketing-ads',
      },
      {
        description: 'Subscription plans, benefits, and renewal behavior.',
        name: 'Subscriptions',
        slug: 'marketing-subscriptions',
      },
      {
        description: 'Audience segments for targeted campaigns.',
        name: 'Segments',
        slug: 'marketing-segments',
      },
      {
        description: 'Campaign results, conversion tracking, and engagement metrics.',
        name: 'Analytics',
        slug: 'marketing-analytics',
      },
    ],
    description: 'Promotions, bonus top-up, referrals, notifications, ads, and subscriptions.',
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/1998/1998087.png',
    name: 'Marketing',
    routeCount: 8,
    slug: 'marketing',
  },
  {
    accentColor: '#5F6B7A',
    children: [
      {
        description: 'Charger inventory, hardware profile, and assignment status.',
        name: 'Chargers',
        slug: 'technical-chargers',
      },
      {
        description: 'Device online state, operational status, and event history.',
        name: 'Status Logs',
        slug: 'technical-status-logs',
      },
      {
        description: 'Meter values, telemetry streams, and interval readings.',
        name: 'Meter Streams',
        slug: 'technical-meter-streams',
      },
      {
        description: 'Energy summaries, consumption reports, and export data.',
        name: 'Energy Reports',
        slug: 'technical-energy-reports',
      },
      {
        description: 'Domain mapping, network routing, and station endpoints.',
        name: 'Domains',
        slug: 'technical-domains',
      },
      {
        description: 'Simulation tools for sessions, chargers, and meter data.',
        name: 'Simulators',
        slug: 'technical-simulators',
      },
      {
        description: 'Diagnostics, fault detail, and charger troubleshooting.',
        name: 'Diagnostics',
        slug: 'technical-diagnostics',
      },
      {
        description: 'Firmware status, version history, and rollout tracking.',
        name: 'Firmware',
        slug: 'technical-firmware',
      },
    ],
    description: 'Chargers, status logs, meter streams, energy reports, domains, and simulators.',
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/1321/1321737.png',
    name: 'Technical',
    routeCount: 8,
    slug: 'technical',
  },
  {
    accentColor: '#24294A',
    children: [
      {
        description: 'Admin users, profile details, and account status.',
        name: 'Admin Accounts',
        slug: 'administrators-accounts',
      },
      {
        description: 'Role definitions and permission bundles.',
        name: 'Roles',
        slug: 'administrators-roles',
      },
      {
        description: 'Access policies, module permissions, and control rules.',
        name: 'Access Control',
        slug: 'administrators-access-control',
      },
      {
        description: 'Staff invitations, activation state, and permission updates.',
        name: 'Staff Permissions',
        slug: 'administrators-staff-permissions',
      },
    ],
    description: 'Admin account management, roles, access, and staff permissions.',
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/18631/18631524.png',
    name: 'Administrators',
    routeCount: 4,
    slug: 'administrators',
  },
];

export function getCmsServiceRoute(service: Pick<CmsServiceGroup | CmsServiceItem, 'slug'>) {
  return `/menu/${service.slug}` as const;
}
