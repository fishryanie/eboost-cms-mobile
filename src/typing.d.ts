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
  id?: number;
  iriId?: string;
  label?: string;
  labelVn?: string;
};

type LocationType = {
  id?: number;
  iriId?: string;
  name?: string | null;
  nameVn?: string | null;
};

type LocationPartnership = {
  address?: {
    district?: number | null;
    fullAddress?: string | null;
    province?: number | null;
    streetAddress?: string | null;
    ward?: number | null;
  } | null;
  contract?: string | { code?: string; name?: string; number?: string } | null;
  contractCode?: string | null;
  contractEndDate?: string | null;
  contractStartDate?: string | null;
  detailAvailable?: boolean;
  installationDate?: string | null;
  locationCode?: string | null;
  locationId?: number | null;
  locationStatus?: string | null;
  mainUser?: { email?: string | null; name?: string | null; phone?: string | null; username?: string | null } | null;
  name?: string | null;
  notes?: string | null;
  priceProfileId?: number | null;
  reportCode?: string | null;
  reportName?: string | null;
  serviceName?: string | null;
  tariff?: string | { id?: number; name?: string; title?: string } | null;
};

type LocationRecord = {
  address?: string | null;
  bikeCount?: number;
  carCount?: number;
  deletedAt?: string | null;
  displayAddress?: string | null;
  id: number;
  iriId?: string;
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
  addressVn?: string | null;
  description?: string | null;
  descriptionVn?: string | null;
  latitude?: number | null;
  locationCode?: string | null;
  location_code?: string | null;
  longitude?: number | null;
  nameVn?: string | null;
  locationType?: LocationType | null;
  partnership?: LocationPartnership | null;
  partnershipLocation?: LocationPartnership | null;
  ward?: {
    id?: number;
    iriId?: string;
    name?: string | null;
    nameVn?: string | null;
    province?: {
      id?: number;
      iriId?: string;
      name?: string | null;
      nameVn?: string | null;
    } | null;
  } | null;
};

type StationRecord = {
  bikeBoxes?: BikeBoxRecord[];
  carBoxes?: CarBoxRecord[];
  createdAt?: string | null;
  description?: string | null;
  descriptionVn?: string | null;
  fullTime?: boolean;
  id: number;
  iriId?: string;
  latitude?: number | string;
  location?: LocationRecord | null;
  longitude?: number | string;
  images?: { originalName?: string | null; url?: string | null }[];
  name?: string;
  nameVn?: string;
  numberOfBikeBoxes?: number;
  numberOfCarBoxes?: number;
  public?: boolean;
  stationAreaType?: {
    id?: number;
    name?: string;
    nameVn?: string;
    outside?: boolean;
  } | null;
  stationOpenProfile?: {
    id?: number;
    name?: string;
    nameVn?: string;
  } | null;
  updatedAt?: string | null;
  visible?: boolean;
};

type ChargerPriceProfileRecord = {
  activationFee?: number | string;
  boxType?: 'bike' | 'car' | string;
  box_type?: 'bike' | 'car' | string;
  chargingFee?: number | string;
  chargingPrice?: number | string;
  currentDirection?: { id?: number | string; iriId?: string; name?: string; type?: string } | string;
  electricityPrice?: number | string;
  energyPrice?: number | string;
  endTime?: string;
  id?: number | string;
  idlePrice?: number | string;
  iriId?: string;
  minimumFee?: number | string;
  name?: string;
  nameVn?: string;
  parkingFee?: number | string;
  parkingPrice?: number | string;
  portFeeSchedules?: ChargerPriceProfileRecord[];
  price?: number | string;
  priceProfileDetails?: ChargerPriceProfileRecord[];
  prices?: ChargerPriceProfileRecord[];
  profit?: number | string;
  servicePrice?: number | string;
  startTime?: string;
  title?: string;
  unitPrice?: number | string;
  vat?: number | string;
  weekday?: { name?: string; nameVn?: string } | string;
};

type ChargerFeeScheduleTimeRecord = {
  activationFee?: number | string;
  begin?: string;
  chargingFee?: number | string;
  currentDirection?: { id?: number | string; iriId?: string; name?: string; type?: string } | string;
  end?: string;
  parkingFee?: number | string;
};

type ChargerFeeScheduleRecord = {
  day?: string;
  dayVn?: string;
  times?: ChargerFeeScheduleTimeRecord[];
};

type ChargerPortRecord = {
  feeSchedules?: ChargerFeeScheduleRecord[];
  id: number;
  name?: string;
  orderOnBox?: number;
  portProfile?: ChargerPriceProfileRecord | string | null;
  portProfileName?: string;
  power?: number;
  priceProfile?: ChargerPriceProfileRecord | string | null;
  priceProfileName?: string;
  pricingProfile?: ChargerPriceProfileRecord | string | null;
  qrCode?: string;
  status?: boolean | string;
  tariff?: ChargerPriceProfileRecord | string | null;
  uniqueId?: string;
  used?: boolean;
  visible?: boolean;
};
type CarConnectorRecord = ChargerPortRecord;
type OutletRecord = ChargerPortRecord;
type CarBoxRecord = WorkflowChargerRecord & { carConnectors?: CarConnectorRecord[]; numberOfCarConnectors?: number };
type BikeBoxRecord = WorkflowChargerRecord & { numberOfOutlets?: number; outlets?: OutletRecord[] };

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
