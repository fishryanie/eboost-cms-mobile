import { Image } from 'expo-image';
import {
  BadgeDollarSign,
  BatteryCharging,
  Bike,
  Car,
  ChevronRight,
  CircleDollarSign,
  CircleParking,
  Clock3,
  MapPin,
  Pencil,
  RotateCcw,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated as NativeAnimated, FlatList, Pressable, ScrollView, Switch, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';

import { ResourceFormSheet } from 'app/location/[id]/components/resource-form-sheet';
import { requestResetCharger, requestTriggerCharger, requestUnlockCharger } from 'app/location/[id]/features/charger-service';
import { getWorkflowChargerIdentifier, getWorkflowChargerType } from 'app/location/[id]/features/charger-workflows';
import { ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { useLocationDetail, useLocationPartnership, useLocationPriceProfiles, useLocationResourceMutations, useStationChargers } from 'shared/locations/hooks';
import { getChargerSelectionKey } from 'shared/stations/charger-utils';
import { FontFamily, Palette } from 'themes';
import { rmhs } from 'themes/scaling';
import { getDisplayImageUrl } from 'utils/media/image-url';

const NativeAnimatedThemedView = NativeAnimated.createAnimatedComponent(ThemedView);
const vietnameseNumberFormatter = new Intl.NumberFormat('vi-VN');
const stationDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function StationList({
  accentColor = Palette.accent,
  accentTone = '#EAF8EF',
  locationId,
  onSelectStation,
  stations,
}: {
  accentColor?: string;
  accentTone?: string;
  locationId: string;
  onSelectStation: (station: StationRecord) => void;
  stations: StationRecord[];
}) {
  const mutations = useLocationResourceMutations(locationId);

  return (
    <ThemedView backgroundColor='transparent' gap={12}>
      <ThemedView alignItems='flex-end' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
        <ThemedView backgroundColor='transparent' flex={1} gap={3}>
          <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={10} letterSpacing={1.2} textTransform='uppercase'>
            Location stations
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={17}>
            Select a station to manage boxes and outlets.
          </ThemedText>
        </ThemedView>
        <ThemedView backgroundColor={accentTone} borderRadius={'pill'} paddingHorizontal={9} paddingVertical={4}>
          <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={10}>
            {stations.length}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      {stations.length === 0 ? (
        <ThemedView backgroundColor='transparent' paddingVertical={'three'}>
          <EmptyState message='Create a station to start adding chargers.' title='No stations yet' />
        </ThemedView>
      ) : (
        <ThemedView backgroundColor='transparent'>
          {stations.map((station, index) => (
            <StationListItem
              index={index}
              accentColor={accentColor}
              accentTone={accentTone}
              isLast={index === stations.length - 1}
              key={station.id}
              onPress={() => onSelectStation(station)}
              onToggleVisibility={() => mutations.patch.mutate({ data: { visible: station.visible === false }, id: station.id, path: 'api/stations' })}
              station={station}
            />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

function StationListItem({
  accentColor,
  accentTone,
  index,
  isLast,
  onPress,
  onToggleVisibility,
  station,
}: {
  accentColor: string;
  accentTone: string;
  index: number;
  isLast: boolean;
  onPress: () => void;
  onToggleVisibility: () => void;
  station: StationRecord;
}) {
  const bikeBoxes = station.numberOfBikeBoxes ?? station.bikeBoxes?.length ?? 0;
  const carBoxes = station.numberOfCarBoxes ?? station.carBoxes?.length ?? 0;
  const stationTypes = [...(bikeBoxes > 0 ? [{ current: 'AC', vehicle: 'BIKE' }] : []), ...(carBoxes > 0 ? [{ current: 'DC', vehicle: 'CAR' }] : [])];
  const imageUrl = getDisplayImageUrl(station.images?.[0]?.url);
  const coordinates = station.latitude != null && station.longitude != null ? `${station.latitude}, ${station.longitude}` : undefined;

  return (
    <Pressable accessibilityRole='button' onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
      <ThemedView
        backgroundColor='transparent'
        borderBottomColor={isLast ? 'transparent' : Palette.borderSubtle}
        borderBottomWidth={isLast ? 0 : 1}
        flexDirection='row'
        gap={12}
        paddingVertical={12}>
        <ThemedView alignItems='stretch' backgroundColor='transparent' gap={5} width={60}>
          {imageUrl ? (
            <Image contentFit='cover' source={{ uri: imageUrl }} style={{ borderRadius: 12, height: 60, width: 60 }} />
          ) : (
            <ThemedView alignItems='center' backgroundColor={accentTone} borderRadius={12} height={60} justifyContent='center' width={60}>
              <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={14}>
                {String(index + 1).padStart(2, '0')}
              </ThemedText>
            </ThemedView>
          )}
          {stationTypes.map(type => (
            <ThemedView
              alignItems='center'
              backgroundColor={type.vehicle === 'BIKE' ? accentTone : '#EDF8FF'}
              borderRadius={6}
              flexDirection='row'
              justifyContent='center'
              key={type.vehicle}
              minHeight={18}
              paddingHorizontal={3}>
              <ThemedText
                color={type.vehicle === 'BIKE' ? accentColor : '#1477B9'}
                fontFamily={FontFamily.semibold}
                fontSize={8}
                lineHeight={16}
                numberOfLines={1}>
                {type.current} · {type.vehicle}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
        <ThemedView backgroundColor='transparent' flex={1} gap={5} minWidth={0}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
            <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={19} numberOfLines={2} selectable>
              {station.name || `Station ${index + 1}`}
            </ThemedText>
            <Switch
              accessibilityLabel={`Toggle ${station.name || `station ${index + 1}`}`}
              onValueChange={onToggleVisibility}
              style={{ transform: [{ scale: 0.78 }] }}
              thumbColor='#FFFFFF'
              trackColor={{ false: '#D7DDDA', true: accentColor }}
              value={station.visible !== false}
            />
          </ThemedView>
          <ThemedText color={Palette.textSecondary} fontSize={11} lineHeight={15} numberOfLines={2}>
            {station.description || station.stationAreaType?.name || 'Charging station'}
          </ThemedText>
          {coordinates ? (
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
              <MapPin color={Palette.textTertiary} size={12} />
              <ThemedText color={Palette.textTertiary} flex={1} fontSize={10} lineHeight={14} numberOfLines={1} selectable>
                {coordinates}
              </ThemedText>
            </ThemedView>
          ) : null}
          <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'one'}>
            <StationListStat
              color={station.public ? accentColor : '#5E6663'}
              label={station.public ? 'Public' : 'Private'}
              tone={station.public ? accentTone : '#F3F5F4'}
            />
            <StationListStat color='#1477B9' label={station.stationAreaType?.name || 'Station'} tone='#EDF8FF' />
            <StationListStat color='#B45309' label={station.fullTime ? 'Full Time' : station.stationOpenProfile?.name || 'Scheduled'} tone='#FFF8E8' />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

function StationListStat({ color, label, tone }: { color: string; label: string; tone: string }) {
  return (
    <ThemedView backgroundColor={tone} borderRadius={'pill'} minHeight={22} paddingHorizontal={7}>
      <ThemedText color={color} fontFamily={FontFamily.medium} fontSize={9} lineHeight={22} numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

export function StationDetailsContent({
  chargerPageOffset,
  chargerPagePosition,
  locationId,
  onChargerTabLayout,
  onSelectedChargerKeyChange,
  onContentHeightChange,
  selectedChargerKey,
  station,
}: {
  chargerPageOffset: NativeAnimated.Value;
  chargerPagePosition: NativeAnimated.Value;
  locationId: string;
  onChargerTabLayout?: (y: number) => void;
  onSelectedChargerKeyChange?: (key: string) => void;
  onContentHeightChange?: (height: number) => void;
  selectedChargerKey?: string;
  station: StationRecord;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const locationQuery = useLocationDetail(locationId);
  const partnershipQuery = useLocationPartnership(locationQuery.data);
  const priceProfilesQuery = useLocationPriceProfiles(Boolean(locationQuery.data));
  const chargersQuery = useStationChargers(station.id);
  const mutations = useLocationResourceMutations(locationId, station.id);
  const [selected, setSelected] = useState<WorkflowChargerRecord>();
  const [editStationOpen, setEditStationOpen] = useState(false);
  const [editCharger, setEditCharger] = useState<WorkflowChargerRecord>();
  const [editPort, setEditPort] = useState<{ charger: WorkflowChargerRecord; port: ChargerPortRecord }>();
  const [internalSelectedChargerKey, setInternalSelectedChargerKey] = useState<string>();
  const chargers = chargersQuery.data?.pages.flatMap(page => page.items) || [];
  const effectiveSelectedChargerKey = selectedChargerKey || internalSelectedChargerKey;
  const activeCharger = chargers.find(charger => getChargerSelectionKey(charger) === effectiveSelectedChargerKey) || chargers[0];
  const activeChargerIndex = activeCharger ? chargers.indexOf(activeCharger) : -1;
  const pageWidth = screenWidth - rmhs(24);
  const outletCount = chargers.reduce(
    (total, charger) => total + (getWorkflowChargerType(charger) === 'car' ? charger.carConnectors?.length || 0 : charger.outlets?.length || 0),
    0,
  );
  const partnership = partnershipQuery.data;
  const inheritedPriceProfile =
    priceProfilesQuery.data?.find(profile => String(profile.id) === String(partnership?.priceProfileId)) || partnership?.tariff || undefined;
  const pendingStationVisibility =
    mutations.patch.isPending && mutations.patch.variables?.path === 'api/stations' && typeof mutations.patch.variables.data.visible === 'boolean'
      ? mutations.patch.variables.data.visible
      : undefined;
  const stationVisible = pendingStationVisibility ?? station.visible !== false;
  const updateStationVisibility = (visible: boolean) => mutations.patch.mutate({ data: { visible }, id: station.id, path: 'api/stations' });
  const selectCharger = (charger: WorkflowChargerRecord) => {
    const key = getChargerSelectionKey(charger);
    setInternalSelectedChargerKey(key);
    onSelectedChargerKeyChange?.(key);
  };

  return (
    <ThemedView
      backgroundColor={Palette.surfaceBase}
      gap={'three'}
      onLayout={event => onContentHeightChange?.(Math.ceil(event.nativeEvent.layout.height))}
      paddingBottom={'eight'}
      paddingHorizontal={rmhs(12)}
      paddingTop={'three'}>
      <StationSummary
        chargerCount={chargers.length}
        outletCount={outletCount}
        onEdit={() => setEditStationOpen(true)}
        onVisibilityChange={updateStationVisibility}
        station={station}
        visibilityLoading={mutations.patch.isPending}
        visible={stationVisible}
      />
      {chargersQuery.isLoading ? (
        <ThemedView gap={'three'}>
          <ThemedView borderRadius={'large'} height={116} loading />
          <ThemedView borderRadius={'large'} height={116} loading />
        </ThemedView>
      ) : chargersQuery.isError ? (
        <EmptyState message='Pull to refresh or try again.' title='Chargers unavailable' />
      ) : chargers.length === 0 ? (
        <EmptyState message='Assign a bike or car charger to this station from CMS.' title='No chargers' />
      ) : (
        <ThemedView backgroundColor='transparent' gap={'two'} onLayout={event => onChargerTabLayout?.(event.nativeEvent.layout.y)}>
          {chargers.length === 1 ? (
            <ChargerSection
              charger={activeCharger}
              index={0}
              inheritedPriceProfile={inheritedPriceProfile}
              locationId={locationId}
              onEditCharger={() => setEditCharger(activeCharger)}
              onEditPort={port => setEditPort({ charger: activeCharger, port })}
              pageWidth={pageWidth}
              stationId={station.id}
            />
          ) : (
            <>
              <ChargerTabs
                chargers={chargers}
                onSelect={selectCharger}
                pageOffset={chargerPageOffset}
                pagePosition={chargerPagePosition}
                selectedKey={getChargerSelectionKey(activeCharger)}
              />
              <ChargerPager
                chargers={chargers}
                inheritedPriceProfile={inheritedPriceProfile}
                locationId={locationId}
                onEditCharger={setEditCharger}
                onEditPort={(charger, port) => setEditPort({ charger, port })}
                onSelect={selectCharger}
                pageOffset={chargerPageOffset}
                pagePosition={chargerPagePosition}
                pageWidth={pageWidth}
                selectedIndex={activeChargerIndex}
                stationId={station.id}
              />
            </>
          )}
        </ThemedView>
      )}

      {chargersQuery.hasNextPage ? (
        <AppButton block label='Load more chargers' loading={chargersQuery.isFetchingNextPage} onPress={() => chargersQuery.fetchNextPage()} />
      ) : null}

      <ResourceFormSheet
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'nameVn', label: 'Vietnamese name' },
          { key: 'description', label: 'Description', multiline: true },
          { key: 'descriptionVn', label: 'Vietnamese description', multiline: true },
          { key: 'latitude', keyboard: 'numeric', label: 'Latitude' },
          { key: 'longitude', keyboard: 'numeric', label: 'Longitude' },
          { key: 'public', label: 'Public station', type: 'switch' },
          { key: 'fullTime', label: 'Open full time', type: 'switch' },
        ]}
        initialValues={station as unknown as Record<string, unknown>}
        loading={mutations.patch.isPending}
        onClose={() => setEditStationOpen(false)}
        onSubmit={values => mutations.patch.mutate({ data: values, id: station.id, path: 'api/stations' }, { onSuccess: () => setEditStationOpen(false) })}
        open={editStationOpen}
        title='Edit station'
      />
      <ResourceFormSheet
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'uniqueId', label: 'Unique ID' },
          { key: 'vendorId', label: 'Vendor ID' },
          { key: 'visible', label: 'Visible', type: 'switch' },
          { key: 'enabled', label: 'Enabled', type: 'switch' },
        ]}
        initialValues={editCharger as unknown as Record<string, unknown>}
        loading={mutations.patch.isPending}
        onClose={() => setEditCharger(undefined)}
        onSubmit={values =>
          editCharger &&
          mutations.patch.mutate(
            { data: values, id: editCharger.id, path: getWorkflowChargerType(editCharger) === 'car' ? 'api/car_boxes' : 'api/bike_boxes' },
            { onSuccess: () => setEditCharger(undefined) },
          )
        }
        open={Boolean(editCharger)}
        title='Edit charger'
      />
      <ResourceFormSheet
        fields={[
          { key: 'name', label: 'Port name' },
          { key: 'orderOnBox', keyboard: 'numeric', label: 'Order on box' },
          { key: 'power', keyboard: 'numeric', label: 'Power (kW)' },
          { key: 'visible', label: 'Visible', type: 'switch' },
        ]}
        initialValues={editPort?.port as unknown as Record<string, unknown>}
        loading={mutations.patch.isPending}
        onClose={() => setEditPort(undefined)}
        onSubmit={values =>
          editPort &&
          mutations.patch.mutate(
            { data: values, id: editPort.port.id, path: getWorkflowChargerType(editPort.charger) === 'car' ? 'api/car_connectors' : 'api/outlets' },
            { onSuccess: () => setEditPort(undefined) },
          )
        }
        open={Boolean(editPort)}
        title='Edit port'
      />
    </ThemedView>
  );
}

function ChargerPager({
  chargers,
  inheritedPriceProfile,
  locationId,
  onEditCharger,
  onEditPort,
  onSelect,
  pageOffset,
  pagePosition,
  pageWidth,
  selectedIndex,
  stationId,
}: {
  chargers: WorkflowChargerRecord[];
  inheritedPriceProfile?: LocationPartnership['tariff'] | Record<string, unknown>;
  locationId: string;
  onEditCharger: (charger: WorkflowChargerRecord) => void;
  onEditPort: (charger: WorkflowChargerRecord, port: ChargerPortRecord) => void;
  onSelect: (charger: WorkflowChargerRecord) => void;
  pageOffset: NativeAnimated.Value;
  pagePosition: NativeAnimated.Value;
  pageWidth: number;
  selectedIndex: number;
  stationId: number;
}) {
  const pagerRef = useRef<PagerView>(null);
  const lastPagerIndexRef = useRef(selectedIndex);
  const [pageHeights, setPageHeights] = useState<Record<string, number>>({});
  const activeCharger = chargers[selectedIndex];
  const activeChargerKey = getChargerSelectionKey(activeCharger);
  const measuredPageHeights = Object.values(pageHeights);
  const activePageHeight = pageHeights[activeChargerKey] ?? (measuredPageHeights.length > 0 ? Math.max(...measuredPageHeights) : undefined);
  const rememberPageHeight = (chargerKey: string, height: number) => {
    const roundedHeight = Math.ceil(height);
    setPageHeights(current => (current[chargerKey] === roundedHeight ? current : { ...current, [chargerKey]: roundedHeight }));
  };

  useEffect(() => {
    if (selectedIndex < 0) return undefined;

    if (!activePageHeight) {
      const indicatorAnimation = NativeAnimated.parallel([
        NativeAnimated.timing(pagePosition, { duration: 220, toValue: selectedIndex, useNativeDriver: true }),
        NativeAnimated.timing(pageOffset, { duration: 220, toValue: 0, useNativeDriver: true }),
      ]);
      indicatorAnimation.start();
      return () => indicatorAnimation.stop();
    }

    const frame = requestAnimationFrame(() => {
      const distance = Math.abs(selectedIndex - lastPagerIndexRef.current);
      if (distance === 0) return;

      if (distance === 1) {
        pagerRef.current?.setPage(selectedIndex);
      } else {
        pagerRef.current?.setPageWithoutAnimation(selectedIndex);
        NativeAnimated.parallel([
          NativeAnimated.timing(pagePosition, { duration: 220, toValue: selectedIndex, useNativeDriver: true }),
          NativeAnimated.timing(pageOffset, { duration: 220, toValue: 0, useNativeDriver: true }),
        ]).start();
      }
      lastPagerIndexRef.current = selectedIndex;
    });
    return () => cancelAnimationFrame(frame);
  }, [activePageHeight, pageOffset, pagePosition, selectedIndex]);

  if (!activePageHeight) {
    return (
      <ThemedView
        accessibilityHint='Swipe left or right to change charger'
        backgroundColor='transparent'
        key={activeChargerKey}
        onLayout={event => rememberPageHeight(activeChargerKey, event.nativeEvent.layout.height)}>
        <ChargerSection
          charger={activeCharger}
          index={selectedIndex}
          inheritedPriceProfile={inheritedPriceProfile}
          locationId={locationId}
          onEditCharger={() => onEditCharger(activeCharger)}
          onEditPort={port => onEditPort(activeCharger, port)}
          pageWidth={pageWidth}
          stationId={stationId}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView accessibilityHint='Swipe left or right to change charger' backgroundColor='transparent' height={activePageHeight}>
      <PagerView
        initialPage={selectedIndex}
        onPageScroll={event => {
          pagePosition.setValue(event.nativeEvent.position);
          pageOffset.setValue(event.nativeEvent.offset);
        }}
        onPageSelected={event => {
          const nextIndex = event.nativeEvent.position;
          const nextCharger = chargers[nextIndex];
          pagePosition.setValue(nextIndex);
          pageOffset.setValue(0);
          lastPagerIndexRef.current = nextIndex;
          if (nextCharger && nextIndex !== selectedIndex) onSelect(nextCharger);
        }}
        ref={pagerRef}
        style={{ height: activePageHeight, width: '100%' }}>
        {chargers.map((charger, index) => {
          const chargerKey = getChargerSelectionKey(charger);
          const shouldRenderContent = Math.abs(index - selectedIndex) <= 1;

          return (
            <ThemedView backgroundColor='transparent' collapsable={false} key={chargerKey}>
              {shouldRenderContent ? (
                <ThemedView backgroundColor='transparent' onLayout={event => rememberPageHeight(chargerKey, event.nativeEvent.layout.height)}>
                  <ChargerSection
                    charger={charger}
                    index={index}
                    inheritedPriceProfile={inheritedPriceProfile}
                    locationId={locationId}
                    onEditCharger={() => onEditCharger(charger)}
                    onEditPort={port => onEditPort(charger, port)}
                    pageWidth={pageWidth}
                    stationId={stationId}
                  />
                </ThemedView>
              ) : null}
            </ThemedView>
          );
        })}
      </PagerView>
    </ThemedView>
  );
}

export function ChargerTabs({
  chargers,
  onSelect,
  pageOffset,
  pagePosition,
  selectedKey,
}: {
  chargers: WorkflowChargerRecord[];
  onSelect: (charger: WorkflowChargerRecord) => void;
  pageOffset: NativeAnimated.Value;
  pagePosition: NativeAnimated.Value;
  selectedKey: string;
}) {
  const scrollRef = useRef<FlatList<WorkflowChargerRecord>>(null);
  const [tabScrollX] = useState(() => new NativeAnimated.Value(0));
  const tabWidth = rmhs(140);
  const selectedIndex = Math.max(
    0,
    chargers.findIndex(charger => getChargerSelectionKey(charger) === selectedKey),
  );
  const selectedCharger = chargers[selectedIndex];
  const selectedAccentColor = getWorkflowChargerType(selectedCharger) === 'car' ? '#B86A13' : '#17834A';
  const indicatorTranslateX = NativeAnimated.subtract(NativeAnimated.multiply(NativeAnimated.add(pagePosition, pageOffset), tabWidth), tabScrollX);

  useEffect(() => {
    if (chargers.length === 0) return undefined;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToIndex({ animated: true, index: selectedIndex, viewPosition: 0.5 });
    });
    return () => cancelAnimationFrame(frame);
  }, [chargers.length, selectedIndex]);

  return (
    <ThemedView
      backgroundColor={Palette.surfaceBase}
      borderBottomColor={Palette.borderSubtle}
      borderBottomWidth={1}
      overflow='hidden'
      position='relative'
      width='100%'>
      <FlatList
        data={chargers}
        extraData={selectedKey}
        getItemLayout={(_, index) => ({ index, length: tabWidth, offset: tabWidth * index })}
        horizontal
        initialNumToRender={4}
        keyExtractor={getChargerSelectionKey}
        maxToRenderPerBatch={6}
        onScroll={event => tabScrollX.setValue(event.nativeEvent.contentOffset.x)}
        ref={scrollRef}
        renderItem={({ item: charger, index }) => {
          const isCar = getWorkflowChargerType(charger) === 'car';
          const chargerKey = getChargerSelectionKey(charger);
          const isSelected = chargerKey === selectedKey;
          const accentColor = isCar ? '#B86A13' : '#17834A';
          const identifier = isCar ? charger.vendorId : charger.uniqueId;
          const label = charger.name || `${isCar ? 'Car' : 'Bike'} charger ${String(index + 1).padStart(2, '0')}`;

          return (
            <Pressable
              accessibilityLabel={`Select ${label}`}
              accessibilityRole='button'
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(charger)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: tabWidth })}>
              <ThemedView alignItems='flex-start' backgroundColor='transparent' gap={3} height={58} justifyContent='center' paddingHorizontal={rmhs(14)}>
                <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={5}>
                  {isCar ? (
                    <Car color={isSelected ? accentColor : Palette.textTertiary} size={14} />
                  ) : (
                    <Bike color={isSelected ? accentColor : Palette.textTertiary} size={14} />
                  )}
                  <ThemedText
                    color={isSelected ? Palette.textPrimary : Palette.textSecondary}
                    flex={1}
                    fontFamily={FontFamily.semibold}
                    fontSize={11}
                    lineHeight={15}
                    numberOfLines={1}
                    selectable>
                    {label}
                  </ThemedText>
                </ThemedView>
                <ThemedText color={isSelected ? accentColor : Palette.textTertiary} fontSize={9} lineHeight={13} numberOfLines={1} selectable>
                  {identifier || (isCar ? 'Vendor ID unavailable' : 'Unique ID unavailable')}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        }}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        windowSize={5}
      />
      <NativeAnimatedThemedView
        pointerEvents='none'
        backgroundColor={selectedAccentColor}
        bottom={0}
        height={2}
        left={0}
        position='absolute'
        style={{ transform: [{ translateX: indicatorTranslateX }] }}
        width={tabWidth}
      />
    </ThemedView>
  );
}

function ChargerSection({
  charger,
  inheritedPriceProfile,
  index,
  locationId,
  onEditCharger,
  onEditPort,
  pageWidth,
  stationId,
}: {
  charger: WorkflowChargerRecord;
  inheritedPriceProfile?: LocationPartnership['tariff'] | Record<string, unknown>;
  index: number;
  locationId: string;
  onEditCharger: () => void;
  onEditPort: (port: ChargerPortRecord) => void;
  pageWidth: number;
  stationId: number;
}) {
  const isCar = getWorkflowChargerType(charger) === 'car';
  const ports = isCar ? charger.carConnectors || [] : charger.outlets || [];
  const rawCharger = charger as WorkflowChargerRecord & Record<string, unknown>;
  const mutations = useLocationResourceMutations(locationId, stationId);
  const type = isCar ? 'car' : 'bike';
  const path = type === 'car' ? 'api/car_boxes' : 'api/bike_boxes';
  const firstPort = ports[0];
  const run = (promise: Promise<unknown>, success: string) =>
    promise.then(() => Alert.alert('Success', success)).catch(error => Alert.alert('Action failed', error?.message || 'Please try again.'));

  const offset = getChargerDisplayValue(rawCharger, ['offset', 'offsetKwh', 'offset_kwh']);
  const standby = getChargerDisplayValue(rawCharger, ['standby', 'standbyKwh', 'standby_kwh']);
  const dateReport = getChargerDisplayValue(rawCharger, ['dateReport', 'date_report', 'reportDate', 'report_date']);
  const readMeter = getChargerDisplayValue(rawCharger, ['readMeter', 'read_meter']);
  const accentColor = isCar ? '#B86A13' : '#17834A';
  const accentTone = isCar ? '#FFF5E8' : '#EEF7F1';
  const chargerIdentifier = getWorkflowChargerIdentifier(charger);
  const chargerStatus = charger.enabled === false ? 'Disabled' : charger.visible === false ? 'Hidden' : 'Active';
  const chargerStatusColor = charger.enabled === false || charger.visible === false ? '#B42318' : accentColor;
  const readyPortCount = ports.filter(port => port.visible !== false && port.status !== false).length;
  const busyPortCount = ports.filter(port => port.visible !== false && port.status === false).length;
  const portCardWidth = (pageWidth - rmhs(8)) / 2;

  return (
    <ThemedView backgroundColor='#FFFFFF' borderBottomColor={Palette.borderSubtle} borderBottomWidth={1}>
      <ThemedView backgroundColor='transparent' gap={'two'} paddingVertical={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
          <ThemedView backgroundColor='transparent' flex={1} minWidth={0}>
            <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={9} letterSpacing={0.7} textTransform='uppercase' selectable>
              {chargerIdentifier || 'Identifier not assigned'}
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} numberOfLines={1} selectable>
              {charger.name || chargerIdentifier || `Charger #${charger.id}`}
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={5}>
            <ThemedView backgroundColor={chargerStatusColor} borderRadius={'pill'} height={7} width={7} />
            <ThemedText color={chargerStatusColor} fontFamily={FontFamily.semibold} fontSize={10}>
              {chargerStatus}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}
        style={{ marginHorizontal: -16 }}>
        <ChargerActionButton icon={Pencil} label='Edit' onPress={onEditCharger} />
        <ChargerActionButton
          icon={Zap}
          label='Trigger'
          onPress={() =>
            chargerIdentifier &&
            run(
              requestTriggerCharger(chargerIdentifier, { connector: firstPort?.orderOnBox || 0, requestedMessage: 'StatusNotification' }),
              'Status requested.',
            )
          }
        />
        <ChargerActionButton
          icon={RotateCcw}
          label='S-Reset'
          onPress={() => chargerIdentifier && run(requestResetCharger(chargerIdentifier, 'Soft'), 'Soft reset requested.')}
        />
        <ChargerActionButton
          icon={RotateCcw}
          label='H-Reset'
          onPress={() =>
            chargerIdentifier &&
            Alert.alert('Hard reset', 'Restart this charger now?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => run(requestResetCharger(chargerIdentifier, 'Hard'), 'Hard reset requested.') },
            ])
          }
        />

        {firstPort ? (
          <ChargerActionButton
            icon={BatteryCharging}
            label='Unlock'
            onPress={() =>
              chargerIdentifier &&
              Alert.alert('Unlock port', `Unlock port ${firstPort.name || firstPort.uniqueId || `Port #${firstPort.id}`}?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Unlock',
                  onPress: () => run(requestUnlockCharger(chargerIdentifier, firstPort.orderOnBox || 1), 'Unlock requested.'),
                },
              ])
            }
          />
        ) : null}
      </ScrollView>
      <ThemedView
        backgroundColor='#FAFAFA'
        borderColor={Palette.borderSubtle}
        borderRadius={12}
        borderWidth={1}
        gap={'two'}
        marginBottom={'three'}
        padding={'two'}>
        <ThemedView flexDirection='row'>
          <ChargerStat label='Offset' value={offset || '--'} />
          <ThemedView backgroundColor={Palette.borderSubtle} marginHorizontal={'two'} width={1} />
          <ChargerStat label='Standby' value={standby || '--'} />
          <ThemedView backgroundColor={Palette.borderSubtle} marginHorizontal={'two'} width={1} />
          <ChargerStat label='Date report' value={dateReport || '--'} />
        </ThemedView>
        <ThemedView backgroundColor={Palette.borderSubtle} height={1} marginVertical={2} />
        <ThemedView flexDirection='row'>
          <ChargerStat isSwitch label='Visible' value={charger.visible !== false} />
          <ThemedView backgroundColor={Palette.borderSubtle} marginHorizontal={'two'} width={1} />
          <ChargerStat isSwitch label='Enabled' value={charger.enabled !== false} />
          <ThemedView backgroundColor={Palette.borderSubtle} marginHorizontal={'two'} width={1} />
          <ChargerStat isSwitch label='Read meter' value={readMeter === true || readMeter === 'true'} />
        </ThemedView>
      </ThemedView>

      <ThemedView backgroundColor='transparent' gap={'two'} paddingBottom={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
            <ThemedView backgroundColor='transparent'>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13}>
                {isCar ? 'Connectors' : 'Outlets'}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontSize={10} marginTop={1}>
                2-column layout · tap to edit
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={11}>
            {ports.length}
          </ThemedText>
        </ThemedView>
        {ports.length > 0 ? (
          <ThemedView backgroundColor='transparent' columnGap={rmhs(8)} flexDirection='row' flexWrap='wrap' rowGap={rmhs(8)}>
            {ports.map((port, portIndex) => {
              const portNumber = typeof port.orderOnBox === 'number' ? port.orderOnBox + 1 : portIndex + 1;
              const portLabel = `${isCar ? 'Connector' : 'Outlet'} ${String(portNumber).padStart(2, '0')}`;
              const displayName = port.name || portLabel;
              const repeatsLabel = displayName.trim().toLowerCase() === portLabel.toLowerCase();
              const subText = [repeatsLabel ? undefined : portLabel, port.power ? `${port.power} kW` : undefined].filter(Boolean).join(' · ');
              const pricing = getPortPricing(port, inheritedPriceProfile, isCar ? 'car' : 'bike');

              return (
                <Pressable
                  accessibilityLabel={`Edit ${portLabel}`}
                  accessibilityRole='button'
                  key={port.id}
                  onPress={() => onEditPort(port)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1, width: portCardWidth })}>
                  <ThemedView
                    backgroundColor={port.visible === false ? '#F3F4F6' : '#FFFFFF'}
                    borderColor={port.visible === false ? '#E5E7EB' : isCar ? 'rgba(184, 106, 19, 0.22)' : 'rgba(23, 131, 74, 0.22)'}
                    borderRadius={12}
                    borderWidth={1}
                    gap={'two'}
                    padding={10}
                    style={
                      port.visible !== false
                        ? {
                            shadowColor: isCar ? '#B86A13' : '#17834A',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.08,
                            shadowRadius: 16,
                            elevation: 3,
                          }
                        : undefined
                    }
                    width='100%'>
                    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
                      <ThemedView backgroundColor='transparent' flex={1} minWidth={0}>
                        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={1} selectable>
                          {displayName}
                        </ThemedText>
                        {subText ? (
                          <ThemedText color={Palette.textSecondary} fontSize={10} lineHeight={15} numberOfLines={1} selectable>
                            {subText}
                          </ThemedText>
                        ) : null}
                      </ThemedView>
                      <ChevronRight color={Palette.textTertiary} size={15} />
                    </ThemedView>
                    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={8} flexWrap='wrap'>
                      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={4}>
                        <ThemedView backgroundColor={port.visible === false ? Palette.textTertiary : '#1477B9'} borderRadius={'pill'} height={6} width={6} />
                        <ThemedText color={port.visible === false ? Palette.textTertiary : '#1477B9'} fontFamily={FontFamily.semibold} fontSize={9}>
                          {port.visible === false ? 'Hidden' : 'Visible'}
                        </ThemedText>
                      </ThemedView>
                      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={4}>
                        <ThemedView backgroundColor={port.status !== false ? accentColor : '#D97706'} borderRadius={'pill'} height={6} width={6} />
                        <ThemedText color={port.status !== false ? accentColor : '#B45309'} fontFamily={FontFamily.semibold} fontSize={9}>
                          {port.status !== false ? 'Available' : 'Charging'}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <PortPricingSummary pricing={pricing} />
                  </ThemedView>
                </Pressable>
              );
            })}
          </ThemedView>
        ) : (
          <ThemedView alignItems='center' backgroundColor='transparent' paddingVertical={'four'}>
            <ThemedText color={Palette.textSecondary} fontSize={11} textAlign='center'>
              No {isCar ? 'connectors' : 'outlets'} assigned
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

type PortPricing = {
  name: string;
  profileReference?: string;
  rates: PortPricingRate[];
  secondaryName?: string;
};

type PortPricingRate = {
  activation?: string;
  charging?: string;
  direction?: string;
  key: string;
  parking?: string;
  schedule?: string;
};

function getPortPricing(
  port: ChargerPortRecord,
  inheritedPriceProfile: LocationPartnership['tariff'] | Record<string, unknown> | undefined,
  chargerType: 'bike' | 'car',
): PortPricing | undefined {
  const portRecord = port as unknown as Record<string, unknown>;
  const profileValue = getUnknownValue(portRecord, [
    'portProfile',
    'port_profile',
    'priceProfile',
    'price_profile',
    'pricingProfile',
    'pricing_profile',
    'tariff',
  ]);
  const profile = toRecord(profileValue) || toRecord(inheritedPriceProfile);
  const fallbackRate = getFirstRecord(
    profile || portRecord,
    ['priceProfileDetails', 'price_profile_details', 'priceDetails', 'price_details', 'rates', 'prices', 'details', 'portFeeSchedules', 'port_fee_schedules'],
    chargerType,
  );
  const profileNameVn = getStringValue(profile, ['nameVn', 'name_vn']);
  const profileName =
    getStringValue(portRecord, [
      'portProfileName',
      'port_profile_name',
      'priceProfileName',
      'price_profile_name',
      'pricingProfileName',
      'pricing_profile_name',
      'tariffName',
      'tariff_name',
    ]) ||
    getStringValue(profile, ['name', 'title', 'label']) ||
    (typeof profileValue === 'string' && !profileValue.startsWith('/') ? profileValue : undefined) ||
    (typeof inheritedPriceProfile === 'string' ? inheritedPriceProfile : undefined);
  const directSchedules = getRecordArray(portRecord, ['feeSchedules', 'fee_schedules']);
  const rates = directSchedules.flatMap((schedule, scheduleIndex) => {
    const times = getRecordArray(schedule, ['times', 'timeRanges', 'time_ranges']);
    const rateRecords = times.length > 0 ? times : [schedule];

    return rateRecords
      .map((time, timeIndex) => getPortPricingRate([time, schedule, profile, portRecord], `${scheduleIndex}-${timeIndex}`))
      .filter((rate): rate is PortPricingRate => Boolean(rate));
  });

  if (rates.length === 0) {
    const fallback = getPortPricingRate(
      [fallbackRate, profile, portRecord].filter((source): source is Record<string, unknown> => Boolean(source)),
      'fallback',
    );
    if (fallback) rates.push(fallback);
  }

  if (!profileName && !profileNameVn && rates.length === 0) return undefined;

  const profileId = getUnknownValue(profile, ['id']);
  const primaryName = profileName || profileNameVn || 'Price profile';
  const secondaryName = undefined;

  return {
    name: primaryName,
    profileReference: typeof profileId === 'number' || typeof profileId === 'string' ? `Profile #${profileId}` : undefined,
    rates,
    secondaryName,
  };
}

function getPortPricingRate(records: (Record<string, unknown> | undefined)[], key: string): PortPricingRate | undefined {
  const sources = records.filter((source): source is Record<string, unknown> => Boolean(source));
  const charging = getPriceValue(sources, [
    'chargingFee',
    'charging_fee',
    'electricityPrice',
    'electricity_price',
    'energyPrice',
    'energy_price',
    'chargingPrice',
    'charging_price',
    'chargePrice',
    'charge_price',
    'pricePerKwh',
    'price_per_kwh',
    'unitPrice',
    'unit_price',
    'price',
  ]);
  const activation = getPriceValue(sources, [
    'activationFee',
    'activation_fee',
    'minimumFee',
    'minimum_fee',
    'minimumPrice',
    'minimum_price',
    'servicePrice',
    'service_price',
    'serviceFee',
    'service_fee',
  ]);
  const parking = getPriceValue(sources, ['parkingPrice', 'parking_price', 'parkingFee', 'parking_fee', 'idlePrice', 'idle_price', 'idleFee', 'idle_fee']);
  const startTime = getFirstStringValue(sources, ['begin', 'startTime', 'start_time', 'fromTime', 'from_time']);
  const endTime = getFirstStringValue(sources, ['end', 'endTime', 'end_time', 'toTime', 'to_time']);
  const dayLabel = getFirstStringValue(sources, [
    'dayVn',
    'day_vn',
    'weekday.nameVn',
    'weekday.name',
    'day',
    'dayLabel',
    'day_label',
    'days',
    'dayOfWeek.name',
    'day_of_week.name',
  ]);
  const direction = getFirstStringValue(sources, [
    'currentDirection.type',
    'current_direction.type',
    'currentDirection.name',
    'current_direction.name',
    'currentDirection',
    'current_direction',
  ]);
  const schedule = [dayLabel, startTime && endTime ? `${startTime}–${endTime}` : startTime || endTime].filter(Boolean).join(' · ') || undefined;

  if (!charging && !activation && !parking && !schedule && !direction) return undefined;

  return { activation, charging, direction, key, parking, schedule };
}

function PortPricingSummary({ pricing }: { pricing?: PortPricing }) {
  if (!pricing) {
    return (
      <ThemedView
        alignItems='center'
        backgroundColor='transparent'
        borderTopColor={Palette.borderSubtle}
        borderTopWidth={1}
        flexDirection='row'
        gap={6}
        paddingTop={'two'}>
        <BadgeDollarSign color={Palette.textTertiary} size={13} />
        <ThemedText color={Palette.textTertiary} flex={1} fontSize={10} lineHeight={14} numberOfLines={1}>
          No price profile
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView backgroundColor='transparent' borderTopColor={Palette.borderSubtle} borderTopWidth={1} gap={4} paddingTop={8}>
      <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={6}>
        <BadgeDollarSign color={Palette.textSecondary} size={13} />
        <ThemedView alignItems='center' backgroundColor='transparent' flex={1} flexDirection='row' flexWrap='wrap' gap={4} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={14} selectable>
            {pricing.name}
          </ThemedText>
          {pricing.secondaryName || pricing.profileReference ? (
            <ThemedText color={Palette.textSecondary} fontSize={8.5} lineHeight={14} selectable>
              {[pricing.secondaryName, pricing.profileReference].filter(Boolean).join(' · ')}
            </ThemedText>
          ) : null}
        </ThemedView>
      </ThemedView>
      {pricing.rates.length > 0 ? (
        pricing.rates.map((rate, index) => {
          const isLast = index === pricing.rates.length - 1;
          const priceItems = [
            { color: '#E98700', icon: Zap, key: 'charging', label: 'Charging', value: rate.charging },
            { color: '#6B7280', icon: CircleDollarSign, key: 'activation', label: 'Activation', value: rate.activation },
            { color: '#6B7280', icon: CircleParking, key: 'parking', label: 'Parking', value: rate.parking },
          ].filter((item): item is { color: string; icon: LucideIcon; key: string; label: string; value: string } => Boolean(item.value));

          return (
            <ThemedView
              backgroundColor='#F7F9F8'
              borderBottomLeftRadius={isLast ? 12 : 0}
              borderBottomRightRadius={isLast ? 12 : 0}
              gap={4}
              key={rate.key}
              marginBottom={isLast ? -10 : 0}
              marginHorizontal={-10}
              paddingHorizontal={10}
              paddingVertical={8}>
              {rate.schedule || rate.direction ? (
                <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={4}>
                  <Clock3 color={Palette.textTertiary} size={10} />
                  <ThemedText color={Palette.textSecondary} flex={1} fontSize={8.5} lineHeight={11} numberOfLines={2} selectable>
                    {rate.schedule || 'Schedule unavailable'}
                  </ThemedText>
                  {rate.direction ? (
                    <ThemedView backgroundColor='#E8EEEB' borderRadius={'pill'} paddingHorizontal={5} paddingVertical={2}>
                      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={8} lineHeight={10} selectable>
                        {rate.direction}
                      </ThemedText>
                    </ThemedView>
                  ) : null}
                </ThemedView>
              ) : null}
              {priceItems.length > 0 ? (
                <ThemedView backgroundColor='transparent' gap={3}>
                  {priceItems.map(item => (
                    <PortPrice key={item.key} color={item.color} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </ThemedView>
              ) : (
                <ThemedText color={Palette.textTertiary} fontSize={9} lineHeight={13}>
                  Pricing details unavailable
                </ThemedText>
              )}
            </ThemedView>
          );
        })
      ) : (
        <ThemedText color={Palette.textTertiary} fontSize={9} lineHeight={13}>
          Pricing details unavailable
        </ThemedText>
      )}
    </ThemedView>
  );
}

function PortPrice({ color, icon: Icon, label, value }: { color: string; icon: LucideIcon; label: string; value: string }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={4} justifyContent='space-between'>
      <ThemedView alignItems='center' backgroundColor='transparent' flex={1} flexDirection='row' gap={4}>
        <Icon color={color} size={10} />
        <ThemedText color={Palette.textSecondary} fontSize={8.5} lineHeight={12} numberOfLines={1}>
          {label}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={8.5} lineHeight={12} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function toRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function getUnknownValue(record: Record<string, unknown> | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    if (record[key] != null) return record[key];
    if (!key.includes('.')) continue;
    const nestedValue = key.split('.').reduce<unknown>((value, segment) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
      return (value as Record<string, unknown>)[segment];
    }, record);
    if (nestedValue != null) return nestedValue;
  }
  return undefined;
}

function getStringValue(record: Record<string, unknown> | undefined, keys: string[]) {
  const value = getUnknownValue(record, keys);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function getFirstStringValue(records: Record<string, unknown>[], keys: string[]) {
  for (const record of records) {
    const value = getStringValue(record, keys);
    if (value) return value;
  }
  return undefined;
}

function getRecordArray(record: Record<string, unknown> | undefined, keys: string[]) {
  const value = getUnknownValue(record, keys);
  if (!Array.isArray(value)) return [];
  return value.map(toRecord).filter((item): item is Record<string, unknown> => Boolean(item));
}

function getFirstRecord(record: Record<string, unknown>, keys: string[], preferredBoxType?: 'bike' | 'car') {
  const value = getUnknownValue(record, keys);
  if (Array.isArray(value)) {
    const records = value.map(toRecord).filter((item): item is Record<string, unknown> => Boolean(item));
    const expectedCurrentDirection = preferredBoxType === 'car' ? 'dc' : 'ac';
    return (
      records.find(item => getStringValue(item, ['boxType', 'box_type', 'chargerType', 'charger_type'])?.toLowerCase() === preferredBoxType) ||
      records.find(item => getStringValue(item, ['currentDirection.type', 'current_direction.type'])?.toLowerCase() === expectedCurrentDirection) ||
      records[0]
    );
  }
  return toRecord(value);
}

function getPriceValue(records: Record<string, unknown>[], keys: string[], unit = '') {
  for (const record of records) {
    const value = getUnknownValue(record, keys);
    if (typeof value === 'number' && Number.isFinite(value)) return `${vietnameseNumberFormatter.format(value)} đ${unit}`;
    if (typeof value !== 'string' || !value.trim()) continue;
    const normalized = value.trim();
    if (/^-?\d+(?:[.,]\d+)?$/.test(normalized)) {
      const parsed = Number(normalized.replace(',', '.'));
      if (Number.isFinite(parsed)) return `${vietnameseNumberFormatter.format(parsed)} đ${unit}`;
    }
    return /(?:đ|vnd|₫)/i.test(normalized) ? normalized : `${normalized} đ${unit}`;
  }
  return undefined;
}

function getChargerDisplayValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function formatBooleanLike(value: unknown) {
  if (value === true || value === 'true') return 'Active';
  if (value === false || value === 'false') return 'Inactive';
  return String(value);
}

function ChargerMeta({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={4}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={9} numberOfLines={1} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function StationSummary({
  chargerCount,
  outletCount,
  onEdit,
  onVisibilityChange,
  station,
  visibilityLoading,
  visible,
}: {
  chargerCount: number;
  outletCount: number;
  onEdit: () => void;
  onVisibilityChange: (visible: boolean) => void;
  station: StationRecord;
  visibilityLoading: boolean;
  visible: boolean;
}) {
  const areaName = station.stationAreaType?.name || station.stationAreaType?.nameVn || 'Not specified';
  const areaSetting = station.stationAreaType?.outside == null ? undefined : station.stationAreaType.outside ? 'Outdoor' : 'Indoor';
  const openProfile = station.stationOpenProfile?.name || station.stationOpenProfile?.nameVn;
  const openingHours = station.fullTime || openProfile?.replaceAll(/[^a-z0-9]/gi, '') === '247' ? 'Open 24/7' : openProfile || 'Not specified';
  const description = station.description || station.descriptionVn || 'No description provided.';

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={'two'} paddingHorizontal={'one'}>
        <ThemedText color={Palette.textSecondary} flex={1} fontSize={12} lineHeight={18} selectable>
          {description}
        </ThemedText>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
          <Switch
            accessibilityLabel='Station visibility'
            disabled={visibilityLoading}
            ios_backgroundColor='#D9DDE2'
            onValueChange={onVisibilityChange}
            style={{ transform: [{ scale: 0.75 }] }}
            trackColor={{ false: '#D9DDE2', true: '#87D4A3' }}
            value={visible}
          />
          <Pressable accessibilityLabel='Edit station' onPress={onEdit}>
            <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={11} height={36} justifyContent='center' width={36}>
              <Pencil color={Palette.textSecondary} size={16} />
            </ThemedView>
          </Pressable>
        </ThemedView>
      </ThemedView>

      <ThemedView backgroundColor='#FAFAFA' borderColor={Palette.borderSubtle} borderRadius={12} borderWidth={1} flexDirection='row' padding={'two'}>
        <StationFact label='Area' value={[areaSetting, areaName].filter(Boolean).join(' · ')} />
        <ThemedView backgroundColor={Palette.borderSubtle} marginHorizontal={'two'} width={1} />
        <StationFact label='Open time' value={openingHours} />
        <ThemedView backgroundColor={Palette.borderSubtle} marginHorizontal={'two'} width={1} />
        <StationFact label='Access' value={station.public ? 'Public' : 'Private'} />
      </ThemedView>
    </ThemedView>
  );
}

function formatStationDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : stationDateFormatter.format(date);
}

function StationInfo({ flex, icon: Icon, label, meta, value }: { flex?: number; icon: LucideIcon; label: string; meta?: string; value: string }) {
  return (
    <ThemedView backgroundColor='#F7F8F8' borderRadius={12} flex={flex} flexDirection='row' gap={'two'} minWidth={0} padding={'two'}>
      <ThemedView alignItems='center' backgroundColor='#EAF3EE' borderRadius={9} height={30} justifyContent='center' width={30}>
        <Icon color={Palette.accent} size={14} strokeWidth={2} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' flex={1} minWidth={0}>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={8} letterSpacing={0.4} textTransform='uppercase'>
          {label}
        </ThemedText>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={14} numberOfLines={2} selectable>
          {value}
        </ThemedText>
        {meta ? (
          <ThemedText color={Palette.textSecondary} fontSize={9} lineHeight={13} numberOfLines={1} selectable>
            {meta}
          </ThemedText>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}

function StationFact({ label, value }: { label: string; value: number | string }) {
  return (
    <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={9} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} numberOfLines={1} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function ChargerStat({ label, value, isSwitch }: { label: string; value: string | boolean; isSwitch?: boolean }) {
  return (
    <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={9} textTransform='uppercase'>
        {label}
      </ThemedText>
      {isSwitch ? (
        <ThemedView alignItems='flex-start' marginTop={2} pointerEvents='none'>
          <Switch
            disabled
            ios_backgroundColor='#D9DDE2'
            style={{ transform: [{ scale: 0.75 }], marginLeft: -6, marginVertical: -4 }}
            trackColor={{ false: '#D9DDE2', true: '#87D4A3' }}
            value={Boolean(value)}
          />
        </ThemedView>
      ) : (
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} numberOfLines={1} selectable>
          {String(value)}
        </ThemedText>
      )}
    </ThemedView>
  );
}

function ChargerActionButton({
  icon: IconComponent,
  label,
  onPress,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? Palette.danger : Palette.accent;
  const bgColor = danger ? '#FEF2F2' : '#F4F6F6';
  return (
    <Pressable onPress={onPress} accessibilityRole='button' style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <ThemedView alignItems='center' backgroundColor={bgColor} borderRadius={16} gap={6} square={76} justifyContent='center' paddingHorizontal={'two'}>
        <IconComponent color={color} size={22} strokeWidth={2} />
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14} numberOfLines={2} textAlign='center'>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}
