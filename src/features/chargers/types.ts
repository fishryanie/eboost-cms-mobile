export type ChargerVehicle = 'bike' | 'car';

export type WorkflowChargerRecord = {
  boxType?: ChargerVehicle;
  enabled?: boolean;
  id: number;
  name?: string;
  uniqueId?: string;
  vendorId?: string;
  visible?: boolean;
};

export type ChargerRequest = (url: string, options?: { data?: unknown; method?: string; service?: 'building' | 'core' | 'hub' }) => Promise<unknown>;
