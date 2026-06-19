import { useQuery } from '@tanstack/react-query';

import { fetchUtilityChargers } from './trigger-box-service';

export const triggerBoxKeys = {
  utilityChargers: ['trigger-box', 'utility-chargers'] as const,
};

export function useUtilityChargers(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: () => fetchUtilityChargers(),
    queryKey: triggerBoxKeys.utilityChargers,
  });
}
