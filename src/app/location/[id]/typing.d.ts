type ChargerVehicle = 'bike' | 'car';

type WorkflowChargerRecord = {
  boxType?: ChargerVehicle;
  enabled?: boolean;
  id: number;
  name?: string;
  uniqueId?: string;
  vendorId?: string;
  visible?: boolean;
};

type ChargerRequest = (url: string, options?: { data?: unknown; method?: string; service?: 'building' | 'core' | 'hub' }) => Promise<unknown>;
