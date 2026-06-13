import type { ApiService } from 'shared/api/types';

export type TechnicalVehicle = 'bike' | 'car';
export type TechnicalPanel = 'chargers' | 'meter-hourly' | 'status-logs' | 'energy-differ' | 'network-status' | 'domain-analyze';

export type ApiListResponse<T> =
  | T[]
  | {
      'hydra:member'?: T[];
      'hydra:totalItems'?: number;
      data?: T[] | { data?: T[] };
      meta?: {
        total_count?: number;
      };
      total?: number;
    };

export type TechnicalList<T> = {
  items: T[];
  total: number;
};

export type TechnicalEndpoint = {
  path: string;
  service?: ApiService;
};

export type ChargerRecord = {
  enabled?: boolean;
  id?: number | string;
  name?: string;
  station?: { name?: string } | string;
  stationName?: string;
  uniqueId?: string;
  vendorId?: string;
  visible?: boolean;
};

export type MeterValueRecord = {
  boxType?: string;
  chargePointID?: string;
  connectorID?: number | string;
  pEnergy?: number;
  pmEnergy?: number;
  receivedAt?: string;
  sampledValues?: {
    measurand?: string;
    phase?: string;
    unit?: string;
    value?: string;
  }[];
  timestamp?: string;
  transactionID?: number | string;
  uniqueID?: string;
};

export type StatusLogRecord = {
  box_id?: string;
  boxId?: string;
  chargePointID?: string;
  connector_id?: number | string;
  connectorID?: number | string;
  error_code?: string;
  errorCode?: string;
  id?: number | string;
  info?: string;
  receivedAt?: string;
  status?: number | string;
  timestamp?: string;
  vendor_id?: string;
  vendorErrorCode?: string;
  vendor_error_code?: string;
};

export type ConnectionLogRecord = {
  chargePointID?: string;
  onlineStatus?: string;
  stationName?: string;
  status?: string | number;
  timestamp?: string;
};

export type BoxStatusData = {
  All?: number;
  Available?: number;
  Charging?: number;
  Faulted?: number;
  Finishing?: number;
  Other?: number;
  Preparing?: number;
  Reserved?: number;
  SuspendedEV?: number;
  SuspendedEVSE?: number;
  Unavailable?: number;
  offline?: number;
  online?: number;
};

export type BoxStatusResponse = {
  data?: BoxStatusData;
  success?: boolean;
};

export type DomainAnalyzeRecord = {
  allow_to_release?: boolean;
  bike_charging?: number;
  car_charging?: number;
  domain?: string;
  id: number;
  is_charging_active?: boolean;
  total_charging?: number;
  working?: boolean;
};

export type EnergyDifferRecord = {
  charge_point_id?: number | string;
  energy_difference?: number;
  id?: number | string;
  meter_difference?: number;
  station_name?: string;
  total_consumed?: number;
  type?: TechnicalVehicle;
};

export type TechnicalQueryParams = {
  page: number;
  search: string;
  vehicle: TechnicalVehicle;
};
