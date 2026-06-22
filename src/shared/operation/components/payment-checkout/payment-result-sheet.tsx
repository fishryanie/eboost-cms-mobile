import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { AppButton } from 'components/ui';
import { UserCard } from 'shared/users/components/user-card';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

export function PaymentResultSheet({ onClose, visible, record }: { onClose: () => void; visible: boolean; record: any }) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresented = useRef(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        ref.current?.present();
        isPresented.current = true;
      }, 150);
      return;
    }
    if (isPresented.current) {
      ref.current?.dismiss();
      isPresented.current = false;
    }
  }, [visible]);

  const handleClose = () => {
    isPresented.current = false;
    onClose();
  };

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />, []);

  const handleCheckout = () => {
    if (record.checkoutUrl) {
      Linking.openURL(record.checkoutUrl);
    } else {
      Alert.alert('Checkout Error', 'No checkout URL is available for this transaction.');
    }
  };

  const isSuccess = record?.status === 'success' || record?.status === '000';
  const isPending = record?.status === 'pending';
  const statusText = record?.status ? record.status.toUpperCase() : 'UNKNOWN';
  const statusColor = isSuccess ? '#00B85A' : isPending ? '#F5A623' : '#D92D20';
  const statusBg = isSuccess ? '#E8F4EF' : isPending ? '#FFF4E5' : '#FEE2E2';
  const statusIcon = isSuccess ? 'checkmark.circle.fill' : isPending ? 'clock.fill' : 'xmark.circle.fill';

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      enableDynamicSizing
      enablePanDownToClose
      keyboardBlurBehavior='restore'
      onDismiss={handleClose}
      ref={ref}>
      <BottomSheetScrollView contentContainerStyle={[styles.sheetList, { paddingBottom: mhs(24) }]} keyboardShouldPersistTaps='handled'>
        {/* Header Section */}
        <ThemedView flex={1} alignItems='center' paddingTop={'two'} paddingBottom={'six'}>
          <ThemedView
            backgroundColor={statusBg}
            paddingHorizontal={'three'}
            paddingVertical={6}
            borderRadius={'pill'}
            flexDirection='row'
            alignItems='center'
            gap={'two'}
            marginBottom={'three'}>
            <SymbolView name={statusIcon} resizeMode='scaleAspectFit' size={14} tintColor={statusColor} />
            <ThemedText color={statusColor} fontFamily={FontFamily.bold} fontSize={12} style={{ letterSpacing: 1 }}>
              {statusText}
            </ThemedText>
          </ThemedView>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={35}>
            {record?.amount !== undefined ? `${Number(record.amount).toLocaleString()} đ` : '---'}
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={14} marginTop={4} textAlign='center' paddingHorizontal={'four'}>
            {[record?.transactionCode, record?.orderCode].filter(Boolean).join(' • ') || '---'}
          </ThemedText>
        </ThemedView>

        {record && (
          <ThemedView paddingHorizontal={'one'}>
            {/* User Section */}
            {record.user && (
              <ThemedView marginBottom={'five'}>
                <ThemedView
                  borderRadius={16}
                  overflow='hidden'
                  backgroundColor={Palette.surfaceBase}
                  shadowColor='#000'
                  shadowOpacity={0.06}
                  shadowRadius={8}
                  shadowOffset={{ width: 0, height: 2 }}
                  elevation={2}>
                  <UserCard user={record.user} onPress={() => {}} />
                </ThemedView>
              </ThemedView>
            )}

            {/* Transaction Details Section */}
            <ThemedView marginBottom={'five'}>
              <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={16} padding={'four'} gap={'four'}>
                {/* Bank */}
                <ThemedView flexDirection='row' justifyContent='space-between' alignItems='flex-start' gap={'three'}>
                  <ThemedText color={Palette.textSecondary} fontSize={14} flexShrink={0}>
                    Bank / Method
                  </ThemedText>
                  <ThemedView flex={1} alignItems='flex-end'>
                    <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} textAlign='right' style={{ flexShrink: 1 }}>
                      {record.bankName ? `${record.bankName} (${record.bankCode || ''})` : record.bankCode || '---'}
                    </ThemedText>
                    {record.cardHolderName ? (
                      <ThemedText
                        color={Palette.textSecondary}
                        fontFamily={FontFamily.medium}
                        fontSize={13}
                        marginTop={2}
                        textAlign='right'
                        style={{ flexShrink: 1 }}>
                        {record.cardHolderName}
                      </ThemedText>
                    ) : null}
                    <ThemedText
                      color={Palette.textSecondary}
                      fontFamily={FontFamily.regular}
                      fontSize={13}
                      marginTop={2}
                      textAlign='right'
                      style={{ flexShrink: 1 }}>
                      {record.cardNumber || '---'} • {record.method || '---'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView height={1} backgroundColor={Palette.borderSubtle} />

                {/* Promo */}
                {(record.promotionMoney || record.promotionAmount > 0) && (
                  <>
                    <ThemedView flexDirection='row' justifyContent='space-between' alignItems='flex-start' gap={'three'}>
                      <ThemedText color={Palette.textSecondary} fontSize={14}>
                        Promotion
                      </ThemedText>
                      <ThemedView flex={1} alignItems='flex-end'>
                        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} textAlign='right'>
                          {record.promotionMoney?.code || 'PROMO'}
                        </ThemedText>
                        <ThemedText color='#D92D20' fontFamily={FontFamily.semibold} fontSize={14} marginTop={2}>
                          -{Number(record.promotionAmount || 0).toLocaleString()} đ
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <ThemedView height={1} backgroundColor={Palette.borderSubtle} />
                  </>
                )}

                {/* Time */}
                <ThemedView flexDirection='row' justifyContent='space-between' alignItems='center' gap={'three'}>
                  <ThemedText color={Palette.textSecondary} fontSize={14}>
                    Time
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={14}>
                    {record.createdAt
                      ? new Date(record.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '---'}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <AppButton
              icon={<SymbolView name='arrow.up.right.circle.fill' resizeMode='scaleAspectFit' size={20} tintColor='#FFFFFF' />}
              label={record?.checkoutUrl ? 'Go to Checkout' : 'No Checkout URL'}
              onPress={handleCheckout}
              disabled={!record?.checkoutUrl}
              style={{ marginTop: 4 }}
            />
          </ThemedView>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetList: {
    paddingHorizontal: mhs(8),
  },
});
