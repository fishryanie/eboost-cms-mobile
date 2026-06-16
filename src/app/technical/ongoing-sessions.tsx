import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { Cable, Copy, Zap, MapPin, User, Clock, Battery } from 'lucide-react-native';
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
        elevation={2}
        gap={Spacing.two}
        marginBottom={Spacing.three}
        padding={Spacing.three}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.06}
        shadowRadius={8}
      >
        {/* Header */}
        <ThemedView alignItems="center" flexDirection="row" justifyContent="space-between">
          <ThemedView alignItems="center" flexDirection="row" gap={Spacing.one}>
            <Cable color="#0284c7" size={16} />
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={16}>
              {item.boxId || item.vendorId}
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems="center" flexDirection="row" gap={Spacing.one}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14}>
              Conn {item.connectorId}
            </ThemedText>
            <ThemedView backgroundColor={Palette.borderSubtle} height={10} width={1} />
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14}>
              {item.power}kW ‧ {item.phase}P
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Location Row */}
        <ThemedView alignItems="center" flexDirection="row" gap={Spacing.one}>
          <MapPin color={Palette.textSecondary} size={12} />
          <ThemedText color={Palette.textSecondary} flex={1} fontFamily={FontFamily.regular} fontSize={11} lineHeight={14} numberOfLines={1}>
            {item.stationName?.toUpperCase()}
          </ThemedText>
        </ThemedView>

        {/* Unified Stats Bar */}
        <ThemedView 
          alignItems="center" 
          backgroundColor={Palette.surfaceMuted} 
          borderRadius={Radius.small} 
          flexDirection="row" 
          justifyContent="space-between"
          paddingHorizontal={Spacing.two} 
          paddingVertical={4}
        >
          <ThemedView alignItems="center" flexDirection="row" gap={4}>
            <Clock color="#15803D" size={12} />
            <ThemedText color="#15803D" fontFamily={FontFamily.semibold} fontSize={11} lineHeight={14}>
              {formatDuration(session?.start_time, session?.end_time)}
            </ThemedText>
          </ThemedView>

          <ThemedView backgroundColor={Palette.borderSubtle} height={12} width={1} />

          <ThemedView alignItems="center" flexDirection="row" gap={4}>
            <Zap color="#0284c7" size={12} />
            <ThemedText color="#0284c7" fontFamily={FontFamily.bold} fontSize={11} lineHeight={14}>
              {session?.wattage_consumed?.toFixed(2) || '0.00'} <ThemedText color="#0284c7" fontFamily={FontFamily.medium} fontSize={9} lineHeight={14}>kWh</ThemedText>
            </ThemedText>
          </ThemedView>
          
          <ThemedView backgroundColor={Palette.borderSubtle} height={12} width={1} />
          
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14}>
            {session?.latest_detail?.A?.toFixed(0) || 0}A
          </ThemedText>
          
          <ThemedView backgroundColor={Palette.borderSubtle} height={12} width={1} />
          
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14}>
            {session?.latest_detail?.V?.toFixed(0) || 0}V
          </ThemedText>

          <ThemedView backgroundColor={Palette.borderSubtle} height={12} width={1} />

          <ThemedView alignItems="center" flexDirection="row" gap={4}>
            <Battery color={Palette.textSecondary} size={12} />
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={11} lineHeight={14}>
              {session?.latest_detail?.SOC || 0}%
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView backgroundColor={Palette.borderSubtle} height={1} />

        {/* Status Badges */}
        <ThemedView alignItems="center" flexDirection="row" flexWrap="wrap" gap={Spacing.two}>
          {/* Invoice */}
          <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={Radius.small} paddingHorizontal={Spacing.one} paddingVertical={2}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
              {session?.invoice_id || 'N/A'}
            </ThemedText>
          </ThemedView>
          {/* Charge Type */}
          <ThemedView backgroundColor="#FDF2F8" borderColor="#FBCFE8" borderRadius={Radius.small} borderWidth={1} paddingHorizontal={Spacing.one} paddingVertical={2}>
            <ThemedText color="#EC4899" fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
              {session?.charge_type === 'quick.charge' ? 'Quick Charge' : session?.charge_type}
            </ThemedText>
          </ThemedView>
          {/* Status */}
          <ThemedView alignItems="center" backgroundColor="#EFF6FF" borderColor="#BFDBFE" borderRadius={Radius.small} borderWidth={1} flexDirection="row" gap={2} paddingHorizontal={Spacing.one} paddingVertical={2}>
            <Zap color="#3B82F6" size={8} />
            <ThemedText color="#3B82F6" fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
              CHARGING
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Time Info */}
        <ThemedView gap={2}>
          <ThemedView flexDirection="row" gap={Spacing.two}>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={10} lineHeight={14} width={50}>Started</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
              {formatUnixTime(session?.start_time)}
            </ThemedText>
          </ThemedView>
          <ThemedView flexDirection="row" gap={Spacing.two}>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={10} lineHeight={14} width={50}>Updated</ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
              {formatUnixTime(session?.end_time)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView backgroundColor={Palette.borderSubtle} height={1} />

        {/* User & Billing Card */}
        <ThemedView>
          {/* Header: User Info & Contact */}
          <ThemedView flexDirection="row" justifyContent="space-between" borderBottomWidth={1} borderBottomColor={Palette.borderSubtle} paddingBottom={Spacing.two} marginBottom={Spacing.two}>
            {/* Left: Avatar + Name + ID */}
            <ThemedView flexDirection="row" gap={Spacing.two} flex={1}>
              <ThemedView alignItems="center" backgroundColor={Palette.surfaceMuted} borderRadius={16} height={32} justifyContent="center" width={32}>
                <User color={Palette.textSecondary} size={16} />
              </ThemedView>
              <ThemedView justifyContent="center" flex={1}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} numberOfLines={1}>
                  {session?.user?.name || 'Unknown User'}
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
                  ID: #{session?.user?.id || 'N/A'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            
            {/* Right: Phone + Email */}
            <ThemedView alignItems="flex-end" justifyContent="center" gap={Spacing.one}>
              <ThemedView alignItems="center" flexDirection="row" gap={Spacing.one}>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11}>
                  {session?.user?.phone || 'N/A'}
                </ThemedText>
                {session?.user?.phone && (
                  <Pressable hitSlop={8} onPress={() => handleCopy(session?.user?.phone)}>
                    <Copy color={Palette.accent} size={10} />
                  </Pressable>
                )}
              </ThemedView>
              <ThemedView alignItems="center" flexDirection="row" gap={Spacing.one}>
                <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={11} numberOfLines={1} maxWidth={120}>
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

          {/* Details Grid */}
          <ThemedView flexDirection="row" gap={Spacing.three}>
            {(() => {
              const rate = session?.promotion_discount || 0;
              const activation = Math.round(session?.activation_fee || 0);
              const consumed = Math.round(session?.total_consumed_fee || 0);
              const baseAmount = consumed || activation;
              const discountAmount = Math.round(baseAmount * (rate / 100));
              const totalFee = Math.round(baseAmount - discountAmount);

              const rawPromo = session?.promotion_code as any;
              const promoStr = rawPromo && typeof rawPromo === 'object' ? rawPromo.code || rawPromo.name : rawPromo;
              const percent = session?.promotion_discount || 0;

              return (
                <>
                  {/* Left: Paid Total */}
                  <ThemedView flex={1} gap={Spacing.one} justifyContent="center">
                    {rate > 0 && (promoStr || percent > 0) && (
                      <ThemedText color="#15803D" fontFamily={FontFamily.regular} fontSize={10} numberOfLines={1}>
                        {promoStr && (
                          <ThemedText color="#15803D" fontFamily={FontFamily.black} fontSize={10}>
                            {promoStr}{' '}
                          </ThemedText>
                        )}
                        ({percent}%)
                      </ThemedText>
                    )}
                    <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11}>Paid Total</ThemedText>
                    <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18}>
                      {totalFee.toLocaleString()} đ
                    </ThemedText>
                  </ThemedView>

                  {/* Divider */}
                  <ThemedView backgroundColor={Palette.borderSubtle} width={1} />

                  {/* Right: Breakdown */}
                  <ThemedView flex={1} gap={Spacing.one} justifyContent="center">
                    <ThemedView flexDirection="row" justifyContent="space-between">
                      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11}>Activation</ThemedText>
                      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11}>{activation.toLocaleString()} đ</ThemedText>
                    </ThemedView>
                    <ThemedView flexDirection="row" justifyContent="space-between">
                      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11}>Charging</ThemedText>
                      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11}>{consumed.toLocaleString()} đ</ThemedText>
                    </ThemedView>
                    {rate > 0 && (
                      <ThemedView flexDirection="row" justifyContent="space-between">
                        <ThemedText color="#15803D" fontFamily={FontFamily.regular} fontSize={11}>Discount</ThemedText>
                        <ThemedText color="#15803D" fontFamily={FontFamily.medium} fontSize={11}>-{discountAmount.toLocaleString()} đ</ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                </>
              );
            })()}
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
