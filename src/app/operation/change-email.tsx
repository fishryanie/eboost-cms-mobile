import { useMutation } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { BottomButton } from 'components/base/BottomButton';
import { HeaderTitle } from 'components/base/HeaderTitle';
import { AppButton } from 'components/ui';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { CheckCircle2, Info } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { updateUserEmail } from 'shared/operation/operation-user-service';
import { UserCard } from 'shared/users/components/user-card';
import { useInfiniteUsers } from 'shared/users/hooks';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { apiRequest } from 'utils/api/client';

export default function ChangeEmailScreen() {
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
  const [email, setEmail] = useState('');

  // Modal state
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const selectedUser = users[0];

  const onSubmit = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Toast.show({ type: 'error', text1: 'Invalid Email', text2: 'Please enter a valid email address.' });
      return;
    }
    if (trimmedEmail.toLowerCase() === selectedUser?.email?.trim().toLowerCase()) {
      Toast.show({ type: 'error', text1: 'Same Email', text2: 'New email must be different from current email.' });
      return;
    }
    setIsModalVisible(true);
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      if (!selectedUser?.id) throw new Error('User not selected');

      // 1. Check admin password
      const confirmResponse = await apiRequest<{ message?: string; success?: boolean }>('api/controller/password/admin/confirm-password', {
        method: 'POST',
        data: { password },
      });

      if (confirmResponse?.success === false) {
        throw new Error(confirmResponse.message || 'Incorrect password');
      }

      // 2. Update email
      return updateUserEmail({
        email: email.trim(),
        userId: selectedUser.id,
      });
    },
    onSuccess: response => {
      if (response?.success === false) {
        Toast.show({ type: 'error', text1: 'Change Email Failed', text2: response.message || 'Failed to process transaction' });
        return;
      }
      setIsModalVisible(false);
      setTimeout(() => {
        setIsSuccessModalVisible(true);
      }, 500);
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Change Email Failed', text2: error?.message || 'Failed to process transaction' });
    },
  });

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceRaised}>
      <HeaderTitle title='Change Email' />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={20}>
          Update a user's registered email address. This will replace their old email for login and communications. You must provide your admin password to
          confirm.
        </ThemedText>

        <ThemedView gap={'six'} marginTop={24}>
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
                  <ThemedView borderRadius={'large'} height={84} loading />
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

          {/* New Email */}
          <FloatingTextInput
            label='* New Email'
            autoCapitalize='none'
            keyboardType='email-address'
            onChangeText={setEmail}
            placeholder='Enter new email address'
            value={email}
          />
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!(query !== '' && users.length > 0) || !email} onPress={onSubmit} title='Submit' />

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
              Are you sure you want to change the email address for this user? This action requires your admin password.
            </ThemedText>
          </ThemedView>

          <ThemedView alignItems='center' paddingVertical={16}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={14} marginBottom={8}>
              New Email
            </ThemedText>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={20} textAlign='center'>
              {email}
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
            Email Updated Successfully
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} textAlign='center' marginTop={2} lineHeight={20}>
            The email address for{' '}
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold}>
              {selectedUser?.name || selectedUser?.username}
            </ThemedText>{' '}
            has been updated to{' '}
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold}>
              {email}
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
                  router.replace({ pathname: '/user/[id]', params: { id: selectedUser?.id as number } });
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
});
