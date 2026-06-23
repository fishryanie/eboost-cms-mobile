import { apiRequest } from 'utils/api/client';

export type BalanceAdjustmentType = 'deduct_wallet' | 'plus_wallet';

export type BalanceAdjustmentInput = {
  amount: number;
  reason: string;
  type: BalanceAdjustmentType;
  userId: number;
};

export type TransferMoneyInput = {
  amount?: number;
  from: number;
  to: number;
};

export type DashboardApiData<T> = {
  data?: T;
  'hydra:member'?: T;
  'hydra:totalItems'?: number;
  pagination?: {
    limit: number;
    page: number;
    total_items: number;
    total_pages: number;
  };
  summary?: Record<string, number>;
};

export type TopUserPerformanceItem = {
  growth?: number;
  total_energy?: number;
  total_orders?: number;
  total_paid?: number;
  total_topup?: number;
  user_email?: string;
  user_id: number;
  user_name?: string;
  user_phone?: string;
};

export type TopStationPerformanceItem = {
  growth?: number;
  station_id: number;
  station_name?: string;
  total_energy?: number;
  total_energy_kwh?: number;
  total_orders?: number;
  total_paid?: number;
};

export type AtRiskUserItem = {
  auto_renew?: boolean;
  days_left?: number;
  end_date?: string;
  risk_types?: string[];
  subscription_id: number;
  user?: {
    email?: string;
    id: number;
    name?: string;
    phone?: string;
  };
};

export type UserGrowthSummary = {
  avg_charge_duration_all_time?: number;
  avg_charge_duration_change_percent?: number;
  charged_today_vs_yesterday_percent?: number;
  today_vs_yesterday_growth_percent?: number;
  total_users?: number;
  users_charged_today?: number;
};

export type UserGrowthChartItem = {
  new_users?: number | string;
  time: string;
  total_users?: number | string;
};

export function confirmAdminPassword(password: string) {
  return apiRequest<{ message?: string; success?: boolean }>('api/controller/password/admin/confirm-password', {
    data: { password },
    method: 'POST',
  });
}

export function adjustUserBalance(input: BalanceAdjustmentInput) {
  const { amount, reason, type, userId } = input;

  return apiRequest(`api/controller/balance/${type}`, {
    data: {
      amount,
      reason,
      userId,
    },
    method: 'PUT',
  });
}

export function transferMoneyUsers(input: TransferMoneyInput) {
  return apiRequest('api/controller/utilities/transfer-money-users', {
    data: input,
    method: 'POST',
    service: 'core',
  });
}

export function updateUserRanking({ iriId, userId }: { iriId: string; userId: number }) {
  return apiRequest(`api/users/${userId}`, {
    data: { userLevel: iriId },
    method: 'PATCH',
  });
}

export function updateUserEmail({ email, userId }: { email: string; userId: number }) {
  return apiRequest<{ message?: string; success?: boolean }>(`api/controller/user/update-user-mail/${userId}`, {
    data: {
      email,
      username: email,
    },
    method: 'POST',
  });
}

export function updateUserPassword({ password, userId }: { password: string; userId: number }) {
  return apiRequest<{ message?: string; statusCode?: string; success?: boolean }>('api/controller/password/admin/update-password-user', {
    data: {
      id: userId,
      password,
    },
    method: 'POST',
  });
}

export function fetchUserLevels() {
  return apiRequest<DashboardApiData<UserLevel[]> | UserLevel[]>('api/user_levels', {
    params: { pagination: false },
  });
}

export function fetchUsersByText(search: string) {
  return apiRequest<UserListItem[]>(`api/user/${search}`, {
    method: 'GET',
    service: 'core',
  });
}

export function fetchTopUsers(sortBy: 'total_energy' | 'total_orders' | 'total_paid' | 'total_topup' = 'total_orders') {
  return apiRequest<DashboardApiData<TopUserPerformanceItem[]>>('api/controller/statistic/top-users', {
    params: { sortBy },
  });
}

export function fetchTopStations(sortBy: 'total_energy' | 'total_orders' | 'total_paid' = 'total_orders') {
  return apiRequest<DashboardApiData<TopStationPerformanceItem[]>>('api/controller/statistic/top-stations', {
    params: { sortBy },
  });
}

export function fetchAtRiskUsers() {
  return apiRequest<DashboardApiData<AtRiskUserItem[]>>('api/controller/statistic/at-risk-users', {
    params: {
      limit: 5,
      low_quota_ratio: 0.2,
      near_end_days: 7,
      page: 1,
      renew: 'all',
      risk: 'all',
    },
  });
}

export function fetchUserGrowth() {
  return apiRequest<DashboardApiData<UserGrowthSummary>>('api/controller/statistic/user-growth');
}

export function fetchUserGrowthChart({ endDate, startDate }: { endDate: string; startDate: string }) {
  return apiRequest<DashboardApiData<UserGrowthChartItem[]>>('api/controller/statistic/user-growth-chart', {
    params: {
      endDate,
      period: 'month',
      startDate,
    },
  });
}

export function getCollectionData<T>(response?: DashboardApiData<T[]> | T[]) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response['hydra:member'])) return response['hydra:member'];
  return [];
}

export function fetchAlePayHistory(params: { orderCode?: string; transactionCode?: string }) {
  return apiRequest<any>('api/ale_pay_histories', {
    params,
    method: 'GET',
  });
}

