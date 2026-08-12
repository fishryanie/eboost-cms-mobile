import { useLocalSearchParams } from 'expo-router';

import { UserProfileScreen } from 'shared/users/components/user-profile-screen';

export default function UserProfileRoute() {
  const params = useLocalSearchParams<{ id?: string }>();

  return <UserProfileScreen userId={String(params.id || '')} />;
}
