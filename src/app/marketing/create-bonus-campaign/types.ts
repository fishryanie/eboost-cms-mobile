export type CreateBonusCampaignValues = {
  beginAt: string;
  blacklistUsers: BonusBlacklistUser[];
  bonusAmountMax: string;
  bonusAmountMin: string;
  bonusRules: BonusRule[];
  description: string;
  descriptionVn: string;
  endAt: string;
  maxTotalUsage: string;
  maxUsagePerUser: string;
  name: string;
  nameVn: string;
  topUpAmountMax: string;
  topUpAmountMin: string;
  userAffectedAt?: string;
  userType: '0' | '1' | '2';
};

export type BonusBlacklistUser = {
  reason: string;
  user: string;
};

export type BonusRule = {
  isPercent: boolean;
  maxAmount: string;
  minAmount: string;
  value: string;
};

export type BonusCampaignResponse = {
  iriId?: string;
  id?: number;
  name?: string;
};
