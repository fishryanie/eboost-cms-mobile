export type ExtendPackageValues = {
  days: string;
  promoCodeId: string;
};

export type PromotionCodeOption = {
  code?: string;
  expiredAt?: string;
  id: number;
  iriId?: string;
  name?: string;
  nameVn?: string;
};

export type SubscriptionPackageOption = {
  days?: number;
  id: number;
  name?: string;
  nameVn?: string;
  price?: number;
  vehicleType?: 'bike' | 'car' | null;
};

export type SubscriptionPackageResponse = {
  days?: number;
  id?: number;
  name?: string;
};
