import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Plus, RefreshCcw, Zap } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated as NativeAnimated, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, RefreshControl } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BottomButton, ThemedText, ThemedView } from 'components/base';
import { AnimatedScrollView } from 'components/organisms/parallax-header';
import { AssignChargerSheet } from 'shared/stations/components/assign-charger-sheet';
import { ChargerTabs, StationDetailsContent } from 'shared/stations/components/station-details-content';
import { getChargerSelectionKey } from 'shared/stations/charger-utils';
import { AppButton, EmptyState } from 'components/ui';
import { useLocationDetail, useLocationStations, useStationChargers, useStationDetail } from 'shared/locations/hooks';
import { FontFamily, Palette } from 'themes';
import { rmhs } from 'themes/scaling';
import { getDisplayImageUrl } from 'utils/media/image-url';

const HEADER_HEIGHT = 300;
const TOP_BAR_HEIGHT = 104;
const CONTENT_OVERLAP = 24;
const CONTENT_TOP_PADDING = 8;
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

function getStationLocationId(location?: StationRecord['location']) {
  if (!location) return '';
  if (typeof location === 'object') return String(location.id || '');
  const resourceMatch = location.match(/\/(\d+)\/?$/);
  return resourceMatch?.[1] || location;
}

export default function StationDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chargerKey?: string; connectorOrder?: string; locationId?: string; stationId: string }>();
  const routeLocationId = String(params.locationId || '');
  const stationId = String(params.stationId || '');
  const stationsQuery = useLocationStations(routeLocationId);
  const stationDetailQuery = useStationDetail(stationId, !routeLocationId);
  const station = routeLocationId ? stationsQuery.data?.find(item => String(item.id) === stationId) : stationDetailQuery.data;
  const locationId = routeLocationId || getStationLocationId(station?.location);
  const locationQuery = useLocationDetail(locationId);
  const chargersQuery = useStationChargers(stationId);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = chargersQuery;
  const scrollOffsetRef = useRef(0);
  const stickyVisibleRef = useRef(false);
  const chargerTabThresholdRef = useRef<number | undefined>(undefined);
  const [chargerPagePosition] = useState(() => new NativeAnimated.Value(0));
  const [chargerPageOffset] = useState(() => new NativeAnimated.Value(0));
  const [selectedChargerKey, setSelectedChargerKey] = useState<string | undefined>(() => params.chargerKey || undefined);
  const [stickyTabsVisible, setStickyTabsVisible] = useState(false);
  const [assignChargerOpen, setAssignChargerOpen] = useState(false);
  const location = locationQuery.data;
  const selectedPortOrder = params.connectorOrder === undefined ? undefined : Number(params.connectorOrder);
  const chargers = chargersQuery.data?.pages.flatMap(page => page.items) || [];
  const selectedCharger = chargers.find(charger => getChargerSelectionKey(charger) === selectedChargerKey);
  const activeCharger = selectedCharger || chargers[0];
  const imageUrl = getDisplayImageUrl(station?.images?.[0]?.url || location?.images?.[0]?.url || location?.image_url || location?.imageUrl || location?.image);
  const refreshing = locationQuery.isRefetching || stationsQuery.isRefetching || stationDetailQuery.isRefetching || chargersQuery.isRefetching;

  useEffect(() => {
    if (!selectedChargerKey || selectedCharger || !hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, selectedCharger, selectedChargerKey]);

  const refresh = () => {
    if (locationId) locationQuery.refetch();
    if (routeLocationId) stationsQuery.refetch();
    else stationDetailQuery.refetch();
    chargersQuery.refetch();
  };

  const updateStickyVisibility = (offset: number, threshold?: number) => {
    const effectiveThreshold = threshold ?? chargerTabThresholdRef.current;
    const nextVisible = effectiveThreshold != null && chargers.length > 1 && offset >= effectiveThreshold;
    if (stickyVisibleRef.current === nextVisible) return;
    stickyVisibleRef.current = nextVisible;
    setStickyTabsVisible(nextVisible);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offset;
    updateStickyVisibility(offset);
  };

  const handleChargerTabLayout = (y: number) => {
    const threshold = HEADER_HEIGHT - CONTENT_OVERLAP + CONTENT_TOP_PADDING + y - TOP_BAR_HEIGHT;
    chargerTabThresholdRef.current = threshold;
    updateStickyVisibility(scrollOffsetRef.current, threshold);
  };

  if (routeLocationId ? stationsQuery.isLoading : stationDetailQuery.isLoading) {
    return (
      <ThemedView backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} padding={'four'} safePaddingTop>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView borderRadius={'large'} height={280} loading />
        <ThemedView borderRadius={'large'} height={180} loading />
      </ThemedView>
    );
  }

  if ((routeLocationId ? stationsQuery.isError : stationDetailQuery.isError) || !station) {
    return (
      <ThemedView alignItems='center' backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} justifyContent='center' padding={'four'}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState message='This station could not be loaded.' title='Station unavailable' />
        <AppButton label='Retry' onPress={refresh} />
      </ThemedView>
    );
  }

  const nav = (collapsed: boolean) => (
    <ThemedView
      alignItems='center'
      backgroundColor={collapsed ? Palette.surfaceBase : 'transparent'}
      flexDirection='row'
      height={104}
      justifyContent='space-between'
      paddingHorizontal={'four'}
      paddingTop={'two'}
      safePaddingTop>
      <Pressable accessibilityLabel='Back' onPress={() => router.back()}>
        <ThemedView
          alignItems='center'
          backgroundColor={collapsed ? Palette.surfaceMuted : 'rgba(12, 20, 18, 0.55)'}
          borderRadius={'pill'}
          height={36}
          justifyContent='center'
          width={36}>
          <ChevronLeft color={collapsed ? Palette.textPrimary : '#FFFFFF'} size={20} />
        </ThemedView>
      </Pressable>
      {collapsed ? (
        <ThemedText
          color={Palette.textPrimary}
          flex={1}
          fontFamily={FontFamily.semibold}
          fontSize={15}
          marginHorizontal={'three'}
          numberOfLines={1}
          textAlign='center'>
          {station.name || `Station #${station.id}`}
        </ThemedText>
      ) : (
        <ThemedView backgroundColor='transparent' flex={1} />
      )}
      <Pressable accessibilityLabel='Refresh station' onPress={refresh}>
        <ThemedView
          alignItems='center'
          backgroundColor={collapsed ? Palette.surfaceMuted : 'rgba(12, 20, 18, 0.55)'}
          borderRadius={'pill'}
          height={36}
          justifyContent='center'
          width={36}>
          <RefreshCcw color={collapsed ? Palette.textPrimary : '#FFFFFF'} size={18} />
        </ThemedView>
      </Pressable>
    </ThemedView>
  );

  const coordinates = station.latitude != null && station.longitude != null ? `${station.latitude}, ${station.longitude}` : undefined;

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimatedScrollView
        contentInsetAdjustmentBehavior='never'
        headerMaxHeight={HEADER_HEIGHT}
        onScroll={handleScroll}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={refreshing} tintColor='#FFFFFF' />}
        renderHeaderComponent={() => (
          <ThemedView backgroundColor='#173629' flex={1}>
            {imageUrl ? (
              <Image contentFit='cover' source={{ uri: imageUrl }} style={{ height: HEADER_HEIGHT, width: '100%' }} />
            ) : (
              <ThemedView alignItems='center' backgroundColor='#24483A' flex={1} justifyContent='center'>
                <Zap color='rgba(255,255,255,0.62)' size={72} strokeWidth={1.4} />
              </ThemedView>
            )}
            <LinearGradient
              colors={['rgba(5,15,11,0.04)', 'rgba(5,15,11,0.32)', 'rgba(5,15,11,0.88)']}
              locations={[0, 0.5, 1]}
              style={{ bottom: 0, height: HEADER_HEIGHT, left: 0, position: 'absolute', right: 0 }}
            />
          </ThemedView>
        )}
        renderHeaderNavBarComponent={() => nav(false)}
        renderOveralComponent={() => (
          <ThemedView backgroundColor='transparent' gap={'one'} padding={'four'} paddingBottom={42} width='100%'>
            <ThemedText color='rgba(255,255,255,0.72)' fontFamily={FontFamily.semibold} fontSize={11} textTransform='uppercase'>
              Station #{station.id}
            </ThemedText>
            <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={24} lineHeight={30} numberOfLines={2}>
              {station.name || `Station #${station.id}`}
            </ThemedText>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
              <MapPin color='rgba(255,255,255,0.78)' size={14} />
              <ThemedText color='rgba(255,255,255,0.82)' flex={1} fontSize={13} numberOfLines={1} selectable>
                {coordinates || location?.displayAddress || location?.address || station.description || 'Location unavailable'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
        renderTopNavBarComponent={() => nav(true)}
        showsVerticalScrollIndicator={false}
        topBarHeight={TOP_BAR_HEIGHT}>
        <ThemedView
          backgroundColor={Palette.surfaceBase}
          borderTopLeftRadius={28}
          borderTopRightRadius={28}
          marginTop={-24}
          overflow='hidden'
          paddingBottom={96}
          paddingTop={8}>
          <StationDetailsContent
            chargerPageOffset={chargerPageOffset}
            chargerPagePosition={chargerPagePosition}
            locationId={locationId}
            onChargerTabLayout={handleChargerTabLayout}
            onSelectedChargerKeyChange={setSelectedChargerKey}
            selectedPortOrder={Number.isFinite(selectedPortOrder) ? selectedPortOrder : undefined}
            selectedChargerKey={selectedChargerKey}
            station={station}
          />
        </ThemedView>
      </AnimatedScrollView>
      {stickyTabsVisible && activeCharger ? (
        <AnimatedThemedView
          backgroundColor={Palette.surfaceBase}
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(120)}
          left={0}
          paddingHorizontal={rmhs(12)}
          position='absolute'
          right={0}
          top={TOP_BAR_HEIGHT}
          zIndex={30}>
          <ChargerTabs
            chargers={chargers}
            onSelect={charger => setSelectedChargerKey(getChargerSelectionKey(charger))}
            pageOffset={chargerPageOffset}
            pagePosition={chargerPagePosition}
            selectedKey={getChargerSelectionKey(activeCharger)}
          />
        </AnimatedThemedView>
      ) : null}
      <BottomButton icon={<Plus color='#FFFFFF' size={20} strokeWidth={2.4} />} onPress={() => setAssignChargerOpen(true)} title='Assign charger' />
      <AssignChargerSheet locationId={locationId} onClose={() => setAssignChargerOpen(false)} station={station} visible={assignChargerOpen} />
    </ThemedView>
  );
}
