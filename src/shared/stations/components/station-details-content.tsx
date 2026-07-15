import { Alert, Pressable, Switch } from 'react-native';
import { Image } from 'expo-image';
import { BatteryCharging, Bike, Car, Eye, EyeOff, MapPin, MoreHorizontal, Pencil, Power, RotateCcw, Zap } from 'lucide-react-native';
import { useState } from 'react';

import { ThemedText, ThemedView } from 'components/base';
import { ActionSheet, AppButton, EmptyState, StatusChip } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { rmhs } from 'themes/scaling';
import { getDisplayImageUrl } from 'utils/media/image-url';
import { useLocationResourceMutations, useStationChargers } from 'shared/locations/hooks';
import { requestResetCharger, requestTriggerCharger, requestUnlockCharger } from 'app/location/[id]/features/charger-service';
import { getWorkflowChargerIdentifier, getWorkflowChargerType } from 'app/location/[id]/features/charger-workflows';
import { ResourceFormSheet } from 'app/location/[id]/components/resource-form-sheet';

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
  const chargersQuery = useStationChargers(station.id);
  const mutations = useLocationResourceMutations(locationId, station.id);
  const [selected, setSelected] = useState<WorkflowChargerRecord>();
  const [editStationOpen, setEditStationOpen] = useState(false);
  const [editCharger, setEditCharger] = useState<WorkflowChargerRecord>();
  const [editPort, setEditPort] = useState<{ charger: WorkflowChargerRecord; port: ChargerPortRecord }>();
  const [createChargerType, setCreateChargerType] = useState<'bike' | 'car'>();
  const chargers = chargersQuery.data?.pages.flatMap(page => page.items) || [];
  const outletCount = chargers.reduce(
    (total, charger) => total + (getWorkflowChargerType(charger) === 'car' ? charger.carConnectors?.length || 0 : charger.outlets?.length || 0),
    0,
  );
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
        chargers.map((charger, index) => (
          <ChargerSection
            charger={charger}
            index={index}
            key={`${charger.boxType}-${charger.id}`}
            onActions={() => setSelected(charger)}
            onEditPort={port => setEditPort({ charger, port })}
          />
        ))
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

function ChargerSection({
  charger,
  index,
  onActions,
  onEditPort,
}: {
  charger: WorkflowChargerRecord;
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

  return (
    <ThemedView
      backgroundColor='#FFFFFF'
      borderColor={Palette.borderSubtle}
      borderRadius={16}
      borderTopColor={isCar ? '#D97706' : Palette.accent}
      borderTopWidth={2}
      borderWidth={1}
      overflow='hidden'>
      <Pressable onPress={onActions}>
        <ThemedView alignItems='center' flexDirection='row' gap={'two'} padding={'three'} paddingBottom={'two'}>
          <ThemedView alignItems='center' backgroundColor={isCar ? '#FFF5E8' : '#EEF7F1'} borderRadius={11} height={44} justifyContent='center' width={44}>
            {isCar ? <Car color='#B86A13' size={20} /> : <Bike color='#17834A' size={20} />}
          </ThemedView>
          <ThemedView flex={1} minWidth={0}>
            <ThemedText color={isCar ? '#B45309' : Palette.accent} fontFamily={FontFamily.semibold} fontSize={10} textTransform='uppercase'>
              Charger {String(index + 1).padStart(2, '0')} · {isCar ? 'Car' : 'Bike'}
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} numberOfLines={1}>
              {charger.name || getWorkflowChargerIdentifier(charger) || `Charger #${charger.id}`}
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontSize={12} marginTop={2} numberOfLines={1}>
              {getWorkflowChargerIdentifier(charger)} · {ports.length} outlets
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems='flex-end' backgroundColor='transparent' gap={'one'}>
            <StatusChip
              label={charger.enabled === false ? 'Disabled' : charger.visible === false ? 'Hidden' : 'Active'}
              tone={charger.enabled === false || charger.visible === false ? 'danger' : 'success'}
            />
            <MoreHorizontal color={Palette.textSecondary} size={18} />
          </ThemedView>
        </ThemedView>
      </Pressable>
      <ThemedView backgroundColor='#F8F9F9' flexDirection='row' flexWrap='wrap' gap={'two'} marginHorizontal={'three'} padding={'two'}>
        <ChargerMeta label='Vendor' value={charger.vendorId || '--'} />
        <ChargerMeta label='Offset' value={offset || '--'} />
        <ChargerMeta label='Standby' value={standby || '--'} />
        <ChargerMeta label='Date report' value={dateReport || '--'} />
        <ChargerMeta label='Read meter' value={readMeter == null ? '--' : formatBooleanLike(readMeter)} />
      </ThemedView>
      <ThemedView backgroundColor='transparent' gap={'two'} padding={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
          <ThemedView backgroundColor='transparent'>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10} textTransform='uppercase'>
              {isCar ? 'Connectors' : 'Outlets'}
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} marginTop={1}>
              {ports.length} {isCar ? 'charging connectors' : 'charging outlets'}
            </ThemedText>
          </ThemedView>
          <Zap color={isCar ? '#D97706' : Palette.accent} size={18} />
        </ThemedView>
        <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'}>
          {ports.map((port, index) => (
            <Pressable key={port.id} onPress={() => onEditPort(port)}>
              <ThemedView
                backgroundColor={port.visible === false ? '#F5F6F6' : '#F2FBF5'}
                borderColor={port.visible === false ? Palette.borderSubtle : '#D7F0DF'}
                borderRadius={12}
                borderWidth={1}
                flexBasis='47%'
                flexGrow={1}
                gap={'one'}
                minHeight={102}
                minWidth={132}
                padding={'three'}>
                <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
                  <ThemedView
                    alignItems='center'
                    backgroundColor={port.visible === false ? '#EEF1F0' : '#E7F8ED'}
                    borderRadius={'pill'}
                    height={34}
                    justifyContent='center'
                    width={34}>
                    <BatteryCharging color={port.visible === false ? Palette.textTertiary : Palette.accent} size={17} />
                  </ThemedView>
                  <ThemedText
                    color={port.visible === false ? Palette.textTertiary : port.used ? '#B45309' : Palette.accent}
                    fontFamily={FontFamily.semibold}
                    fontSize={10}>
                    {port.visible === false ? 'Hidden' : port.used ? 'In use' : 'Ready'}
                  </ThemedText>
                </ThemedView>
                <ThemedView backgroundColor='transparent' minWidth={0}>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={9} textTransform='uppercase'>
                    {isCar ? 'Connector' : 'Outlet'} {String(port.orderOnBox || index + 1).padStart(2, '0')}
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} marginTop={1} numberOfLines={1}>
                    {port.name || `${isCar ? 'Connector' : 'Outlet'} ${port.orderOnBox || index + 1}`}
                  </ThemedText>
                  <ThemedText color={Palette.textSecondary} fontSize={11} marginTop={1} numberOfLines={1}>
                    {port.uniqueId || port.qrCode || `#${port.id}`}
                    {port.power ? ` · ${port.power} kW` : ''}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
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

function ChargerMeta({ label, value }: { label: string; value: boolean | string }) {
  return (
    <ThemedView backgroundColor='transparent' flexBasis='30%' flexGrow={1} minWidth={86}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={9} numberOfLines={1} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} marginTop={2} numberOfLines={1} selectable>
        {typeof value === 'boolean' ? formatBooleanLike(value) : value}
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
      <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <ThemedView alignItems='center' backgroundColor='#EEF7F1' borderRadius={13} height={44} justifyContent='center' width={44}>
          <Zap color={Palette.accent} size={20} />
        </ThemedView>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={10} textTransform='uppercase'>
            Station details
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={17} lineHeight={22} marginTop={'one'} selectable>
            {station.name || `Station #${station.id}`}
          </ThemedText>
          {station.description ? (
            <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={19} marginTop={'one'} numberOfLines={3}>
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
