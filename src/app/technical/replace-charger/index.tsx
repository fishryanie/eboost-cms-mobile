import { useMutation } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { replaceCharger } from './service';
import type { ChargerVehicle } from './types';

function VehicleOption({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView
        alignItems='center'
        backgroundColor={active ? Palette.accent : Palette.surfaceMuted}
        borderColor={active ? Palette.accent : Palette.borderSubtle}
        borderRadius={16}
        borderWidth={1}
        flexDirection='row'
        gap={'two'}
        justifyContent='center'
        minHeight={42}
        paddingHorizontal={'four'}>
        {active ? <CheckCircle2 color='#FFFFFF' size={16} /> : null}
        <ThemedText color={active ? '#FFFFFF' : Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function ReplaceChargerScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<ChargerVehicle>('bike');
  const [chargerId, setChargerId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [name, setName] = useState('');
  const [station, setStation] = useState('');
  const mutation = useMutation({ mutationFn: replaceCharger });
  const canSubmit = useMemo(
    () => Boolean(chargerId.trim() && vendorId.trim() && name.trim()) && !mutation.isPending,
    [chargerId, mutation.isPending, name, vendorId],
  );

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Missing information', 'Please fill charger ID, replacement vendor ID, and name.');
      return;
    }

    try {
      const response = await mutation.mutateAsync({ chargerId, name, station, vendorId, vehicle });
      Alert.alert('Charger replaced', `Updated charger ${response.vendorId || vendorId.trim()}.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Replace charger failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Replace Charger' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'five'}>
          <ThemedView gap={'one'}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={30}>
              Replacement hardware
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
              Update an existing charger box with the new hardware identity.
            </ThemedText>
          </ThemedView>

          <ThemedView flexDirection='row' gap={'three'}>
            <ThemedView flex={1}>
              <VehicleOption active={vehicle === 'bike'} label='Bike' onPress={() => setVehicle('bike')} />
            </ThemedView>
            <ThemedView flex={1}>
              <VehicleOption active={vehicle === 'car'} label='Car' onPress={() => setVehicle('car')} />
            </ThemedView>
          </ThemedView>

          <ThemedView gap={'four'}>
            <FloatingTextInput label='* Current Charger ID' value={chargerId} onChangeText={setChargerId} keyboardType='number-pad' />
            <FloatingTextInput label='* New Vendor ID' value={vendorId} onChangeText={setVendorId} autoCapitalize='none' />
            <FloatingTextInput label='* New Name' value={name} onChangeText={setName} />
            <FloatingTextInput label='Station IRI (optional)' value={station} onChangeText={setStation} placeholder='/api/stations/1' autoCapitalize='none' />
          </ThemedView>
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={submit} title='Replace Charger' />
    </ThemedView>
  );
}
