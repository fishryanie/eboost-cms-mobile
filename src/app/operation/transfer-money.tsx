import { useMutation } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { BottomButton } from 'components/base/BottomButton';
import { HeaderTitle } from 'components/base/HeaderTitle';
import { AppButton } from 'components/ui';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowDownUp, ArrowRight, CheckCircle2, Info, User } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { transferMoneyUsers } from 'shared/operation/operation-user-service';
import { UserCard } from 'shared/users/components/user-card';
import { useInfiniteUsers } from 'shared/users/hooks';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { apiRequest } from 'utils/api/client';

export default function TransferMoneyScreen() {
  const router = useRouter();

  // Sender search state
  const [senderQueryInput, setSenderQueryInput] = useState('');
  const [senderQuery, setSenderQuery] = useState('');

  const senderUsersQuery = useInfiniteUsers(senderQuery);
  const senderUsers = useMemo(() => senderUsersQuery.data?.pages.flatMap(page => page.items) || [], [senderUsersQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSenderQuery(senderQueryInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [senderQueryInput]);

  // Receiver search state
  const [receiverQueryInput, setReceiverQueryInput] = useState('');
  const [receiverQuery, setReceiverQuery] = useState('');

  const receiverUsersQuery = useInfiniteUsers(receiverQuery);
  const receiverUsers = useMemo(() => receiverUsersQuery.data?.pages.flatMap(page => page.items) || [], [receiverUsersQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setReceiverQuery(receiverQueryInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [receiverQueryInput]);

  // Form state
  const [amount, setAmount] = useState('');

  const handleSwap = () => {
    const tempInput = senderQueryInput;
    const tempQuery = senderQuery;

    setSenderQueryInput(receiverQueryInput);
    setSenderQuery(receiverQuery);

    setReceiverQueryInput(tempInput);
    setReceiverQuery(tempQuery);
  };

  // Modal state
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const senderUser = senderQuery !== '' ? senderUsers[0] : null;
  const receiverUser = receiverQuery !== '' ? receiverUsers[0] : null;

  const onSubmit = () => {
    setIsModalVisible(true);
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const senderUserId = senderUser?.id;
      const receiverUserId = receiverUser?.id;

      if (!senderUserId || !receiverUserId) throw new Error('Sender and Receiver must be selected');

      // 1. Check admin password
      await apiRequest('api/controller/password/admin/confirm-password', {
        method: 'POST',
        data: { password },
      });

      // 2. Transfer money
      const parsedAmount = amount ? Number(amount.replace(/[^0-9]/g, '')) : undefined;

      return transferMoneyUsers({
        amount: parsedAmount,
        from: senderUserId,
        to: receiverUserId,
      });
    },
    onSuccess: () => {
      setIsModalVisible(false);
      setTimeout(() => {
        setIsSuccessModalVisible(true);
      }, 500);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Transaction Failed',
        text2: error?.message || 'Failed to process transaction',
      });
    },
  });

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceRaised}>
      <HeaderTitle title='Transfer Money' />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'six'}>
          <ThemedView backgroundColor={Palette.surfaceBase}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={20}>
              Securely move funds from a sender's wallet to a receiver's wallet. This action transfers the actual wallet balance and requires Admin verification
              to complete. Leaving the amount empty will transfer the sender's entire balance.
            </ThemedText>
          </ThemedView>
          {/* Sender Search Input & Results */}
          <ThemedView>
            <FloatingTextInput
              label='* Sender'
              autoCapitalize='none'
              autoCorrect={false}
              onChangeText={setSenderQueryInput}
              onClear={() => setSenderQueryInput('')}
              placeholder='Search sender user id, name, email, phone'
              returnKeyType='search'
              value={senderQueryInput}
            />

            {senderQuery !== '' && (
              <ThemedView gap={'two'} marginTop={12}>
                {senderUsersQuery.isLoading ? (
                  <ThemedView borderRadius={'large'} height={84} loading />
                ) : senderUsers.length > 0 ? (
                  <UserCard
                    user={senderUsers[0]}
                    onPress={() => {}}
                    style={{
                      backgroundColor: Palette.antiFlashWhite,
                      borderRadius: mhs(16),
                      overflow: 'hidden',
                    }}
                  />
                ) : (
                  <ThemedText color={Palette.textSecondary} fontSize={13}>
                    No sender found.
                  </ThemedText>
                )}
              </ThemedView>
            )}
          </ThemedView>

          {/* Swap Button */}
          <ThemedView alignItems='center' zIndex={10}>
            <Pressable
              onPress={handleSwap}
              style={({ pressed }) => ({
                backgroundColor: Palette.antiFlashWhite,
                padding: mhs(8),
                borderRadius: mhs(20),
                borderWidth: 1,
                borderColor: '#E5E7EB',
                marginTop: mhs(-12),
                marginBottom: mhs(-12),
                opacity: pressed ? 0.7 : 1,
              })}>
              <ArrowDownUp color={Palette.textSecondary} size={20} />
            </Pressable>
          </ThemedView>

          {/* Receiver Search Input & Results */}
          <ThemedView>
            <FloatingTextInput
              label='* Receiver'
              autoCapitalize='none'
              autoCorrect={false}
              onChangeText={setReceiverQueryInput}
              onClear={() => setReceiverQueryInput('')}
              placeholder='Search receiver user id, name, email, phone'
              returnKeyType='search'
              value={receiverQueryInput}
            />

            {receiverQuery !== '' && (
              <ThemedView gap={'two'} marginTop={12}>
                {receiverUsersQuery.isLoading ? (
                  <ThemedView borderRadius={'large'} height={84} loading />
                ) : receiverUsers.length > 0 ? (
                  <UserCard
                    user={receiverUsers[0]}
                    onPress={() => {}}
                    style={{
                      backgroundColor: Palette.antiFlashWhite,
                      borderRadius: mhs(16),
                      overflow: 'hidden',
                    }}
                  />
                ) : (
                  <ThemedText color={Palette.textSecondary} fontSize={13}>
                    No receiver found.
                  </ThemedText>
                )}
              </ThemedView>
            )}
          </ThemedView>

          {/* Transfer Amount */}
          <FloatingTextInput label='Transfer amount' isMoney onChangeText={setAmount} placeholder='Empty means transfer full balance' value={amount} />
        </ThemedView>
      </ScrollView>
      <BottomButton
        disabled={!(senderQuery !== '' && senderUsers.length > 0) || !(receiverQuery !== '' && receiverUsers.length > 0)}
        onPress={onSubmit}
        title='Submit'
      />

      <Modal
        avoidKeyboard
        isVisible={isModalVisible}
        onBackButtonPress={() => setIsModalVisible(false)}
        onBackdropPress={() => setIsModalVisible(false)}
        style={{ margin: mhs(20), justifyContent: 'center' }}>
        <ThemedView backgroundColor={Palette.surfaceBase} borderRadius={16} gap={'six'} padding={20}>
          {/* Security Confirmation Banner */}
          <ThemedView alignItems='flex-start' backgroundColor='#FFF8E1' borderColor='#FFD54F' borderRadius={8} borderWidth={1} flexDirection='row' padding={12}>
            <Info color='#F59E0B' size={mhs(20)} style={{ marginTop: mhs(2) }} />
            <ThemedView flex={1} marginLeft={8} gap={'one'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={16}>
                Security Confirmation
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={14}>
                Once confirmed, the money will be transferred immediately and cannot be reversed.
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Transfer Info Card */}
          <ThemedView
            borderRadius={12}
            flexDirection='row'
            alignItems='center'
            backgroundColor='#F0FDF4'
            justifyContent='space-between'
            style={{ padding: mhs(12), overflow: 'hidden' }}>
            {/* Sender */}
            <ThemedView alignItems='center' flex={1}>
              <ThemedView width={40} height={40} borderRadius={20} backgroundColor='#E2E8F0' alignItems='center' justifyContent='center' overflow='hidden'>
                {(senderUser as any)?.avatar ? (
                  <Image source={{ uri: (senderUser as any)?.avatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <User color='#94A3B8' size={20} />
                )}
              </ThemedView>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} marginTop={8} numberOfLines={1}>
                {senderUser?.name || senderUser?.username || 'Sender'}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} marginTop={2}>
                SENDER
              </ThemedText>
            </ThemedView>

            {/* Amount & Arrow */}
            <ThemedView alignItems='center' flex={1} paddingHorizontal={4}>
              <ThemedView width={32} height={32} borderRadius={16} backgroundColor='#D1FAE5' alignItems='center' justifyContent='center'>
                <ArrowRight color='#10B981' size={16} />
              </ThemedView>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} marginTop={8} numberOfLines={1} adjustsFontSizeToFit>
                {amount ? `${amount} đ` : 'Full Balance'}
              </ThemedText>
            </ThemedView>

            {/* Receiver */}
            <ThemedView alignItems='center' flex={1}>
              <ThemedView width={40} height={40} borderRadius={20} backgroundColor='#E2E8F0' alignItems='center' justifyContent='center' overflow='hidden'>
                {(receiverUser as any)?.avatar ? (
                  <Image source={{ uri: (receiverUser as any)?.avatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <User color='#94A3B8' size={20} />
                )}
              </ThemedView>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} marginTop={8} numberOfLines={1}>
                {receiverUser?.name || receiverUser?.username || 'Receiver'}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} marginTop={2}>
                RECEIVER
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Details */}
          <ThemedView gap={'three'} marginTop={8}>
            <ThemedView flexDirection='row' justifyContent='space-between'>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14}>
                Internal Transfer
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={14}>
                Free of charge
              </ThemedText>
            </ThemedView>
            <ThemedView flexDirection='row' justifyContent='space-between'>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14}>
                Sender Balance After
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14}>
                {(() => {
                  const transferAmount = amount ? Number(amount.replace(/[^0-9]/g, '')) : senderUser?.balance || 0;
                  const balanceAfter = (senderUser?.balance || 0) - transferAmount;
                  return Intl.NumberFormat('en-US').format(balanceAfter);
                })()}{' '}
                đ
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Admin Password Input */}
          <FloatingTextInput isPassword label='* Admin Password' onChangeText={setPassword} placeholder='Please enter password' value={password} />

          <AppButton disabled={!password || isPending} loading={isPending} onPress={() => mutate()}>
            Confirm
          </AppButton>
        </ThemedView>
      </Modal>

      <Modal
        isVisible={isSuccessModalVisible}
        onBackButtonPress={() => {
          setIsSuccessModalVisible(false);
          router.back();
        }}
        onBackdropPress={() => {
          setIsSuccessModalVisible(false);
          router.back();
        }}
        style={{ margin: mhs(20), justifyContent: 'center' }}>
        <ThemedView backgroundColor={Palette.surfaceBase} borderRadius={16} gap={'six'} padding={24} alignItems='center'>
          <ThemedView width={64} height={64} borderRadius={32} backgroundColor='#D1FAE5' alignItems='center' justifyContent='center' marginBottom={8}>
            <CheckCircle2 color='#10B981' size={32} />
          </ThemedView>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} textAlign='center'>
            Transaction Successful
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} textAlign='center' marginTop={2} lineHeight={20}>
            You have successfully transferred{' '}
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold}>
              {amount ? `${amount} đ` : 'Full Balance'}
            </ThemedText>{' '}
            to{' '}
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold}>
              {receiverUser?.name || receiverUser?.username}
            </ThemedText>
            .
          </ThemedText>

          <ThemedView flexDirection='row' gap={'four'} marginTop={20} width='100%'>
            <ThemedView flex={1}>
              <AppButton
                onPress={() => {
                  setIsSuccessModalVisible(false);
                  router.back();
                }}
                style={{ backgroundColor: Palette.antiFlashWhite }}
                textStyle={{ color: Palette.textPrimary }}>
                Close
              </AppButton>
            </ThemedView>
            <ThemedView flex={1}>
              <AppButton
                onPress={() => {
                  setIsSuccessModalVisible(false);
                  router.replace({ pathname: '/user/[id]', params: { id: receiverUser?.id as number } });
                }}>
                View Receiver
              </AppButton>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: mhs(20),
    paddingTop: mhs(24),
    paddingBottom: mhs(40),
  },
});
