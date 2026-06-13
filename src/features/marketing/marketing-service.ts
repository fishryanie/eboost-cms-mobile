import { apiRequest } from 'shared/api/client';

export type ShareMetric = 'purchases' | 'revenue';
export type VehicleType = 'bike' | 'car';
export type PackageKind = 'discount' | 'kwh';

export type SubscriptionDetailsMetricGroup = {
  bike?: number | string;
  car?: number | string;
  other?: number | string;
  total?: number | string;
};

export type SubscriptionPackageListItem = {
  count?: number | string;
  discount?: number | string;
  discountPercent?: number | string;
  name?: string;
  nameVn?: string;
  package_id?: number | string;
  package_name?: string;
  package_name_vn?: string;
  packageId?: number | string;
  packageName?: string;
  packageNameVn?: string;
  paid?: number | string;
  price?: number | string;
  purchases?: number | string;
  revenue?: number | string;
  total_price?: number | string;
  totalPrice?: number | string;
  unitPrice?: number | string;
  vehicle_type?: string | number | null;
  vehicleType?: string | number | null;
  wattage_consumed?: number | string | null;
  wattageConsumed?: number | string | null;
};

export type SubscriptionDetailsPayload = {
  buyers?: SubscriptionDetailsMetricGroup;
  package_lists?: SubscriptionPackageListItem[];
  packages?: SubscriptionDetailsMetricGroup;
  purchases?: SubscriptionDetailsMetricGroup;
  revenue?: SubscriptionDetailsMetricGroup;
};

export type SubscriptionKwSummaryPayload = {
  purchased?: number | string;
  purchased_kw?: number | string;
  purchasedKw?: number | string;
  remaining_active_kw?: number | string;
  remaining_expired?: number | string;
  remaining_expired_kw?: number | string;
  remaining_valid?: number | string;
  remaining_valid_kw?: number | string;
  remainingActiveKw?: number | string;
  remainingExpiredKw?: number | string;
  remainingValidKw?: number | string;
  total_purchased_kw?: number | string;
  total_remaining_active_kw?: number | string;
  total_remaining_expired_kw?: number | string;
  total_remaining_valid_kw?: number | string;
  total_used_kw?: number | string;
  totalPurchasedKw?: number | string;
  totalRemainingActiveKw?: number | string;
  totalRemainingExpiredKw?: number | string;
  totalRemainingValidKw?: number | string;
  totalUsedKw?: number | string;
  used?: number | string;
  used_kw?: number | string;
  usedKw?: number | string;
};

export type SubscriptionStatsResponse = {
  data?: SubscriptionKwSummaryPayload;
  period?: {
    end?: string;
    start?: string;
  };
  subscription_details?: SubscriptionDetailsPayload;
  success?: boolean;
  summary?: SubscriptionKwSummaryPayload;
};

export type KwSummary = {
  purchasedKw: number;
  remainingExpiredKw: number;
  remainingValidKw: number;
  usedKw: number;
};

export type SubscriptionPackageRow = {
  count: number;
  discount?: number;
  id: string;
  name: string;
  packageId?: number;
  packageKind: PackageKind;
  price: number;
  revenue: number;
  share: number;
  vehicleType?: VehicleType;
};

export type SubscriptionStatsSummary = {
  avgRevenuePerPurchase: number;
  bikeStats: VehicleSubscriptionStats;
  carStats: VehicleSubscriptionStats;
  kwSummary: KwSummary;
  rows: SubscriptionPackageRow[];
  totalPurchases: number;
  totalRevenue: number;
  totalSoldPackages: number;
  totalUniqueBuyers: number;
};

type VehicleGroup = 'bike' | 'car' | 'total';

type VehicleSubscriptionStats = {
  buyers: number;
  discountPackages: number;
  discountRevenue: number;
  kwhPackages: number;
  kwhRevenue: number;
  packages: number;
  purchases: number;
  revenue: number;
};

const KW_SUMMARY_ENDPOINT = 'api/controller/statistic/subscription-kw-summary';

const KW_SUMMARY_FIELD_KEYS: Record<keyof KwSummary, readonly string[]> = {
  purchasedKw: ['purchased_kw', 'purchasedKw', 'purchased', 'total_purchased_kw', 'totalPurchasedKw'],
  remainingExpiredKw: ['remaining_expired_kw', 'remainingExpiredKw', 'remaining_expired', 'total_remaining_expired_kw', 'totalRemainingExpiredKw'],
  remainingValidKw: [
    'remaining_valid_kw',
    'remainingValidKw',
    'remaining_valid',
    'remaining_active_kw',
    'remainingActiveKw',
    'total_remaining_valid_kw',
    'totalRemainingValidKw',
    'total_remaining_active_kw',
    'totalRemainingActiveKw',
  ],
  usedKw: ['used_kw', 'usedKw', 'used', 'total_used_kw', 'totalUsedKw'],
};

export function fetchSubscriptionStats({ end, start }: { end?: string; start?: string }) {
  return apiRequest<SubscriptionStatsResponse>(KW_SUMMARY_ENDPOINT, {
    params: { end, start },
  });
}

export function getCurrentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    end: formatDateParam(end),
    start: formatDateParam(start),
  };
}

export function toSubscriptionStatsSummary(response: unknown, shareMetric: ShareMetric): SubscriptionStatsSummary {
  const subscriptionDetails = getSubscriptionDetailsPayload(response);
  const kwSummary = toKwSummary(response);
  const packageMap = new Map<string, Omit<SubscriptionPackageRow, 'share'>>();
  const packageBreakdownMap = new Map<string, { count: number; revenue: number }>(
    ['bike-kwh', 'bike-discount', 'car-kwh', 'car-discount'].map(key => [key, { count: 0, revenue: 0 }]),
  );

  (subscriptionDetails.package_lists || []).forEach(item => {
    const source = item as Record<string, unknown>;
    const packageIdValue = getFirstValue(source, ['package_id', 'packageId']);
    const packageId = packageIdValue == null ? undefined : Number(packageIdValue);
    const name =
      String(getFirstValue(source, ['package_name_vn', 'packageNameVn', 'nameVn', 'package_name', 'packageName', 'name']) || '') || 'Unassigned package';
    const id = String(Number.isFinite(packageId) ? packageId : name);
    const discount = getDiscountValue(getFirstValue(source, ['discount', 'discountPercent']));
    const vehicleType = getVehicleType(getFirstValue(source, ['vehicle_type', 'vehicleType']));
    const wattageConsumed = getPositiveNumber(getFirstValue(source, ['wattage_consumed', 'wattageConsumed']));
    const packageKind = getPackageKind(wattageConsumed);
    const revenue = toNumber(getFirstValue(source, ['total_price', 'totalPrice', 'revenue', 'paid']));
    const count = toNumber(getFirstValue(source, ['count', 'purchases']));
    const rawPrice = toNumber(getFirstValue(source, ['price', 'unitPrice']));
    const price = rawPrice > 0 ? rawPrice : count > 0 ? revenue / count : 0;

    packageMap.set(id, {
      count,
      discount,
      id,
      name,
      packageId: Number.isFinite(packageId) ? packageId : undefined,
      packageKind,
      price,
      revenue,
      vehicleType,
    });

    if (vehicleType) {
      const breakdown = packageBreakdownMap.get(`${vehicleType}-${packageKind}`);
      if (breakdown) {
        breakdown.count += count;
        breakdown.revenue += revenue;
      }
    }
  });

  const totalPurchases = getMetricValue(subscriptionDetails.purchases, 'total');
  const totalRevenue = getMetricValue(subscriptionDetails.revenue, 'total');
  const rows = Array.from(packageMap.values())
    .sort((left, right) => {
      if (shareMetric === 'purchases') {
        return right.count - left.count || right.revenue - left.revenue || left.name.localeCompare(right.name);
      }
      return right.revenue - left.revenue || right.count - left.count || left.name.localeCompare(right.name);
    })
    .map(item => ({
      ...item,
      share:
        shareMetric === 'revenue' ? (totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0) : totalPurchases > 0 ? (item.count / totalPurchases) * 100 : 0,
    }));

  return {
    avgRevenuePerPurchase: totalPurchases > 0 ? totalRevenue / totalPurchases : 0,
    bikeStats: getVehicleStats(subscriptionDetails, packageBreakdownMap, 'bike'),
    carStats: getVehicleStats(subscriptionDetails, packageBreakdownMap, 'car'),
    kwSummary,
    rows,
    totalPurchases,
    totalRevenue,
    totalSoldPackages: getMetricValue(subscriptionDetails.packages, 'total'),
    totalUniqueBuyers: getMetricValue(subscriptionDetails.buyers, 'total'),
  };
}

function getVehicleStats(
  details: SubscriptionDetailsPayload,
  breakdownMap: Map<string, { count: number; revenue: number }>,
  vehicle: VehicleType,
): VehicleSubscriptionStats {
  const discount = breakdownMap.get(`${vehicle}-discount`);
  const kwh = breakdownMap.get(`${vehicle}-kwh`);

  return {
    buyers: getMetricValue(details.buyers, vehicle),
    discountPackages: discount?.count ?? 0,
    discountRevenue: discount?.revenue ?? 0,
    kwhPackages: kwh?.count ?? 0,
    kwhRevenue: kwh?.revenue ?? 0,
    packages: getMetricValue(details.packages, vehicle),
    purchases: getMetricValue(details.purchases, vehicle),
    revenue: getMetricValue(details.revenue, vehicle),
  };
}

function formatDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getObjectPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const source = value as Record<string, unknown>;
  const data = source.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;

  const summary = source.summary;
  if (summary && typeof summary === 'object' && !Array.isArray(summary)) return summary as Record<string, unknown>;

  return source;
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function getFirstValue(source: Record<string, unknown> | undefined, keys: readonly string[]) {
  if (!source) return undefined;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  return undefined;
}

function hasSubscriptionDetailsShape(source: Record<string, unknown>) {
  return ['revenue', 'purchases', 'packages', 'buyers', 'package_lists', 'packageLists'].some(key => source[key] !== undefined);
}

function findSubscriptionDetailsSource(value: unknown, depth = 0): Record<string, unknown> | undefined {
  const source = getRecord(value);
  if (!source || depth > 4) return undefined;
  if (hasSubscriptionDetailsShape(source)) return source;

  const directDetails = getFirstValue(source, ['subscription_details', 'subscriptionDetails', 'subscription_detail', 'subscriptionDetail']);
  const directDetailsSource = findSubscriptionDetailsSource(directDetails, depth + 1);
  if (directDetailsSource) return directDetailsSource;

  for (const key of ['data', 'summary', 'result', 'payload']) {
    const nestedSource = findSubscriptionDetailsSource(source[key], depth + 1);
    if (nestedSource) return nestedSource;
  }

  return undefined;
}

function normalizeMetricGroup(value: unknown): SubscriptionDetailsMetricGroup | undefined {
  const source = getRecord(value);
  if (!source) return undefined;

  return {
    bike: getMetricPrimitive(getFirstValue(source, ['bike', 'Bike', 'BIKE'])),
    car: getMetricPrimitive(getFirstValue(source, ['car', 'Car', 'CAR'])),
    other: getMetricPrimitive(getFirstValue(source, ['other', 'Other', 'OTHER'])),
    total: getMetricPrimitive(getFirstValue(source, ['total', 'Total', 'TOTAL'])),
  };
}

function getMetricPrimitive(value: unknown): number | string | undefined {
  return typeof value === 'number' || typeof value === 'string' ? value : undefined;
}

function getSubscriptionDetailsPayload(value: unknown): SubscriptionDetailsPayload {
  const source = findSubscriptionDetailsSource(value);
  if (!source) return {};

  const packageLists = getFirstValue(source, ['package_lists', 'packageLists', 'package_list', 'packageList']);

  return {
    buyers: normalizeMetricGroup(source.buyers),
    package_lists: Array.isArray(packageLists) ? (packageLists as SubscriptionPackageListItem[]) : [],
    packages: normalizeMetricGroup(source.packages),
    purchases: normalizeMetricGroup(source.purchases),
    revenue: normalizeMetricGroup(source.revenue),
  };
}

function toKwSummary(value: unknown): KwSummary {
  const source = getObjectPayload(value);

  return {
    purchasedKw: getFirstNumber(source, KW_SUMMARY_FIELD_KEYS.purchasedKw),
    remainingExpiredKw: getFirstNumber(source, KW_SUMMARY_FIELD_KEYS.remainingExpiredKw),
    remainingValidKw: getFirstNumber(source, KW_SUMMARY_FIELD_KEYS.remainingValidKw),
    usedKw: getFirstNumber(source, KW_SUMMARY_FIELD_KEYS.usedKw),
  };
}

function getFirstNumber(source: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return toNumber(source[key]);
  }
  return 0;
}

function getMetricValue(group: SubscriptionDetailsMetricGroup | undefined, key: VehicleGroup) {
  return toNumber(group?.[key]);
}

function getDiscountValue(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;

  const discount = toNumber(value);
  return Number.isFinite(discount) ? discount : undefined;
}

function getPositiveNumber(value: unknown) {
  const numberValue = toNumber(value);
  return numberValue > 0 ? numberValue : undefined;
}

function getPackageKind(wattageConsumed?: number): PackageKind {
  return wattageConsumed && wattageConsumed > 0 ? 'kwh' : 'discount';
}

function getVehicleType(value: unknown): VehicleType | undefined {
  const vehicleType = String(value || '').toLowerCase();

  if (vehicleType === 'car' || vehicleType === 'bike') return vehicleType;
  return undefined;
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}
