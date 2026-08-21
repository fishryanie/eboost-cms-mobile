export type QrVehicleType = 'bike' | 'car';

export type QrDecodeResult = {
  identifier: string;
  vehicle_type: QrVehicleType;
};

export type QrScanCurrentDirection = {
  id?: number;
  iriId?: string;
  type?: string;
};

export type QrScanFeeTime = {
  activationFee?: number;
  begin?: string;
  chargingFee?: number;
  currentDirection?: string;
  end?: string;
  parkingFee?: number;
};

export type QrScanFeeSchedule = {
  day?: string;
  dayVn?: string;
  times?: QrScanFeeTime[];
};

export type QrScanStation = {
  description?: string | null;
  descriptionVn?: string | null;
  id: number;
  images?: {
    fileSize?: number;
    iriId?: string;
    mimeType?: string;
    originalName?: string;
    url?: string;
  }[];
  iriId?: string;
  location?:
    | {
        id?: number;
        iriId?: string;
      }
    | string
    | null;
  name?: string;
  nameVn?: string;
  visible?: boolean;
};

export type QrScanPortProfile = {
  id?: number;
  iriId?: string;
  name?: string;
  nameVn?: string;
  portFeeSchedules?: {
    currentDirection?: QrScanCurrentDirection;
    iriId?: string;
  }[];
};

export type QrScanConnector = {
  feeSchedules?: QrScanFeeSchedule[];
  id: number;
  iriId?: string;
  isReserved?: boolean;
  name?: string;
  orderOnBox?: number;
  phase?: number;
  portProfile?: QrScanPortProfile | string | null;
  portProfileName?: string;
  portType?: {
    currentDirection?: QrScanCurrentDirection;
    details?: string;
    iriId?: string;
    type?: string;
  } | null;
  power?: number;
  qrCode?: string | null;
  qrText?: string | null;
  statconn?: string;
  status?: boolean | string;
  uniqueId?: string;
  used?: boolean;
  visible?: boolean;
};

export type QrScanBox = {
  bikeConnectors?: QrScanConnector[];
  carConnectors?: QrScanConnector[];
  enabled?: boolean;
  id: number;
  image?: string | null;
  iriId?: string;
  name?: string;
  numberOfCarConnectors?: number;
  numberOfOutlets?: number;
  outlets?: QrScanConnector[];
  station?: QrScanStation | string | null;
  uniqueId?: string;
  vendorId?: string;
  visible?: boolean;
};

export type QrIdentifierParts = {
  connectorOrder: number;
  vendorId: string;
};

export type QrOutletDetails = QrIdentifierParts & {
  box: QrScanBox;
  connector: QrScanConnector;
  station?: QrScanStation;
  stationId: number | string;
  stationReference?: string;
  vehicleType: QrVehicleType;
};
