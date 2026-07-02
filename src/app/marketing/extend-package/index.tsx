import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMutation } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import { DatePicker, type DatePickerMethods } from 'components/base/DatePicker';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView } from 'react-native';
import { Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { PromoCodeSelectSheet } from './promo-code-select-sheet';
import { extendPackage } from './service';
import type { PromotionCodeOption } from './types';

export default function ExtendPackageScreen() {
  const router = useRouter();
  const promoCodeSheetRef = useRef<BottomSheetModal>(null);
  const datePickerRef = useRef<DatePickerMethods>(null);
  const [promoCodeId, setPromoCodeId] = useState('');
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromotionCodeOption | null>(null);
  const [days, setDays] = useState('');
  const mutation = useMutation({ mutationFn: extendPackage });
  const canSubmit = useMemo(() => Boolean(promoCodeId.trim() && days.trim()) && !mutation.isPending, [days, mutation.isPending, promoCodeId]);
  const promoCodeInputValue = useMemo(() => {
    if (!selectedPromoCode) return '';
    return `#${selectedPromoCode.id} - ${selectedPromoCode.code || selectedPromoCode.name || selectedPromoCode.nameVn || 'Promo code'}`;
  }, [selectedPromoCode]);

  function openPromoCodeSheet() {
    Keyboard.dismiss();
    promoCodeSheetRef.current?.present();
  }

  function openDatePicker() {
    Keyboard.dismiss();
    datePickerRef.current?.open();
  }

  function handleDateChange(value: number) {
    const now = new Date();
    const selected = new Date(value * 1000);
    const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const end = Date.UTC(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDays(String(Math.max(1, Math.ceil((end - start) / 86400000))));
  }

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Missing information', 'Please select package and promo code.');
      return;
    }

    try {
      await mutation.mutateAsync({ days, promoCodeId });
      Alert.alert('Package extended', 'Promo code day count was updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Extend Package' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'four'}>
          <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
            Update the subscription package duration.
          </ThemedText>
          <Pressable onPress={openPromoCodeSheet}>
            <ThemedView pointerEvents='none'>
              <FloatingTextInput label='* Promo Code' value={promoCodeInputValue} editable={false} placeholder='Select promo code' />
            </ThemedView>
          </Pressable>
          <Pressable onPress={openDatePicker}>
            <ThemedView pointerEvents='none'>
              <FloatingTextInput label='* New Days' value={days ? `${days} days` : ''} editable={false} placeholder='Select date' />
            </ThemedView>
          </Pressable>
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={submit} title='Extend Package' />
      <PromoCodeSelectSheet
        ref={promoCodeSheetRef}
        onSelect={item => {
          setSelectedPromoCode(item);
          setPromoCodeId(String(item.id));
          promoCodeSheetRef.current?.dismiss();
        }}
        selectedPromoCodeId={promoCodeId ? `/api/promotion_codes/${promoCodeId}` : ''}
      />
      <DatePicker ref={datePickerRef} onChange={handleDateChange} />
    </ThemedView>
  );
}
