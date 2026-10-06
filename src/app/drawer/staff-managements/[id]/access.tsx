import { useLocalSearchParams } from 'expo-router';
import { AdministratorAccessScreen } from 'features/administrator-access/access-screen';

export default function AccessRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const adminId = typeof id === 'string' ? id : '';
  return <AdministratorAccessScreen adminId={adminId} key={adminId} />;
}
