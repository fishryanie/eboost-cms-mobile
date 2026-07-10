import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { apiRequest } from 'utils/api/client';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

export function PaymentCheckoutSheet({ onClose, visible, onSuccess }: { onClose: () => void; visible: boolean; onSuccess: (record: any) => void }) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresented = useRef(false);
  const [inputCode, setInputCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  const detectParam = (code: string) => {
    return code.includes('_') || code.length > 20 ? { orderCode: code } : { transactionCode: code };
  };

  useEffect(() => {
    if (visible) {
      ref.current?.present();
      isPresented.current = true;
      return;
    }
    if (isPresented.current) {
      ref.current?.dismiss();
      isPresented.current = false;
    }
    setInputCode('');
    setIsNotFound(false);
  }, [visible]);

  const handleClose = () => {
    isPresented.current = false;
    onClose();
  };

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />, []);

  const handleSearch = async () => {
    const code = inputCode.trim();
    if (!code) {
      Alert.alert('Error', 'Please enter a code');
      return;
    }
    setIsSearching(true);
    setIsNotFound(false);
    try {
      const data = await apiRequest<any>('api/ale_pay_histories', { params: detectParam(code), method: 'GET' });
      const record = Array.isArray(data) ? data[0] : data?.['hydra:member']?.[0] || (data as any)?.data?.[0];
      if (record) {
        onSuccess(record);
        ref.current?.dismiss();
      } else {
        setIsNotFound(true);
      }
    } catch (error) {
      setIsNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      enableDynamicSizing
      keyboardBehavior='interactive'
      keyboardBlurBehavior='restore'
      onDismiss={handleClose}
      ref={ref}>
      <BottomSheetScrollView contentContainerStyle={[styles.sheetList, { paddingBottom: mhs(24) }]} keyboardShouldPersistTaps='handled'>
        <ThemedView alignItems='center' flexDirection='row' gap={12} paddingBottom={30} paddingHorizontal={15} paddingTop={12}>
          <ThemedView flex={1} minWidth={0}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={22} letterSpacing={0.5}>
              Alepay Checkout
            </ThemedText>
            <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} marginTop={2}>
              Enter orderCode or transactionCode
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView paddingBottom={'three'} gap={'three'} paddingHorizontal={12}>
          <BottomSheetTextInput
            autoCapitalize='none'
            autoCorrect={false}
            onChangeText={text => {
              setInputCode(text);
              setIsNotFound(false);
            }}
            placeholder='e.g. ALE0H76R3 or ALP01_...'
            placeholderTextColor='#98A2B3'
            returnKeyType='search'
            style={[styles.search, { backgroundColor: Palette.surfaceMuted }]}
            value={inputCode}
            onSubmitEditing={handleSearch}
          />
          <AppButton block label='Search' onPress={handleSearch} loading={isSearching} disabled={isSearching || !inputCode.trim()} />
        </ThemedView>

        {!isSearching && isNotFound && <EmptyState message='No payment history found for this code' title='No record found' />}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(21),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    height: 48,
    paddingHorizontal: mhs(16),
  },

  sheetList: {
    paddingHorizontal: mhs(8),
  },
});
