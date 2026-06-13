import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { UserCard } from 'features/users/components/user-card';
import { useInfiniteUsers } from 'features/users/hooks';
import type { UserListItem } from 'features/users/types';
import { AppButton, EmptyState } from 'shared/ui';

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
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={users}
        keyboardShouldPersistTaps='handled'
        keyExtractor={user => String(user.id)}
        ListEmptyComponent={
          usersQuery.isLoading ? (
            <ThemedView gap={Spacing.four} paddingTop={Spacing.five}>
              <ActivityIndicator color={Palette.accent} />
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20} textAlign='center'>
                Loading users
              </ThemedText>
            </ThemedView>
          ) : usersQuery.isError ? (
            <ThemedView gap={Spacing.four} paddingTop={Spacing.five}>
              <EmptyState message='The user list could not be loaded.' title='Users unavailable' />
              <AppButton label='Retry' onPress={() => usersQuery.refetch()} />
            </ThemedView>
          ) : (
            <EmptyState message={search ? 'Try another ID, phone number, or email.' : 'No user records were returned.'} title='No users found' />
          )
        }
        ListFooterComponent={
          usersQuery.isFetchingNextPage ? (
            <ActivityIndicator color={Palette.accent} style={styles.footerLoader} />
          ) : usersQuery.isFetchNextPageError ? (
            <Pressable onPress={() => usersQuery.fetchNextPage()} style={styles.retryMore}>
              <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={14} lineHeight={20}>
                Retry loading more
              </ThemedText>
            </Pressable>
          ) : null
        }
        ListHeaderComponent={
          <ThemedView gap={Spacing.four} padding={Spacing.four}>
            <ThemedView alignItems='center' flexDirection='row' gap={Spacing.three} justifyContent='space-between'>
              {onBack ? (
                <Pressable accessibilityLabel='Back' accessibilityRole='button' onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: Radius.medium,
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
    paddingVertical: Spacing.five,
  },
  retryMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  search: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: Radius.large,
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    height: 48,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.72,
  },
});
