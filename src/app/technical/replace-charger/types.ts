export type ChargerVehicle = 'bike' | 'car';

export type ReplaceChargerValues = {
  chargerId: string;
  name: string;
  station?: string;
  vendorId: string;
  vehicle: ChargerVehicle;
};

export type ChargerBoxResponse = {
  id?: number;
  name?: string;
  uniqueId?: string;
  vendorId?: string;
};
