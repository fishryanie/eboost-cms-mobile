export type SampledValue = {
  measurand?: string;
  phase?: string;
  value?: string;
};

export type MeterValue = {
  sampledValues?: SampledValue[];
  timestamp?: string;
};

export type TransactionDetail = {
  avgPowerKW?: number;
  durationHours?: number;
  meterValues?: MeterValue[];
  startMeter?: number;
  stopMeter?: number;
  totalEnergyKWh?: number;
};

export type ChartPoint = {
  date?: string;
  label?: string;
  timestamp?: number;
  value: number;
};

export type ChartAxis = 'electrical' | 'soc' | 'voltage';
export type ChartAxisDomain = readonly [number, number];
export type ChartAxisDomains = Record<ChartAxis, ChartAxisDomain>;

export type ChartSeries = {
  axis: ChartAxis;
  color: string;
  data: ChartPoint[];
  label: string;
  unit: 'A' | 'kW' | '%' | 'V';
};

export type MobileChartPreset = 'core' | 'current' | 'voltage' | 'all';

export const defaultMobileChartPreset: MobileChartPreset = 'all';

export const mobileChartPresets: { label: string; value: MobileChartPreset }[] = [
  { label: 'Core', value: 'core' },
  { label: 'Current', value: 'current' },
  { label: 'Voltage', value: 'voltage' },
  { label: 'All', value: 'all' },
];

const mobileChartPresetLabels: Record<Exclude<MobileChartPreset, 'all'>, ReadonlySet<string>> = {
  core: new Set(['Power', 'Current', 'SoC']),
  current: new Set(['Current', 'L1', 'L2', 'L3']),
  voltage: new Set(['Voltage', 'V L1', 'V L2', 'V L3', 'V L1-N', 'V L2-N', 'V L3-N']),
};

export const chartColors = {
  current: '#64748B',
  currentL1: '#FF8A1F',
  currentL2: '#13C2C2',
  currentL3: '#EB2F96',
  power: '#0BA95B',
  soc: '#FAAD14',
  voltage: '#7C3AED',
  voltageL1: '#EF3340',
  voltageL2: '#52C41A',
  voltageL3: '#722ED1',
} as const;

function getSampleValue(meterValue: MeterValue, measurand: string, phase?: string) {
  const sample = meterValue.sampledValues?.find(item => item.measurand === measurand && (phase ? item.phase === phase : !item.phase));
  const value = sample?.value ? Number.parseFloat(sample.value) : 0;
  return Number.isFinite(value) ? value : 0;
}

function createSeries(label: string, unit: ChartSeries['unit'], axis: ChartAxis, color: string, data: ChartPoint[]) {
  if (!data.some(point => point.value !== 0)) return undefined;

  return {
    axis,
    color,
    data,
    label,
    unit,
  };
}

export function filterMobileChartSeries(series: ChartSeries[] | undefined, preset: MobileChartPreset) {
  if (!series) return undefined;
  if (preset === 'all') return series;

  const allowedLabels = mobileChartPresetLabels[preset];
  return series.filter(item => allowedLabels.has(item.label));
}

function getNiceTickStep(min: number, max: number, count = 5) {
  const rawStep = Math.abs(max - min) / Math.max(1, count);
  if (!Number.isFinite(rawStep) || rawStep === 0) return 1;

  const power = Math.floor(Math.log10(rawStep));
  const error = rawStep / 10 ** power;
  const factor = error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1;
  return factor * 10 ** power;
}

function resolveNiceDomain(values: number[], includeZero: boolean): ChartAxisDomain {
  if (!values.length) return [0, 1];

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
    max += Math.max(1, (max - min) * 0.05);
  }

  if (min === max) {
    const padding = Math.max(1, Math.abs(min) * 0.005);
    min -= padding;
    max += padding;
  }

  const step = getNiceTickStep(min, max);
  let niceMin = Math.floor(min / step) * step;
  let niceMax = Math.ceil(max / step) * step;

  if (!includeZero && niceMin === min) niceMin -= step;
  if (!includeZero && niceMax === max) niceMax += step;

  return [niceMin, niceMax];
}

export function buildMobileChartAxisDomains(series: ChartSeries[]): ChartAxisDomains {
  const values: Record<ChartAxis, number[]> = {
    electrical: [],
    soc: [],
    voltage: [],
  };

  series.forEach(item => {
    item.data.forEach(point => {
      if (Number.isFinite(point.value)) values[item.axis].push(point.value);
    });
  });

  const positiveVoltageValues = values.voltage.filter(value => value > 0);

  return {
    electrical: resolveNiceDomain(values.electrical, true),
    soc: [0, 100],
    voltage: resolveNiceDomain(positiveVoltageValues.length ? positiveVoltageValues : values.voltage, false),
  };
}

export function normalizeMobileChartValue(value: number, domain: ChartAxisDomain) {
  const span = domain[1] - domain[0];
  if (!Number.isFinite(value) || span <= 0) return 0;
  return Math.min(1, Math.max(0, (value - domain[0]) / span));
}

export function getMobileChartAxisTicks(domain: ChartAxisDomain, count = 5) {
  if (count <= 1) return [domain[1]];

  const step = getNiceTickStep(domain[0], domain[1], count);
  const epsilon = step * 1e-10;
  const first = Math.ceil(domain[0] / step) * step;
  const ticks: number[] = [];

  for (let value = first; value <= domain[1] + epsilon; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }

  return ticks.reverse();
}

export function buildChargingProfileChartData(data?: TransactionDetail) {
  if (!data?.meterValues?.length) return null;

  const sampleStep = Math.max(1, Math.ceil(data.meterValues.length / 80));
  const lastMeterValueIndex = data.meterValues.length - 1;
  const meterValues = data.meterValues.filter((_, index) => index % sampleStep === 0 || index === lastMeterValueIndex);
  const labelStep = Math.max(1, Math.floor(meterValues.length / 6));

  const powerData: ChartPoint[] = [];
  const currentData: ChartPoint[] = [];
  const currentL1Data: ChartPoint[] = [];
  const currentL2Data: ChartPoint[] = [];
  const currentL3Data: ChartPoint[] = [];
  const socData: ChartPoint[] = [];
  const voltageData: ChartPoint[] = [];
  const voltageL1Data: ChartPoint[] = [];
  const voltageL2Data: ChartPoint[] = [];
  const voltageL3Data: ChartPoint[] = [];
  const voltageL1NData: ChartPoint[] = [];
  const voltageL2NData: ChartPoint[] = [];
  const voltageL3NData: ChartPoint[] = [];

  let latestCurrent = 0;
  let latestPower = 0;
  let latestVoltage = 0;
  let latestLabel = '';

  meterValues.forEach((meterValue, index) => {
    const date = meterValue.timestamp ? new Date(meterValue.timestamp) : null;
    const isValidDate = Boolean(date && !Number.isNaN(date.getTime()));
    const label = isValidDate ? `${date!.getHours().toString().padStart(2, '0')}:${date!.getMinutes().toString().padStart(2, '0')}` : '';
    const pointLabel = index % labelStep === 0 ? label : '';
    const timestamp = isValidDate ? date!.getTime() : undefined;

    const power = getSampleValue(meterValue, 'Power.Active.Import') / 1000;
    const current = getSampleValue(meterValue, 'Current.Import');
    const currentL1 = getSampleValue(meterValue, 'Current.Import', 'L1');
    const currentL2 = getSampleValue(meterValue, 'Current.Import', 'L2');
    const currentL3 = getSampleValue(meterValue, 'Current.Import', 'L3');
    const soc = getSampleValue(meterValue, 'SoC');
    const voltage = getSampleValue(meterValue, 'Voltage');
    const voltageL1 = getSampleValue(meterValue, 'Voltage', 'L1');
    const voltageL2 = getSampleValue(meterValue, 'Voltage', 'L2');
    const voltageL3 = getSampleValue(meterValue, 'Voltage', 'L3');
    const voltageL1N = getSampleValue(meterValue, 'Voltage', 'L1-N');
    const voltageL2N = getSampleValue(meterValue, 'Voltage', 'L2-N');
    const voltageL3N = getSampleValue(meterValue, 'Voltage', 'L3-N');

    if (power > 0) latestPower = power;
    if (current > 0 || currentL1 > 0) latestCurrent = current || currentL1;
    if (voltage > 0 || voltageL1 > 0 || voltageL1N > 0) latestVoltage = voltage || voltageL1 || voltageL1N;
    if (label) latestLabel = label;

    powerData.push({ date: label, label: pointLabel, timestamp, value: power });
    currentData.push({ date: label, label: pointLabel, timestamp, value: current });
    currentL1Data.push({ date: label, label: pointLabel, timestamp, value: currentL1 });
    currentL2Data.push({ date: label, label: pointLabel, timestamp, value: currentL2 });
    currentL3Data.push({ date: label, label: pointLabel, timestamp, value: currentL3 });
    socData.push({ date: label, label: pointLabel, timestamp, value: soc });
    voltageData.push({ date: label, label: pointLabel, timestamp, value: voltage });
    voltageL1Data.push({ date: label, label: pointLabel, timestamp, value: voltageL1 });
    voltageL2Data.push({ date: label, label: pointLabel, timestamp, value: voltageL2 });
    voltageL3Data.push({ date: label, label: pointLabel, timestamp, value: voltageL3 });
    voltageL1NData.push({ date: label, label: pointLabel, timestamp, value: voltageL1N });
    voltageL2NData.push({ date: label, label: pointLabel, timestamp, value: voltageL2N });
    voltageL3NData.push({ date: label, label: pointLabel, timestamp, value: voltageL3N });
  });

  const mobileSeries = [
    createSeries('Power', 'kW', 'electrical', chartColors.power, powerData),
    createSeries('Current', 'A', 'electrical', chartColors.current, currentData),
    createSeries('L1', 'A', 'electrical', chartColors.currentL1, currentL1Data),
    createSeries('L2', 'A', 'electrical', chartColors.currentL2, currentL2Data),
    createSeries('L3', 'A', 'electrical', chartColors.currentL3, currentL3Data),
    createSeries('SoC', '%', 'soc', chartColors.soc, socData),
    createSeries('V L1', 'V', 'voltage', chartColors.voltageL1, voltageL1Data),
    createSeries('V L2', 'V', 'voltage', chartColors.voltageL2, voltageL2Data),
    createSeries('V L3', 'V', 'voltage', chartColors.voltageL3, voltageL3Data),
    createSeries('V L1-N', 'V', 'voltage', chartColors.voltageL1, voltageL1NData),
    createSeries('V L2-N', 'V', 'voltage', chartColors.voltageL2, voltageL2NData),
    createSeries('V L3-N', 'V', 'voltage', chartColors.voltageL3, voltageL3NData),
    createSeries('Voltage', 'V', 'voltage', chartColors.voltage, voltageData),
  ].filter(Boolean) as ChartSeries[];

  const primarySeries = filterMobileChartSeries(mobileSeries, 'core');
  const currentSeries = filterMobileChartSeries(mobileSeries, 'current');
  const voltageSeries = filterMobileChartSeries(mobileSeries, 'voltage');

  return {
    dataSet1: primarySeries?.length ? primarySeries : currentSeries?.length ? currentSeries : undefined,
    dataSet2: voltageSeries?.length ? voltageSeries : undefined,
    hasCurrent: mobileSeries.some(series => ['Current', 'L1', 'L2', 'L3'].includes(series.label)),
    hasPower: mobileSeries.some(series => series.label === 'Power'),
    hasVoltage: mobileSeries.some(series => series.label.startsWith('V') || series.label === 'Voltage'),
    latestCurrent,
    latestLabel,
    latestPower,
    latestVoltage,
    mobileSeries,
  };
}
