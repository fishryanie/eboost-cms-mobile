import { useMutation, useQuery } from '@tanstack/react-query';
import { ThemedText, ThemedView } from 'components/base';
import { HeaderTitle } from 'components/base/HeaderTitle';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { AppButton } from 'components/ui';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CheckCircle2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { confirmAdminPassword, fetchUserLevels, getCollectionData, updateUserRanking } from 'shared/operation/operation-user-service';
import { UserCard } from 'shared/users/components/user-card';
import { useInfiniteUsers } from 'shared/users/hooks';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

function getUserLevelLabel(level?: UserLevel | null) {
  if (!level) return 'No rank';
  return level.nameVn || level.name_vn || level.name;
}

export default function ModifyRankingScreen() {
  const router = useRouter();
  const levelSheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />, []);

  // User search state
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');

  const usersQuery = useInfiniteUsers(query);
  const users = useMemo(() => usersQuery.data?.pages.flatMap(page => page.items) || [], [usersQuery.data]);
  
  const hasSearched = query.trim() !== '';
  const selectedUser = hasSearched ? users[0] : undefined;
  const selectedUserId = selectedUser?.id;

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(queryInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [queryInput]);

  // User Levels state
  const levelsQuery = useQuery({
    queryFn: fetchUserLevels,
    queryKey: ['operation', 'user-levels'],
  });
  const userLevels = useMemo(() => getCollectionData(levelsQuery.data), [levelsQuery.data]);

  const [selectedIriId, setSelectedIriId] = useState<string>('');

  // Modal state
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const onSubmit = () => {
    setIsModalVisible(true);
    setPassword('');
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error('User not selected');
      if (!selectedIriId) throw new Error('Ranking level not selected');

      // 1. Check admin password
      await confirmAdminPassword(password);

      // 2. Modify ranking
      return updateUserRanking({
        iriId: selectedIriId,
        userId: selectedUserId,
      });
    },
    onSuccess: () => {
      setIsModalVisible(false);
      setTimeout(() => {
        setIsSuccessModalVisible(true);
      }, 500);
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Transaction Failed', text2: error?.message || 'Failed to update ranking' });
    },
  });

  const selectedLevel = useMemo(() => userLevels.find(l => (l.iriId || `api/user_levels/${l.id}`) === selectedIriId), [userLevels, selectedIriId]);

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceRaised}>
      <HeaderTitle title='Change User Level' />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={20}>
          Change the membership level or ranking of a specific user. This may affect their privileges and benefits within the app.
        </ThemedText>

        <ThemedView gap={'six'} marginTop={16}>
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

            {usersQuery.isFetching && (
              <ThemedView alignItems='center' marginTop={16}>
                <ActivityIndicator color={Palette.accent} />
              </ThemedView>
            )}

            {hasSearched && users.length === 0 && !usersQuery.isFetching && (
              <ThemedText color={Palette.textSecondary} fontSize={12} marginTop={8}>
                No user found matching "{query}"
              </ThemedText>
            )}

            {hasSearched && selectedUser && (
              <ThemedView marginTop={16} style={styles.selectedUserContainer}>
                <ThemedView style={styles.selectedUserCard}>
                  <UserCard onPress={() => {}} user={selectedUser} />
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>

          {/* User Levels Selection */}
          <ThemedView marginTop={16}>
            {levelsQuery.isLoading ? (
              <ActivityIndicator color={Palette.accent} />
            ) : (
              <Pressable onPress={() => levelSheetRef.current?.present()}>
                <ThemedView pointerEvents="none">
                  <FloatingTextInput
                    label='* Select Ranking Level'
                    editable={false}
                    value={selectedLevel?.name || ''}
                    placeholder='Select a level'
                  />
                </ThemedView>
              </Pressable>
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>

      {/* Bottom Button */}
      <ThemedView backgroundColor={Palette.surfaceBase} paddingBottom={mhs(40)} paddingHorizontal={mhs(20)} paddingTop={mhs(16)}>
        <AppButton disabled={!selectedUserId || !selectedIriId} onPress={onSubmit}>
          Submit
        </AppButton>
      </ThemedView>

      <Modal
        avoidKeyboard
        isVisible={isModalVisible}
        onBackButtonPress={() => setIsModalVisible(false)}
        onBackdropPress={() => setIsModalVisible(false)}
        style={{ justifyContent: 'flex-end', margin: 0 }}>
        <ThemedView backgroundColor={Palette.surfaceBase} borderTopLeftRadius={24} borderTopRightRadius={24} gap={'six'} padding={24} paddingBottom={40}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} textAlign='center'>
            Security Confirmation
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} textAlign='center' marginTop={-8}>
            Please enter your admin password to confirm changing {selectedUser?.name || selectedUser?.username}'s level to {selectedLevel?.name}.
          </ThemedText>

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
            Ranking Changed Successfully
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} textAlign='center' marginTop={2} lineHeight={20}>
            You have successfully changed{' '}
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold}>
              {selectedUser?.name || selectedUser?.username}
            </ThemedText>
            's ranking to{' '}
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold}>
              {selectedLevel?.name}
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
                  router.replace({ pathname: '/user/[id]', params: { id: selectedUserId as number } });
                }}>
                View User
              </AppButton>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>

      <BottomSheetModal
        ref={levelSheetRef}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        snapPoints={['60%']}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} marginBottom={16}>
            Select Ranking Level
          </ThemedText>
          <ThemedView gap={'three'}>
            {userLevels.map((level: UserLevel) => {
              const iriIdValue = level.iriId || `/api/user_levels/${level.id}`;
              const selected = selectedIriId === iriIdValue;
              const backgroundColor = level.backgroundColor || Palette.accent;
              return (
                <Pressable
                  key={level.iriId || level.id}
                  onPress={() => {
                    setSelectedIriId(iriIdValue);
                    levelSheetRef.current?.dismiss();
                  }}
                  style={({ pressed }) => [styles.levelOption, selected && styles.levelOptionSelected, pressed && styles.pressed]}>
                  {level.image?.url ? (
                    <Image source={{ uri: level.image.url }} style={styles.levelImage} contentFit='contain' />
                  ) : (
                    <ThemedView style={[styles.levelDot, { backgroundColor }]} />
                  )}
                  <ThemedView flex={1} minWidth={0}>
                    <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14}>
                      {level.name}
                    </ThemedText>
                    <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} marginTop={2}>
                      {getUserLevelLabel(level)}
                    </ThemedText>
                  </ThemedView>
                  {selected ? <SymbolView name='checkmark.circle.fill' resizeMode='scaleAspectFit' size={22} tintColor={Palette.accent} /> : null}
                </Pressable>
              );
            })}
          </ThemedView>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: mhs(20),
    paddingTop: mhs(24),
    paddingBottom: mhs(40),
  },
  selectedUserContainer: {
    position: 'relative',
    borderRadius: mhs(16),
    overflow: 'hidden',
  },
  selectedUserCard: {
    backgroundColor: '#F0F9FF',
    borderColor: Palette.accent,
    borderWidth: 1.5,
    borderRadius: mhs(16),
    borderBottomWidth: 1.5,
    overflow: 'hidden',
  },
  levelOption: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceBase,
    borderColor: '#E2E8F0',
    borderRadius: mhs(12),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(12),
  },
  levelOptionSelected: {
    borderColor: Palette.accent,
    backgroundColor: '#F0FDF4', // Light green tint
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.7,
  },
  levelDot: {
    borderRadius: mhs(8),
    height: mhs(16),
    width: mhs(16),
  },
  levelImage: {
    height: mhs(24),
    width: mhs(24),
  },
});
