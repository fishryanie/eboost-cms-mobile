import { apiRequest } from 'utils/api/client';
import type { BonusCampaignResponse, CreateBonusCampaignValues } from './types';

function toNumber(value: string) {
  const normalized = Number(value.replace(/,/g, ''));
  return Number.isFinite(normalized) ? normalized : 0;
}

export function normalizeBonusCampaignValues(values: CreateBonusCampaignValues) {
  return {
    beginAt: values.beginAt.trim(),
    bonusAmountMax: toNumber(values.bonusAmountMax),
    bonusAmountMin: toNumber(values.bonusAmountMin),
    description: values.description.trim(),
    descriptionVn: values.descriptionVn.trim(),
    endAt: values.endAt.trim(),
    isActive: false,
    maxTotalUsage: toNumber(values.maxTotalUsage),
    maxUsagePerUser: toNumber(values.maxUsagePerUser),
    name: values.name.trim(),
    nameVn: values.nameVn.trim(),
    topUpAmountMax: toNumber(values.topUpAmountMax),
    topUpAmountMin: toNumber(values.topUpAmountMin),
    userAffectedAt: values.userType === '0' ? undefined : values.userAffectedAt?.trim(),
    userType: Number(values.userType),
  };
}

export async function createBonusCampaign(values: CreateBonusCampaignValues) {
  const response = await apiRequest<BonusCampaignResponse>('api/money_top_up_events', {
    data: normalizeBonusCampaignValues(values),
    method: 'POST',
  });
  const event = response.iriId || (response.id ? `/api/money_top_up_events/${response.id}` : undefined);

  if (event) {
    await Promise.all([
      ...values.bonusRules
        .filter(rule => rule.minAmount.trim() && rule.maxAmount.trim() && rule.value.trim())
        .map(rule =>
          apiRequest('api/money_top_up_bonus_rules', {
            data: {
              event,
              isPercent: rule.isPercent,
              maxAmount: toNumber(rule.maxAmount),
              minAmount: toNumber(rule.minAmount),
              value: toNumber(rule.value),
            },
            method: 'POST',
          }),
        ),
      ...values.blacklistUsers
        .filter(item => item.user.trim())
        .map(item =>
          apiRequest('api/money_top_up_blacklists', {
            data: { event, reason: item.reason.trim(), user: item.user.trim() },
            method: 'POST',
          }),
        ),
    ]);
  }

  return response;
}
