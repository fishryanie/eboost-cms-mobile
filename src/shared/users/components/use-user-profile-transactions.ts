import { type InfiniteData, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { cmsPageConfigs } from 'shared/cms-pages/config';
import {
  buildTransactionApiFilters,
  createDefaultTransactionFilters,
  getTransactionActiveFilterCount,
  type TransactionFilterValues,
  type TransactionVehicle,
} from 'shared/cms-pages/transaction-filter-sheet';
import { fetchCmsSectionPage, type CmsPage } from 'shared/cms-pages/service';

function lockToUser(values: TransactionFilterValues, userId: string): TransactionFilterValues {
  return { ...values, source: 'eboost', userId };
}

export function useUserProfileTransactions(userId: string, enabled: boolean) {
  const [vehicle, setVehicle] = useState<TransactionVehicle>('car');
  const [filters, setFilters] = useState<TransactionFilterValues>(() => createDefaultTransactionFilters(userId));
  const [filterDraft, setFilterDraft] = useState<TransactionFilterValues>(() => createDefaultTransactionFilters(userId));
  const [filterVisible, setFilterVisible] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const section = cmsPageConfigs.transactions.sections.find(candidate => candidate.key === vehicle) || cmsPageConfigs.transactions.sections[0];
  const lockedFilters = lockToUser(filters, userId);
  const apiFilters = buildTransactionApiFilters(lockedFilters, vehicle);

  const query = useInfiniteQuery<CmsPage, Error, InfiniteData<CmsPage>, readonly unknown[], number>({
    enabled: enabled && Boolean(userId),
    getNextPageParam: lastPage => lastPage.nextPage,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) => fetchCmsSectionPage({ filters: apiFilters, page: pageParam, search: '', section }),
    queryKey: ['user-profile-transactions', userId, section.endpoint, vehicle, apiFilters],
  });

  const items = query.data?.pages.flatMap(page => page.items) || [];
  const totalItems = query.data?.pages[0]?.totalItems || 0;

  function changeFilters(values: Partial<TransactionFilterValues>) {
    setFilters(current => lockToUser({ ...current, ...values }, userId));
  }

  function applyFilters(values: TransactionFilterValues) {
    const nextValues = lockToUser(values, userId);
    setFilters(nextValues);
    setFilterDraft(nextValues);
  }

  function changeVehicle(nextVehicle: TransactionVehicle) {
    setVehicle(nextVehicle);
  }

  function openFilters() {
    setFilterDraft(lockToUser(filters, userId));
    setFilterVisible(true);
  }

  function refresh() {
    setIsPullRefreshing(true);
    return query.refetch().finally(() => setIsPullRefreshing(false));
  }

  function loadMore() {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }

  return {
    activeFilterCount: getTransactionActiveFilterCount(lockedFilters, vehicle, userId),
    applyFilters,
    changeFilters,
    changeVehicle,
    closeFilters: () => setFilterVisible(false),
    error: query.error,
    filterDraft,
    filters: lockedFilters,
    filterVisible,
    hasNextPage: query.hasNextPage,
    isError: query.isError,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isPullRefreshing,
    items,
    loadMore,
    openFilters,
    refresh,
    refetch: query.refetch,
    setFilterDraft: (values: TransactionFilterValues) => setFilterDraft(lockToUser(values, userId)),
    totalItems,
    vehicle,
  };
}

export type UserProfileTransactionsController = ReturnType<typeof useUserProfileTransactions>;
