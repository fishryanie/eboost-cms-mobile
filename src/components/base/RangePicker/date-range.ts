import dayjs from 'dayjs';

export type DateRange = { start?: Date; end?: Date };
export type RangePreset = 'today' | 'week' | 'month' | 'year';

export function getRangeFromValue(value?: number[]): DateRange {
  if (value?.[0] === undefined || !Number.isFinite(value[0])) return {};
  const start = dayjs.unix(value[0]).startOf('day');
  if (!start.isValid()) return {};
  const end = value[1] !== undefined && Number.isFinite(value[1]) ? dayjs.unix(value[1]).startOf('day') : undefined;
  if (!end?.isValid()) return { start: start.toDate() };
  return end.isBefore(start) ? { start: end.toDate(), end: start.toDate() } : { start: start.toDate(), end: end.toDate() };
}

export function getPresetRange(preset: RangePreset, now = new Date()): DateRange {
  const today = dayjs(now).startOf('day');
  if (preset === 'week') return { start: today.subtract(6, 'day').toDate(), end: today.toDate() };
  if (preset === 'month') return { start: today.startOf('month').toDate(), end: today.endOf('month').startOf('day').toDate() };
  if (preset === 'year') return { start: today.startOf('year').toDate(), end: today.endOf('year').startOf('day').toDate() };
  return { start: today.toDate(), end: today.toDate() };
}

export function selectRangeDay(range: DateRange, date: Date): DateRange {
  const selected = dayjs(date).startOf('day').toDate();
  if (!range.start || range.end) return { start: selected };
  return selected < range.start ? { start: selected, end: range.start } : { start: range.start, end: selected };
}

export function getCalendarWeeks(month: Date): (Date | undefined)[][] {
  const firstDay = dayjs(month).startOf('month');
  const offset = (firstDay.day() + 6) % 7;
  const cellCount = Math.ceil((offset + firstDay.daysInMonth()) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, index) => {
    const day = index - offset + 1;
    return day < 1 || day > firstDay.daysInMonth() ? undefined : firstDay.date(day).toDate();
  });
  return Array.from({ length: cellCount / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}
