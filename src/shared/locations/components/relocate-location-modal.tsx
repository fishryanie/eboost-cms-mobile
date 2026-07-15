import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { LocateFixed, Map, X } from 'lucide-react-native';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { BottomButton, ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';
import { mhs, mvs } from 'themes/scaling';

import { useRelocateLocation } from '../hooks';
import { useRelocateLocationDraftStore } from '../relocate-location-draft-store';

const FOOTER_BUTTON_HEIGHT = 45;
const FOOTER_BUTTON_RADIUS = 16;

function formatCoordinate(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function getCoordinateError(latitudeValue: string, longitudeValue: string) {
  if (!latitudeValue.trim() || !longitudeValue.trim()) return 'Enter both latitude and longitude.';

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 'Latitude and longitude must be valid numbers.';
  if (latitude < -90 || latitude > 90) return 'Latitude must be between -90 and 90.';
  if (longitude < -180 || longitude > 180) return 'Longitude must be between -180 and 180.';

  return undefined;
}

export function RelocateLocationModal({ location, onClose }: { location?: LocationRecord; onClose: () => void }) {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const relocateMutation = useRelocateLocation();
  const draft = useRelocateLocationDraftStore(state => state.draft);
  const clearDraft = useRelocateLocationDraftStore(state => state.clearDraft);
  const setDraftCoordinates = useRelocateLocationDraftStore(state => state.setCoordinates);
  const [picking, setPicking] = useState(false);
  const [navigatingToMap, setNavigatingToMap] = useState(false);
  const [submittedLocationId, setSubmittedLocationId] = useState<number>();
  const mapRouteParamsRef = useRef<{ latitude?: string; locationId: string; longitude?: string } | undefined>(undefined);
  const locationId = location?.id;
  const currentDraft = draft.locationId === locationId ? draft : {};
  const latitude = currentDraft.latitude ?? formatCoordinate(location?.latitude);
  const longitude = currentDraft.longitude ?? formatCoordinate(location?.longitude);
  const formError = submittedLocationId === locationId ? getCoordinateError(latitude, longitude) : undefined;
  const busy = picking || relocateMutation.isPending;

  useFocusEffect(
    useCallback(() => {
      setNavigatingToMap(false);
    }, []),
  );

  function updateDraft(values: { latitude?: string; longitude?: string }) {
    if (!locationId) return;
    setSubmittedLocationId(undefined);
    setDraftCoordinates(locationId, values);
  }

  function handleClose() {
    if (busy) return;
    clearDraft();
    setSubmittedLocationId(undefined);
    relocateMutation.reset();
    onClose();
  }

  function handleChooseOnMap() {
    if (!locationId || busy) return;

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    mapRouteParamsRef.current = {
      latitude: Number.isFinite(parsedLatitude) ? String(parsedLatitude) : undefined,
      locationId: String(locationId),
      longitude: Number.isFinite(parsedLongitude) ? String(parsedLongitude) : undefined,
    };
    setNavigatingToMap(true);
  }

  function handleModalHide() {
    const params = mapRouteParamsRef.current;
    if (!params) return;

    mapRouteParamsRef.current = undefined;
    router.push({ pathname: '/location/map-picker', params });
  }

  async function handleUseCurrentLocation() {
    if (!locationId || busy) return;

    setPicking(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Location access needed', 'Allow location access to capture the current GPS coordinates.');
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert('Location services are off', 'Turn on Location Services, then try again.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      updateDraft({
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6),
      });
      Toast.show({ text1: 'GPS location captured', text2: 'Review the coordinates, then save your changes.', type: 'success' });
    } catch (error) {
      Alert.alert('Could not get current location', error instanceof Error ? error.message : 'Please try again in an open area.');
    } finally {
      setPicking(false);
    }
  }

  function handleSubmit() {
    if (!locationId || busy) return;

    setSubmittedLocationId(locationId);
    const error = getCoordinateError(latitude, longitude);
    if (error) return;

    relocateMutation.mutate(
      {
        id: locationId,
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      {
        onSuccess: () => {
          clearDraft();
          setSubmittedLocationId(undefined);
          Toast.show({ text1: 'Location updated', text2: 'The new coordinates have been saved.', type: 'success' });
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      animationIn='slideInUp'
      animationInTiming={360}
      animationOut='slideOutDown'
      animationOutTiming={260}
      avoidKeyboard
      backdropColor='#0F172A'
      backdropOpacity={0.32}
      backdropTransitionInTiming={360}
      backdropTransitionOutTiming={260}
      hideModalContentWhileAnimating
      isVisible={Boolean(location) && !navigatingToMap}
      onBackButtonPress={handleClose}
      onBackdropPress={handleClose}
      onModalHide={handleModalHide}
      style={{ justifyContent: 'flex-end', margin: 0 }}>
      <ThemedView backgroundColor={Palette.surfaceBase} borderTopLeftRadius={28} borderTopRightRadius={28} maxHeight='90%' overflow='hidden'>
        <ScrollView
          contentContainerStyle={{ gap: 22, paddingBottom: bottom + mvs(72), paddingHorizontal: 20, paddingTop: 10 }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          style={{ flexShrink: 1 }}>
          <ThemedView alignSelf='center' backgroundColor='#D7DCE2' borderRadius={'pill'} height={5} width={40} />

          <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
            <ThemedView flex={1} gap={2}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={20} lineHeight={25}>
                Relocate location
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17} numberOfLines={1}>
                {location?.name || 'Location'}
              </ThemedText>
            </ThemedView>
            <Pressable accessibilityLabel='Close relocate modal' accessibilityRole='button' disabled={busy} hitSlop={8} onPress={handleClose}>
              {({ pressed }) => (
                <ThemedView
                  alignItems='center'
                  backgroundColor={pressed ? Palette.surfaceMuted : Palette.surfaceRaised}
                  borderCurve='continuous'
                  borderRadius={'pill'}
                  height={36}
                  justifyContent='center'
                  opacity={busy ? 0.45 : 1}
                  width={36}>
                  <X color={Palette.textSecondary} size={18} strokeWidth={2.3} />
                </ThemedView>
              )}
            </Pressable>
          </ThemedView>

          <ThemedView gap={'two'}>
            <ThemedView gap={2}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
                Coordinates
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16}>
                Fine-tune the selected point manually
              </ThemedText>
            </ThemedView>
            <ThemedView flexDirection='row' gap={'three'}>
              <CoordinateField label='Latitude' onChangeText={value => updateDraft({ latitude: value })} placeholder='10.762622' value={latitude} />
              <CoordinateField label='Longitude' onChangeText={value => updateDraft({ longitude: value })} placeholder='106.660172' value={longitude} />
            </ThemedView>
          </ThemedView>

          {formError || relocateMutation.isError ? (
            <ThemedText color={Palette.danger} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17} selectable>
              {formError || relocateMutation.error?.message || 'Could not update this location. Please try again.'}
            </ThemedText>
          ) : null}
        </ScrollView>
        <BottomButton
          disabled={picking}
          LeftComponent={
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={10} marginRight={10}>
              <FooterActionButton
                accessibilityHint='Fills the form with coordinates from device GPS'
                accessibilityLabel='Use current location'
                disabled={busy}
                loading={picking}
                onPress={handleUseCurrentLocation}>
                <LocateFixed color={Palette.accent} size={21} strokeWidth={2.3} />
              </FooterActionButton>
              <FooterActionButton
                accent
                accessibilityHint='Opens the map to choose a precise point'
                accessibilityLabel='Choose on map'
                disabled={busy}
                onPress={handleChooseOnMap}>
                <Map color={Palette.accent} size={21} strokeWidth={2.3} />
              </FooterActionButton>
            </ThemedView>
          }
          loading={relocateMutation.isPending}
          onPress={handleSubmit}
          radius={FOOTER_BUTTON_RADIUS}
          title='Save'
        />
      </ThemedView>
    </Modal>
  );
}

function FooterActionButton({
  accent = false,
  accessibilityHint,
  accessibilityLabel,
  children,
  disabled,
  loading = false,
  onPress,
}: {
  accent?: boolean;
  accessibilityHint: string;
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='button'
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.45 : pressed ? 0.72 : 1 })}>
      <ThemedView
        backgroundColor={accent ? '#EAF8F1' : Palette.surfaceRaised}
        borderColor={accent ? '#BDE8D1' : Palette.borderSubtle}
        borderCurve='continuous'
        borderRadius={mhs(FOOTER_BUTTON_RADIUS)}
        borderWidth={1}
        alignItems='center'
        height={mvs(FOOTER_BUTTON_HEIGHT)}
        justifyContent='center'
        width={mvs(FOOTER_BUTTON_HEIGHT)}>
        {loading ? <ActivityIndicator color={Palette.accent} size='small' /> : children}
      </ThemedView>
    </Pressable>
  );
}

function CoordinateField({
  label,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <ThemedView flex={1} gap={6}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={11} letterSpacing={0.6} lineHeight={15}>
        {label.toUpperCase()}
      </ThemedText>
      <TextInput
        autoCapitalize='none'
        autoCorrect={false}
        inputMode='decimal'
        keyboardType='numbers-and-punctuation'
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor='#98A2B3'
        returnKeyType='done'
        selectTextOnFocus
        style={{
          backgroundColor: Palette.surfaceRaised,
          borderColor: Palette.borderSubtle,
          borderRadius: 13,
          borderWidth: 1,
          color: Palette.textPrimary,
          fontFamily: FontFamily.medium,
          fontSize: 14,
          minHeight: 48,
          paddingHorizontal: 12,
        }}
        value={value}
      />
    </ThemedView>
  );
}
