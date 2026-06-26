export type PeakUsageDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type PeakUsageRaw = {
  hour: string | number;
} & Partial<Record<PeakUsageDayKey, number | string | null>>;

export type PeakUsageRow = {
  hour: string;
} & Record<PeakUsageDayKey, number>;

export const peakUsageDayColumns: { key: PeakUsageDayKey; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

export function toPeakUsageNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function normalizePeakUsageHour(hour: string | number): string {
  const asNumber = typeof hour === 'number' ? hour : Number(hour);
  if (Number.isFinite(asNumber)) return String(Math.max(0, Math.min(23, asNumber))).padStart(2, '0');
  return '00';
}

export function normalizePeakUsageRows(items: PeakUsageRaw[] = []): PeakUsageRow[] {
  return items
    .map(item => ({
      hour: normalizePeakUsageHour(item.hour),
      mon: toPeakUsageNumber(item.mon),
      tue: toPeakUsageNumber(item.tue),
      wed: toPeakUsageNumber(item.wed),
      thu: toPeakUsageNumber(item.thu),
      fri: toPeakUsageNumber(item.fri),
      sat: toPeakUsageNumber(item.sat),
      sun: toPeakUsageNumber(item.sun),
    }))
    .sort((left, right) => Number(left.hour) - Number(right.hour));
}

export function getPeakUsageMaxValue(rows: PeakUsageRow[]): number {
  return rows.reduce((max, row) => {
    const rowMax = Math.max(...peakUsageDayColumns.map(({ key }) => row[key]));
    return Math.max(max, rowMax);
  }, 0);
}

export function getPeakUsageIntensity(value: number, maxValue: number): 'empty' | 'low' | 'medium' | 'high' | 'peak' {
  if (value <= 0 || maxValue <= 0) return 'empty';
  const ratio = value / maxValue;
  if (ratio >= 0.85) return 'peak';
  if (ratio >= 0.65) return 'high';
  if (ratio >= 0.35) return 'medium';
  return 'low';
}
