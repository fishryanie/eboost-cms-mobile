export type OperationStatus = {
  label?: string;
};

export type LocationRecord = {
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

export type StationRecord = {
  id: number;
  name?: string;
  visible?: boolean;
};

export type CarConnectorRecord = {
  id: number;
};

export type OutletRecord = {
  id: number;
};

export type CarBoxRecord = {
  carConnectors?: CarConnectorRecord[];
  id: number;
};

export type BikeBoxRecord = {
  id: number;
  outlets?: OutletRecord[];
};
