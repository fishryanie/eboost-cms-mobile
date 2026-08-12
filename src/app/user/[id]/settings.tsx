import { useLocalSearchParams } from 'expo-router';

import { UserProfileSettingsScreen } from 'shared/users/components/user-profile-settings-screen';

export default function UserProfileSettingsRoute() {
  const params = useLocalSearchParams<{ id?: string }>();

  return <UserProfileSettingsScreen userId={String(params.id || '')} />;
}
