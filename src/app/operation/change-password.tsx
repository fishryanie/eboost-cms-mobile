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

import { UserCard } from 'shared/users/components/user-card';
import { useInfiniteUsers } from 'shared/users/hooks';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { apiRequest } from 'utils/api/client';

export default function ChangePasswordScreen() {
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
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Modal state
  const [adminPassword, setAdminPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const selectedUser = users[0];

  const onSubmit = () => {
    if (newPassword.length < 8 || newPassword.length > 40) {
      Toast.show({ type: 'error', text1: 'Invalid Password', text2: 'Password must be between 8 and 40 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Toast.show({ type: 'error', text1: 'Password Mismatch', text2: 'New password and confirmation do not match.' });
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
        data: { password: adminPassword },
      });

      if (confirmResponse?.success === false) {
        throw new Error(confirmResponse.message || 'Incorrect admin password');
      }

      // 2. Update password
      return apiRequest<{ message?: string; statusCode?: string; success?: boolean }>('api/controller/password/admin/update-password-user', {
        data: {
          id: selectedUser.id,
          password: newPassword,
        },
        method: 'POST',
      });
    },
    onSuccess: response => {
      if (response?.success === false || response?.statusCode === 'EVD011' || response?.statusCode === 'EVD013') {
        Toast.show({ type: 'error', text1: 'Change Password Failed', text2: response.message || 'Failed to process transaction' });
        return;
      }
      setIsModalVisible(false);
      setTimeout(() => {
        setIsSuccessModalVisible(true);
      }, 500);
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Change Password Failed', text2: error?.message || 'Failed to process transaction' });
    },
  });

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceRaised}>
      <HeaderTitle title='Change Password' />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={20}>
          Set a new password for a user. This is usually done when a user cannot reset their password via email. You must provide your admin password to
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

          {/* New Password */}
          <FloatingTextInput label='* New Password' isPassword onChangeText={setNewPassword} placeholder='Enter new password' value={newPassword} />

          {/* Confirm New Password */}
          <FloatingTextInput
            label='* Confirm New Password'
            isPassword
            onChangeText={setConfirmNewPassword}
            placeholder='Re-enter new password'
            value={confirmNewPassword}
          />
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!(query !== '' && users.length > 0) || !newPassword || !confirmNewPassword} onPress={onSubmit} title='Submit' />

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
              Are you sure you want to change the password for this user? This action requires your admin password.
            </ThemedText>
          </ThemedView>

          {/* Admin Password Input */}
          <FloatingTextInput
            isPassword
            label='* Admin Password'
            onChangeText={setAdminPassword}
            placeholder='Please enter admin password'
            value={adminPassword}
          />

          <AppButton disabled={!adminPassword || isPending} loading={isPending} onPress={() => mutate()}>
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
            Password Updated Successfully
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} textAlign='center' marginTop={2} lineHeight={20}>
            The password for{' '}
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold}>
              {selectedUser?.name || selectedUser?.username}
            </ThemedText>{' '}
            has been updated successfully.
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
