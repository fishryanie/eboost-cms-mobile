import { apiRequest } from 'utils/api/client';
import type { CreatePromoCodeValues, PromoChargerOption, PromoCodeResponse } from './types';

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      'hydra:member'?: T[];
      member?: T[];
    };

function unwrapCollection<T>(response: CollectionResponse<T>) {
  if (Array.isArray(response)) return response;
  return response.data || response['hydra:member'] || response.member || [];
}

function toNumber(value: string) {
  const normalized = Number(value.replace(/,/g, ''));
  return Number.isFinite(normalized) ? normalized : 0;
}

export function normalizePromoCodeValues(values: CreatePromoCodeValues) {
  return {
    code: values.code.trim(),
    description: values.description.trim(),
    descriptionVn: values.descriptionVn.trim(),
    discountPercent: toNumber(values.discountPercent),
    enabled: values.enabled,
    expiredAt: values.expiredAt.trim(),
    maxDiscountAmount: toNumber(values.maxDiscountAmount),
    maxTotalUsage: values.maxTotalUsage.trim() ? toNumber(values.maxTotalUsage) : -1,
    maxUsagePerUser: values.maxUsagePerUser.trim() ? toNumber(values.maxUsagePerUser) : -1,
    monopoly: values.monopoly,
    name: values.name.trim(),
    nameVn: values.nameVn.trim(),
    note: values.note.trim(),
    startAt: values.startAt.trim(),
    vehicleType: values.vehicleType === '0' ? 0 : values.vehicleType,
    visible: values.visible,
  };
}

export async function fetchPromoChargerOptions() {
  const response = await apiRequest<CollectionResponse<PromoChargerOption>>('api/controller/utilities/chargers');
  return unwrapCollection(response);
}

export async function createPromoCode(values: CreatePromoCodeValues) {
  const response = await apiRequest<PromoCodeResponse>('api/promotion_codes', {
    data: normalizePromoCodeValues(values),
    method: 'POST',
  });
  const promotionCode = response.iriId || (response.id ? `/api/promotion_codes/${response.id}` : undefined);

  if (promotionCode && values.applyUsers) {
    await Promise.all(
      values.userTargets
        .filter(item => item.user.trim())
        .map(item =>
          apiRequest('api/promotion_code_users', {
            data: { isBlocked: item.isBlocked, promotionCode, user: item.user.trim() },
            method: 'POST',
          }),
        ),
    );
  }

  if (promotionCode && values.applyChargers) {
    await Promise.all(
      values.chargerTargets
        .filter(item => item.boxUniqueId.trim())
        .map(item =>
          apiRequest('api/promotion_code_boxes', {
            data: { ...item, boxUniqueId: item.boxUniqueId.trim(), promotionCode },
            method: 'POST',
          }),
        ),
    );
  }

  return response;
}
