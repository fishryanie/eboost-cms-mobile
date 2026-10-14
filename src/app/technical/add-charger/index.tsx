import { useMutation } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import { VehicleSegment } from 'components/technical/vehicle-segment';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { createCharger } from './service';
import type { ChargerVehicle } from './types';

export default function AddChargerScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<ChargerVehicle>('bike');
  const [vendorId, setVendorId] = useState('');
  const [name, setName] = useState('');
  const [station, setStation] = useState('');
  const mutation = useMutation({ mutationFn: createCharger });
  const canSubmit = useMemo(
    () => Boolean(vendorId.trim() && name.trim() && station.trim()) && !mutation.isPending,
    [mutation.isPending, name, station, vendorId],
  );

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Missing information', 'Please fill vendor ID, name, and station IRI.');
      return;
    }

    try {
      const response = await mutation.mutateAsync({ name, station, vendorId, vehicle });
      Alert.alert('Charger added', `Created charger ${response.vendorId || vendorId.trim()}.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Add charger failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Add Charger' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'five'}>
          <ThemedView gap={'one'}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={30}>
              New charger
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
              Create a bike or car charger box and assign it to a station.
            </ThemedText>
          </ThemedView>

          <VehicleSegment onChange={setVehicle} value={vehicle} width='100%' />

          <ThemedView gap={'four'}>
            <FloatingTextInput label='* Vendor ID' value={vendorId} onChangeText={setVendorId} autoCapitalize='none' />
            <FloatingTextInput label='* Name' value={name} onChangeText={setName} />
            <FloatingTextInput label='* Station IRI' value={station} onChangeText={setStation} placeholder='/api/stations/1' autoCapitalize='none' />
          </ThemedView>
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={submit} title='Add Charger' />
    </ThemedView>
  );
}
