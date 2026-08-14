import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';

import * as Haptics from 'expo-haptics';
import { ArrowDownLeft, ArrowUpRight, Bike, ChevronDown } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { SectionHeading } from './user-profile-common';
import { formatCurrency, formatDate, getBalanceReason, numberFormatter, profileColors } from './user-profile-helpers';
import { UserProfileWalletFlow } from './user-profile-wallet-flow';

type BalanceFilter = 'all' | 'charging' | 'credit' | 'debit';

const initialVisibleCount = 15;
const visibleCountStep = 15;

const filterColors: Record<BalanceFilter, { color: string; surface: string }> = {
  all: { color: Palette.accentPressed, surface: profileColors.accentSurface },
  charging: { color: profileColors.info, surface: profileColors.infoSurface },
  credit: { color: '#067647', surface: '#ECFDF3' },
  debit: { color: '#C01048', surface: '#FFF1F3' },
};

export function UserProfileActivityTab({ user }: { user: UserProfile }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'six'}>
      <UserProfileWalletFlow user={user} />
      <BalanceHistory user={user} />
    </ThemedView>
  );
}

function BalanceHistory({ user }: { user: UserProfile }) {
  const [activeFilter, setActiveFilter] = useState<BalanceFilter>('all');
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const history = [...(user.balanceHistory || [])].sort(compareBalanceHistory);
  const counts = {
    all: history.length,
    charging: history.filter(isChargingEntry).length,
    credit: history.filter(isCreditEntry).length,
    debit: history.filter(isDebitEntry).length,
  };
  const filteredHistory = history.filter(item => matchesFilter(item, activeFilter));
  const visibleHistory = filteredHistory.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredHistory.length - visibleHistory.length);

  const selectFilter = (filter: BalanceFilter) => {
    if (filter === activeFilter) return;
    void Haptics.selectionAsync().catch(() => undefined);
    setActiveFilter(filter);
    setVisibleCount(initialVisibleCount);
  };

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading eyebrow='Ledger' subtitle='Wallet balance changes recorded for this account.' title='Balance history' />
      <ScrollView contentContainerStyle={{ gap: 8, paddingRight: 12 }} horizontal showsHorizontalScrollIndicator={false}>
        {(['all', 'charging', 'credit', 'debit'] as const).map(filter => (
          <BalanceFilterChip active={activeFilter === filter} count={counts[filter]} filter={filter} key={filter} onPress={() => selectFilter(filter)} />
        ))}
      </ScrollView>

      {visibleHistory.length > 0 ? (
        <ThemedView
          backgroundColor={Palette.surfaceRaised}
          borderColor={Palette.borderSubtle}
          borderCurve='continuous'
          borderRadius={16}
          borderWidth={1}
          overflow='hidden'
          paddingHorizontal={'three'}>
          {visibleHistory.map((item, index) => (
            <ThemedView backgroundColor='transparent' key={item.id}>
              {index > 0 ? <ThemedView backgroundColor={Palette.borderSubtle} height={1} /> : null}
              <BalanceHistoryRow item={item} />
            </ThemedView>
          ))}
          {remainingCount > 0 ? (
            <ThemedView backgroundColor='transparent'>
              <ThemedView backgroundColor={Palette.borderSubtle} height={1} />
              <Pressable
                accessibilityLabel={`Show ${Math.min(visibleCountStep, remainingCount)} more balance records`}
                accessibilityRole='button'
                onPress={() => setVisibleCount(current => current + visibleCountStep)}>
                {({ pressed }) => (
                  <ThemedView
                    alignItems='center'
                    backgroundColor='transparent'
                    flexDirection='row'
                    gap={'two'}
                    justifyContent='center'
                    minHeight={46}
                    opacity={pressed ? 0.65 : 1}>
                    <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={12}>
                      Show {Math.min(visibleCountStep, remainingCount)} more
                    </ThemedText>
                    <ChevronDown color={Palette.accent} size={15} strokeWidth={2.3} />
                  </ThemedView>
                )}
              </Pressable>
            </ThemedView>
          ) : null}
        </ThemedView>
      ) : (
        <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={16} gap={'two'} padding={'five'}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13}>
            No balance activity
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} textAlign='center'>
            No records match this filter.
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

function BalanceFilterChip({ active, count, filter, onPress }: { active: boolean; count: number; filter: BalanceFilter; onPress: () => void }) {
  const colors = filterColors[filter];
  const label = filter.charAt(0).toUpperCase() + filter.slice(1);

  return (
    <Pressable accessibilityRole='button' accessibilityState={{ selected: active }} onPress={onPress}>
      {({ pressed }) => (
        <ThemedView
          alignItems='center'
          backgroundColor={active ? colors.surface : Palette.surfaceRaised}
          borderColor={active ? colors.color : Palette.borderSubtle}
          borderRadius={'pill'}
          borderWidth={1}
          flexDirection='row'
          gap={'two'}
          height={38}
          opacity={pressed ? 0.68 : 1}
          paddingHorizontal={'three'}>
          {filter === 'charging' ? <Bike color={active ? colors.color : Palette.textSecondary} size={14} strokeWidth={2.2} /> : null}
          <ThemedText color={active ? colors.color : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12}>
            {label}
          </ThemedText>
          <ThemedText color={active ? colors.color : Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={11} selectable>
            {numberFormatter.format(count)}
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
}

function BalanceHistoryRow({ item }: { item: BalanceHistoryItem }) {
  const credit = isCreditEntry(item);
  const color = credit ? '#067647' : '#C01048';
  const surface = credit ? '#ECFDF3' : '#FFF1F3';
  const Icon = credit ? ArrowDownLeft : ArrowUpRight;
  const amount = `${credit ? '+' : '−'}${formatCurrency(Math.abs(Number(item.amount) || 0))}`;

  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'} minHeight={72} paddingVertical={'two'}>
      <ThemedView alignItems='center' backgroundColor={surface} borderRadius={11} height={36} justifyContent='center' width={36}>
        <Icon color={color} size={18} strokeWidth={2.2} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17} numberOfLines={1}>
          {getBalanceReason(item.reason)}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} numberOfLines={1}>
          {item.reason || `Record #${item.id}`}
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={13} numberOfLines={1}>
          {formatDate(item.createdAt)}
        </ThemedText>
      </ThemedView>
      <ThemedView alignItems='flex-end' backgroundColor='transparent' gap={3} maxWidth='35%'>
        <ThemedText adjustsFontSizeToFit color={color} fontFamily={FontFamily.bold} fontSize={12} minimumFontScale={0.75} numberOfLines={1} selectable>
          {amount}
        </ThemedText>
        <ThemedText
          adjustsFontSizeToFit
          color={Palette.textSecondary}
          fontFamily={FontFamily.medium}
          fontSize={9}
          minimumFontScale={0.72}
          numberOfLines={1}
          selectable>
          Balance {formatCurrency(item.wallet)}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function matchesFilter(item: BalanceHistoryItem, filter: BalanceFilter) {
  if (filter === 'charging') return isChargingEntry(item);
  if (filter === 'credit') return isCreditEntry(item);
  if (filter === 'debit') return isDebitEntry(item);
  return true;
}

function isChargingEntry(item: BalanceHistoryItem) {
  const reason = `${item.reason || ''}`.toUpperCase();
  return isDebitEntry(item) && (reason.includes('EBIKE') || reason.includes('ECAR') || reason.includes('EVD'));
}

function isCreditEntry(item: BalanceHistoryItem) {
  return item.balanceAction === '+';
}

function isDebitEntry(item: BalanceHistoryItem) {
  return item.balanceAction === '-';
}

function compareBalanceHistory(left: BalanceHistoryItem, right: BalanceHistoryItem) {
  const timeDifference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  return Number.isNaN(timeDifference) || timeDifference === 0 ? right.id - left.id : timeDifference;
}
