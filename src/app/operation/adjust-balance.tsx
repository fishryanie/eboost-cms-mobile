import { useMutation } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { BottomButton } from 'components/base/BottomButton';
import { HeaderTitle } from 'components/base/HeaderTitle';
import SegmentedControl from 'components/organisms/segmented-control';
import { AppButton } from 'components/ui';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { CheckCircle2, Info } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { UserCard } from 'shared/users/components/user-card';
import { useInfiniteUsers } from 'shared/users/hooks';
import { FontFamily, Palette } from 'themes';
import { mhs, width } from 'themes/scaling';
import { apiRequest } from 'utils/api/client';

export default function AdjustBalanceScreen() {
  const router = useRouter();

  // User search state
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');

  const usersQuery = useInfiniteUsers(query);
  const users = useMemo(() => usersQuery.data?.pages.flatMap(page => page.items) || [], [usersQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(queryInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [queryInput]);

  // Form state
  const [type, setType] = useState('plus');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  // Modal state
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const selectedUserId = users[0]?.id;

  const onSubmit = () => {
    setIsModalVisible(true);
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error('User not selected');

      // 1. Check admin password
      await apiRequest('api/controller/password/admin/confirm-password', {
        method: 'POST',
        data: { password },
      });

      // 2. Adjust balance
      const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
      const endpoint = type === 'plus' ? 'api/controller/balance/plus_wallet' : 'api/controller/balance/deduct_wallet';

      return apiRequest(endpoint, {
        method: 'PUT',
        data: {
          amount: parsedAmount,
          reason,
          userId: selectedUserId,
        },
      });
    },
    onSuccess: () => {
      setIsModalVisible(false);
      setTimeout(() => {
        setIsSuccessModalVisible(true);
      }, 500);
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Transaction Failed', text2: error?.message || 'Failed to process transaction' });
    },
  });

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceRaised}>
      <HeaderTitle title='Adjust Balance' />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={20}>
          Manually add (+) or deduct (-) funds from a specific user's wallet. This is typically used for refunds, compensations, or corrections. You must
          provide a clear reason for auditing purposes.
        </ThemedText>
        {/* Transaction Type */}
        <SegmentedControl
          segmentedControlBackgroundColor={Palette.antiFlashWhite}
          activeSegmentBackgroundColor={Palette.accent}
          borderRadius={mhs(16)}
          currentIndex={type === 'plus' ? 0 : 1}
          onChange={index => setType(index === 0 ? 'plus' : 'deduct')}
          width={width - mhs(40)}>
          <ThemedText color={type === 'plus' ? '#FFF' : Palette.textPrimary} fontFamily={FontFamily.medium} textAlign='center'>
            Plus
          </ThemedText>
          <ThemedText color={type === 'deduct' ? '#FFF' : Palette.textPrimary} fontFamily={FontFamily.medium} textAlign='center'>
            Deduct
          </ThemedText>
        </SegmentedControl>
        <ThemedView gap={'six'}>
          {/* User Search Input & Results */}
          <ThemedView>
            <FloatingTextInput
              label='* User'
              autoCapitalize='none'
              autoCorrect={false}
              onChangeText={setQueryInput}
              onClear={() => setQueryInput('')}
              placeholder='Search user id, name, email, phone'
              returnKeyType='search'
              value={queryInput}
            />

            {query !== '' && (
              <ThemedView gap={'two'} marginTop={12}>
                {usersQuery.isLoading ? (
                  <ActivityIndicator color={Palette.accent} style={{ alignSelf: 'center' }} />
                ) : users.length > 0 ? (
                  <UserCard
                    user={users[0]}
                    onPress={() => {}}
                    style={{
                      backgroundColor: Palette.antiFlashWhite,
                      borderRadius: mhs(16),
                      overflow: 'hidden',
                    }}
                  />
                ) : (
                  <ThemedText color={Palette.textSecondary} fontSize={13}>
                    No user found.
                  </ThemedText>
                )}
              </ThemedView>
            )}
          </ThemedView>

          {/* Transfer Amount */}
          <FloatingTextInput label='* Transfer amount' isMoney onChangeText={setAmount} placeholder='Enter amount' value={amount} />

          {/* Reason */}
          <FloatingTextInput label='* Reason' onChangeText={setReason} placeholder='Enter reason for this transaction' value={reason} />
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!(query !== '' && users.length > 0) || !amount || !reason} onPress={onSubmit} title='Submit' />

      <Modal
        avoidKeyboard
        isVisible={isModalVisible}
        onBackButtonPress={() => setIsModalVisible(false)}
        onBackdropPress={() => setIsModalVisible(false)}
        style={{ margin: mhs(20), justifyContent: 'center' }}>
        <ThemedView backgroundColor={Palette.surfaceBase} borderRadius={16} gap={'six'} padding={20}>
          {/* Warning Banner */}
          <ThemedView alignItems='flex-start' backgroundColor='#FFF8E1' borderColor='#FFD54F' borderRadius={8} borderWidth={1} flexDirection='row' padding={12}>
            <Info color='#F59E0B' size={mhs(20)} style={{ marginTop: mhs(2) }} />
            <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.regular} fontSize={14} marginLeft={8}>
              Once the transfer is confirmed, the funds will be directly deposited into the recipient's account and cannot be refunded.
            </ThemedText>
          </ThemedView>

          {/* Prominent Transfer Amount */}
          <ThemedView alignItems='center' paddingVertical={16}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={14} marginBottom={8}>
              Transfer amount
            </ThemedText>
            <ThemedText color={type === 'plus' ? Palette.accent : Palette.danger} fontFamily={FontFamily.bold} fontSize={36}>
              {type === 'plus' ? '+' : '-'}
              {amount} đ
            </ThemedText>
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
            You have successfully {type === 'plus' ? 'added' : 'deducted'}{' '}
            <ThemedText color={type === 'plus' ? Palette.accent : Palette.danger} fontFamily={FontFamily.bold}>
              {amount} đ
            </ThemedText>{' '}
            {type === 'plus' ? 'to' : 'from'}{' '}
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold}>
              {users[0]?.name || users[0]?.username}
            </ThemedText>
            's wallet.
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
                  router.replace({ pathname: '/user/[id]', params: { id: selectedUserId as number } });
                }}>
                View User
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
  input: {
    // borderColor: '#D0D5DD',
    borderRadius: mhs(8),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    height: mhs(44),
    paddingHorizontal: mhs(12),
  },
  textArea: {
    borderColor: '#D0D5DD',
    borderRadius: mhs(8),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    height: mhs(100),
    padding: mhs(12),
  },
  segmented: {
    backgroundColor: '#F2F4F7',
    borderRadius: mhs(22),
    height: mhs(44),
    padding: mhs(4),
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: mhs(18),
    flex: 1,
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: '#0F9F6E', // Green color from screenshot
  },
  stepperContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: mhs(20),
    paddingVertical: mhs(20),
  },
  selectedUserContainer: {
    position: 'relative',
    borderRadius: mhs(16),
    overflow: 'hidden',
  },
  selectedUserCard: {
    backgroundColor: '#F0F9FF', // Light blue tint
    borderColor: Palette.accent,
    borderWidth: 1.5,
    borderRadius: mhs(16),
    borderBottomWidth: 1.5,
    overflow: 'hidden',
  },
  clearUserBtn: {
    position: 'absolute',
    right: mhs(12),
    top: mhs(12),
  },
});
