import { mhs } from 'themes/scaling';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { UserCard } from 'shared/users/components/user-card';
import { useInfiniteUsers } from 'shared/users/hooks';
import { AppButton, EmptyState } from 'components/ui';

export default function UsersScreen({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const usersQuery = useInfiniteUsers(search);
  const users = useMemo(() => usersQuery.data?.pages.flatMap(page => page.items) || [], [usersQuery.data]);
  const totalItems = usersQuery.data?.pages[0]?.totalItems || 0;

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadMore = useCallback(() => {
    if (usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) {
      void usersQuery.fetchNextPage();
    }
  }, [usersQuery]);

  const renderUser = useCallback(
    ({ item }: { item: UserListItem }) => <UserCard onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.id } })} user={item} />,
    [router],
  );

  return (
    <ThemedView safePaddingTop flex={1} backgroundColor={Palette.surfaceBase}>
      <FlatList
        contentContainerStyle={styles.content}
        data={users}
        keyboardShouldPersistTaps='handled'
        keyExtractor={user => String(user.id)}
        ListEmptyComponent={
          usersQuery.isLoading ? (
            <ThemedView gap={'four'} paddingTop={'five'}>
              <ThemedView borderRadius={'large'} height={88} loading />
              <ThemedView borderRadius={'large'} height={88} loading />
              <ThemedView borderRadius={'large'} height={88} loading />
            </ThemedView>
          ) : usersQuery.isError ? (
            <ThemedView gap={'four'} paddingTop={'five'}>
              <EmptyState message='The user list could not be loaded.' title='Users unavailable' />
              <AppButton label='Retry' onPress={() => usersQuery.refetch()} />
            </ThemedView>
          ) : (
            <EmptyState message={search ? 'Try another ID, phone number, or email.' : 'No user records were returned.'} title='No users found' />
          )
        }
        ListFooterComponent={
          usersQuery.isFetchingNextPage ? (
            <ThemedView alignSelf='center' borderRadius={'pill'} height={18} loading marginVertical={24} width={132} />
          ) : usersQuery.isFetchNextPageError ? (
            <Pressable onPress={() => usersQuery.fetchNextPage()} style={styles.retryMore}>
              <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={14} lineHeight={20}>
                Retry loading more
              </ThemedText>
            </Pressable>
          ) : null
        }
        ListHeaderComponent={
          <ThemedView gap={'four'} padding={'four'}>
            <ThemedView alignItems='center' flexDirection='row' gap={'three'} justifyContent='space-between'>
              {onBack ? (
                <Pressable
                  accessibilityLabel='Back'
                  accessibilityRole='button'
                  onPress={onBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                  <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
                </Pressable>
              ) : null}
              <ThemedView flex={1} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={27} letterSpacing={0} lineHeight={34}>
                  Users
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} marginTop={3}>
                  {totalItems.toLocaleString()} {totalItems === 1 ? 'account' : 'accounts'}
                </ThemedText>
              </ThemedView>
              {searchInput ? (
                <Pressable onPress={() => setSearchInput('')} style={styles.clearButton}>
                  <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={14} lineHeight={20}>
                    Clear
                  </ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>
            <TextInput
              autoCapitalize='none'
              autoCorrect={false}
              onChangeText={setSearchInput}
              placeholder='Search ID, phone, or email'
              placeholderTextColor='#98A2B3'
              returnKeyType='search'
              style={styles.search}
              value={searchInput}
            />
          </ThemedView>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            onRefresh={() => usersQuery.refetch()}
            refreshing={usersQuery.isRefetching && !usersQuery.isFetchingNextPage}
            tintColor={Palette.accent}
          />
        }
        renderItem={renderUser}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  clearButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  content: {
    paddingBottom: 120,
  },
  footerLoader: {
    paddingVertical: mhs(24),
  },
  retryMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },

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
  pressed: {
    opacity: 0.72,
  },
});
