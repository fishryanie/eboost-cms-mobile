export type CreatePromoCodeValues = {
  applyChargers: boolean;
  applyUsers: boolean;
  chargerTargets: PromoChargerTarget[];
  code: string;
  description: string;
  descriptionVn: string;
  discountPercent: string;
  enabled: boolean;
  expiredAt: string;
  maxDiscountAmount: string;
  maxTotalUsage: string;
  maxUsagePerUser: string;
  monopoly: boolean;
  name: string;
  nameVn: string;
  note: string;
  startAt: string;
  userTargets: PromoUserTarget[];
  vehicleType: 'bike' | 'car' | '0';
  visible: boolean;
};

export type PromoChargerOption = {
  stationName?: string | null;
  uniqueId: string;
  vehicleType?: 'bike' | 'car';
};

export type PromoChargerTarget = {
  boxUniqueId: string;
  isBlocked: boolean;
  vehicleType: 'bike' | 'car';
};

export type PromoUserTarget = {
  isBlocked: boolean;
  user: string;
};

export type PromoCodeResponse = {
  code?: string;
  id?: number;
  iriId?: string;
};
