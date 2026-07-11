import { Alert, Pressable, ScrollView } from 'react-native';
import { BatteryCharging, Bike, Car, Eye, EyeOff, MoreHorizontal, Pencil, Power, RotateCcw, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import Animated, { Extrapolation, interpolate, interpolateColor, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { ThemedText, ThemedView } from 'components/base';
import { ActionSheet, AppButton, EmptyState, StatusChip } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { rmhs } from 'themes/scaling';
import { useLocationResourceMutations, useStationChargers } from 'shared/locations/hooks';
import { requestResetCharger, requestTriggerCharger, requestUnlockCharger } from '../features/charger-service';
import { getWorkflowChargerIdentifier, getWorkflowChargerType } from '../features/charger-workflows';
import { ResourceFormSheet } from './resource-form-sheet';

const STATION_TAB_WIDTH = 112;
const STATION_INDICATOR_WIDTH = 56;
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

function StationTab({
  index,
  label,
  onPress,
  pageWidth,
  scrollX,
}: {
  index: number;
  label: string;
  onPress: () => void;
  pageWidth: number;
  scrollX: SharedValue<number>;
}) {
  const labelStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollX.get(), [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth], [0, 1, 0], Extrapolation.CLAMP);

    return {
      color: interpolateColor(progress, [0, 1], ['#79817E', '#18231F']),
      opacity: interpolate(progress, [0, 1], [0.72, 1], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(progress, [0, 1], [0.97, 1], Extrapolation.CLAMP) }],
    };
  });

  return (
    <Pressable accessibilityRole='tab' onPress={onPress}>
      <ThemedView alignItems='center' backgroundColor='transparent' height={50} justifyContent='center' width={STATION_TAB_WIDTH}>
        <AnimatedThemedText fontFamily={FontFamily.semibold} fontSize={15} numberOfLines={1} style={labelStyle}>
          {label}
        </AnimatedThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function StationTabBar({
  activeId,
  locationId,
  onChange,
  pageWidth,
  scrollX,
  stations,
}: {
  activeId?: number;
  locationId: string;
  onChange: (stationId: number) => void;
  pageWidth: number;
  scrollX: SharedValue<number>;
  stations: StationRecord[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const mutations = useLocationResourceMutations(locationId);
  const tabsRef = useRef<ScrollView>(null);
  const activeIndex = Math.max(
    0,
    stations.findIndex(station => station.id === activeId),
  );
  const indicatorStyle = useAnimatedStyle(() => {
    const restingX = (STATION_TAB_WIDTH - STATION_INDICATOR_WIDTH) / 2;
    if (stations.length < 2) return { transform: [{ translateX: restingX }] };

    return {
      transform: [
        {
          translateX: interpolate(
            scrollX.get(),
            stations.map((_, index) => index * pageWidth),
            stations.map((_, index) => index * STATION_TAB_WIDTH + restingX),
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  useEffect(() => {
    tabsRef.current?.scrollTo({ animated: true, x: Math.max(0, activeIndex * STATION_TAB_WIDTH - STATION_TAB_WIDTH) });
  }, [activeIndex]);

  const createForm = (
    <ResourceFormSheet
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'nameVn', label: 'Vietnamese name' },
        { key: 'description', label: 'Description', multiline: true },
        { key: 'latitude', keyboard: 'numeric', label: 'Latitude' },
        { key: 'longitude', keyboard: 'numeric', label: 'Longitude' },
        { key: 'public', label: 'Public station', type: 'switch' },
        { key: 'fullTime', label: 'Open full time', type: 'switch' },
        { key: 'visible', label: 'Visible', type: 'switch' },
      ]}
      initialValues={{ fullTime: true, public: true, visible: true }}
      loading={mutations.create.isPending}
      onClose={() => setCreateOpen(false)}
      onSubmit={values =>
        mutations.create.mutate(
          { data: { ...values, location: `/api/locations/${locationId}` }, path: 'api/stations' },
          { onSuccess: () => setCreateOpen(false) },
        )
      }
      open={createOpen}
      title='Create station'
    />
  );

  if (stations.length === 0)
    return (
      <ThemedView backgroundColor={Palette.surfaceBase} gap={'three'} padding={'four'}>
        <EmptyState message='Create a station to start adding chargers.' title='No stations' />
        <AppButton label='Create station' onPress={() => setCreateOpen(true)} />
        {createForm}
      </ThemedView>
    );

  return (
    <ThemedView backgroundColor='#FFFFFF' borderBottomColor='#E8ECEA' borderBottomWidth={1} paddingTop={'two'}>
      <ThemedView borderBottomColor='#E8ECEA' borderBottomWidth={1}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, position: 'relative' }} horizontal ref={tabsRef} showsHorizontalScrollIndicator={false}>
          <AnimatedThemedView
            backgroundColor='#18231F'
            borderRadius={'pill'}
            bottom={0}
            height={3}
            left={16}
            position='absolute'
            style={indicatorStyle}
            width={STATION_INDICATOR_WIDTH}
          />
          {stations.map((item, index) => {
            return (
              <StationTab
                index={index}
                key={item.id}
                label={`Station ${index + 1}`}
                onPress={() => onChange(item.id)}
                pageWidth={pageWidth}
                scrollX={scrollX}
              />
            );
          })}
          <Pressable onPress={() => setCreateOpen(true)}>
            <ThemedView alignItems='center' backgroundColor='transparent' justifyContent='center' minHeight={48} paddingHorizontal={'three'}>
              <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={14}>
                + Add station
              </ThemedText>
            </ThemedView>
          </Pressable>
        </ScrollView>
      </ThemedView>
      {createForm}
    </ThemedView>
  );
}

export function StationScene({
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
  const chargers = useMemo(() => chargersQuery.data?.pages.flatMap(page => page.items) || [], [chargersQuery.data]);
  const toggleStation = () => mutations.patch.mutate({ data: { visible: station.visible === false }, id: station.id, path: 'api/stations' });

  return (
    <ThemedView
      backgroundColor={Palette.surfaceBase}
      gap={'four'}
      onLayout={event => onContentHeightChange?.(Math.ceil(event.nativeEvent.layout.height))}
      paddingBottom={'eight'}
      paddingHorizontal={rmhs(12)}
      paddingTop={'four'}>
      <StationSummary
        chargerCount={chargers.length}
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
    <ThemedView backgroundColor='#FFFFFF' borderColor={Palette.borderSubtle} borderRadius={18} borderWidth={1} overflow='hidden' paddingBottom={'four'}>
      <Pressable onPress={onActions}>
        <ThemedView alignItems='center' flexDirection='row' gap={'three'} padding={'three'}>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={16} textAlign='center' width={24}>
            {index + 1}
          </ThemedText>
          <ThemedView alignItems='center' backgroundColor={isCar ? '#FFF2E2' : '#EAF8EF'} borderRadius={6} height={48} justifyContent='center' width={48}>
            {isCar ? <Car color='#D97706' size={21} /> : <Bike color='#07853D' size={21} />}
          </ThemedView>
          <ThemedView flex={1} minWidth={0}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} numberOfLines={1}>
              {charger.name || getWorkflowChargerIdentifier(charger) || `Charger #${charger.id}`}
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontSize={12} marginTop={2} numberOfLines={1}>
              {getWorkflowChargerIdentifier(charger)} · {ports.length} ports
            </ThemedText>
          </ThemedView>
          <ThemedText
            color={charger.enabled === false || charger.visible === false ? Palette.danger : Palette.accent}
            fontFamily={FontFamily.medium}
            fontSize={12}>
            {charger.enabled === false ? 'Disabled' : charger.visible === false ? 'Hidden' : 'Active'}
          </ThemedText>
          <MoreHorizontal color={Palette.textSecondary} size={18} />
        </ThemedView>
      </Pressable>
      <ThemedView
        backgroundColor='#F8FAF9'
        borderTopColor={Palette.borderSubtle}
        borderTopWidth={1}
        flexDirection='row'
        flexWrap='wrap'
        gap={'two'}
        padding={'three'}>
        <ChargerMeta label='Vendor' value={charger.vendorId || '--'} />
        <ChargerMeta label='Offset' value={offset || '--'} />
        <ChargerMeta label='Standby' value={standby || '--'} />
        <ChargerMeta label='Date report' value={dateReport || '--'} />
        <ChargerMeta label='Read meter' value={readMeter == null ? '--' : formatBooleanLike(readMeter)} />
      </ThemedView>
      <ScrollView
        contentContainerStyle={{ gap: 10, paddingHorizontal: 12, paddingRight: 30, paddingTop: 12 }}
        decelerationRate='fast'
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}>
        {ports.map((port, index) => (
          <Pressable key={port.id} onPress={() => onEditPort(port)}>
            <ThemedView
              backgroundColor={Palette.surfaceMuted}
              borderColor={Palette.borderSubtle}
              borderRadius={14}
              borderWidth={1}
              gap={'two'}
              minHeight={124}
              padding={'three'}
              width={176}>
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
                <StatusChip
                  label={port.visible === false ? 'Hidden' : port.used ? 'In use' : formatBooleanLike(port.status || 'Available')}
                  tone={port.visible === false ? 'danger' : port.used ? 'warning' : 'success'}
                />
              </ThemedView>
              <ThemedView backgroundColor='transparent' minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} numberOfLines={1}>
                  {port.name || `Port ${port.orderOnBox || index + 1}`}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontSize={11} marginTop={1} numberOfLines={1}>
                  {port.uniqueId || port.qrCode || `#${port.id}`}
                  {port.power ? ` · ${port.power} kW` : ''}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </Pressable>
        ))}
      </ScrollView>
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
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={9} numberOfLines={1} textTransform='uppercase'>
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
  onAddBike,
  onAddCar,
  onEdit,
  onRefresh,
  station,
}: {
  chargerCount: number;
  onAddBike: () => void;
  onAddCar: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  station: StationRecord;
}) {
  return (
    <ThemedView backgroundColor='#F5F7F6' borderColor={Palette.borderSubtle} borderRadius={18} borderWidth={1} gap={'three'} padding={'four'}>
      <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={'three'}>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={11} textTransform='uppercase'>
            Station information
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={24} marginTop={'one'}>
            {station.name || `Station #${station.id}`}
          </ThemedText>
          {station.description ? (
            <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={19} marginTop={'one'} numberOfLines={3}>
              {station.description}
            </ThemedText>
          ) : null}
        </ThemedView>
        <Pressable accessibilityLabel='Edit station' onPress={onEdit}>
          <ThemedView
            alignItems='center'
            backgroundColor='#FFFFFF'
            borderColor={Palette.borderSubtle}
            borderRadius={'pill'}
            borderWidth={1}
            height={38}
            justifyContent='center'
            width={38}>
            <Pencil color={Palette.textSecondary} size={17} />
          </ThemedView>
        </Pressable>
      </ThemedView>
      <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'}>
        <StatusChip label={station.public ? 'Public' : 'Private'} tone={station.public ? 'success' : 'muted'} />
        <StatusChip label={station.fullTime ? 'Full time' : station.stationOpenProfile?.name || 'Scheduled'} tone='muted' />
        <StatusChip label={`${chargerCount} chargers`} tone='muted' />
      </ThemedView>
      <ThemedView backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <SummaryAction icon={Bike} label='Add bike' onPress={onAddBike} />
        <SummaryAction icon={Car} label='Add car' onPress={onAddCar} />
        <SummaryAction icon={RotateCcw} label='Refresh' onPress={onRefresh} />
      </ThemedView>
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
