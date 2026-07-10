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
  value: number;
};

export type ChartSeries = {
  color: string;
  data: ChartPoint[];
  dataPointsColor: string;
  endFillColor?: string;
  label: string;
  startFillColor?: string;
};

export type MobileChartPreset = 'core' | 'current' | 'voltage' | 'all';

export const mobileChartPresets: { label: string; value: MobileChartPreset }[] = [
  { label: 'Core', value: 'core' },
  { label: 'Current', value: 'current' },
  { label: 'Voltage', value: 'voltage' },
  { label: 'All', value: 'all' },
];

const mobileChartPresetLabels: Record<Exclude<MobileChartPreset, 'all'>, string[]> = {
  core: ['Power', 'Current', 'SoC'],
  current: ['Current', 'L1', 'L2', 'L3'],
  voltage: ['Voltage', 'V L1', 'V L2', 'V L3', 'V L1-N', 'V L2-N', 'V L3-N'],
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

function createSeries(label: string, color: string, data: ChartPoint[]) {
  if (!data.some(point => point.value !== 0)) return undefined;

  return {
    color,
    data,
    dataPointsColor: color,
    endFillColor: color,
    label,
    startFillColor: color,
  };
}

export function filterMobileChartSeries(series: ChartSeries[] | undefined, preset: MobileChartPreset) {
  if (!series) return undefined;
  if (preset === 'all') return series;

  const allowedLabels = mobileChartPresetLabels[preset];
  return series.filter(item => allowedLabels.includes(item.label));
}

export function buildChargingProfileChartData(data?: TransactionDetail) {
  if (!data?.meterValues?.length) return null;

  const sampleStep = Math.max(1, Math.ceil(data.meterValues.length / 80));
  const meterValues = data.meterValues.filter((_, index) => index % sampleStep === 0);
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
    const label = date ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : '';
    const pointLabel = index % labelStep === 0 ? label : '';

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

    powerData.push({ date: label, label: pointLabel, value: power });
    currentData.push({ date: label, label: pointLabel, value: current });
    currentL1Data.push({ date: label, label: pointLabel, value: currentL1 });
    currentL2Data.push({ date: label, label: pointLabel, value: currentL2 });
    currentL3Data.push({ date: label, label: pointLabel, value: currentL3 });
    socData.push({ date: label, label: pointLabel, value: soc });
    voltageData.push({ date: label, label: pointLabel, value: voltage });
    voltageL1Data.push({ date: label, label: pointLabel, value: voltageL1 });
    voltageL2Data.push({ date: label, label: pointLabel, value: voltageL2 });
    voltageL3Data.push({ date: label, label: pointLabel, value: voltageL3 });
    voltageL1NData.push({ date: label, label: pointLabel, value: voltageL1N });
    voltageL2NData.push({ date: label, label: pointLabel, value: voltageL2N });
    voltageL3NData.push({ date: label, label: pointLabel, value: voltageL3N });
  });

  const mobileSeries = [
    createSeries('Power', chartColors.power, powerData),
    createSeries('Current', chartColors.current, currentData),
    createSeries('L1', chartColors.currentL1, currentL1Data),
    createSeries('L2', chartColors.currentL2, currentL2Data),
    createSeries('L3', chartColors.currentL3, currentL3Data),
    createSeries('SoC', chartColors.soc, socData),
    createSeries('Voltage', chartColors.voltage, voltageData),
    createSeries('V L1', chartColors.voltageL1, voltageL1Data),
    createSeries('V L2', chartColors.voltageL2, voltageL2Data),
    createSeries('V L3', chartColors.voltageL3, voltageL3Data),
    createSeries('V L1-N', chartColors.voltageL1, voltageL1NData),
    createSeries('V L2-N', chartColors.voltageL2, voltageL2NData),
    createSeries('V L3-N', chartColors.voltageL3, voltageL3NData),
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
