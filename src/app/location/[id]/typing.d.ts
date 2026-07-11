type ChargerVehicle = 'bike' | 'car';

type WorkflowChargerRecord = {
  boxType?: ChargerVehicle;
  enabled?: boolean;
  id: number;
  name?: string;
  uniqueId?: string;
  vendorId?: string;
  visible?: boolean;
  carConnectors?: CarConnectorRecord[];
  outlets?: OutletRecord[];
  station?: { id?: number; name?: string } | string;
};

type ChargerRequest = (url: string, options?: { data?: unknown; method?: string; service?: 'building' | 'core' | 'hub' }) => Promise<unknown>;
