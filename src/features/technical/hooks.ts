import { useQuery } from '@tanstack/react-query';

import {
  fetchChargers,
  fetchDomainAnalyze,
  fetchEnergyDiffer,
  fetchMeterHourly,
  fetchNetworkStatus,
  fetchStatusLogs,
} from './technical-service';
import type { TechnicalPanel, TechnicalQueryParams } from './types';

export const technicalKeys = {
  chargers: (params: TechnicalQueryParams) => ['technical', 'chargers', params] as const,
  domainAnalyze: ['technical', 'domain-analyze'] as const,
  energyDiffer: (vehicle: TechnicalQueryParams['vehicle']) => ['technical', 'energy-differ', vehicle] as const,
  meterHourly: (params: TechnicalQueryParams) => ['technical', 'meter-hourly', params] as const,
  networkStatus: (vehicle: TechnicalQueryParams['vehicle']) => ['technical', 'network-status', vehicle] as const,
  statusLogs: (params: TechnicalQueryParams) => ['technical', 'status-logs', params] as const,
};

export function useTechnicalPanel(panel: TechnicalPanel, params: TechnicalQueryParams) {
  const enabled = ['chargers', 'meter-hourly', 'status-logs'].includes(panel);

  const chargers = useQuery({
    enabled: enabled && panel === 'chargers',
    queryFn: () => fetchChargers(params),
    queryKey: technicalKeys.chargers(params),
  });
  const meterHourly = useQuery({
    enabled: enabled && panel === 'meter-hourly',
    queryFn: () => fetchMeterHourly(params),
    queryKey: technicalKeys.meterHourly(params),
  });
  const statusLogs = useQuery({
    enabled: enabled && panel === 'status-logs',
    queryFn: () => fetchStatusLogs(params),
    queryKey: technicalKeys.statusLogs(params),
  });

  return { chargers, meterHourly, statusLogs };
}

export function useTechnicalStats(panel: TechnicalPanel, vehicle: TechnicalQueryParams['vehicle']) {
  const networkStatus = useQuery({
    enabled: panel === 'network-status',
    queryFn: () => fetchNetworkStatus(vehicle),
    queryKey: technicalKeys.networkStatus(vehicle),
  });
  const domainAnalyze = useQuery({
    enabled: panel === 'domain-analyze',
    queryFn: fetchDomainAnalyze,
    queryKey: technicalKeys.domainAnalyze,
  });
  const energyDiffer = useQuery({
    enabled: panel === 'energy-differ',
    queryFn: () => fetchEnergyDiffer({ vehicle }),
    queryKey: technicalKeys.energyDiffer(vehicle),
  });

  return { domainAnalyze, energyDiffer, networkStatus };
}
