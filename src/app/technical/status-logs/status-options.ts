export enum ChargingStatus {
  Available = 'Available',
  Preparing = 'Preparing',
  Charging = 'Charging',
  Finishing = 'Finishing',
  SuspendedEV = 'SuspendedEV',
  SuspendedEVSE = 'SuspendedEVSE',
  Reserved = 'Reserved',
  Unavailable = 'Unavailable',
  Faulted = 'Faulted',
}

export type StatusOption = {
  label: string;
  value: string;
};

const carStatusOptions: StatusOption[] = Object.values(ChargingStatus).map(status => ({
  label: status,
  value: status,
}));

const bikeStatusOptions: StatusOption[] = [
  'Available',
  'Ready',
  'Charging',
  'ChargeFull',
  'Unplugged',
  'NoPower',
  'NoFuse',
  'NoRelay',
  'OverCurrent',
  'TotalOverCurrent',
  'OverMoney',
  'OverTime',
  'RelayBroken',
  'StoppedFromApp',
  'EmergencyStop',
].map(status => ({ label: status, value: status }));

export function getStatusOptions(vehicle: TechnicalVehicle): StatusOption[] {
  return [{ label: 'All statuses', value: '' }, ...(vehicle === 'car' ? carStatusOptions : bikeStatusOptions)];
}

export function formatDateParam(timestampSeconds: number) {
  const date = new Date(timestampSeconds * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDateRangeLabel(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return 'All time';

  const formatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'All time';

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}
