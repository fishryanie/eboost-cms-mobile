import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView } from 'react-native';
import { Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { PackageSelectSheet } from './package-select-sheet';
import { fetchSubscriptionPackages, suspendPackage } from './service';
import type { SubscriptionPackageOption } from './types';
import { useDrawerStore } from 'utils/drawer-store';

export default function SuspendPackageScreen() {
  const router = useRouter();
  const packageSheetRef = useRef<BottomSheetModal>(null);
  const [packageId, setPackageId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackageOption | null>(null);
  const packagesQuery = useQuery({ queryFn: fetchSubscriptionPackages, queryKey: ['marketing', 'subscription-packages', 'suspend'] });
  const mutation = useMutation({ mutationFn: suspendPackage });
  const canSubmit = useMemo(() => Boolean(packageId.trim()) && !mutation.isPending, [mutation.isPending, packageId]);
  const packageInputValue = useMemo(() => {
    const item = selectedPackage || (packagesQuery.data || []).find(pkg => String(pkg.id) === packageId);
    if (!item) return '';
    return `#${item.id} - ${item.name || item.nameVn || 'Subscription package'}`;
  }, [packageId, packagesQuery.data, selectedPackage]);

  function openPackageSheet() {
    Keyboard.dismiss();
    useDrawerStore.getState().closeDrawer();
    packageSheetRef.current?.present();
  }

  function confirmSubmit() {
    if (!canSubmit) {
      Alert.alert('Missing package', 'Please enter package ID.');
      return;
    }

    Alert.alert('Suspend package?', 'This will disable the subscription package.', [
      { style: 'cancel', text: 'Cancel' },
      { onPress: submit, style: 'destructive', text: 'Suspend' },
    ]);
  }

  async function submit() {
    try {
      await mutation.mutateAsync({ packageId });
      Alert.alert('Package suspended', 'Subscription package was disabled.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Suspend failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Suspend Package' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView backgroundColor={Palette.dangerSurface} borderColor='#FDA29B' borderRadius={20} borderWidth={1} gap={'two'} padding={'four'}>
          <ThemedText color={Palette.danger} fontFamily='bold' fontSize={18} lineHeight={24}>
            Disable package
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
            Use this quick action to stop a subscription package from being purchased.
          </ThemedText>
        </ThemedView>
        <ThemedView marginTop={'five'} gap={'three'}>
          <Pressable onPress={openPackageSheet}>
            <ThemedView pointerEvents='none'>
              <FloatingTextInput label='* Package' value={packageInputValue} editable={false} placeholder='Select package' />
            </ThemedView>
          </Pressable>
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={confirmSubmit} title='Suspend Package' btnColor={Palette.danger} />
      <PackageSelectSheet
        ref={packageSheetRef}
        loading={packagesQuery.isLoading}
        onSelect={item => {
          setSelectedPackage(item);
          setPackageId(String(item.id));
          packageSheetRef.current?.dismiss();
        }}
        packages={packagesQuery.data || []}
        selectedPackageId={packageId}
      />
    </ThemedView>
  );
}
