import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Banknote, BatteryCharging, Bike, Building2, Car, Clock3, Eye, EyeOff, PlugZap, QrCode, Server, ShieldCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import { useQrScanResultStore } from './qr-scan-result-store';
import { fetchQrOutletDetails } from './qr-scan-service';
import type { QrScanConnector, QrScanFeeTime } from './types';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

function formatVnd(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? `${currencyFormatter.format(value)} ₫` : '—';
}

function formatBoolean(value?: boolean, trueLabel = 'Yes', falseLabel = 'No') {
  if (value === undefined) return 'Not provided';
  return value ? trueLabel : falseLabel;
}

function getConnectorStatus(connector: QrScanConnector) {
  const connection = connector.statconn?.trim();
  if (connection?.toLowerCase() === 'offline') return { active: false, label: 'Offline' };
  if (connector.isReserved) return { active: false, label: 'Reserved' };
  if (connector.status === false) return { active: false, label: 'Inactive' };
  if (typeof connector.status === 'string' && connector.status.trim()) {
    const label = connector.status.trim();
    return { active: !/offline|fault|inactive|unavailable/i.test(label), label };
  }
  if (connector.used) return { active: true, label: 'In use' };
  return { active: true, label: 'Available' };
}

export function QrScanResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const decodedResult = useQrScanResultStore(state => state.result);
  const detailsQuery = useQuery({
    enabled: Boolean(decodedResult),
    queryFn: () => {
      if (!decodedResult) throw new Error('Scan a QR code before loading outlet details.');
      return fetchQrOutletDetails(decodedResult);
    },
    queryKey: ['qr-code', 'outlet-details', decodedResult?.vehicle_type, decodedResult?.identifier],
    staleTime: 30_000,
  });

  if (!decodedResult) {
    return (
      <ThemedView alignItems='center' backgroundColor={Palette.surfaceBase} flex={1} gap={16} justifyContent='center' paddingHorizontal={24}>
        <ResultHeader />
        <EmptyState message='Scan a QR code to load its station, box, connector, and fee information.' title='No scan result' />
        <AppButton label='Scan QR code' onPress={() => router.replace('/scan-qr-code')} />
      </ThemedView>
    );
  }

  if (detailsQuery.isPending) {
    return (
      <ThemedView backgroundColor={Palette.surfaceMuted} flex={1}>
        <ResultHeader />
        <ScrollView
          contentContainerStyle={{ gap: 16, paddingBottom: insets.bottom + 32, paddingHorizontal: 16, paddingTop: 16 }}
          contentInsetAdjustmentBehavior='automatic'
          showsVerticalScrollIndicator={false}>
          <ThemedView borderRadius={24} height={280} loading />
          <ThemedView borderRadius={20} height={156} loading />
          <ThemedView borderRadius={20} height={240} loading />
        </ScrollView>
      </ThemedView>
    );
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    const message = detailsQuery.error instanceof Error ? detailsQuery.error.message : 'The outlet details could not be loaded.';
    return (
      <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
        <ResultHeader />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, gap: 16, justifyContent: 'center', paddingBottom: insets.bottom + 32, paddingHorizontal: 24, paddingTop: 24 }}
          contentInsetAdjustmentBehavior='automatic'>
          <EmptyState message='Check the decoded identifier or try the request again.' title='Outlet unavailable' />
          <ThemedText selectable color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={19} textAlign='center'>
            {message}
          </ThemedText>
          <AppButton block label='Retry' onPress={() => void detailsQuery.refetch()} />
          <AppButton block label='Scan another QR code' onPress={() => router.replace('/scan-qr-code')} />
        </ScrollView>
      </ThemedView>
    );
  }

  const { box, connector, connectorOrder, station, stationReference, vehicleType, vendorId } = detailsQuery.data;
  const isCar = vehicleType === 'car';
  const VehicleIcon = isCar ? Car : Bike;
  const accentColor = isCar ? '#D78628' : '#2CB570';
  const accentSurface = isCar ? '#FFF3E2' : '#EAF8F0';
  const heroBackground = isCar ? '#3D2B18' : '#123C2C';
  const portProfile = connector.portProfile && typeof connector.portProfile === 'object' ? connector.portProfile : undefined;
  const profileName =
    connector.portProfileName ||
    portProfile?.name ||
    portProfile?.nameVn ||
    (typeof connector.portProfile === 'string' ? connector.portProfile : undefined) ||
    'Not assigned';
  const directions = [
    connector.portType?.currentDirection?.type,
    ...(portProfile?.portFeeSchedules?.map(schedule => schedule.currentDirection?.type) || []),
  ].filter((direction): direction is string => Boolean(direction));
  const currentDirections = [...new Set(directions)];
  const stationImage = station?.images?.find(image => image.url)?.url;
  const stationName = station?.name || station?.nameVn || 'Station unavailable';
  const connectorStatus = getConnectorStatus(connector);
  const feeSchedules = connector.feeSchedules || [];

  return (
    <ThemedView backgroundColor={Palette.surfaceMuted} flex={1}>
      <ResultHeader />
      <ScrollView
        contentContainerStyle={{ gap: 16, paddingBottom: insets.bottom + 32, paddingHorizontal: 16, paddingTop: 16 }}
        contentInsetAdjustmentBehavior='automatic'
        refreshControl={
          <RefreshControl
            onRefresh={() => void detailsQuery.refetch()}
            refreshing={detailsQuery.isFetching && !detailsQuery.isPending}
            tintColor={Palette.accent}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ThemedView backgroundColor={heroBackground} borderCurve='continuous' borderRadius={24} overflow='hidden'>
          <ThemedView backgroundColor={heroBackground} height={164} position='relative'>
            {stationImage ? <Image contentFit='cover' source={{ uri: stationImage }} style={{ height: '100%', width: '100%' }} /> : null}
            <ThemedView absoluteFillObject backgroundColor={stationImage ? 'rgba(5,7,11,0.48)' : 'transparent'} />
            <ThemedView absoluteFillObject backgroundColor='transparent' justifyContent='space-between' padding={18}>
              <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
                <ThemedView
                  alignItems='center'
                  backgroundColor='rgba(255,255,255,0.14)'
                  borderRadius={999}
                  flexDirection='row'
                  gap={7}
                  paddingHorizontal={11}
                  paddingVertical={7}>
                  <VehicleIcon color='#FFFFFF' size={15} strokeWidth={2.3} />
                  <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={11} textTransform='uppercase'>
                    {vehicleType} charger
                  </ThemedText>
                </ThemedView>
                <StatusPill active={connectorStatus.active} label={connectorStatus.label} />
              </ThemedView>
              <ThemedView backgroundColor='transparent' gap={3}>
                <ThemedText color='rgba(255,255,255,0.7)' fontFamily={FontFamily.semibold} fontSize={10} letterSpacing={0.8} textTransform='uppercase'>
                  Station {station?.id ? `#${station.id}` : ''}
                </ThemedText>
                <ThemedText selectable color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={24} lineHeight={30} numberOfLines={2}>
                  {stationName}
                </ThemedText>
                {station?.nameVn && station.nameVn !== stationName ? (
                  <ThemedText selectable color='rgba(255,255,255,0.76)' fontFamily={FontFamily.medium} fontSize={12} lineHeight={17} numberOfLines={1}>
                    {station.nameVn}
                  </ThemedText>
                ) : null}
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView backgroundColor='transparent' gap={15} padding={18}>
            <ThemedView backgroundColor='transparent' gap={3}>
              <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={10} letterSpacing={0.8} textTransform='uppercase'>
                Connector #{connectorOrder}
              </ThemedText>
              <ThemedText selectable color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={22} lineHeight={28}>
                {connector.name || connector.uniqueId || `Connector ${connectorOrder}`}
              </ThemedText>
              <ThemedText selectable color='rgba(255,255,255,0.65)' fontFamily={FontFamily.medium} fontSize={12} lineHeight={17} numberOfLines={1}>
                {connector.uniqueId || decodedResult.identifier}
              </ThemedText>
            </ThemedView>
            <ThemedView backgroundColor='rgba(255,255,255,0.09)' borderRadius={16} flexDirection='row' gap={1} overflow='hidden'>
              <HeroMetric label='Box' value={box.uniqueId || `#${box.id}`} />
              <HeroMetric label='Power' value={connector.power === undefined ? '—' : `${connector.power} kW`} />
              <HeroMetric label='Current' value={currentDirections.join(', ') || '—'} />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <Section icon={<ShieldCheck color={accentColor} size={19} />} iconSurface={accentSurface} title='Availability'>
          <ThemedView flexDirection='row' gap={10}>
            <AvailabilityCard
              active={connector.visible !== false}
              icon={connector.visible !== false ? <Eye color={accentColor} size={19} /> : <EyeOff color={Palette.danger} size={19} />}
              label={connector.visible !== false ? 'Visible outlet' : 'Hidden outlet'}
            />
            <AvailabilityCard
              active={connector.status !== false && !connector.isReserved}
              icon={<BatteryCharging color={connector.status !== false && !connector.isReserved ? accentColor : Palette.danger} size={19} />}
              label={connector.isReserved ? 'Reserved' : connector.status === false ? 'Inactive' : connector.used ? 'In use' : 'Available'}
            />
          </ThemedView>
        </Section>

        <Section icon={<Banknote color={accentColor} size={19} />} iconSurface={accentSurface} title='Fee schedules'>
          {feeSchedules.length ? (
            feeSchedules.map((schedule, scheduleIndex) => (
              <ThemedView
                backgroundColor={Palette.surfaceMuted}
                borderCurve='continuous'
                borderRadius={16}
                gap={12}
                key={`${schedule.day}-${scheduleIndex}`}
                padding={14}>
                <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={9}>
                  <Clock3 color={Palette.textSecondary} size={18} />
                  <ThemedView backgroundColor='transparent' flex={1}>
                    <ThemedText selectable color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={21}>
                      {schedule.day || 'Schedule'}
                    </ThemedText>
                    {schedule.dayVn ? (
                      <ThemedText selectable color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
                        {schedule.dayVn}
                      </ThemedText>
                    ) : null}
                  </ThemedView>
                </ThemedView>
                {schedule.times?.length ? (
                  schedule.times.map((time, timeIndex) => (
                    <FeeTimeCard accentColor={accentColor} accentSurface={accentSurface} key={`${time.begin}-${time.end}-${timeIndex}`} time={time} />
                  ))
                ) : (
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13}>
                    No time-based rates are configured.
                  </ThemedText>
                )}
              </ThemedView>
            ))
          ) : (
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14}>
              No fee schedule is configured for this connector.
            </ThemedText>
          )}
        </Section>

        <Section icon={<Building2 color={accentColor} size={19} />} iconSurface={accentSurface} title='Station information'>
          <InfoRow label='Station ID' value={station?.id === undefined ? 'Not provided' : String(station.id)} />
          <InfoRow label='Name' value={station?.name || 'Not provided'} />
          <InfoRow label='Vietnamese name' value={station?.nameVn || 'Not provided'} />
          <InfoRow label='Visibility' value={formatBoolean(station?.visible, 'Visible', 'Hidden')} />
          <InfoRow label='Resource' value={stationReference || 'Not provided'} />
          <InfoBlock label='Description' value={station?.description || station?.descriptionVn || 'No description provided.'} />
        </Section>

        <Section icon={<Server color={accentColor} size={19} />} iconSurface={accentSurface} title={`${isCar ? 'Car' : 'Bike'} box`}>
          <InfoRow label='Name' value={box.name || 'Not provided'} />
          <InfoRow label='Vendor ID' value={vendorId} />
          <InfoRow label='Unique ID' value={box.uniqueId || 'Not provided'} />
          <InfoRow label='Enabled' value={formatBoolean(box.enabled, 'Enabled', 'Disabled')} />
          <InfoRow label='Visibility' value={formatBoolean(box.visible, 'Visible', 'Hidden')} />
          <InfoRow label='Resource' value={box.iriId || 'Not provided'} />
        </Section>

        <Section icon={<PlugZap color={accentColor} size={19} />} iconSurface={accentSurface} title='Connector details'>
          <InfoRow label='Connector ID' value={String(connector.id)} />
          <InfoRow label='Unique ID' value={connector.uniqueId || 'Not provided'} />
          <InfoRow label='Order on box' value={String(connector.orderOnBox ?? connectorOrder)} />
          <InfoRow label='Power' value={connector.power === undefined ? 'Not provided' : `${connector.power} kW`} />
          <InfoRow label='Phase' value={connector.phase === undefined ? 'Not provided' : String(connector.phase)} />
          <InfoRow label='Connection' value={connector.statconn || 'Not provided'} />
          <InfoRow label='Port type' value={[connector.portType?.type, connector.portType?.details].filter(Boolean).join(' · ') || 'Not provided'} />
          <InfoRow label='Port profile' value={profileName} />
          <InfoRow label='Current direction' value={currentDirections.join(', ') || 'Not provided'} />
          <InfoRow label='Reserved' value={formatBoolean(connector.isReserved)} />
          <InfoRow label='In use' value={formatBoolean(connector.used)} />
          <InfoRow label='Resource' value={connector.iriId || 'Not provided'} />
        </Section>

        <Section icon={<QrCode color={accentColor} size={19} />} iconSurface={accentSurface} title='QR code'>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={16}>
            {connector.qrCode ? (
              <ThemedView backgroundColor='#FFFFFF' borderColor={Palette.borderSubtle} borderCurve='continuous' borderRadius={18} borderWidth={1} padding={8}>
                <Image contentFit='contain' source={{ uri: connector.qrCode }} style={{ borderRadius: 10, height: 104, width: 104 }} />
              </ThemedView>
            ) : (
              <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={18} contentCenter height={122} width={122}>
                <QrCode color={Palette.textTertiary} size={42} />
              </ThemedView>
            )}
            <ThemedView backgroundColor='transparent' flex={1} gap={10}>
              <InfoBlock label='Decoded identifier' value={decodedResult.identifier} />
              <InfoBlock label='QR text' value={connector.qrText || 'Not provided'} />
            </ThemedView>
          </ThemedView>
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

function ResultHeader() {
  return (
    <Stack.Screen
      options={{
        headerBackButtonDisplayMode: 'minimal',
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Palette.surfaceBase },
        headerTintColor: Palette.textPrimary,
        headerTitle: 'QR outlet details',
      }}
    />
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor={active ? 'rgba(117,228,158,0.18)' : 'rgba(255,160,150,0.18)'}
      borderRadius={999}
      flexDirection='row'
      gap={7}
      paddingHorizontal={11}
      paddingVertical={7}>
      <ThemedView backgroundColor={active ? '#75E49E' : '#FF9D92'} borderRadius={999} height={7} width={7} />
      <ThemedText selectable color={active ? '#C3F7D4' : '#FFD0CA'} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flex={1} gap={4} paddingHorizontal={6} paddingVertical={12}>
      <ThemedText color='rgba(255,255,255,0.58)' fontFamily={FontFamily.medium} fontSize={10} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedText selectable color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16} numberOfLines={1} textAlign='center'>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function Section({ children, icon, iconSurface, title }: { children: ReactNode; icon: ReactNode; iconSurface: string; title: string }) {
  return (
    <ThemedView
      backgroundColor={Palette.surfaceRaised}
      borderColor={Palette.borderSubtle}
      borderCurve='continuous'
      borderRadius={20}
      borderWidth={1}
      gap={14}
      padding={16}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={9}>
        <ThemedView backgroundColor={iconSurface} borderRadius={11} contentCenter height={34} width={34}>
          {icon}
        </ThemedView>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={17} lineHeight={23}>
          {title}
        </ThemedText>
      </ThemedView>
      {children}
    </ThemedView>
  );
}

function AvailabilityCard({ active, icon, label }: { active: boolean; icon: ReactNode; label: string }) {
  return (
    <ThemedView backgroundColor={active ? '#F0FAF4' : Palette.dangerSurface} borderCurve='continuous' borderRadius={14} flex={1} gap={9} padding={13}>
      {icon}
      <ThemedText color={active ? '#167443' : Palette.danger} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function FeeTimeCard({ accentColor, accentSurface, time }: { accentColor: string; accentSurface: string; time: QrScanFeeTime }) {
  return (
    <ThemedView backgroundColor='#FFFFFF' borderColor={Palette.borderSubtle} borderCurve='continuous' borderRadius={14} borderWidth={1} gap={11} padding={12}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
        <ThemedText selectable color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={19}>
          {time.begin || '--:--'} – {time.end || '--:--'}
        </ThemedText>
        <ThemedView backgroundColor={accentSurface} borderRadius={999} paddingHorizontal={9} paddingVertical={5}>
          <ThemedText selectable color={accentColor} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={14}>
            {time.currentDirection || 'N/A'}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView flexDirection='row' gap={8}>
        <PriceMetric label='Activation' value={formatVnd(time.activationFee)} />
        <PriceMetric label='Charging' value={formatVnd(time.chargingFee)} />
        <PriceMetric label='Parking' value={formatVnd(time.parkingFee)} />
      </ThemedView>
    </ThemedView>
  );
}

function PriceMetric({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={11} flex={1} gap={4} paddingHorizontal={8} paddingVertical={9}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
        {label}
      </ThemedText>
      <ThemedText selectable color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16} numberOfLines={1}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView
      alignItems='flex-start'
      backgroundColor='transparent'
      borderBottomColor={Palette.borderSubtle}
      borderBottomWidth={1}
      flexDirection='row'
      gap={16}
      paddingBottom={11}>
      <ThemedText color={Palette.textSecondary} flex={1} fontFamily={FontFamily.regular} fontSize={13} lineHeight={19}>
        {label}
      </ThemedText>
      <ThemedText selectable color={Palette.textPrimary} flex={1} fontFamily={FontFamily.medium} fontSize={13} lineHeight={19} textAlign='right'>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView backgroundColor='transparent' gap={3}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} textTransform='uppercase'>
        {label}
      </ThemedText>
      <ThemedText selectable color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17} numberOfLines={4}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}
