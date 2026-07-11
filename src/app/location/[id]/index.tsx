import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bike,
  Building2,
  Car,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Home,
  MapPin,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  UserRound,
} from 'lucide-react-native';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ThemedText, ThemedView } from 'components/base';
import { AnimatedScrollView } from 'components/organisms/parallax-header';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { rmhs } from 'themes/scaling';
import { getDisplayImageUrl } from 'utils/media/image-url';
import { LocationActionsSheet } from 'shared/locations/components/location-actions-sheet';
import { useLocationDetail, useLocationResourceMutations, useLocationStations } from 'shared/locations/hooks';
import { ResourceFormSheet } from './components/resource-form-sheet';
import { StationScene, StationTabBar } from './components/station-tabs';

const HEADER_HEIGHT = 330;
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export default function LocationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const locationId = String(params.id || '');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeStationId, setActiveStationId] = useState<number>();
  const [sceneHeights, setSceneHeights] = useState<Record<number, number>>({});
  const stationTabsOffset = useRef(Number.POSITIVE_INFINITY);
  const stationTabsSticky = useSharedValue(0);
  const stationScrollX = useSharedValue(0);
  const stationPagerRef = useRef<FlatList<StationRecord>>(null);
  const stationPagerLayoutRef = useRef({ count: 0, width: 0 });
  const { width } = useWindowDimensions();
  const unscaledPageWidth = rmhs(width);
  const locationQuery = useLocationDetail(locationId);
  const stationsQuery = useLocationStations(locationId);
  const location = locationQuery.data;
  const resourceMutations = useLocationResourceMutations(locationId);
  const imageUrl = getDisplayImageUrl(location?.images?.[0]?.url || location?.image_url || location?.imageUrl || location?.image);
  const refreshing = locationQuery.isRefetching || stationsQuery.isRefetching;
  const stations = stationsQuery.data || [];
  const rawLocation = location as (LocationRecord & Record<string, unknown>) | undefined;
  const locationCode = getDisplayValue(rawLocation, ['code', 'locationCode', 'location_code', 'iriId']) || (location ? `#${location.id}` : undefined);
  const locationType = getNestedDisplayValue(rawLocation, ['type', 'locationType', 'location_type', 'buildingType', 'category'], ['name', 'label', 'title']);
  const partnerChargers = getNumberValue(rawLocation, [
    'partnerChargerCount',
    'partner_charger_count',
    'numberOfPartnerChargers',
    'number_of_partner_chargers',
  ]);
  const resolvedActiveStationId = stations.some(station => station.id === activeStationId) ? activeStationId : stations[0]?.id;
  const activeStationIndex = Math.max(
    0,
    stations.findIndex(station => station.id === resolvedActiveStationId),
  );
  const activeStation = stations[activeStationIndex];

  const selectStation = (stationId: number) => {
    if (!stations.some(station => station.id === stationId)) return;
    const index = stations.findIndex(station => station.id === stationId);
    setActiveStationId(stationId);
    stationPagerRef.current?.scrollToOffset({ animated: true, offset: index * width });
  };

  useEffect(() => {
    if (!resolvedActiveStationId) return;
    if (stationPagerLayoutRef.current.count === stations.length && stationPagerLayoutRef.current.width === width) return;
    stationPagerLayoutRef.current = { count: stations.length, width };
    stationScrollX.set(activeStationIndex * width);
    stationPagerRef.current?.scrollToOffset({ animated: false, offset: activeStationIndex * width });
  }, [activeStationIndex, resolvedActiveStationId, stationScrollX, stations.length, width]);

  const handleStationSwipe = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(0, Math.min(stations.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
    const stationId = stations[index]?.id;
    if (stationId) setActiveStationId(stationId);
  };

  const handleStationScroll = useAnimatedScrollHandler(event => {
    stationScrollX.set(event.contentOffset.x);
  });

  const handleDetailScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    stationTabsSticky.set(event.nativeEvent.contentOffset.y + 104 >= stationTabsOffset.current ? 1 : 0);
  };

  const stickyTabsStyle = useAnimatedStyle(() => ({
    opacity: stationTabsSticky.get(),
    transform: [{ translateY: interpolate(stationTabsSticky.get(), [0, 1], [-180, 0]) }],
  }));

  const refresh = () => {
    locationQuery.refetch();
    stationsQuery.refetch();
  };

  if (locationQuery.isLoading) {
    return (
      <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingTop padding={'four'} gap={'four'}>
        <ThemedView borderRadius={'large'} height={280} loading />
        <ThemedView borderRadius={'large'} height={90} loading />
        <ThemedView borderRadius={'large'} height={180} loading />
      </ThemedView>
    );
  }

  if (locationQuery.isError || !location) {
    return (
      <ThemedView flex={1} alignItems='center' backgroundColor={Palette.surfaceBase} gap={'four'} justifyContent='center' padding={'four'}>
        <EmptyState title='Location unavailable' message='The location could not be loaded.' />
        <AppButton label='Retry' onPress={() => locationQuery.refetch()} />
      </ThemedView>
    );
  }

  const nav = (collapsed: boolean) => (
    <ThemedView
      safePaddingTop
      alignItems='center'
      backgroundColor={collapsed ? Palette.surfaceBase : 'transparent'}
      flexDirection='row'
      height={104}
      justifyContent='space-between'
      paddingHorizontal={'four'}
      paddingTop={'two'}>
      <Pressable accessibilityLabel='Back' onPress={() => router.back()}>
        <ThemedView
          alignItems='center'
          backgroundColor={collapsed ? Palette.surfaceMuted : 'rgba(12, 20, 18, 0.55)'}
          borderRadius={'pill'}
          height={38}
          justifyContent='center'
          width={38}>
          <ChevronLeft color={collapsed ? Palette.textPrimary : '#FFFFFF'} size={22} />
        </ThemedView>
      </Pressable>
      {collapsed ? (
        <ThemedText
          color={Palette.textPrimary}
          flex={1}
          fontFamily={FontFamily.bold}
          fontSize={16}
          marginHorizontal={'three'}
          numberOfLines={1}
          textAlign='center'>
          {location.name}
        </ThemedText>
      ) : (
        <ThemedView flex={1} />
      )}
      <Pressable accessibilityLabel='Location actions' onPress={() => setActionsOpen(true)}>
        <ThemedView
          alignItems='center'
          backgroundColor={collapsed ? Palette.surfaceMuted : 'rgba(12, 20, 18, 0.55)'}
          borderRadius={'pill'}
          height={38}
          justifyContent='center'
          width={38}>
          <MoreHorizontal color={collapsed ? Palette.textPrimary : '#FFFFFF'} size={21} />
        </ThemedView>
      </Pressable>
    </ThemedView>
  );

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimatedScrollView
        contentInsetAdjustmentBehavior='never'
        headerMaxHeight={HEADER_HEIGHT}
        onScroll={handleDetailScroll}
        topBarHeight={104}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={refreshing} tintColor='#FFFFFF' />}
        renderHeaderNavBarComponent={() => nav(false)}
        renderTopNavBarComponent={() => nav(true)}
        renderHeaderComponent={() => (
          <ThemedView flex={1} backgroundColor='#173629'>
            {imageUrl ? (
              <Image contentFit='cover' source={{ uri: imageUrl }} style={{ height: HEADER_HEIGHT, width: '100%' }} />
            ) : (
              <ThemedView flex={1} alignItems='center' backgroundColor='#24483A' justifyContent='center'>
                <MapPin color='rgba(255,255,255,0.62)' size={72} strokeWidth={1.4} />
              </ThemedView>
            )}
            <LinearGradient
              colors={['rgba(5,15,11,0.04)', 'rgba(5,15,11,0.32)', 'rgba(5,15,11,0.86)']}
              locations={[0, 0.5, 1]}
              style={{ bottom: 0, height: HEADER_HEIGHT, left: 0, position: 'absolute', right: 0 }}
            />
          </ThemedView>
        )}
        renderOveralComponent={() => (
          <ThemedView backgroundColor='transparent' gap={'one'} padding={'four'} paddingBottom={46} width='100%'>
            <ThemedText color='rgba(255,255,255,0.78)' fontFamily={FontFamily.bold} fontSize={12} textTransform='uppercase'>
              Location #{location.id}
            </ThemedText>
            <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={30} lineHeight={36} numberOfLines={2}>
              {location.name}
            </ThemedText>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
              <MapPin color='rgba(255,255,255,0.78)' size={14} />
              <ThemedText color='rgba(255,255,255,0.82)' flex={1} fontSize={13} numberOfLines={1}>
                {location.displayAddress || location.address || 'Address unavailable'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
        showsVerticalScrollIndicator={false}>
        <ThemedView backgroundColor={Palette.surfaceBase} borderTopLeftRadius={28} borderTopRightRadius={28} marginTop={-24} overflow='hidden' paddingTop={8}>
          <ThemedView backgroundColor='transparent' paddingHorizontal={20} paddingBottom={24} paddingTop={18}>
            <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'} marginBottom={18}>
              <InfoPill
                color={location.visible === false ? Palette.danger : Palette.accent}
                icon={CheckCircle2}
                label={location.operationStatus?.label || 'Unknown status'}
              />
              <InfoPill icon={Hash} label={locationCode || 'No code'} />
              {locationType ? <InfoPill icon={Home} label={locationType} /> : null}
              <InfoPill icon={location.visible === false ? EyeOff : Eye} label={location.visible === false ? 'Hidden' : 'Visible'} />
            </ThemedView>
            <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'} marginBottom={22}>
              <Metric icon={Bike} label='Bikes' value={location.bikeCount || location.numberOfBikeBoxes || 0} />
              <Metric icon={Car} label='Cars' value={location.carCount || location.numberOfCarBoxes || 0} />
              <Metric icon={Building2} label='Stations' value={stationsQuery.data?.length || location.numberOfStations || location.stationCount || 0} />
              <Metric icon={CircleDollarSign} label='Partner chargers' value={partnerChargers || 0} />
            </ThemedView>
            <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
              <ThemedView flex={1}>
                <Pressable onPress={() => setActionsOpen(true)}>
                  <ThemedView
                    alignItems='center'
                    backgroundColor='#18231F'
                    borderRadius={'pill'}
                    minHeight={48}
                    justifyContent='center'
                    paddingHorizontal={'four'}>
                    <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={14}>
                      {location.visible === false ? 'Show location' : 'Location actions'}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </ThemedView>
              <RoundAction accessibilityLabel='Edit location' icon={Pencil} onPress={() => setEditOpen(true)} />
              <RoundAction accessibilityLabel='Refresh location' icon={RefreshCcw} onPress={refresh} />
            </ThemedView>
            <OperationLocationSummary location={location} />
            <PartnershipSummary location={location} />
          </ThemedView>
        </ThemedView>

        <ThemedView backgroundColor={Palette.surfaceBase} onLayout={event => (stationTabsOffset.current = event.nativeEvent.layout.y)}>
          <StationTabBar
            activeId={resolvedActiveStationId}
            locationId={locationId}
            onChange={selectStation}
            pageWidth={width}
            scrollX={stationScrollX}
            stations={stations}
          />
        </ThemedView>

        {stationsQuery.isLoading ? (
          <ThemedView backgroundColor={Palette.surfaceBase} padding={'four'}>
            <ThemedView borderRadius={'large'} height={220} loading />
          </ThemedView>
        ) : stationsQuery.isError ? (
          <ThemedView backgroundColor={Palette.surfaceBase} padding={'four'}>
            <EmptyState title='Stations unavailable' message='Pull down to retry.' />
          </ThemedView>
        ) : activeStation ? (
          <ThemedView backgroundColor={Palette.surfaceBase} height={sceneHeights[activeStation.id] || 720}>
            <Animated.FlatList
              bounces={false}
              data={stations}
              directionalLockEnabled
              getItemLayout={(_data, index) => ({ index, length: width, offset: width * index })}
              horizontal
              keyExtractor={station => String(station.id)}
              nestedScrollEnabled
              onMomentumScrollEnd={handleStationSwipe}
              onScroll={handleStationScroll}
              pagingEnabled
              ref={stationPagerRef}
              removeClippedSubviews={false}
              renderItem={({ item: station }) => (
                <ThemedView backgroundColor={Palette.surfaceBase} width={unscaledPageWidth}>
                  <StationScene
                    locationId={locationId}
                    onContentHeightChange={height =>
                      setSceneHeights(current => (current[station.id] === height ? current : { ...current, [station.id]: height }))
                    }
                    station={station}
                  />
                </ThemedView>
              )}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
            />
          </ThemedView>
        ) : (
          <ThemedView />
        )}

        <ThemedView backgroundColor={Palette.surfaceBase} paddingBottom={120} paddingHorizontal={20} paddingTop={'eight'}>
          {location.description ? (
            <>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} marginBottom={'four'}>
                About
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontSize={15} lineHeight={22}>
                {location.description}
              </ThemedText>
            </>
          ) : null}
        </ThemedView>
      </AnimatedScrollView>
      <AnimatedThemedView backgroundColor={Palette.surfaceBase} left={0} position='absolute' right={0} style={stickyTabsStyle} top={104} zIndex={40}>
        <StationTabBar
          activeId={resolvedActiveStationId}
          locationId={locationId}
          onChange={selectStation}
          pageWidth={width}
          scrollX={stationScrollX}
          stations={stations}
        />
      </AnimatedThemedView>
      <LocationActionsSheet location={location} onClose={() => setActionsOpen(false)} onEdit={() => setEditOpen(true)} open={actionsOpen} />
      <ResourceFormSheet
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'nameVn', label: 'Vietnamese name' },
          { key: 'address', label: 'Address' },
          { key: 'addressVn', label: 'Vietnamese address' },
          { key: 'description', label: 'Description', multiline: true },
          { key: 'descriptionVn', label: 'Vietnamese description', multiline: true },
          { key: 'latitude', keyboard: 'numeric', label: 'Latitude' },
          { key: 'longitude', keyboard: 'numeric', label: 'Longitude' },
        ]}
        initialValues={location as unknown as Record<string, unknown>}
        loading={resourceMutations.patch.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={values => resourceMutations.patch.mutate({ data: values, id: location.id, path: 'api/locations' }, { onSuccess: () => setEditOpen(false) })}
        open={editOpen}
        title='Edit location'
      />
    </ThemedView>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Bike; label: string; value: number }) {
  return (
    <ThemedView
      alignItems='flex-start'
      backgroundColor={Palette.surfaceMuted}
      borderColor={Palette.borderSubtle}
      borderRadius={12}
      borderWidth={1}
      flexBasis='48%'
      flexGrow={1}
      gap={'one'}
      minWidth={136}
      padding={14}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <Icon color={Palette.textSecondary} size={15} />
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function InfoPill({ color = Palette.textPrimary, icon: Icon, label }: { color?: string; icon: typeof Hash; label: string }) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor='#F5F7F6'
      borderColor={Palette.borderSubtle}
      borderRadius={'pill'}
      borderWidth={1}
      flexDirection='row'
      gap={6}
      minHeight={32}
      paddingHorizontal={'three'}>
      <Icon color={color} size={14} />
      <ThemedText color={color} fontFamily={FontFamily.semibold} fontSize={12} numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function getDisplayValue(record: Record<string, unknown> | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function getNumberValue(record: Record<string, unknown> | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function getNestedDisplayValue(record: Record<string, unknown> | undefined, keys: string[], childKeys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value === 'object') {
      const nested = getDisplayValue(value as Record<string, unknown>, childKeys);
      if (nested) return nested;
    }
  }
  return undefined;
}

function OperationLocationSummary({ location }: { location: LocationRecord }) {
  const rawLocation = location as unknown as Record<string, unknown>;
  const coordinates =
    location.latitude != null && location.longitude != null
      ? `${location.latitude}, ${location.longitude}`
      : getDisplayValue(rawLocation, ['coordinates', 'coordinate']);
  const updatedAt = getDisplayValue(rawLocation, ['updatedAt', 'updated_at', 'modifiedAt', 'modified_at']);

  return (
    <ThemedView backgroundColor='#FFFFFF' borderColor={Palette.borderSubtle} borderRadius={18} borderWidth={1} gap={'three'} marginTop={22} padding={'four'}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <ThemedView alignItems='center' backgroundColor='#E7F8ED' borderRadius={10} height={36} justifyContent='center' width={36}>
          <MapPin color={Palette.accent} size={18} />
        </ThemedView>
        <ThemedView backgroundColor='transparent' flex={1}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16}>
            Operation Location
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={12} marginTop={1}>
            Names, address, and coordinates
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'}>
        <DetailItem label='Name' value={location.name} />
        <DetailItem label='Name (VN)' value={location.nameVn} />
        <DetailItem label='Address' value={location.address || location.displayAddress} wide />
        <DetailItem label='Address (VN)' value={location.addressVn} wide />
        <DetailItem label='Coordinates' value={coordinates} />
        <DetailItem label='Updated at' value={updatedAt} />
      </ThemedView>
    </ThemedView>
  );
}

function DetailItem({ label, value, wide }: { label: string; value?: number | string | null; wide?: boolean }) {
  return (
    <ThemedView
      backgroundColor='#F8FAF9'
      borderColor={Palette.borderSubtle}
      borderRadius={12}
      borderWidth={1}
      flexBasis={wide ? '100%' : '48%'}
      flexGrow={1}
      gap={3}
      minWidth={wide ? undefined : 132}
      padding={'three'}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={10} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={13} lineHeight={18} numberOfLines={wide ? 2 : 1} selectable>
        {value == null || value === '' ? '--' : String(value)}
      </ThemedText>
    </ThemedView>
  );
}

function getPartnershipText(value: unknown, keys: string[]) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return keys.map(key => record[key]).find(item => typeof item === 'string' && item.trim()) as string | undefined;
}

function PartnershipSummary({ location }: { location: LocationRecord }) {
  const rawLocation = location as unknown as Record<string, unknown>;
  const partnershipList = Array.isArray(rawLocation.partnerships) ? rawLocation.partnerships : [];
  const partnership = (location.partnershipLocation || location.partnership || rawLocation.partnerLocation || partnershipList[0]) as
    (LocationPartnership & Record<string, unknown>) | undefined;
  const contractValue = partnership?.contract ?? partnership?.partnershipContract ?? rawLocation.contract;
  const tariffValue = partnership?.tariff ?? rawLocation.tariff;
  const mainUser = (partnership?.mainUser || partnership?.main_user || rawLocation.mainUser || rawLocation.main_user) as Record<string, unknown> | undefined;
  const contract = partnership?.contractCode || getPartnershipText(contractValue, ['code', 'number', 'name', 'contractCode']);
  const tariff = getPartnershipText(tariffValue, ['name', 'title', 'label']);
  const mainUserName = getPartnershipText(mainUser, ['name', 'username', 'email', 'phone']);
  const mainUserContact = [getPartnershipText(mainUser, ['phone', 'phoneNumber', 'phone_number']), getPartnershipText(mainUser, ['email'])]
    .filter(Boolean)
    .join(' · ');
  const notes = partnership?.notes || getPartnershipText(rawLocation, ['notes', 'partnershipNotes', 'partnership_notes']);

  return (
    <ThemedView backgroundColor='#F5F7F6' borderColor={Palette.borderSubtle} borderRadius={18} borderWidth={1} gap={'three'} marginTop={24} padding={'four'}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <ThemedView alignItems='center' backgroundColor='#E7F8ED' borderRadius={10} height={36} justifyContent='center' width={36}>
          <Building2 color={Palette.accent} size={18} />
        </ThemedView>
        <ThemedView backgroundColor='transparent' flex={1}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16}>
            Partnership
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={12} marginTop={1}>
            Contract and account assignment
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <PartnershipItem icon={FileText} label='Contract' value={contract || 'Not assigned'} />
        <PartnershipItem icon={CircleDollarSign} label='Tariff' value={tariff || 'Default'} />
      </ThemedView>
      <PartnershipItem icon={UserRound} label='Main user' value={mainUserName || 'Not assigned'} wide />
      {mainUserContact ? (
        <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={18} selectable>
          {mainUserContact}
        </ThemedText>
      ) : null}
      <PartnershipItem icon={FileText} label='Notes' value={notes || '--'} wide />
    </ThemedView>
  );
}

function PartnershipItem({ icon: Icon, label, value, wide }: { icon: typeof FileText; label: string; value: string; wide?: boolean }) {
  return (
    <ThemedView
      backgroundColor='#FFFFFF'
      borderColor={Palette.borderSubtle}
      borderRadius={12}
      borderWidth={1}
      flex={wide ? undefined : 1}
      gap={'two'}
      padding={'three'}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <Icon color={Palette.textSecondary} size={15} />
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11}>
          {label}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} numberOfLines={1} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function RoundAction({ accessibilityLabel, icon: Icon, onPress }: { accessibilityLabel: string; icon: typeof Pencil; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress}>
      <ThemedView
        alignItems='center'
        backgroundColor={Palette.surfaceMuted}
        borderColor={Palette.borderSubtle}
        borderRadius={'pill'}
        borderWidth={1}
        height={44}
        justifyContent='center'
        width={44}>
        <Icon color={Palette.textSecondary} size={18} />
      </ThemedView>
    </Pressable>
  );
}
