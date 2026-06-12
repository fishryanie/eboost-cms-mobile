import { apiRequest } from 'shared/api/client';
import type { ApiRequestOptions } from 'shared/api/types';

export type ReplaceMeterRequest = <TResponse = unknown, TData = unknown>(url: string, options?: ApiRequestOptions<TData>) => Promise<TResponse>;

export type ReplaceMeterChargerType = 'bike' | 'car';

export type ReplaceMeterValues = {
  boxIdentifier: string;
  chargerType: ReplaceMeterChargerType;
  closingIndex: number | string;
  connectorId?: number;
  newMeterIndex: number | string;
  partnerBoxId: number;
  partnershipLocationId: number;
  replacementDate: string;
  request?: ReplaceMeterRequest;
};

export type CreatedMeterReport = {
  comment: string;
  id: number;
  noted: string;
  offset: number;
  old_index: number;
  old_index_real_time: number;
  price: number;
  profit: number;
  profit_mode?: 'currency' | 'percent';
  standby_energy: number;
  vat: number;
};

export class ReplaceMeterReportError extends Error {
  raw: unknown;

  constructor(message: string, raw: unknown) {
    super(message);
    this.name = 'ReplaceMeterReportError';
    this.raw = raw;
  }
}

function getResponseReportData(response: unknown) {
  if (!response || typeof response !== 'object') return response;
  const candidate = response as Record<string, unknown>;
  return candidate.data || candidate.result || response;
}

function toMetricNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function addDays(dateText: string, days: number) {
  const [year, month, day] = dateText.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function extractCreatedMeterReport(response: unknown): CreatedMeterReport | undefined {
  const candidate = getResponseReportData(response);
  if (!candidate || typeof candidate !== 'object') return undefined;

  const record = candidate as Record<string, unknown>;
  const reportId = record.id || record.box_reading_id || record.boxReadingId;

  if (!reportId) return undefined;

  return {
    comment: String(record.comment || ''),
    id: Number(reportId),
    noted: String(record.noted || ''),
    offset: toMetricNumber(record.offset),
    old_index: toMetricNumber(record.old_index),
    old_index_real_time: toMetricNumber(record.old_index_real_time),
    price: toMetricNumber(record.price),
    profit: toMetricNumber(record.profit),
    profit_mode: record.profit_mode === 'currency' ? 'currency' : 'percent',
    standby_energy: toMetricNumber(record.standby_energy),
    vat: toMetricNumber(record.vat),
  };
}

function createPartnerLog(
  request: ReplaceMeterRequest,
  locationId: number,
  partnerBoxId: number,
  payload: { description: string; log_date: string; offset: number; status: 'install_meter' | 'remove_meter' },
) {
  return request(`api/v1/partner/locations/${locationId}/charger-logs`, {
    data: {
      box_id: partnerBoxId,
      ...payload,
    },
    method: 'POST',
    service: 'building',
  });
}

export async function replaceMeter({
  boxIdentifier,
  chargerType,
  closingIndex,
  connectorId,
  newMeterIndex,
  partnerBoxId,
  partnershipLocationId,
  replacementDate,
  request = apiRequest,
}: ReplaceMeterValues) {
  const today = replacementDate;
  const tomorrow = addDays(replacementDate, 1);
  const normalizedClosingIndex = toMetricNumber(closingIndex);
  const normalizedNewMeterIndex = toMetricNumber(newMeterIndex);
  const reportData = {
    box_id: boxIdentifier,
    connector_id: chargerType === 'car' ? connectorId : undefined,
    isCalculate: true,
    unit: 'kWh',
  };
  const [removeMeterResponse, installMeterResponse] = await Promise.all([
    request(`api/v2/boxes/${chargerType}/meter-report`, {
      data: {
        ...reportData,
        reading_date: today,
      },
      method: 'POST',
      service: 'building',
    }),
    request(`api/v2/boxes/${chargerType}/meter-report`, {
      data: {
        ...reportData,
        reading_date: tomorrow,
      },
      method: 'POST',
      service: 'building',
    }),
  ]);

  const removeMeterReport = extractCreatedMeterReport(removeMeterResponse);
  const installMeterReport = extractCreatedMeterReport(installMeterResponse);

  if (!removeMeterReport?.id) {
    throw new ReplaceMeterReportError('Could not find the first created meter report id.', removeMeterResponse);
  }

  if (!installMeterReport?.id) {
    throw new ReplaceMeterReportError('Could not find the created meter report id.', installMeterResponse);
  }

  await Promise.all([
    request(`api/v1/partner/locations/${partnershipLocationId}/meter-report/${removeMeterReport.id}`, {
      data: {
        old_index: removeMeterReport.old_index,
        new_index: normalizedClosingIndex,
        old_index_real_time: removeMeterReport.old_index_real_time,
        new_index_real_time: normalizedClosingIndex,
        standby_energy: removeMeterReport.standby_energy,
        offset: removeMeterReport.offset,
        price: removeMeterReport.price,
        vat: removeMeterReport.vat,
        profit: removeMeterReport.profit,
        profit_mode: removeMeterReport.profit_mode || 'percent',
        comment: 'CLOSING_METER_READING',
        noted: removeMeterReport.noted,
      },
      method: 'PUT',
      service: 'building',
    }),
    request(`api/v1/partner/locations/${partnershipLocationId}/meter-report/${installMeterReport.id}`, {
      data: {
        old_index: normalizedNewMeterIndex,
        new_index: normalizedNewMeterIndex,
        old_index_real_time: normalizedNewMeterIndex,
        new_index_real_time: normalizedNewMeterIndex,
        standby_energy: installMeterReport.standby_energy,
        offset: installMeterReport.offset,
        price: installMeterReport.price,
        vat: installMeterReport.vat,
        profit: installMeterReport.profit,
        profit_mode: installMeterReport.profit_mode || 'percent',
        comment: 'THAY_METER',
        noted: installMeterReport.noted,
      },
      method: 'PUT',
      service: 'building',
    }),
  ]);

  await Promise.all([
    createPartnerLog(request, partnershipLocationId, partnerBoxId, {
      description: 'Close meter data before meter replacement.',
      log_date: today,
      offset: normalizedClosingIndex,
      status: 'remove_meter',
    }),
    createPartnerLog(request, partnershipLocationId, partnerBoxId, {
      description: 'Install new meter and record the initial meter index.',
      log_date: tomorrow,
      offset: normalizedNewMeterIndex,
      status: 'install_meter',
    }),
  ]);

  return {
    installMeterReportId: installMeterReport.id,
    removeMeterReportId: removeMeterReport.id,
  };
}
