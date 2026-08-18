import { Bike, Building2, Car, FileText, Mail, MapPin, Phone, Plus } from 'lucide-react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, type BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResourceFormSheet } from 'app/location/[id]/components/resource-form-sheet';
import { StationList } from 'shared/stations/components/station-details-content';
import { BottomSheetButton, ThemedText, ThemedView } from 'components/base';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import { useLocationActionMutations, useLocationDetail, useLocationPartnership, useLocationResourceMutations, useLocationStations } from '../hooks';
import { getLocationStatusTheme, type LocationStatusTheme } from '../location-status';

const snapPoints = ['70%', '92%'];

export function LocationStationsSheet({
  location,
  onClose,
  onClosed,
  onEditStation,
  onRelocateStation,
  onSelectStation,
  open,
}: {
  location?: LocationRecord;
  onClose: () => void;
  onClosed: () => void;
  onEditStation: (location: LocationRecord, station: StationRecord) => void;
  onRelocateStation: (location: LocationRecord, station: StationRecord) => void;
  onSelectStation: (location: LocationRecord, station: StationRecord) => void;
  open: boolean;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const [createStationOpen, setCreateStationOpen] = useState(false);
  const { bottom, top } = useSafeAreaInsets();
  const locationId = location ? String(location.id) : '';
  const locationDetailQuery = useLocationDetail(locationId);
  const overviewLocation = locationDetailQuery.data || location;
  const partnershipQuery = useLocationPartnership(overviewLocation);
  const stationsQuery = useLocationStations(locationId);
  const locationActions = useLocationActionMutations(locationId);
  const mutations = useLocationResourceMutations(locationId);
  const stations = stationsQuery.data || [];
  const partnership = overviewLocation?.partnership || overviewLocation?.partnershipLocation || partnershipQuery.data;
  const stationBikeCount = stations.reduce((total, station) => total + (station.numberOfBikeBoxes ?? station.bikeBoxes?.length ?? 0), 0);
  const stationCarCount = stations.reduce((total, station) => total + (station.numberOfCarBoxes ?? station.carBoxes?.length ?? 0), 0);
  const bikeCount = Math.max(overviewLocation?.bikeCount ?? overviewLocation?.numberOfBikeBoxes ?? 0, stationBikeCount);
  const carCount = Math.max(overviewLocation?.carCount ?? overviewLocation?.numberOfCarBoxes ?? 0, stationCarCount);
  const fullAddress = overviewLocation ? formatLocationAddress(overviewLocation) : 'Address unavailable';
  const statusTheme = getLocationStatusTheme(overviewLocation || location);

  useEffect(() => {
    if (open && locationId) {
      isPresentedRef.current = true;
      const frame = requestAnimationFrame(() => sheetRef.current?.present());
      return () => cancelAnimationFrame(frame);
    }

    if (isPresentedRef.current) {
      sheetRef.current?.dismiss();
    }

    return undefined;
  }, [locationId, open]);

  function handleDismiss() {
    if (!isPresentedRef.current) return;
    isPresentedRef.current = false;
    setCreateStationOpen(false);
    if (open) onClose();
    onClosed();
  }

  function handleSetupPartnership() {
    Alert.alert('Setup partnership', 'Connect this location to partnership and refresh its meter mapping?', [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: () =>
          locationActions.sync.mutate(undefined, {
            onError: error => Alert.alert('Setup failed', error.message || 'Partnership could not be set up.'),
            onSuccess: () => Alert.alert('Partnership updated', 'Partnership information has been refreshed for this location.'),
          }),
        text: 'Setup',
      },
    ]);
  }

  function renderFooter(props: BottomSheetFooterProps) {
    if (!location) return null;

    return (
      <BottomSheetButton
        btnColor={statusTheme.accent}
        footerProps={props}
        icon={<Plus color='#FFFFFF' size={20} strokeWidth={2.4} />}
        onPress={() => setCreateStationOpen(true)}
        title='Add or assign station'
      />
    );
  }

  return (
    <>
      <BottomSheetModal
        backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior='close' />}
        backgroundStyle={{ backgroundColor: Palette.surfaceBase, borderRadius: 28 }}
        enableDynamicSizing={false}
        enablePanDownToClose
        footerComponent={renderFooter}
        handleIndicatorStyle={{ backgroundColor: '#D7DCDA', height: 5, width: 42 }}
        handleStyle={{ paddingBottom: 8, paddingTop: 10 }}
        index={0}
        onDismiss={handleDismiss}
        ref={sheetRef}
        snapPoints={snapPoints}
        topInset={top}>
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: Math.max(bottom + 96, 120), paddingHorizontal: 20 }}
          contentInsetAdjustmentBehavior='never'
          showsVerticalScrollIndicator={false}>
          {location ? (
            <ThemedView backgroundColor='transparent' gap={20}>
              <ThemedView backgroundColor='transparent' gap={10}>
                <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
                  <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
                    <ThemedView alignItems='center' backgroundColor={statusTheme.tone} borderRadius={10} height={32} justifyContent='center' width={32}>
                      <Building2 color={statusTheme.accent} size={16} />
                    </ThemedView>
                    <ThemedText color={statusTheme.accent} fontFamily={FontFamily.semibold} fontSize={10} letterSpacing={1.3} textTransform='uppercase'>
                      Location overview
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={10}>
                  <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={22} lineHeight={28} selectable>
                    {overviewLocation?.name || location.name}
                  </ThemedText>
                  <LocationStatus theme={statusTheme} />
                </ThemedView>
                <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={'two'}>
                  <MapPin color={statusTheme.accent} size={17} />
                  <ThemedText color={Palette.textSecondary} flex={1} fontSize={13} lineHeight={19} selectable>
                    {fullAddress}
                  </ThemedText>
                </ThemedView>
                <PartnershipOverview
                  error={!partnership && partnershipQuery.isError}
                  loading={!partnership && partnershipQuery.isLoading}
                  onSetup={handleSetupPartnership}
                  partnership={partnership}
                  settingUp={locationActions.sync.isPending}
                  theme={statusTheme}
                />
              </ThemedView>

              <ThemedView
                alignItems='center'
                backgroundColor='#F6F8F7'
                borderColor={Palette.borderSubtle}
                borderRadius={14}
                borderWidth={1}
                flexDirection='row'
                padding={10}>
                <ThemedView backgroundColor='transparent' flex={1} gap={2}>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} letterSpacing={0.8} textTransform='uppercase'>
                    Location ID
                  </ThemedText>
                  <ThemedText color='#365C91' fontFamily={FontFamily.semibold} fontSize={12} letterSpacing={0.2} selectable>
                    EVM-{String(location.id).padStart(4, '0')}
                  </ThemedText>
                </ThemedView>
                <ThemedView backgroundColor={Palette.borderSubtle} height={30} width={1} />
                <ThemedView backgroundColor='transparent' flex={1} gap={2} paddingLeft={12}>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={9} letterSpacing={0.8} textTransform='uppercase'>
                    Network
                  </ThemedText>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12}>
                    {stations.length} {stations.length === 1 ? 'station' : 'stations'}
                  </ThemedText>
                </ThemedView>
                <ThemedView backgroundColor={Palette.borderSubtle} height={30} width={1} />
                <LocationMetric icon={Bike} label='Bikes' value={bikeCount} />
                <ThemedView backgroundColor={Palette.borderSubtle} height={30} width={1} />
                <LocationMetric icon={Car} label='Cars' value={carCount} />
              </ThemedView>

              {stationsQuery.isLoading ? (
                <ThemedView borderRadius={18} height={184} loading />
              ) : stationsQuery.isError ? (
                <EmptyState message='Pull down or reopen this location to retry.' title='Stations unavailable' />
              ) : (
                <StationList
                  accentColor={statusTheme.accent}
                  accentTone={statusTheme.tone}
                  locationId={locationId}
                  onEditStation={station => onEditStation(location, station)}
                  onRelocateStation={station => onRelocateStation(location, station)}
                  onSelectStation={station => onSelectStation(location, station)}
                  stations={stations}
                />
              )}
            </ThemedView>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>

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
        onClose={() => setCreateStationOpen(false)}
        onSubmit={values =>
          mutations.create.mutate(
            { data: { ...values, location: `/api/locations/${locationId}` }, path: 'api/stations' },
            { onSuccess: () => setCreateStationOpen(false) },
          )
        }
        open={createStationOpen}
        title='Create station'
      />
    </>
  );
}

function LocationMetric({ icon: Icon, label, value }: { icon: typeof Bike; label: string; value: number }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flex={0.7} gap={2}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={3}>
        <Icon color={Palette.textTertiary} size={11} />
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={8} letterSpacing={0.5} textTransform='uppercase'>
          {label}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function getAddressPartKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(ward|commune|district|city|province)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function formatLocationAddress(location: LocationRecord) {
  const baseAddress = location.displayAddress || location.address || location.addressVn || '';
  const parts = baseAddress
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  const administrativeParts = [location.ward?.name || location.ward?.nameVn, location.ward?.province?.name || location.ward?.province?.nameVn].filter(
    (part): part is string => Boolean(part?.trim()),
  );

  administrativeParts.forEach(part => {
    const candidate = part.trim();
    const key = getAddressPartKey(candidate);
    const duplicateIndex = parts.findIndex(current => getAddressPartKey(current) === key);

    if (duplicateIndex === -1) {
      parts.push(candidate);
    } else if (candidate.length > parts[duplicateIndex].length) {
      parts[duplicateIndex] = candidate;
    }
  });

  return parts.join(', ') || 'Address unavailable';
}

function LocationStatus({ theme }: { theme: LocationStatusTheme }) {
  return (
    <ThemedView alignItems='center' backgroundColor={theme.accent} borderRadius={'pill'} justifyContent='center' minHeight={25} paddingHorizontal={10}>
      <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={10} numberOfLines={1}>
        {theme.label}
      </ThemedText>
    </ThemedView>
  );
}

function getPartnershipLabel(value?: LocationPartnership['contract'] | LocationPartnership['tariff']) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const details = value as { code?: string; name?: string; number?: string; title?: string };
  return details.name || details.code || details.number || details.title;
}

function PartnershipOverview({
  error,
  loading,
  onSetup,
  partnership,
  settingUp,
  theme,
}: {
  error?: boolean;
  loading?: boolean;
  onSetup: () => void;
  partnership?: LocationPartnership | null;
  settingUp?: boolean;
  theme: LocationStatusTheme;
}) {
  const contact = partnership?.mainUser;
  const contactName = contact?.name || contact?.username;
  const contactDetail = contact?.email || contact?.phone;
  const contract = partnership?.contractCode || getPartnershipLabel(partnership?.contract);
  const tariff = getPartnershipLabel(partnership?.tariff);
  const contactSummary = [contactName, contactDetail].filter((value, index, values) => value && values.indexOf(value) === index).join(' · ');
  const subtitle = partnership
    ? contactSummary || 'Commercial account connected'
    : loading
      ? 'Loading partnership information...'
      : error
        ? 'Partnership information unavailable'
        : 'No partnership information available';

  return (
    <ThemedView backgroundColor='#FFFFFF' borderColor={theme.border} borderCurve='continuous' borderRadius={14} borderWidth={1} gap={10} padding={12}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={9}>
        <ThemedView backgroundColor='transparent' flex={1} gap={1} minWidth={0}>
          <ThemedText color={theme.accent} fontFamily={FontFamily.semibold} fontSize={9} letterSpacing={1.1} textTransform='uppercase'>
            Partnership
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontSize={10} lineHeight={14} numberOfLines={1} selectable={Boolean(partnership)}>
            {subtitle}
          </ThemedText>
        </ThemedView>
        {partnership ? (
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={6}>
            <Pressable
              accessibilityLabel='Email partner'
              accessibilityRole='link'
              accessibilityState={{ disabled: !contact?.email }}
              disabled={!contact?.email}
              hitSlop={8}
              onPress={() => void Linking.openURL(`mailto:${contact?.email}`)}>
              <ThemedView
                alignItems='center'
                backgroundColor='#F1F5F3'
                borderColor='#DFE7E2'
                borderRadius={'pill'}
                borderWidth={1}
                height={30}
                justifyContent='center'
                opacity={contact?.email ? 1 : 0.4}
                width={30}>
                <Mail color={Palette.textSecondary} size={14} strokeWidth={2.1} />
              </ThemedView>
            </Pressable>
            <Pressable
              accessibilityLabel='Call partner'
              accessibilityRole='link'
              accessibilityState={{ disabled: !contact?.phone }}
              disabled={!contact?.phone}
              hitSlop={8}
              onPress={() => void Linking.openURL(`tel:${contact?.phone?.replace(/[^\d+]/g, '')}`)}>
              <ThemedView
                alignItems='center'
                backgroundColor={theme.accent}
                borderRadius={'pill'}
                height={30}
                justifyContent='center'
                opacity={contact?.phone ? 1 : 0.4}
                width={30}>
                <Phone color='#FFFFFF' size={14} strokeWidth={2.2} />
              </ThemedView>
            </Pressable>
          </ThemedView>
        ) : !loading && !error ? (
          <Pressable
            accessibilityLabel='Setup partnership'
            accessibilityRole='button'
            accessibilityState={{ busy: settingUp, disabled: settingUp }}
            disabled={settingUp}
            hitSlop={6}
            onPress={onSetup}>
            <ThemedView
              alignItems='center'
              backgroundColor={theme.accent}
              borderRadius={'pill'}
              flexDirection='row'
              gap={4}
              height={32}
              justifyContent='center'
              opacity={settingUp ? 0.65 : 1}
              paddingHorizontal={11}>
              <Plus color='#FFFFFF' size={13} strokeWidth={2.4} />
              <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={10} numberOfLines={1}>
                {settingUp ? 'Setting up...' : 'Setup partnership'}
              </ThemedText>
            </ThemedView>
          </Pressable>
        ) : null}
      </ThemedView>
      {partnership ? (
        <ThemedView backgroundColor='transparent' gap={9}>
          <ThemedView backgroundColor='#E5ECE7' height={1} />
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={10}>
            <FileText color={theme.accent} size={14} strokeWidth={2} />
            <ThemedView backgroundColor='transparent' flex={1} gap={1} minWidth={0}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={8} letterSpacing={0.6} textTransform='uppercase'>
                Contract
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={15} numberOfLines={1} selectable>
                {contract || 'Not assigned'}
              </ThemedText>
            </ThemedView>
            <ThemedView backgroundColor='#E5ECE7' height={26} width={1} />
            <ThemedView backgroundColor='transparent' flex={0.8} gap={1} minWidth={0}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={8} letterSpacing={0.6} textTransform='uppercase'>
                Tariff
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={15} numberOfLines={1} selectable>
                {tariff || 'Not assigned'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          {partnership.notes ? (
            <ThemedText color={Palette.textSecondary} fontSize={9} lineHeight={13} numberOfLines={1} selectable>
              {partnership.notes}
            </ThemedText>
          ) : null}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}
