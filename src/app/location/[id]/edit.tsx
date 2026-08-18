import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { LocationResourceFormSheet } from 'shared/locations/components/location-resource-form-sheet';
import { useLocationDetail } from 'shared/locations/hooks';
import { Palette } from 'themes';

export default function EditLocationRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const locationId = Array.isArray(id) ? id[0] : String(id || '');
  const locationQuery = useLocationDetail(locationId);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/operation/locations'));

  if (locationQuery.isLoading) {
    return (
      <ThemedView backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} padding={'four'} safePaddingTop>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView borderRadius={'large'} height={320} loading />
      </ThemedView>
    );
  }

  if (locationQuery.isError || !locationQuery.data) {
    return (
      <ThemedView alignItems='center' backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} justifyContent='center' padding={'four'}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState message='The location details could not be loaded.' title='Location unavailable' />
        <AppButton label='Retry' onPress={() => locationQuery.refetch()} />
      </ThemedView>
    );
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <Stack.Screen options={{ headerShown: false }} />
      <LocationResourceFormSheet location={locationQuery.data} onClose={close} open />
    </ThemedView>
  );
}
