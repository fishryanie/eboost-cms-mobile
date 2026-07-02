export type SuspendPackageValues = {
  packageId: string;
};

export type SubscriptionPackageOption = {
  enabled?: boolean;
  id: number;
  name?: string;
  nameVn?: string;
  vehicleType?: 'bike' | 'car' | null;
};

export type SubscriptionPackageResponse = {
  enabled?: boolean;
  id?: number;
  name?: string;
};
