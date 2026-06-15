import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { Cable, Copy, Zap, MapPin, User } from 'lucide-react-native';
import { useState } from 'react';

import { ThemedText, ThemedView } from 'components/base';
import { SearchBar } from 'components/molecules/search-bar';
import { AnimatedHeaderScrollView } from 'components/organisms/animated-header-scrollview';
import { EmptyState } from 'shared/ui';
import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { fetchOngoingSessions } from 'features/technical/technical-service';
import type { OngoingSessionRecord } from 'features/technical/types';

export default function OngoingSessionsRoute() {
  const router = useRouter();
  const [page] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryFn: () => fetchOngoingSessions({ page, search, status: 'Charging' }),
    queryKey: ['technical', 'ongoing-sessions', { page, search, status: 'Charging' }],
  });

  const handleCopy = (text?: string) => {
    if (text) {
      console.log('Copy:', text);
    }
  };

  const formatUnixTime = (unix?: number) => {
    if (!unix) return '-';
    const date = new Date(unix * 1000);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatDuration = (start?: number, end?: number) => {
    if (!start || !end) return '00:00:00';
    const seconds = end - start;
    if (seconds < 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderItem = (item: OngoingSessionRecord) => {
    const session = item.charging_session;

    return (
      <ThemedView
        backgroundColor={Palette.surfaceBase}
        borderColor={Palette.borderSubtle}
        borderRadius={Radius.large}
        borderWidth={1}
        gap={Spacing.three}
        marginBottom={Spacing.three}
        padding={Spacing.three}
      >
        {/* Header */}
        <ThemedView alignItems="center" flexDirection="row" justifyContent="space-between">
          <ThemedView alignItems="center" flexDirection="row" gap={Spacing.two}>
            <Cable color="#0284c7" size={18} />
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={18}>
              {item.boxId || item.vendorId}
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems="center" flexDirection="row" gap={Spacing.two}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
              Conn {item.connectorId}
            </ThemedText>
            <ThemedView backgroundColor={Palette.borderSubtle} height={10} width={1} />
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
              {item.power}kW ‧ {item.phase}P
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Location Row */}
        <ThemedView alignItems="center" flexDirection="row" gap={Spacing.two}>
          <MapPin color={Palette.textSecondary} size={14} />
          <ThemedText color={Palette.textSecondary} flex={1} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16} numberOfLines={1}>
            {item.stationName?.toUpperCase()}
          </ThemedText>
        </ThemedView>

        {/* Stats Row 1 */}
        <ThemedView flexDirection="row" gap={Spacing.two}>
          {/* Energy */}
          <ThemedView
            alignItems="center"
            backgroundColor="#F0F9FF"
            borderColor="#B9E6FE"
            borderRadius={Radius.small}
            borderWidth={1}
            flex={1.2}
            flexDirection="row"
            gap={4}
            justifyContent="center"
            paddingHorizontal={Spacing.two}
            paddingVertical={Spacing.one}
          >
            <Zap color="#0284c7" size={12} />
            <ThemedText color="#0284c7" fontFamily={FontFamily.bold} fontSize={12} lineHeight={16}>
              {session?.wattage_consumed?.toFixed(2) || '0.00'} <ThemedText color="#0284c7" fontFamily={FontFamily.semibold} fontSize={10} lineHeight={16}>kWh</ThemedText>
            </ThemedText>
          </ThemedView>
          {/* Current A */}
          <ThemedView
            alignItems="center"
            backgroundColor={Palette.surfaceMuted}
            borderRadius={Radius.small}
            flex={1}
            flexDirection="row"
            justifyContent="space-between"
            paddingHorizontal={Spacing.two}
            paddingVertical={Spacing.one}
          >
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>A</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
              {session?.latest_detail?.A?.toFixed(0) || 0}
            </ThemedText>
          </ThemedView>
          {/* Voltage V */}
          <ThemedView
            alignItems="center"
            backgroundColor={Palette.surfaceMuted}
            borderRadius={Radius.small}
            flex={1}
            flexDirection="row"
            justifyContent="space-between"
            paddingHorizontal={Spacing.two}
            paddingVertical={Spacing.one}
          >
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>V</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
              {session?.latest_detail?.V?.toFixed(0) || 0}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Stats Row 2 */}
        <ThemedView flexDirection="row" gap={Spacing.two}>
          {/* Time */}
          <ThemedView
            alignItems="center"
            backgroundColor={Palette.surfaceMuted}
            borderRadius={Radius.small}
            flex={1.2}
            flexDirection="row"
            justifyContent="space-between"
            paddingHorizontal={Spacing.two}
            paddingVertical={Spacing.one}
          >
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>Time</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {formatDuration(session?.start_time, session?.end_time)}
            </ThemedText>
          </ThemedView>
          {/* SOC */}
          <ThemedView
            alignItems="center"
            backgroundColor={Palette.surfaceMuted}
            borderRadius={Radius.small}
            flex={1}
            flexDirection="row"
            justifyContent="space-between"
            paddingHorizontal={Spacing.two}
            paddingVertical={Spacing.one}
          >
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>SOC</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
              {session?.latest_detail?.SOC || 0}%
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView backgroundColor={Palette.borderSubtle} height={1} />

        {/* Status Badges */}
        <ThemedView alignItems="center" flexDirection="row" flexWrap="wrap" gap={Spacing.two}>
          {/* Invoice */}
          <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={Radius.small} paddingHorizontal={Spacing.two} paddingVertical={2}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
              {session?.invoice_id || 'N/A'}
            </ThemedText>
          </ThemedView>
          {/* Charge Type */}
          <ThemedView backgroundColor="#FDF2F8" borderColor="#FBCFE8" borderRadius={Radius.small} borderWidth={1} paddingHorizontal={Spacing.two} paddingVertical={2}>
            <ThemedText color="#EC4899" fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
              {session?.charge_type === 'quick.charge' ? 'Quick Charge' : session?.charge_type}
            </ThemedText>
          </ThemedView>
          {/* Status */}
          <ThemedView alignItems="center" backgroundColor="#EFF6FF" borderColor="#BFDBFE" borderRadius={Radius.small} borderWidth={1} flexDirection="row" gap={4} paddingHorizontal={Spacing.two} paddingVertical={2}>
            <Zap color="#3B82F6" size={10} />
            <ThemedText color="#3B82F6" fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
              CHARGING
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Time Info */}
        <ThemedView gap={2}>
          <ThemedView flexDirection="row" gap={Spacing.three}>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} width={48}>Started</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {formatUnixTime(session?.start_time)}
            </ThemedText>
          </ThemedView>
          <ThemedView flexDirection="row" gap={Spacing.three}>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} width={48}>Updated</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {formatUnixTime(session?.end_time)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView backgroundColor={Palette.borderSubtle} height={1} />

        {/* User Info */}
        <ThemedView alignItems="center" flexDirection="row" gap={Spacing.three}>
          <ThemedView height={36} position="relative" width={32}>
            <ThemedView alignItems="center" backgroundColor={Palette.surfaceMuted} borderRadius={16} height={32} justifyContent="center" width={32}>
              <User color={Palette.textSecondary} size={18} />
            </ThemedView>
            <ThemedView alignItems="center" bottom={0} left={-4} position="absolute" right={-4}>
              <ThemedView backgroundColor={Palette.surfaceBase} borderColor={Palette.borderSubtle} borderRadius={Radius.small} borderWidth={1} paddingHorizontal={4}>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
                  #{session?.user?.id || 'N/A'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
          
          <ThemedView flex={1} gap={2} justifyContent="center" minWidth={0}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
              {session?.user?.name || 'Unknown User'}
            </ThemedText>
            <ThemedView alignItems="center" flexDirection="row" gap={Spacing.one}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
                {session?.user?.phone || 'N/A'}
              </ThemedText>
              {session?.user?.phone && (
                <Pressable hitSlop={8} onPress={() => handleCopy(session?.user?.phone)}>
                  <Copy color={Palette.accent} size={10} />
                </Pressable>
              )}
            </ThemedView>
            <ThemedView alignItems="center" flexDirection="row" gap={Spacing.one}>
              <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1}>
                {session?.user?.email || 'N/A'}
              </ThemedText>
              {session?.user?.email && (
                <Pressable hitSlop={8} onPress={() => handleCopy(session?.user?.email)}>
                  <Copy color={Palette.accent} size={10} />
                </Pressable>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Fee Summary */}
        <ThemedView backgroundColor="#F8FAFC" borderRadius={Radius.medium} gap={2} padding={Spacing.three}>
          <ThemedText color={Palette.accent} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} marginBottom={2}>
            {session?.promotion_discount ? `Promotion applied: -${session?.promotion_discount} đ` : 'No promotion code applied.'}
          </ThemedText>
          <ThemedView alignItems="center" flexDirection="row" justifyContent="space-between">
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>Activation</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {session?.activation_fee || 0} đ
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems="center" flexDirection="row" justifyContent="space-between">
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>Charging</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {(session?.charging_fee || 0).toLocaleString()} đ
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems="center" flexDirection="row" justifyContent="space-between" marginTop={2}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>Paid</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} lineHeight={18}>
              {(session?.total_consumed_fee || 0).toLocaleString()} đ
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <AnimatedHeaderScrollView
        canGoBack
        largeTitle="Ongoing Sessions"
        largeTitleContainerStyle={{ marginHorizontal: -18 }}
        onBack={() => router.back()}
        searchBar={<SearchBar centerWhenUnfocused={false} enableWidthAnimation={false} onSearch={setSearch} placeholder="Search session" />}
        isFlatList
        flatListProps={{
          contentContainerStyle: { paddingBottom: 40, paddingHorizontal: 18 },
          data: data?.items || [],
          keyExtractor: (item: any) => String(item.boxId || Math.random()),
          ListEmptyComponent: isLoading ? (
            <ThemedView contentCenter marginTop={40}>
              <ActivityIndicator color={Palette.accent} />
            </ThemedView>
          ) : (
            <EmptyState message="Try adjusting your search criteria" title="No ongoing sessions" />
          ),
          renderItem: ({ item }: { item: any }) => renderItem(item),
          showsVerticalScrollIndicator: false,
          refreshControl: <RefreshControl onRefresh={refetch} refreshing={isRefetching} tintColor={Palette.accent} />,
        }}
      />
    </ThemedView>
  );
}
