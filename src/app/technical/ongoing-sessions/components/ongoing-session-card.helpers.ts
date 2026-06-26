export type OngoingSessionPayment = {
  activation: number;
  charging: number;
  discount: number;
  paidTotal: number;
  promotion?: string;
  promotionPercent: number;
};

const padTime = (value: number) => value.toString().padStart(2, '0');

export function formatSessionTime(unix?: number) {
  if (!unix) return '-';

  const date = new Date(unix * 1000);
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())} ${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(date.getSeconds())}`;
}

export function formatSessionDuration(start?: number, end?: number) {
  if (!start || !end) return '00:00:00';

  const seconds = end - start;
  if (seconds < 0) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${padTime(hours)}:${padTime(minutes)}:${padTime(remainingSeconds)}`;
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString()} đ`;
}

export function formatChargeType(value?: string) {
  if (!value) return 'Unknown';
  return value === 'quick.charge' ? 'Quick Charge' : value;
}

export function getOngoingSessionPayment(record: OngoingSessionRecord): OngoingSessionPayment {
  const session = record.charging_session;
  const activation = Math.round(session?.activation_fee || 0);
  const charging = Math.round(session?.total_consumed_fee || 0);
  const promotionPercent = Math.round(session?.promotion_discount || 0);
  const baseAmount = charging || activation;
  const discount = Math.round(baseAmount * (promotionPercent / 100));
  const rawPromotion = session?.promotion_code as { code?: string; name?: string } | string | null | undefined;
  const promotion = typeof rawPromotion === 'object' ? rawPromotion?.code || rawPromotion?.name : rawPromotion || undefined;

  return {
    activation,
    charging,
    discount,
    paidTotal: Math.max(0, baseAmount - discount),
    promotion,
    promotionPercent,
  };
}

export function getOngoingSessionKey(record: OngoingSessionRecord) {
  return [
    record.boxId || record.vendorId || 'box',
    record.connectorId || record.carConnectorId || 'connector',
    record.charging_session?.invoice_id || record.charging_session?.transaction_id || 'session',
  ].join('-');
}

export function hasChargingProfile(record: OngoingSessionRecord) {
  return Boolean(record.charging_session?.transaction_id);
}
