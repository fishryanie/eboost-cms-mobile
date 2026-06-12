import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { NetworkIssuesScreen } from 'features/technical/technical-screen';
import { fetchNetworkStatus } from 'features/technical/technical-service';

export default function TechnicalNetworkIssuesRoute() {
  const router = useRouter();
  const bikeNetworkQuery = useQuery({
    queryFn: () => fetchNetworkStatus('bike'),
    queryKey: ['technical', 'network-issues', 'bike'],
  });
  const carNetworkQuery = useQuery({
    queryFn: () => fetchNetworkStatus('car'),
    queryKey: ['technical', 'network-issues', 'car'],
  });

  return <NetworkIssuesScreen bikeQuery={bikeNetworkQuery} carQuery={carNetworkQuery} onBack={() => router.back()} />;
}
