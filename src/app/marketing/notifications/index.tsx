import { useRouter } from 'expo-router';

import { NotificationsPage } from 'shared/cms-pages/notifications-page';

export default function NotificationsRoute() {
  const router = useRouter();

  return <NotificationsPage onBack={() => router.back()} />;
}
