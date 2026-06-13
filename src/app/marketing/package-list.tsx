import { useLocalSearchParams, useRouter } from 'expo-router';

import { SubscriptionPackageListScreen } from 'features/marketing/marketing-screen';
import type { ShareMetric } from 'features/marketing/marketing-service';

export default function MarketingPackageListRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ metric?: string }>();
  const metric: ShareMetric = params.metric === 'purchases' ? 'purchases' : 'revenue';

  return <SubscriptionPackageListScreen initialMetric={metric} onBack={() => router.back()} />;
}
