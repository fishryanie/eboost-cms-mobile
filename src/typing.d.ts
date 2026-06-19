type TechnicalVehicle = 'bike' | 'car';
type TechnicalPanel = 'chargers' | 'meter-hourly' | 'status-logs' | 'energy-differ' | 'network-status' | 'domain-analyze';

type ApiListResponse<T> =
  | T[]
  | {
      'hydra:member'?: T[];
      'hydra:totalItems'?: number;
      data?: T[] | { data?: T[] };
      meta?: {
        total_count?: number;
      };
      pagination?: {
        total_items?: number;
      };
      total?: number;
    };

type TechnicalList<T> = {
  items: T[];
  total: number;
};

type TechnicalEndpoint = {
  path: string;
  service?: import('utils/api/types').ApiService;
};

type ChargerRecord = {
  enabled?: boolean;
  id?: number | string;
  name?: string;
  station?: { name?: string } | string;
  stationName?: string;
  uniqueId?: string;
  vendorId?: string;
  visible?: boolean;
};

type MeterValueRecord = {
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

type StatusLogRecord = {
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

type ConnectionLogRecord = {
  chargePointID?: string;
  onlineStatus?: string;
  stationName?: string;
  status?: string | number;
  timestamp?: string;
};

type BoxStatusData = {
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

type BoxStatusResponse = {
  data?: BoxStatusData;
  success?: boolean;
};

type DomainAnalyzeRecord = {
  allow_to_release?: boolean;
  bike_charging?: number;
  car_charging?: number;
  domain?: string;
  id: number;
  is_charging_active?: boolean;
  total_charging?: number;
  working?: boolean;
};

type EnergyDifferRecord = {
  charge_point_id?: number | string;
  energy_difference?: number;
  id?: number | string;
  meter_difference?: number;
  station_name?: string;
  total_consumed?: number;
  type?: TechnicalVehicle;
};

type TechnicalQueryParams = {
  page: number;
  search: string;
  vehicle: TechnicalVehicle;
};

type OngoingSessionRecord = {
  boxId?: string;
  carBoxId?: number;
  carConnectorId?: number;
  charging_session?: {
    activation_fee?: number;
    charge_type?: string;
    charge_value?: number | null;
    charging_fee?: number;
    discount_amount?: number | null;
    end_time?: number;
    invoice_id?: string;
    latest_detail?: {
      A?: number;
      SOC?: number;
      V?: number;
      W?: number;
    };
    parking_fee?: number;
    promotion_code?: string | null;
    promotion_discount?: number;
    start_time?: number;
    thrid_party?: any;
    total_consumed_fee?: number;
    transaction_id?: string | null;
    user?: {
      email?: string;
      id?: number;
      name?: string;
      phone?: string;
    };
    wattage_consumed?: number;
  };
  connectorId?: number;
  onlineStatus?: string;
  phase?: number;
  power?: number;
  qrCode?: string;
  stationName?: string;
  status?: string;
  vendorId?: string;
};

type OperationStatus = {
  label?: string;
};

type LocationRecord = {
  address?: string | null;
  bikeCount?: number;
  carCount?: number;
  deletedAt?: string | null;
  displayAddress?: string | null;
  id: number;
  image?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  images?: { originalName?: string | null; url?: string | null }[] | null;
  numberOfBikeBoxes?: number;
  numberOfCarBoxes?: number;
  numberOfStations?: number;
  name: string;
  operationStatus?: OperationStatus | null;
  photoUrl?: string | null;
  stationCount?: number;
  thumbnailUrl?: string | null;
  visible?: boolean;
};

type StationRecord = {
  id: number;
  name?: string;
  visible?: boolean;
};

type CarConnectorRecord = { id: number };
type OutletRecord = { id: number };
type CarBoxRecord = { carConnectors?: CarConnectorRecord[]; id: number };
type BikeBoxRecord = { id: number; outlets?: OutletRecord[] };

type UserLevel = {
  backgroundColor?: string | null;
  id: number;
  image?: { url?: string | null } | null;
  iriId?: string;
  name: string;
  nameVn?: string | null;
  name_vn?: string | null;
};

type UserListItem = {
  activatedMail?: boolean;
  avatar?: { path?: string | null; url?: string | null } | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  balance: number;
  email?: string | null;
  enabled?: boolean;
  id: number;
  image?: { path?: string | null; url?: string | null } | null;
  isPhoneVerified?: boolean;
  name?: string | null;
  phoneNumber?: string | null;
  userLevel?: UserLevel | null;
  username?: string | null;
};

type BalanceHistoryItem = {
  amount: number;
  balanceAction: '+' | '-' | string;
  createdAt: string;
  id: number;
  reason?: string | null;
  wallet: number;
};

type UserProfile = UserListItem & {
  address?: string | null;
  autoApplyPromotionCode?: boolean;
  autoCharge?: boolean;
  balanceHistory?: BalanceHistoryItem[];
  citizenIdentification?: string | null;
  createdAt?: string | null;
  dateOfBirth?: string | null;
  isCitizenVerified?: boolean;
  isNew?: boolean;
  userIdentifier?: string | null;
  userVehicles?: unknown[];
};

