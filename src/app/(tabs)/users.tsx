import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { UserCard } from 'features/users/components/user-card';
import { useInfiniteUsers } from 'features/users/hooks';
import type { UserListItem } from 'features/users/types';
import { AppButton, EmptyState } from 'shared/ui';

export default function UsersScreen() {
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
            <View style={styles.centerState}>
              <ActivityIndicator color={Palette.accent} />
              <Text style={styles.stateText}>Loading users</Text>
            </View>
          ) : usersQuery.isError ? (
            <View style={styles.centerState}>
              <EmptyState message='The user list could not be loaded.' title='Users unavailable' />
              <AppButton label='Retry' onPress={() => usersQuery.refetch()} />
            </View>
          ) : (
            <EmptyState message={search ? 'Try another ID, phone number, or email.' : 'No user records were returned.'} title='No users found' />
          )
        }
        ListFooterComponent={
          usersQuery.isFetchingNextPage ? (
            <ActivityIndicator color={Palette.accent} style={styles.footerLoader} />
          ) : usersQuery.isFetchNextPageError ? (
            <Pressable onPress={() => usersQuery.fetchNextPage()} style={styles.retryMore}>
              <Text style={styles.retryMoreText}>Retry loading more</Text>
            </Pressable>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.title}>Users</Text>
                <Text style={styles.subtitle}>
                  {totalItems.toLocaleString()} {totalItems === 1 ? 'account' : 'accounts'}
                </Text>
              </View>
              {searchInput ? (
                <Pressable onPress={() => setSearchInput('')} style={styles.clearButton}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
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
          </View>
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
  centerState: {
    gap: Spacing.four,
    paddingTop: Spacing.five,
  },
  clearButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  clearText: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    paddingBottom: 120,
  },
  footerLoader: {
    paddingVertical: Spacing.five,
  },
  header: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  retryMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  retryMoreText: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
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
  stateText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginTop: 3,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 27,
    letterSpacing: 0,
    lineHeight: 34,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
