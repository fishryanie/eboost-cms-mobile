export type ChargerVehicle = 'bike' | 'car';

export type UninstallChargerValues = {
  chargerId: string;
  vehicle: ChargerVehicle;
};

export type ChargerBoxResponse = {
  enabled?: boolean;
  id?: number;
  station?: string | null;
  visible?: boolean;
};
