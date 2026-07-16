import { Alert, FlatList, Pressable, Switch } from 'react-native';
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
  Eye,
  EyeOff,
  MapPin,
  MoreHorizontal,
  Pencil,
  Power,
  RotateCcw,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';

import { ThemedText, ThemedView } from 'components/base';
import { ActionSheet, AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { rmhs } from 'themes/scaling';
import { getDisplayImageUrl } from 'utils/media/image-url';
import { useLocationDetail, useLocationPartnership, useLocationPriceProfiles, useLocationResourceMutations, useStationChargers } from 'shared/locations/hooks';
import { requestResetCharger, requestTriggerCharger, requestUnlockCharger } from 'app/location/[id]/features/charger-service';
import { getWorkflowChargerIdentifier, getWorkflowChargerType } from 'app/location/[id]/features/charger-workflows';
import { ResourceFormSheet } from 'app/location/[id]/components/resource-form-sheet';

const vietnameseNumberFormatter = new Intl.NumberFormat('vi-VN');

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
  locationId,
  onContentHeightChange,
  station,
}: {
  locationId: string;
  onContentHeightChange?: (height: number) => void;
  station: StationRecord;
}) {
  const locationQuery = useLocationDetail(locationId);
  const partnershipQuery = useLocationPartnership(locationQuery.data);
  const priceProfilesQuery = useLocationPriceProfiles(Boolean(locationQuery.data));
  const chargersQuery = useStationChargers(station.id);
  const mutations = useLocationResourceMutations(locationId, station.id);
  const [selected, setSelected] = useState<WorkflowChargerRecord>();
  const [editStationOpen, setEditStationOpen] = useState(false);
  const [editCharger, setEditCharger] = useState<WorkflowChargerRecord>();
  const [editPort, setEditPort] = useState<{ charger: WorkflowChargerRecord; port: ChargerPortRecord }>();
  const [createChargerType, setCreateChargerType] = useState<'bike' | 'car'>();
  const [selectedChargerKey, setSelectedChargerKey] = useState<string>();
  const chargers = chargersQuery.data?.pages.flatMap(page => page.items) || [];
  const activeCharger = chargers.find(charger => getChargerSelectionKey(charger) === selectedChargerKey) || chargers[0];
  const activeChargerIndex = activeCharger ? chargers.indexOf(activeCharger) : -1;
  const outletCount = chargers.reduce(
    (total, charger) => total + (getWorkflowChargerType(charger) === 'car' ? charger.carConnectors?.length || 0 : charger.outlets?.length || 0),
    0,
  );
  const partnership = partnershipQuery.data;
  const inheritedPriceProfile =
    priceProfilesQuery.data?.find(profile => String(profile.id) === String(partnership?.priceProfileId)) || partnership?.tariff || undefined;
  const toggleStation = () => mutations.patch.mutate({ data: { visible: station.visible === false }, id: station.id, path: 'api/stations' });

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
        onAddBike={() => setCreateChargerType('bike')}
        onAddCar={() => setCreateChargerType('car')}
        onEdit={() => setEditStationOpen(true)}
        onRefresh={() => chargersQuery.refetch()}
        station={station}
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
        <ThemedView backgroundColor='transparent' gap={'two'}>
          {chargers.length > 1 ? (
            <ChargerSelector
              chargers={chargers}
              onSelect={charger => setSelectedChargerKey(getChargerSelectionKey(charger))}
              selectedKey={getChargerSelectionKey(activeCharger)}
            />
          ) : null}
          <ChargerSection
            charger={activeCharger}
            inheritedPriceProfile={inheritedPriceProfile}
            index={activeChargerIndex}
            key={getChargerSelectionKey(activeCharger)}
            onActions={() => setSelected(activeCharger)}
            onEditPort={port => setEditPort({ charger: activeCharger, port })}
          />
        </ThemedView>
      )}

      {chargersQuery.hasNextPage ? (
        <AppButton block label='Load more chargers' loading={chargersQuery.isFetchingNextPage} onPress={() => chargersQuery.fetchNextPage()} />
      ) : null}

      {station.visible === false ? <AppButton block label='Show station' onPress={toggleStation} /> : null}

      <ChargerActionSheet
        charger={selected}
        locationId={locationId}
        onClose={() => setSelected(undefined)}
        onEdit={() => {
          setEditCharger(selected);
          setSelected(undefined);
        }}
        stationId={station.id}
      />
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
          { key: 'name', label: 'Name' },
          { key: 'uniqueId', label: 'Unique ID' },
          { key: 'vendorId', label: 'Vendor ID' },
          { key: 'visible', label: 'Visible', type: 'switch' },
          { key: 'enabled', label: 'Enabled', type: 'switch' },
        ]}
        initialValues={{ enabled: true, visible: true }}
        loading={mutations.create.isPending}
        onClose={() => setCreateChargerType(undefined)}
        onSubmit={values =>
          createChargerType &&
          mutations.create.mutate(
            {
              data: { ...values, station: station.iriId || `/api/stations/${station.id}` },
              path: createChargerType === 'car' ? 'api/car_boxes' : 'api/bike_boxes',
            },
            { onSuccess: () => setCreateChargerType(undefined) },
          )
        }
        open={Boolean(createChargerType)}
        title={`Add ${createChargerType || ''} charger`}
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

function getChargerSelectionKey(charger: WorkflowChargerRecord) {
  return `${getWorkflowChargerType(charger)}-${charger.id}`;
}

function ChargerSelector({
  chargers,
  onSelect,
  selectedKey,
}: {
  chargers: WorkflowChargerRecord[];
  onSelect: (charger: WorkflowChargerRecord) => void;
  selectedKey: string;
}) {
  return (
    <ThemedView backgroundColor='transparent' borderBottomColor={Palette.borderSubtle} borderBottomWidth={1}>
      <FlatList
        contentContainerStyle={{ gap: rmhs(20), paddingHorizontal: rmhs(4) }}
        data={chargers}
        horizontal
        keyExtractor={getChargerSelectionKey}
        renderItem={({ item: charger, index }) => {
          const isCar = getWorkflowChargerType(charger) === 'car';
          const chargerKey = getChargerSelectionKey(charger);
          const isSelected = chargerKey === selectedKey;
          const accentColor = isCar ? '#B86A13' : '#17834A';
          const ports = isCar ? charger.carConnectors || [] : charger.outlets || [];

          return (
            <Pressable
              accessibilityLabel={`Select ${charger.name || `charger ${index + 1}`}`}
              accessibilityRole='button'
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(charger)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <ThemedView
                alignItems='center'
                backgroundColor='transparent'
                borderBottomColor={isSelected ? accentColor : 'transparent'}
                borderBottomWidth={2}
                gap={3}
                minHeight={48}
                minWidth={rmhs(76)}
                paddingBottom={8}
                paddingHorizontal={2}
                paddingTop={4}>
                <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={5}>
                  {isCar ? (
                    <Car color={isSelected ? accentColor : Palette.textTertiary} size={14} />
                  ) : (
                    <Bike color={isSelected ? accentColor : Palette.textTertiary} size={14} />
                  )}
                  <ThemedText color={isSelected ? Palette.textPrimary : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={11}>
                    Charger {String(index + 1).padStart(2, '0')}
                  </ThemedText>
                </ThemedView>
                <ThemedText color={isSelected ? accentColor : Palette.textTertiary} fontSize={9}>
                  {ports.length} {isCar ? 'connectors' : 'outlets'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        }}
        showsHorizontalScrollIndicator={false}
      />
    </ThemedView>
  );
}

function ChargerSection({
  charger,
  inheritedPriceProfile,
  index,
  onActions,
  onEditPort,
}: {
  charger: WorkflowChargerRecord;
  inheritedPriceProfile?: LocationPartnership['tariff'] | Record<string, unknown>;
  index: number;
  onActions: () => void;
  onEditPort: (port: ChargerPortRecord) => void;
}) {
  const isCar = getWorkflowChargerType(charger) === 'car';
  const ports = isCar ? charger.carConnectors || [] : charger.outlets || [];
  const rawCharger = charger as WorkflowChargerRecord & Record<string, unknown>;
  const offset = getChargerDisplayValue(rawCharger, ['offset', 'offsetKwh', 'offset_kwh']);
  const standby = getChargerDisplayValue(rawCharger, ['standby', 'standbyKwh', 'standby_kwh']);
  const dateReport = getChargerDisplayValue(rawCharger, ['dateReport', 'date_report', 'reportDate', 'report_date']);
  const readMeter = getChargerDisplayValue(rawCharger, ['readMeter', 'read_meter']);
  const accentColor = isCar ? '#B86A13' : '#17834A';
  const accentTone = isCar ? '#FFF5E8' : '#EEF7F1';
  const chargerIdentifier = getWorkflowChargerIdentifier(charger);
  const chargerStatus = charger.enabled === false ? 'Disabled' : charger.visible === false ? 'Hidden' : 'Active';
  const chargerStatusColor = charger.enabled === false || charger.visible === false ? '#B42318' : accentColor;
  const readyPortCount = ports.filter(port => port.visible !== false && !port.used).length;
  const busyPortCount = ports.filter(port => port.visible !== false && port.used).length;
  const metadata = [
    { label: 'Vendor', value: charger.vendorId },
    { label: 'Offset', value: offset },
    { label: 'Standby', value: standby },
    { label: 'Date report', value: dateReport },
    { label: 'Read meter', value: readMeter == null ? undefined : formatBooleanLike(readMeter) },
  ].filter((item): item is { label: string; value: string } => typeof item.value === 'string' && item.value.trim() !== '' && item.value !== '--');

  return (
    <ThemedView backgroundColor='#FFFFFF' borderBottomColor={Palette.borderSubtle} borderBottomWidth={1}>
      <ThemedView backgroundColor='transparent' gap={'two'} paddingHorizontal={'three'} paddingVertical={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
          <ThemedView alignItems='center' backgroundColor={accentTone} borderRadius={'pill'} height={38} justifyContent='center' width={38}>
            {isCar ? <Car color={accentColor} size={18} /> : <Bike color={accentColor} size={18} />}
          </ThemedView>
          <ThemedView backgroundColor='transparent' flex={1} minWidth={0}>
            <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={9} letterSpacing={0.7} textTransform='uppercase'>
              {isCar ? 'Car' : 'Bike'} charger · {String(index + 1).padStart(2, '0')}
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} numberOfLines={1} selectable>
              {charger.name || chargerIdentifier || `Charger #${charger.id}`}
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontSize={10} lineHeight={14} numberOfLines={1} selectable>
              {chargerIdentifier || 'Identifier not assigned'}
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={5}>
            <ThemedView backgroundColor={chargerStatusColor} borderRadius={'pill'} height={7} width={7} />
            <ThemedText color={chargerStatusColor} fontFamily={FontFamily.semibold} fontSize={10}>
              {chargerStatus}
            </ThemedText>
          </ThemedView>
          <Pressable
            accessibilityLabel={`Open actions for ${charger.name || chargerIdentifier || `charger ${charger.id}`}`}
            accessibilityRole='button'
            hitSlop={8}
            onPress={onActions}>
            <ThemedView alignItems='center' backgroundColor='transparent' height={32} justifyContent='center' width={28}>
              <MoreHorizontal color={Palette.textSecondary} size={19} />
            </ThemedView>
          </Pressable>
        </ThemedView>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'} paddingLeft={46}>
          <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={10}>
            {readyPortCount} ready
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontSize={10}>
            ·
          </ThemedText>
          <ThemedText color={busyPortCount > 0 ? '#B45309' : Palette.textSecondary} fontSize={10}>
            {busyPortCount} in use
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontSize={10}>
            ·
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={10}>
            {ports.length} total
          </ThemedText>
        </ThemedView>
      </ThemedView>
      {metadata.length > 0 ? (
        <ThemedView
          backgroundColor='transparent'
          borderTopColor={Palette.borderSubtle}
          borderTopWidth={1}
          flexDirection='row'
          flexWrap='wrap'
          gap={'three'}
          paddingHorizontal={'three'}
          paddingVertical={'two'}>
          {metadata.map(item => (
            <ChargerMeta key={item.label} label={item.label} value={item.value} />
          ))}
        </ThemedView>
      ) : null}
      <ThemedView backgroundColor='#F7F8F8' gap={'two'} paddingVertical={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between' paddingHorizontal={'three'}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
            <ThemedView backgroundColor='transparent'>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13}>
                {isCar ? 'Connectors' : 'Outlets'}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontSize={10} marginTop={1}>
                Swipe to browse · tap to edit
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={11}>
            {ports.length}
          </ThemedText>
        </ThemedView>
        {ports.length > 0 ? (
          <FlatList
            contentContainerStyle={{ gap: rmhs(8), paddingHorizontal: rmhs(12), paddingRight: rmhs(20) }}
            data={ports}
            decelerationRate='fast'
            horizontal
            keyExtractor={port => String(port.id)}
            renderItem={({ item: port, index: portIndex }) => {
              const portNumber = typeof port.orderOnBox === 'number' ? port.orderOnBox + 1 : portIndex + 1;
              const portLabel = `${isCar ? 'Connector' : 'Outlet'} ${String(portNumber).padStart(2, '0')}`;
              const displayName = port.name || portLabel;
              const repeatsLabel = displayName.trim().toLowerCase() === portLabel.toLowerCase();
              const pricing = getPortPricing(port, inheritedPriceProfile, isCar ? 'car' : 'bike');

              return (
                <Pressable
                  accessibilityLabel={`Edit ${portLabel}`}
                  accessibilityRole='button'
                  onPress={() => onEditPort(port)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
                  <ThemedView
                    backgroundColor={port.visible === false ? '#FAFAFA' : '#FFFFFF'}
                    borderColor={Palette.borderSubtle}
                    borderRadius={12}
                    borderWidth={1}
                    gap={'three'}
                    minHeight={134}
                    padding={'three'}
                    width={rmhs(180)}>
                    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
                      <BatteryCharging color={port.visible === false ? Palette.textTertiary : accentColor} size={17} />
                      <ThemedView backgroundColor='transparent' flex={1} minWidth={0}>
                        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={1} selectable>
                          {displayName}
                        </ThemedText>
                        <ThemedText color={Palette.textSecondary} fontSize={10} lineHeight={15} numberOfLines={1} selectable>
                          {[repeatsLabel ? undefined : portLabel, port.uniqueId || port.qrCode || `#${port.id}`, port.power ? `${port.power} kW` : undefined]
                            .filter(Boolean)
                            .join(' · ')}
                        </ThemedText>
                      </ThemedView>
                      <ChevronRight color={Palette.textTertiary} size={15} />
                    </ThemedView>
                    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={5}>
                      <ThemedView
                        backgroundColor={port.visible === false ? Palette.textTertiary : port.used ? '#D97706' : accentColor}
                        borderRadius={'pill'}
                        height={6}
                        width={6}
                      />
                      <ThemedText
                        color={port.visible === false ? Palette.textTertiary : port.used ? '#B45309' : accentColor}
                        fontFamily={FontFamily.semibold}
                        fontSize={9}>
                        {port.visible === false ? 'Hidden' : port.used ? 'In use' : 'Ready'}
                      </ThemedText>
                    </ThemedView>
                    <PortPricingSummary pricing={pricing} />
                  </ThemedView>
                </Pressable>
              );
            }}
            showsHorizontalScrollIndicator={false}
            snapToInterval={rmhs(188)}
          />
        ) : (
          <ThemedView alignItems='center' backgroundColor='transparent' paddingHorizontal={'three'} paddingVertical={'four'}>
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
  energy?: string;
  name: string;
  parking?: string;
  schedule?: string;
  service?: string;
};

function getPortPricing(
  port: ChargerPortRecord,
  inheritedPriceProfile: LocationPartnership['tariff'] | Record<string, unknown> | undefined,
  chargerType: 'bike' | 'car',
): PortPricing | undefined {
  const portRecord = port as unknown as Record<string, unknown>;
  const profileValue = getUnknownValue(portRecord, ['priceProfile', 'price_profile', 'pricingProfile', 'pricing_profile', 'tariff']);
  const profile = toRecord(profileValue) || toRecord(inheritedPriceProfile);
  const rate = getFirstRecord(
    profile || portRecord,
    ['priceProfileDetails', 'price_profile_details', 'priceDetails', 'price_details', 'rates', 'prices', 'details'],
    chargerType,
  );
  const sources = [rate, profile, portRecord].filter((source): source is Record<string, unknown> => Boolean(source));
  const profileName =
    getStringValue(portRecord, ['priceProfileName', 'price_profile_name', 'pricingProfileName', 'pricing_profile_name', 'tariffName', 'tariff_name']) ||
    getStringValue(profile, ['name', 'title', 'label']) ||
    (typeof profileValue === 'string' && !profileValue.startsWith('/') ? profileValue : undefined) ||
    (typeof inheritedPriceProfile === 'string' ? inheritedPriceProfile : undefined);
  const energy = getPriceValue(
    sources,
    [
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
    ],
    '/kWh',
  );
  const service = getPriceValue(sources, ['servicePrice', 'service_price', 'serviceFee', 'service_fee', 'priceService', 'price_service'], '/kWh');
  const parking = getPriceValue(
    sources,
    ['parkingPrice', 'parking_price', 'parkingFee', 'parking_fee', 'idlePrice', 'idle_price', 'idleFee', 'idle_fee'],
    '/min',
  );
  const startTime = getFirstStringValue(sources, ['startTime', 'start_time', 'fromTime', 'from_time']);
  const endTime = getFirstStringValue(sources, ['endTime', 'end_time', 'toTime', 'to_time']);
  const dayLabel =
    getFirstStringValue(sources, ['dayLabel', 'day_label', 'days', 'dayOfWeek', 'day_of_week', 'weekday']) || (startTime || endTime ? 'Everyday' : undefined);
  const schedule = [dayLabel, startTime && endTime ? `${startTime}–${endTime}` : startTime || endTime].filter(Boolean).join(' · ') || undefined;

  if (!profileName && !energy && !service && !parking) return undefined;

  return {
    energy,
    name: profileName || 'Price profile',
    parking,
    schedule,
    service,
  };
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

  const priceItems = [
    { color: '#E98700', icon: Zap, key: 'energy', value: pricing.energy },
    { color: '#6B7280', icon: CircleDollarSign, key: 'service', value: pricing.service },
    { color: '#6B7280', icon: CircleParking, key: 'parking', value: pricing.parking },
  ].filter((item): item is { color: string; icon: LucideIcon; key: string; value: string } => Boolean(item.value));

  return (
    <ThemedView backgroundColor='transparent' borderTopColor={Palette.borderSubtle} borderTopWidth={1} gap={5} paddingTop={'two'}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={6}>
        <BadgeDollarSign color={Palette.textSecondary} size={13} />
        <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={14} numberOfLines={1} selectable>
          {pricing.name}
        </ThemedText>
      </ThemedView>
      {priceItems.length > 0 ? (
        <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={10}>
          {priceItems.map(item => (
            <PortPrice key={item.key} color={item.color} icon={item.icon} value={item.value} />
          ))}
        </ThemedView>
      ) : (
        <ThemedText color={Palette.textTertiary} fontSize={9} lineHeight={13}>
          Pricing details unavailable
        </ThemedText>
      )}
      {pricing.schedule ? (
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={4}>
          <Clock3 color={Palette.textTertiary} size={11} />
          <ThemedText color={Palette.textSecondary} fontSize={9} lineHeight={13} numberOfLines={1} selectable>
            {pricing.schedule}
          </ThemedText>
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

function PortPrice({ color, icon: Icon, value }: { color: string; icon: LucideIcon; value: string }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={4}>
      <Icon color={color} size={12} />
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={14} selectable>
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

function getFirstRecord(record: Record<string, unknown>, keys: string[], preferredBoxType?: 'bike' | 'car') {
  const value = getUnknownValue(record, keys);
  if (Array.isArray(value)) {
    const records = value.map(toRecord).filter((item): item is Record<string, unknown> => Boolean(item));
    return records.find(item => getStringValue(item, ['boxType', 'box_type', 'chargerType', 'charger_type'])?.toLowerCase() === preferredBoxType) || records[0];
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
  onAddBike,
  onAddCar,
  onEdit,
  onRefresh,
  station,
}: {
  chargerCount: number;
  outletCount: number;
  onAddBike: () => void;
  onAddCar: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  station: StationRecord;
}) {
  return (
    <ThemedView backgroundColor='#FFFFFF' borderColor={Palette.borderSubtle} borderRadius={18} borderWidth={1} gap={'three'} padding={'three'}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <ThemedView alignItems='center' backgroundColor='#EEF7F1' borderRadius={11} height={38} justifyContent='center' width={38}>
          <Zap color={Palette.accent} size={18} />
        </ThemedView>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={10} letterSpacing={0.7} textTransform='uppercase'>
            Station details
          </ThemedText>
          {station.description ? (
            <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={17} marginTop={2} numberOfLines={2} selectable>
              {station.description}
            </ThemedText>
          ) : null}
        </ThemedView>
        <Pressable accessibilityLabel='Edit station' onPress={onEdit}>
          <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={11} height={36} justifyContent='center' width={36}>
            <Pencil color={Palette.textSecondary} size={16} />
          </ThemedView>
        </Pressable>
      </ThemedView>
      <ThemedView backgroundColor='#F7F8F8' borderRadius={13} flexDirection='row' gap={'two'} padding={'two'}>
        <StationFact label='Chargers' value={chargerCount} />
        <StationFact label='Outlets' value={outletCount} />
        <StationFact label='Access' value={station.public ? 'Public' : 'Private'} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <SummaryAction icon={Bike} label='Add bike' onPress={onAddBike} />
        <SummaryAction icon={Car} label='Add car' onPress={onAddCar} />
        <SummaryAction icon={RotateCcw} label='Refresh' onPress={onRefresh} />
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
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} numberOfLines={1} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function SummaryAction({ icon: Icon, label, onPress }: { icon: typeof Bike; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={{ flex: 1 }}>
      <ThemedView
        alignItems='center'
        backgroundColor='#FFFFFF'
        borderColor={Palette.borderSubtle}
        borderRadius={12}
        borderWidth={1}
        flexDirection='row'
        gap={'two'}
        justifyContent='center'
        minHeight={40}
        paddingHorizontal={'two'}>
        <Icon color={Palette.accent} size={16} />
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={11}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function ChargerActionSheet({
  charger,
  locationId,
  onClose,
  onEdit,
  stationId,
}: {
  charger?: WorkflowChargerRecord;
  locationId: string;
  onClose: () => void;
  onEdit: () => void;
  stationId: number;
}) {
  const mutations = useLocationResourceMutations(locationId, stationId);
  if (!charger) return <ActionSheet items={[]} onClose={onClose} open={false} />;
  const type = getWorkflowChargerType(charger);
  const path = type === 'car' ? 'api/car_boxes' : 'api/bike_boxes';
  const identifier = getWorkflowChargerIdentifier(charger);
  const firstPort = (type === 'car' ? charger.carConnectors : charger.outlets)?.[0];
  const run = (promise: Promise<unknown>, success: string) =>
    promise.then(() => Alert.alert('Success', success)).catch(error => Alert.alert('Action failed', error?.message || 'Please try again.'));

  return (
    <ActionSheet
      description={identifier}
      onClose={onClose}
      open
      title={charger.name || `Charger #${charger.id}`}
      items={[
        { icon: Pencil, key: 'edit', label: 'Edit charger', meta: 'Update identifiers, name and availability', onPress: onEdit },
        {
          icon: charger.visible === false ? Eye : EyeOff,
          key: 'visible',
          label: charger.visible === false ? 'Show charger' : 'Hide charger',
          meta: 'Controls whether users can see and scan this charger',
          onPress: () => mutations.patch.mutate({ data: { visible: charger.visible === false }, id: charger.id, path }),
        },
        {
          icon: Power,
          key: 'enabled',
          label: charger.enabled === false ? 'Enable charger' : 'Disable charger',
          meta: 'Disabled chargers remain in CMS but cannot charge',
          onPress: () => mutations.patch.mutate({ data: { enabled: charger.enabled === false }, id: charger.id, path }),
        },
        {
          icon: RotateCcw,
          key: 'soft-reset',
          label: 'Soft reset',
          meta: 'Restart charger software without power cycling',
          onPress: () => identifier && run(requestResetCharger(identifier, 'Soft'), 'Soft reset requested.'),
        },
        {
          danger: true,
          icon: RotateCcw,
          key: 'hard-reset',
          label: 'Hard reset',
          meta: 'Force a complete charger restart',
          onPress: () =>
            identifier &&
            Alert.alert('Hard reset', 'Restart this charger now?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => run(requestResetCharger(identifier, 'Hard'), 'Hard reset requested.') },
            ]),
        },
        {
          icon: Zap,
          key: 'trigger',
          label: 'Request status',
          meta: 'Trigger a StatusNotification from the charger',
          onPress: () =>
            identifier &&
            run(requestTriggerCharger(identifier, { connector: firstPort?.orderOnBox || 0, requestedMessage: 'StatusNotification' }), 'Status requested.'),
        },
        ...(firstPort
          ? [
              {
                icon: BatteryCharging,
                key: 'unlock',
                label: 'Unlock first port',
                meta: firstPort.name || firstPort.uniqueId || `Port #${firstPort.id}`,
                onPress: () => identifier && run(requestUnlockCharger(identifier, firstPort.orderOnBox || 1), 'Unlock requested.'),
              },
            ]
          : []),
      ]}
    />
  );
}
