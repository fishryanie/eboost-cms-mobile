import { useMutation } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { uninstallCharger } from './service';
import type { ChargerVehicle } from './types';

function VehicleOption({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView
        alignItems='center'
        backgroundColor={active ? Palette.danger : Palette.surfaceMuted}
        borderColor={active ? Palette.danger : Palette.borderSubtle}
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

export default function UninstallChargerScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<ChargerVehicle>('bike');
  const [chargerId, setChargerId] = useState('');
  const mutation = useMutation({ mutationFn: uninstallCharger });
  const canSubmit = useMemo(() => Boolean(chargerId.trim()) && !mutation.isPending, [chargerId, mutation.isPending]);

  function confirmSubmit() {
    if (!canSubmit) {
      Alert.alert('Missing charger', 'Please enter the charger ID to uninstall.');
      return;
    }

    Alert.alert('Uninstall charger?', 'This will detach the charger from its station and disable it.', [
      { style: 'cancel', text: 'Cancel' },
      { onPress: submit, style: 'destructive', text: 'Uninstall' },
    ]);
  }

  async function submit() {
    try {
      await mutation.mutateAsync({ chargerId, vehicle });
      Alert.alert('Charger uninstalled', `Charger #${chargerId.trim()} was detached and disabled.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Uninstall failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Uninstall Charger' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'five'}>
          <ThemedView backgroundColor={Palette.dangerSurface} borderColor='#FDA29B' borderRadius={20} borderWidth={1} gap={'two'} padding={'four'}>
            <ThemedText color={Palette.danger} fontFamily={FontFamily.bold} fontSize={18} lineHeight={24}>
              Detach and disable
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
              Use this task only when the physical charger is removed from a station.
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

          <FloatingTextInput label='* Charger ID' value={chargerId} onChangeText={setChargerId} keyboardType='number-pad' />
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={confirmSubmit} title='Uninstall Charger' btnColor={Palette.danger} />
    </ThemedView>
  );
}
