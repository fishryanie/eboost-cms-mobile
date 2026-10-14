import { apiRequest } from 'utils/api/client';
import { getCollectionItems } from 'utils/api/collection';

import type { TransactionDetail } from './charging-profile-chart.helpers';

export type ChargingProfileSource = {
  carHistoryId?: number | string | null;
  chargerId?: string | null;
  invoiceId?: string | null;
  transactionId?: number | string | null;
};

type CarHistoryReference = {
  transactionId?: number | string | null;
};

function normalizeId(value?: number | string | null) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  return String(value).trim() || null;
}

export function hasChargingProfileSource(source: ChargingProfileSource) {
  return Boolean(normalizeId(source.transactionId) || normalizeId(source.carHistoryId) || (source.invoiceId && source.chargerId));
}

export function getChargingProfileQueryKey(source: ChargingProfileSource) {
  const transactionId = normalizeId(source.transactionId);
  return transactionId
    ? ['transaction-detail', transactionId]
    : ['transaction-detail', 'car-history', normalizeId(source.carHistoryId), source.invoiceId || null, source.chargerId || null];
}

export async function fetchChargingProfile(source: ChargingProfileSource, request = apiRequest): Promise<TransactionDetail | null> {
  let transactionId = normalizeId(source.transactionId);
  const historyId = normalizeId(source.carHistoryId);

  if (!transactionId && historyId) {
    const history = await request<CarHistoryReference>(`api/car_charge_histories/${encodeURIComponent(historyId)}`);
    transactionId = normalizeId(history.transactionId);
  }

  if (!transactionId && source.invoiceId && source.chargerId) {
    const response = await request<ApiListResponse<OngoingSessionRecord>>('api/controller/statistic/car-realtime-status', {
      params: { itemsPerPage: 30, limit: 30, page: 1, search: source.chargerId, status: 'Charging' },
    });
    const session = getCollectionItems(response).find(record => record.charging_session?.invoice_id === source.invoiceId);
    transactionId = normalizeId(session?.charging_session?.transaction_id);
  }

  if (!transactionId) return null;

  return request<TransactionDetail>(`api/transactions/${encodeURIComponent(transactionId)}`, { service: 'hub' });
}
